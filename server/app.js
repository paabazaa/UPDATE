// The SURGICISS API: accounts, sessions, quote requests and enquiries.
// createApp() takes a database object with query() and execute(), so tests can supply their own.
import crypto from "node:crypto";
import {hashPassword, verifyPassword, DUMMY_HASH, sha256, newToken} from "./passwords.js";
import {createRateLimiter} from "./ratelimit.js";
import {providerSettings, enabledProviders, newPkce, authorizeUrl, fetchProfile, safeNextPath} from "./oauth.js";
import {text, normaliseEmail, isEmail, checkPassword, cleanProfile, cleanSignup, cleanQuote, cleanEnquiry} from "./validation.js";

const MAX_BODY = 100 * 1024;
const HOUR = 60 * 60 * 1000;
const QUARTER_HOUR = 15 * 60 * 1000;
const sqlDate = (date = new Date()) => date.toISOString().slice(0, 19).replace("T", " ");
const parseJson = value => (typeof value === "string" ? JSON.parse(value) : value);
const isDuplicate = error => error && (error.code === "ER_DUP_ENTRY" || /UNIQUE constraint/i.test(String(error.message)));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createApp({db, config, mailer, fetchImpl = fetch}) {
  const allow = createRateLimiter();

  function clientIp(req) {
    if (config.trustProxy) {
      const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
      if (forwarded) return forwarded;
    }
    return req.socket.remoteAddress || "unknown";
  }
  const limit = (req, name, count, windowMs, extra = "") => {
    if (!allow(`${name}:${clientIp(req)}:${extra}`, count, windowMs)) throw new HttpError(429, "Too many attempts. Please wait a little and try again.");
  };

  function redirect(res, location, cookieList, headers = {}) {
    res.writeHead(302, {Location: location, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Set-Cookie": cookieList, ...headers});
    res.end();
  }

  function send(res, status, body, headers = {}) {
    const json = JSON.stringify(body);
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(json),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      ...headers
    });
    res.end(json);
  }

  async function readBody(req) {
    if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) throw new HttpError(415, "Send the request as JSON.");
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) {
        const error = new HttpError(413, "That request is too large.");
        error.closeConnection = true;
        throw error;
      }
      chunks.push(chunk);
    }
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("not an object");
      return body;
    } catch {
      throw new HttpError(400, "The request could not be read.");
    }
  }

  const cookies = req => Object.fromEntries(String(req.headers.cookie || "").split(";").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));

  function cookieHeader(value, maxAgeSeconds) {
    const s = config.session;
    return `${s.cookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=${s.sameSite}${s.secure ? "; Secure" : ""}`;
  }

  const presentUser = row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    organisation: row.organisation || "",
    country: row.country || "",
    city: row.city || "",
    deliveryLocation: row.delivery_location || "",
    hasPassword: Boolean(row.password_hash),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at).replace(" ", "T") + "Z"
  });

  async function sessionUser(req) {
    const token = cookies(req)[config.session.cookieName];
    if (!token) return null;
    const rows = await db.query(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?",
      [sha256(token), sqlDate()]
    );
    return rows[0] || null;
  }
  const requireUser = async req => {
    const user = await sessionUser(req);
    if (!user) throw new HttpError(401, "Please log in.");
    return user;
  };

  async function startSession(userId) {
    const token = newToken();
    const now = new Date();
    const expires = new Date(now.getTime() + config.session.days * 24 * HOUR);
    await db.execute("DELETE FROM sessions WHERE expires_at < ?", [sqlDate(now)]);
    await db.execute("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [sha256(token), userId, sqlDate(now), sqlDate(expires)]);
    return cookieHeader(token, config.session.days * 24 * 60 * 60);
  }
  const clearCookie = () => cookieHeader("", 0);

  function makeReference(prefix) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `${prefix}-${day}-${crypto.randomBytes(3).toString("hex").slice(0, 4).toUpperCase()}`;
  }

  async function saveRecord(table, prefix, user, value) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const ref = makeReference(prefix);
      const createdAt = new Date();
      const payload = {id: ref, createdAt: createdAt.toISOString(), userId: user ? user.id : null, ...value, status: "received", delivered: true, deliveryError: false};
      try {
        await db.execute(
          `INSERT INTO ${table} (id, reference, user_id, contact_email, status, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), ref, user ? user.id : null, value.contact.email, "received", JSON.stringify(payload), sqlDate(createdAt)]
        );
        return ref;
      } catch (error) {
        if (!isDuplicate(error)) throw error;
      }
    }
    throw new HttpError(500, "The request could not be saved. Please try again.");
  }

  const siteBase = () => config.siteUrl || config.allowedOrigins[0] || "";
  const siteRedirect = path => `${siteBase()}/#${path}`;
  const OAUTH_COOKIE = "surgiciss_oauth";
  const oauthCookie = (value, maxAge) => `${OAUTH_COOKIE}=${encodeURIComponent(value)}; Path=/api/auth/oauth; HttpOnly; Max-Age=${maxAge}; SameSite=Lax${config.session.secure ? "; Secure" : ""}`;

  async function oauthStart(req, url, name) {
    limit(req, "oauth", 30, QUARTER_HOUR);
    const settings = providerSettings(config, name);
    if (!settings) return {redirect: siteRedirect("/login?error=oauth_unavailable"), cookies: []};
    const state = newToken();
    const {verifier, challenge} = newPkce();
    const now = new Date();
    await db.execute("DELETE FROM oauth_states WHERE expires_at < ?", [sqlDate(now)]);
    await db.execute(
      "INSERT INTO oauth_states (id, provider, verifier, next_path, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      [sha256(state), name, verifier, safeNextPath(url.searchParams.get("next")), sqlDate(now), sqlDate(new Date(now.getTime() + 10 * 60 * 1000))]
    );
    return {redirect: authorizeUrl(settings, config, {state, challenge}), cookies: [oauthCookie(state, 600)]};
  }

  async function userForOauth(name, profile, email) {
    const linked = (await db.query("SELECT user_id FROM oauth_identities WHERE provider = ? AND provider_user_id = ?", [name, profile.id]))[0];
    if (linked) return linked.user_id;
    const now = sqlDate();
    let user = (await db.query("SELECT * FROM users WHERE email = ?", [email]))[0];
    if (user && !user.email_verified) {
      await db.execute("UPDATE users SET password_hash = NULL, email_verified = 1, updated_at = ? WHERE id = ?", [now, user.id]);
      await db.execute("DELETE FROM sessions WHERE user_id = ?", [user.id]);
    }
    if (!user) {
      const id = crypto.randomUUID();
      try {
        await db.execute(
          "INSERT INTO users (id, email, name, phone, organisation, country, city, delivery_location, password_hash, email_verified, created_at, updated_at) VALUES (?, ?, ?, '', '', '', '', '', NULL, 1, ?, ?)",
          [id, email, text(profile.name, 255) || email.split("@")[0], now, now]
        );
        user = {id};
      } catch (error) {
        if (!isDuplicate(error)) throw error;
        user = (await db.query("SELECT * FROM users WHERE email = ?", [email]))[0];
      }
    }
    try {
      await db.execute("INSERT INTO oauth_identities (provider, provider_user_id, user_id, email, created_at) VALUES (?, ?, ?, ?, ?)", [name, profile.id, user.id, email, now]);
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
    return user.id;
  }

  async function oauthCallback(req, url, name) {
    limit(req, "oauth", 30, QUARTER_HOUR);
    const clear = oauthCookie("", 0);
    const fail = code => ({redirect: siteRedirect(`/login?error=${code}`), cookies: [clear]});
    const settings = providerSettings(config, name);
    if (!settings) return fail("oauth_unavailable");
    if (url.searchParams.get("error")) return fail("oauth_denied");
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    if (!state || !code || cookies(req)[OAUTH_COOKIE] !== state) return fail("oauth_failed");
    const row = (await db.query("SELECT * FROM oauth_states WHERE id = ? AND provider = ? AND expires_at > ?", [sha256(state), name, sqlDate()]))[0];
    await db.execute("DELETE FROM oauth_states WHERE id = ?", [sha256(state)]);
    if (!row) return fail("oauth_failed");
    let profile;
    try {
      profile = await fetchProfile(fetchImpl, settings, config, {code, verifier: row.verifier});
    } catch (error) {
      console.error(`[oauth] ${name} sign-in failed:`, error.message);
      return fail("oauth_failed");
    }
    const email = normaliseEmail(profile.email);
    if (!profile.id) return fail("oauth_failed");
    if (!isEmail(email)) return fail("oauth_no_email");
    if (!profile.emailVerified) return fail("oauth_unverified");
    const userId = await userForOauth(name, profile, email);
    return {redirect: siteRedirect(row.next_path), cookies: [clear, await startSession(userId)]};
  }

  const routes = {
    "GET /api/auth/oauth/providers": async () => ({body: {providers: enabledProviders(config)}}),

    "GET /api/health": async () => {
      let database = true;
      try { await db.query("SELECT 1 AS ok"); } catch { database = false; }
      return {status: database ? 200 : 503, body: {ok: database, database}};
    },

    "GET /api/auth/me": async req => {
      const user = await sessionUser(req);
      return {body: {user: user ? presentUser(user) : null}};
    },

    "POST /api/auth/signup": async req => {
      limit(req, "signup", 5, HOUR);
      const input = cleanSignup(await readBody(req));
      if (input.error) throw new HttpError(400, input.error);
      const user = input.value;
      const id = crypto.randomUUID();
      const now = sqlDate();
      try {
        await db.execute(
          "INSERT INTO users (id, email, name, phone, organisation, country, city, delivery_location, password_hash, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)",
          [id, user.email, user.name, user.phone, user.organisation, user.country, user.city, user.deliveryLocation, await hashPassword(user.password), now, now]
        );
      } catch (error) {
        if (isDuplicate(error)) throw new HttpError(409, "An account with that email already exists. Try logging in.");
        throw error;
      }
      const cookie = await startSession(id);
      const row = (await db.query("SELECT * FROM users WHERE id = ?", [id]))[0];
      return {status: 201, cookie, body: {user: presentUser(row)}};
    },

    "POST /api/auth/login": async req => {
      const body = await readBody(req);
      const email = normaliseEmail(body.email);
      limit(req, "login", 10, QUARTER_HOUR);
      limit(req, "login-email", 5, QUARTER_HOUR, email);
      const row = (await db.query("SELECT * FROM users WHERE email = ?", [email]))[0];
      const ok = await verifyPassword(String(body.password || "").slice(0, 128), row && row.password_hash ? row.password_hash : DUMMY_HASH);
      if (!row || !row.password_hash || !ok) throw new HttpError(401, "That email and password do not match an account.");
      return {cookie: await startSession(row.id), body: {user: presentUser(row)}};
    },

    "POST /api/auth/logout": async req => {
      const token = cookies(req)[config.session.cookieName];
      if (token) await db.execute("DELETE FROM sessions WHERE id = ?", [sha256(token)]);
      return {cookie: clearCookie(), body: {ok: true}};
    },

    "PATCH /api/auth/profile": async req => {
      const user = await requireUser(req);
      const profile = cleanProfile(await readBody(req));
      if (profile.name.length < 2) throw new HttpError(400, "Please keep a name on the account.");
      await db.execute(
        "UPDATE users SET name = ?, phone = ?, organisation = ?, country = ?, city = ?, delivery_location = ?, updated_at = ? WHERE id = ?",
        [profile.name, profile.phone, profile.organisation, profile.country, profile.city, profile.deliveryLocation, sqlDate(), user.id]
      );
      const row = (await db.query("SELECT * FROM users WHERE id = ?", [user.id]))[0];
      return {body: {user: presentUser(row)}};
    },

    "POST /api/auth/password": async req => {
      const user = await requireUser(req);
      limit(req, "password", 10, QUARTER_HOUR, user.id);
      const body = await readBody(req);
      if (!user.password_hash) throw new HttpError(400, "Your account signs in with Google or Facebook and has no password. Use Forgot password if you would like to add one.");
      if (!(await verifyPassword(String(body.currentPassword || "").slice(0, 128), user.password_hash))) throw new HttpError(400, "The current password is not correct.");
      const problem = checkPassword(body.nextPassword, body.confirm);
      if (problem) throw new HttpError(400, problem.replace("The two passwords", "The new passwords"));
      await db.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [await hashPassword(body.nextPassword), sqlDate(), user.id]);
      const token = cookies(req)[config.session.cookieName];
      await db.execute("DELETE FROM sessions WHERE user_id = ? AND id <> ?", [user.id, sha256(token)]);
      return {body: {ok: true}};
    },

    "POST /api/auth/delete": async req => {
      const user = await requireUser(req);
      limit(req, "delete", 5, QUARTER_HOUR, user.id);
      const body = await readBody(req);
      if (user.password_hash) {
        if (!(await verifyPassword(String(body.password || "").slice(0, 128), user.password_hash))) throw new HttpError(400, "The password is not correct, so the account was left as it is.");
      } else if (body.confirmText !== "DELETE") {
        throw new HttpError(400, "Type DELETE to confirm that you want the account removed.");
      }
      await db.execute("DELETE FROM users WHERE id = ?", [user.id]);
      return {cookie: clearCookie(), body: {ok: true}};
    },

    "POST /api/auth/forgot": async req => {
      limit(req, "forgot", 5, HOUR);
      const email = normaliseEmail((await readBody(req)).email);
      if (isEmail(email)) {
        const row = (await db.query("SELECT id FROM users WHERE email = ?", [email]))[0];
        if (row) {
          const token = newToken();
          const now = new Date();
          await db.execute("DELETE FROM password_resets WHERE user_id = ?", [row.id]);
          await db.execute("INSERT INTO password_resets (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [sha256(token), row.id, sqlDate(now), sqlDate(new Date(now.getTime() + HOUR))]);
          const base = config.siteUrl || config.allowedOrigins[0] || "";
          console.log(`\n[DEV RESET LINK] For ${email}:\n${base}/#/reset-password?token=${token}\n`);
          try {
            await mailer.send({
              to: email,
              subject: "Reset your SURGICISS password",
              text: `Use this link within one hour to choose a new password:\n\n${base}/#/reset-password?token=${token}\n\nIf you did not ask for this, you can ignore this message.`
            });
          } catch (error) {
            console.error("[mail] Could not send reset email (using dev link above):", error.message);
          }
        } else {
          console.log(`[forgot] No account for ${email} - nothing to send`);
        }
      }
      return {body: {ok: true}};
    },

    "POST /api/auth/reset": async req => {
      limit(req, "reset", 10, HOUR);
      const body = await readBody(req);
      const problem = checkPassword(body.password, body.confirm);
      if (problem) throw new HttpError(400, problem);
      const invalid = new HttpError(400, "This reset link is not valid or has expired. Please request a new one.");
      const row = (await db.query("SELECT * FROM password_resets WHERE id = ? AND used_at IS NULL AND expires_at > ?", [sha256(String(body.token || "")), sqlDate()]))[0];
      if (!row) throw invalid;
      await db.execute("UPDATE users SET password_hash = ?, email_verified = 1, updated_at = ? WHERE id = ?", [await hashPassword(body.password), sqlDate(), row.user_id]);
      await db.execute("UPDATE password_resets SET used_at = ? WHERE id = ?", [sqlDate(), row.id]);
      await db.execute("DELETE FROM sessions WHERE user_id = ?", [row.user_id]);
      return {body: {ok: true}};
    },

    "POST /api/submissions": async req => {
      limit(req, "submit", 15, HOUR);
      const body = await readBody(req);
      const user = await sessionUser(req);
      if (body.kind === "quote") {
        const input = cleanQuote(body.record);
        if (input.error) throw new HttpError(400, input.error);
        return {status: 201, body: {ok: true, id: await saveRecord("quotes", "Q", user, input.value)}};
      }
      if (body.kind === "enquiry") {
        const input = cleanEnquiry(body.record);
        if (input.error) throw new HttpError(400, input.error);
        return {status: 201, body: {ok: true, id: await saveRecord("enquiries", "E", user, input.value)}};
      }
      throw new HttpError(400, "Unknown submission type.");
    },

    "GET /api/me/records": async req => {
      const user = await requireUser(req);
      const load = async table => (await db.query(`SELECT payload FROM ${table} WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`, [user.id])).map(row => parseJson(row.payload));
      return {body: {quotes: await load("quotes"), enquiries: await load("enquiries")}};
    },

    "POST /api/newsletter": async req => {
      limit(req, "newsletter", 10, HOUR);
      const email = normaliseEmail((await readBody(req)).email);
      if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
      try {
        await db.execute("INSERT INTO newsletter_subscribers (email, created_at) VALUES (?, ?)", [email, sqlDate()]);
      } catch (error) {
        if (!isDuplicate(error)) throw error;
      }
      return {body: {ok: true}};
    }
  };

  // FIX: Allow frontend to call /api/auth/register (same as signup) - saves to MySQL users table
  routes["POST /api/auth/register"] = routes["POST /api/auth/signup"];

  return async function handle(req, res) {
    const origin = String(req.headers.origin || "").replace(/\/+$/, "");
    const originAllowed = origin && config.allowedOrigins.includes(origin);
    const corsHeaders = originAllowed ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    } : {"Vary": "Origin"};
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (req.method === "OPTIONS") {
        if (origin && !originAllowed) throw new HttpError(403, "This website is not allowed to use the API.");
        res.writeHead(204, corsHeaders);
        res.end();
        return;
      }
      const oauth = req.method === "GET" && url.pathname.match(/^\/api\/auth\/oauth\/(google|facebook)\/(start|callback)$/);
      const route = oauth
        ? (request => (oauth[2] === "start" ? oauthStart(request, url, oauth[1]) : oauthCallback(request, url, oauth[1])))
        : routes[`${req.method} ${url.pathname}`];
      if (!route) throw new HttpError(404, "Not found.");
      if (req.method !== "GET") {
        if (origin && !originAllowed) throw new HttpError(403, "This website is not allowed to use the API.");
        if (!req.headers["x-requested-with"]) throw new HttpError(403, "Missing request header.");
      }
      const result = await route(req);
      if (result.redirect) return redirect(res, result.redirect, result.cookies || []);
      send(res, result.status || 200, result.body, {...corsHeaders, ...(result.cookie ? {"Set-Cookie": [result.cookie]} : {})});
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.closeConnection) res.on("finish", () => req.destroy());
        return send(res, error.status, {error: error.message}, error.closeConnection ? {...corsHeaders, Connection: "close"} : corsHeaders);
      }
      console.error("[api]", error);
      send(res, 500, {error: "Something went wrong on the server. Please try again."}, corsHeaders);
    }
  };
}