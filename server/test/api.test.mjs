// API tests. They run the real request handler against an in-memory SQLite database
// (node:sqlite) instead of MySQL, so they check the logic and the SQL shapes, not MySQL itself.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {DatabaseSync} from "node:sqlite";
import {createApp} from "../app.js";
import {loadConfig} from "../config.js";

const ORIGIN = "https://site.example";
const DDL = `
CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, phone TEXT, organisation TEXT, country TEXT, city TEXT, delivery_location TEXT, password_hash TEXT, email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT, updated_at TEXT);
CREATE TABLE oauth_identities (provider TEXT, provider_user_id TEXT, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, email TEXT, created_at TEXT, PRIMARY KEY (provider, provider_user_id));
CREATE TABLE oauth_states (id TEXT PRIMARY KEY, provider TEXT, verifier TEXT, next_path TEXT, created_at TEXT, expires_at TEXT);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, created_at TEXT, expires_at TEXT);
CREATE TABLE password_resets (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, created_at TEXT, expires_at TEXT, used_at TEXT);
CREATE TABLE quotes (id TEXT PRIMARY KEY, reference TEXT UNIQUE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, contact_email TEXT, status TEXT, payload TEXT, created_at TEXT);
CREATE TABLE enquiries (id TEXT PRIMARY KEY, reference TEXT UNIQUE, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, contact_email TEXT, status TEXT, payload TEXT, created_at TEXT);
CREATE TABLE newsletter_subscribers (email TEXT PRIMARY KEY, created_at TEXT);`;

export function sqliteDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(DDL);
  const clean = params => params.map(value => (value === undefined ? null : value));
  return {
    sqlite,
    async query(sql, params = []) { return sqlite.prepare(sql).all(...clean(params)); },
    async execute(sql, params = []) { return {affectedRows: sqlite.prepare(sql).run(...clean(params)).changes}; }
  };
}

async function start(overrides = {}, fetchImpl) {
  const db = sqliteDatabase();
  const outbox = [];
  const config = loadConfig({ALLOWED_ORIGINS: ORIGIN, SITE_URL: ORIGIN + "/html", COOKIE_SECURE: "true", ...overrides});
  const handler = createApp({db, config, fetchImpl, mailer: {send: async message => { outbox.push(message); return true; }}});
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = "";
    return async (method, path, body, headers = {}) => {
      const response = await fetch(base + path, {
        method,
        headers: {"Content-Type": "application/json", "X-Requested-With": "test", Origin: ORIGIN, ...(cookie ? {Cookie: cookie} : {}), ...headers},
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const set = response.headers.get("set-cookie");
      if (set) cookie = set.startsWith("surgiciss_session=;") ? "" : set.split(";")[0];
      return {status: response.status, headers: response.headers, data: await response.json().catch(() => null), setCookie: set};
    };
  };
  return {db, outbox, client, base, close: () => new Promise(resolve => server.close(resolve))};
}

const signupBody = (email = "ama@example.com") => ({name: "Ama Mensah", email, password: "correct horse 9", confirm: "correct horse 9", organisation: "Korle Bu", country: "Ghana", city: "Accra"});
const quoteRecord = (email = "ama@example.com") => ({
  lines: [{ref: "product:master-wrap", name: "Master Wrap", quantity: 3, note: "Large"}],
  contact: {name: "Ama Mensah", email, organisation: "Korle Bu", country: "Ghana", city: "Accra", deliveryLocation: "Theatre 1", preferredContact: "Email"},
  requirements: "None"
});
const enquiryRecord = {subject: "Hello", message: "Please send more information.", interest: "Software", contact: {name: "Kofi", email: "kofi@example.com", organisation: "Hospital", country: "Ghana"}};

test("health reports the database", async () => {
  const s = await start(); const api = s.client();
  const r = await api("GET", "/api/health");
  assert.equal(r.status, 200); assert.equal(r.data.database, true);
  await s.close();
});

test("signup, session cookie, me, logout", async () => {
  const s = await start(); const api = s.client();
  const r = await api("POST", "/api/auth/signup", signupBody());
  assert.equal(r.status, 201);
  assert.equal(r.data.user.email, "ama@example.com");
  assert.ok(!JSON.stringify(r.data).includes("password"));
  assert.match(r.setCookie, /HttpOnly/); assert.match(r.setCookie, /Secure/); assert.match(r.setCookie, /SameSite=None/);
  assert.equal((await api("GET", "/api/auth/me")).data.user.name, "Ama Mensah");
  assert.equal((await api("POST", "/api/auth/logout", {})).status, 200);
  assert.equal((await api("GET", "/api/auth/me")).data.user, null);
  const stored = s.db.sqlite.prepare("SELECT password_hash FROM users").get().password_hash;
  assert.match(stored, /^scrypt\$/); assert.ok(!stored.includes("correct horse"));
  await s.close();
});

test("signup validation and duplicate email", async () => {
  const s = await start(); const api = s.client();
  assert.equal((await api("POST", "/api/auth/signup", {...signupBody(), password: "short", confirm: "short"})).status, 400);
  assert.equal((await api("POST", "/api/auth/signup", {...signupBody(), confirm: "different"})).status, 400);
  assert.equal((await api("POST", "/api/auth/signup", {...signupBody(), email: "nope"})).status, 400);
  assert.equal((await api("POST", "/api/auth/signup", signupBody())).status, 201);
  assert.equal((await api("POST", "/api/auth/signup", signupBody("AMA@example.com"))).status, 409);
  await s.close();
});

test("login accepts the right password and rejects wrong ones the same way", async () => {
  const s = await start(); const api = s.client();
  await api("POST", "/api/auth/signup", signupBody());
  const other = s.client();
  const wrong = await other("POST", "/api/auth/login", {email: "ama@example.com", password: "wrong password"});
  const unknown = await other("POST", "/api/auth/login", {email: "nobody@example.com", password: "wrong password"});
  assert.equal(wrong.status, 401); assert.equal(unknown.status, 401); assert.equal(wrong.data.error, unknown.data.error);
  assert.equal((await other("POST", "/api/auth/login", {email: "Ama@Example.com", password: "correct horse 9"})).status, 200);
  assert.equal((await other("GET", "/api/auth/me")).data.user.email, "ama@example.com");
  await s.close();
});

test("login is rate limited", async () => {
  const s = await start(); const api = s.client();
  let last;
  for (let i = 0; i < 7; i++) last = await api("POST", "/api/auth/login", {email: "ama@example.com", password: "nope nope nope"});
  assert.equal(last.status, 429);
  await s.close();
});

test("guest submissions are stored and not tied to an account", async () => {
  const s = await start(); const guest = s.client();
  const q = await guest("POST", "/api/submissions", {kind: "quote", record: quoteRecord()});
  assert.equal(q.status, 201); assert.match(q.data.id, /^Q-\d{8}-[0-9A-F]{4}$/);
  const e = await guest("POST", "/api/submissions", {kind: "enquiry", record: enquiryRecord});
  assert.equal(e.status, 201); assert.match(e.data.id, /^E-/);
  assert.equal(s.db.sqlite.prepare("SELECT user_id FROM quotes").get().user_id, null);
  assert.equal((await guest("GET", "/api/me/records")).status, 401);
  await s.close();
});

test("signed-in submissions appear only in that customer's records", async () => {
  const s = await start(); const ama = s.client(); const kofi = s.client();
  await ama("POST", "/api/auth/signup", signupBody());
  await kofi("POST", "/api/auth/signup", signupBody("kofi@example.com"));
  const sent = await ama("POST", "/api/submissions", {kind: "quote", record: {...quoteRecord(), userId: "someone-else"}});
  await ama("POST", "/api/submissions", {kind: "enquiry", record: enquiryRecord});
  const mine = (await ama("GET", "/api/me/records")).data;
  assert.equal(mine.quotes.length, 1); assert.equal(mine.quotes[0].id, sent.data.id);
  assert.equal(mine.quotes[0].lines[0].quantity, 3); assert.equal(mine.enquiries.length, 1);
  assert.notEqual(mine.quotes[0].userId, "someone-else");
  const theirs = (await kofi("GET", "/api/me/records")).data;
  assert.equal(theirs.quotes.length, 0); assert.equal(theirs.enquiries.length, 0);
  await s.close();
});

test("submission validation", async () => {
  const s = await start(); const api = s.client();
  const bad = async record => (await api("POST", "/api/submissions", {kind: "quote", record})).status;
  assert.equal(await bad({...quoteRecord(), lines: []}), 400);
  assert.equal(await bad({...quoteRecord(), lines: [{ref: "x", quantity: 0}]}), 400);
  assert.equal(await bad({...quoteRecord(), lines: [{ref: "x", quantity: 1.5}]}), 400);
  assert.equal(await bad({...quoteRecord(), contact: {...quoteRecord().contact, email: "bad"}}), 400);
  assert.equal((await api("POST", "/api/submissions", {kind: "other", record: {}})).status, 400);
  assert.equal((await api("POST", "/api/submissions", {kind: "enquiry", record: {...enquiryRecord, message: "short"}})).status, 400);
  await s.close();
});

test("profile update, password change and account deletion", async () => {
  const s = await start(); const api = s.client(); const second = s.client();
  await api("POST", "/api/auth/signup", signupBody());
  await second("POST", "/api/auth/login", {email: "ama@example.com", password: "correct horse 9"});
  const updated = await api("PATCH", "/api/auth/profile", {name: "Ama M.", country: "Ghana", city: "Kumasi", phone: "", organisation: "KATH", deliveryLocation: "Ward 2"});
  assert.equal(updated.data.user.city, "Kumasi");
  assert.equal((await api("PATCH", "/api/auth/profile", {name: "A"})).status, 400);
  assert.equal((await api("POST", "/api/auth/password", {currentPassword: "wrong", nextPassword: "new password 1", confirm: "new password 1"})).status, 400);
  assert.equal((await api("POST", "/api/auth/password", {currentPassword: "correct horse 9", nextPassword: "new password 1", confirm: "new password 1"})).status, 200);
  assert.equal((await second("GET", "/api/auth/me")).data.user, null, "other sessions end after a password change");
  assert.equal((await api("GET", "/api/auth/me")).data.user.name, "Ama M.");
  await api("POST", "/api/submissions", {kind: "quote", record: quoteRecord()});
  assert.equal((await api("POST", "/api/auth/delete", {password: "wrong"})).status, 400);
  assert.equal((await api("POST", "/api/auth/delete", {password: "new password 1"})).status, 200);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get().n, 0);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM quotes").get().n, 0);
  assert.equal((await api("GET", "/api/auth/me")).data.user, null);
  await s.close();
});

test("password reset by email link", async () => {
  const s = await start(); const api = s.client();
  await api("POST", "/api/auth/signup", signupBody());
  const unknown = await api("POST", "/api/auth/forgot", {email: "nobody@example.com"});
  assert.equal(unknown.status, 200); assert.equal(s.outbox.length, 0);
  assert.equal((await api("POST", "/api/auth/forgot", {email: "ama@example.com"})).status, 200);
  assert.equal(s.outbox.length, 1);
  const token = s.outbox[0].text.match(/token=([\w-]+)/)[1];
  assert.ok(s.outbox[0].text.includes(ORIGIN + "/html/#/reset-password?token="));
  assert.equal((await api("POST", "/api/auth/reset", {token: "wrong", password: "brand new pass", confirm: "brand new pass"})).status, 400);
  assert.equal((await api("POST", "/api/auth/reset", {token, password: "brand new pass", confirm: "brand new pass"})).status, 200);
  assert.equal((await api("POST", "/api/auth/reset", {token, password: "another pass 22", confirm: "another pass 22"})).status, 400, "a link works once");
  const fresh = s.client();
  assert.equal((await fresh("POST", "/api/auth/login", {email: "ama@example.com", password: "correct horse 9"})).status, 401);
  assert.equal((await fresh("POST", "/api/auth/login", {email: "ama@example.com", password: "brand new pass"})).status, 200);
  await s.close();
});

test("expired sessions are refused", async () => {
  const s = await start(); const api = s.client();
  await api("POST", "/api/auth/signup", signupBody());
  s.db.sqlite.exec("UPDATE sessions SET expires_at = '2000-01-01 00:00:00'");
  assert.equal((await api("GET", "/api/auth/me")).data.user, null);
  await s.close();
});

test("origin and header checks", async () => {
  const s = await start(); const api = s.client();
  const evil = await api("POST", "/api/auth/signup", signupBody(), {Origin: "https://evil.example"});
  assert.equal(evil.status, 403);
  const noHeader = await api("POST", "/api/auth/signup", signupBody(), {"X-Requested-With": ""});
  assert.equal(noHeader.status, 403);
  const preflight = await fetch(s.base + "/api/auth/login", {method: "OPTIONS", headers: {Origin: ORIGIN, "Access-Control-Request-Method": "POST"}});
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get("access-control-allow-origin"), ORIGIN);
  const blocked = await fetch(s.base + "/api/auth/login", {method: "OPTIONS", headers: {Origin: "https://evil.example"}});
  assert.equal(blocked.status, 403);
  const ok = await api("GET", "/api/health");
  assert.equal(ok.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(ok.headers.get("access-control-allow-credentials"), "true");
  const other = await api("GET", "/api/health", undefined, {Origin: "https://evil.example"});
  assert.equal(other.headers.get("access-control-allow-origin"), null);
  await s.close();
});

test("oversized and malformed bodies, unknown routes", async () => {
  const s = await start(); const api = s.client();
  assert.equal((await api("POST", "/api/submissions", {kind: "quote", record: {requirements: "x".repeat(200000)}})).status, 413);
  assert.equal((await api("GET", "/api/nothing")).status, 404);
  const notJson = await fetch(s.base + "/api/auth/login", {method: "POST", headers: {"Content-Type": "text/plain", "X-Requested-With": "test", Origin: ORIGIN}, body: "hello"});
  assert.equal(notJson.status, 415);
  const broken = await fetch(s.base + "/api/auth/login", {method: "POST", headers: {"Content-Type": "application/json", "X-Requested-With": "test", Origin: ORIGIN}, body: "{oops"});
  assert.equal(broken.status, 400);
  await s.close();
});

test("newsletter signup is idempotent", async () => {
  const s = await start(); const api = s.client();
  assert.equal((await api("POST", "/api/newsletter", {email: "a@example.com"})).status, 200);
  assert.equal((await api("POST", "/api/newsletter", {email: "A@example.com"})).status, 200);
  assert.equal((await api("POST", "/api/newsletter", {email: "bad"})).status, 400);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get().n, 1);
  await s.close();
});

// ---- Sign in with Google or Facebook ----------------------------------------------------------
const OAUTH_ENV = {GOOGLE_CLIENT_ID: "gid", GOOGLE_CLIENT_SECRET: "gsecret", FACEBOOK_APP_ID: "fid", FACEBOOK_APP_SECRET: "fsecret", API_URL: "https://api.example"};

// Stands in for Google and Facebook: answers the token and profile calls with whatever `fake.profile` holds.
function fakeProviders() {
  const fake = {profile: null, calls: [], tokenFails: false};
  fake.fetch = async (url, options = {}) => {
    const address = String(url);
    fake.calls.push({url: address, options});
    const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {"Content-Type": "application/json"}});
    if (address.startsWith("https://oauth2.googleapis.com/token")) return fake.tokenFails ? json({error: "invalid_grant"}, 400) : json({access_token: "google-token"});
    if (address.startsWith("https://openidconnect.googleapis.com/")) return json(fake.profile);
    if (address.includes("graph.facebook.com") && address.includes("oauth/access_token")) return json({access_token: "fb-token"});
    if (address.includes("graph.facebook.com") && address.includes("/me")) return json(fake.profile);
    return json({error: "unexpected call"}, 500);
  };
  return fake;
}

// Runs the browser's part of the flow by hand and returns the redirects and cookies.
async function oauthRun(s, provider, {next, tamperState, cookie} = {}) {
  const start = await fetch(`${s.base}/api/auth/oauth/${provider}/start${next ? "?next=" + encodeURIComponent(next) : ""}`, {redirect: "manual"});
  const authorize = new URL(start.headers.get("location"));
  const stateCookie = (start.headers.getSetCookie().find(item => item.startsWith("surgiciss_oauth=")) || "").split(";")[0];
  const state = tamperState || authorize.searchParams.get("state");
  const callback = await fetch(`${s.base}/api/auth/oauth/${provider}/callback?code=abc&state=${encodeURIComponent(state)}`, {redirect: "manual", headers: {Cookie: cookie ?? stateCookie}});
  const cookies = callback.headers.getSetCookie();
  const session = (cookies.find(item => item.startsWith("surgiciss_session=") && !item.startsWith("surgiciss_session=;")) || "").split(";")[0];
  return {start, authorize, callback, location: callback.headers.get("location"), session, stateCookie};
}
const googleProfile = (over = {}) => ({sub: "g-123", email: "ama@example.com", email_verified: true, name: "Ama Mensah", ...over});
const asUser = (s, session) => async path => (await fetch(s.base + path, {headers: {Cookie: session, Origin: ORIGIN}})).json();

test("only configured providers are offered", async () => {
  const none = await start(); assert.deepEqual((await none.client()("GET", "/api/auth/oauth/providers")).data.providers, []);
  const redirected = await fetch(none.base + "/api/auth/oauth/google/start", {redirect: "manual"});
  assert.match(redirected.headers.get("location"), /#\/login\?error=oauth_unavailable$/);
  await none.close();
  const some = await start({...OAUTH_ENV, FACEBOOK_APP_ID: "", FACEBOOK_APP_SECRET: ""});
  assert.deepEqual((await some.client()("GET", "/api/auth/oauth/providers")).data.providers, ["google"]);
  await some.close();
});

test("start sends the visitor to Google with state, PKCE and the registered return address", async () => {
  const fake = fakeProviders(); const s = await start(OAUTH_ENV, fake.fetch);
  const r = await oauthRun(s, "google");
  assert.equal(r.start.status, 302);
  assert.equal(r.authorize.origin + r.authorize.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(r.authorize.searchParams.get("client_id"), "gid");
  assert.equal(r.authorize.searchParams.get("redirect_uri"), "https://api.example/api/auth/oauth/google/callback");
  assert.equal(r.authorize.searchParams.get("code_challenge_method"), "S256");
  assert.match(r.authorize.searchParams.get("scope"), /email/);
  assert.ok(r.authorize.searchParams.get("state").length > 20);
  const cookie = r.start.headers.getSetCookie().find(item => item.startsWith("surgiciss_oauth="));
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/);
  assert.ok(!r.authorize.toString().includes("gsecret"), "the secret never goes to the browser");
  await s.close();
});

test("a new Google user is created and signed in", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile();
  const s = await start(OAUTH_ENV, fake.fetch);
  const r = await oauthRun(s, "google", {next: "/account/quotes"});
  assert.equal(r.callback.status, 302);
  assert.equal(r.location, ORIGIN + "/html/#/account/quotes");
  assert.match(r.session, /^surgiciss_session=/);
  const me = await asUser(s, r.session)("/api/auth/me");
  assert.equal(me.user.email, "ama@example.com"); assert.equal(me.user.name, "Ama Mensah"); assert.equal(me.user.hasPassword, false);
  const exchange = fake.calls.find(call => call.url.startsWith("https://oauth2.googleapis.com/token"));
  assert.match(exchange.options.body, /code_verifier=/); assert.match(exchange.options.body, /client_secret=gsecret/);
  assert.equal(s.db.sqlite.prepare("SELECT email_verified FROM users").get().email_verified, 1);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM oauth_identities").get().n, 1);
  const again = await oauthRun(s, "google");
  const me2 = await asUser(s, again.session)("/api/auth/me");
  assert.equal(me2.user.id, me.user.id, "signing in again finds the same account");
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get().n, 1);
  await s.close();
});

test("a Facebook user can sign in", async () => {
  const fake = fakeProviders(); fake.profile = {id: "fb-9", name: "Kofi Boateng", email: "kofi@example.com"};
  const s = await start(OAUTH_ENV, fake.fetch);
  const r = await oauthRun(s, "facebook");
  assert.equal(r.authorize.hostname, "www.facebook.com"); assert.equal(r.authorize.searchParams.get("scope"), "email,public_profile");
  assert.equal(r.location, ORIGIN + "/html/#/account");
  assert.equal((await asUser(s, r.session)("/api/auth/me")).user.email, "kofi@example.com");
  await s.close();
});

test("the same email on Google and Facebook is one account", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile({email: "same@example.com"});
  const s = await start(OAUTH_ENV, fake.fetch);
  const g = await oauthRun(s, "google");
  fake.profile = {id: "fb-1", name: "Ama", email: "same@example.com"};
  const f = await oauthRun(s, "facebook");
  assert.equal((await asUser(s, g.session)("/api/auth/me")).user.id, (await asUser(s, f.session)("/api/auth/me")).user.id);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM oauth_identities").get().n, 2);
  await s.close();
});

test("sign-in is refused for bad state, replays, denial and unverified or missing email", async () => {
  const fake = fakeProviders(); const s = await start(OAUTH_ENV, fake.fetch);
  fake.profile = googleProfile();
  assert.match((await oauthRun(s, "google", {tamperState: "forged"})).location, /error=oauth_failed$/);
  assert.match((await oauthRun(s, "google", {cookie: ""})).location, /error=oauth_failed$/, "needs the browser's own cookie");
  const first = await oauthRun(s, "google");
  assert.ok(first.session);
  const replay = await fetch(`${s.base}/api/auth/oauth/google/callback?code=abc&state=${first.authorize.searchParams.get("state")}`, {redirect: "manual", headers: {Cookie: first.stateCookie}});
  assert.match(replay.headers.get("location"), /error=oauth_failed$/, "a state works once");
  const denied = await fetch(`${s.base}/api/auth/oauth/google/callback?error=access_denied`, {redirect: "manual"});
  assert.match(denied.headers.get("location"), /error=oauth_denied$/);
  fake.profile = googleProfile({sub: "g-2", email: "x@example.com", email_verified: false});
  const unverified = await oauthRun(s, "google"); assert.match(unverified.location, /error=oauth_unverified$/); assert.equal(unverified.session, "");
  fake.profile = {id: "fb-2", name: "No Email"};
  assert.match((await oauthRun(s, "facebook")).location, /error=oauth_no_email$/);
  fake.tokenFails = true; fake.profile = googleProfile({sub: "g-3", email: "y@example.com"});
  assert.match((await oauthRun(s, "google")).location, /error=oauth_failed$/);
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM users WHERE email IN ('x@example.com','y@example.com')").get().n, 0);
  await s.close();
});

test("the page to return to must be a path on the site", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile(); const s = await start(OAUTH_ENV, fake.fetch);
  for (const next of ["//evil.example", "https://evil.example", "/\\evil.example", "/login", "javascript:alert(1)"]) {
    const r = await oauthRun(s, "google", {next});
    assert.equal(r.location, ORIGIN + "/html/#/account", next);
  }
  await s.close();
});

test("signing in with Google takes over an unverified password account instead of sharing it", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile({email: "victim@example.com"});
  const s = await start(OAUTH_ENV, fake.fetch);
  const squatter = s.client();
  await squatter("POST", "/api/auth/signup", {...signupBody("victim@example.com"), password: "squatter pass 1", confirm: "squatter pass 1"});
  const owner = await oauthRun(s, "google");
  assert.ok(owner.session);
  assert.equal((await squatter("GET", "/api/auth/me")).data.user, null, "the squatter's session ends");
  assert.equal((await s.client()("POST", "/api/auth/login", {email: "victim@example.com", password: "squatter pass 1"})).status, 401, "the squatter's password stops working");
  assert.equal(s.db.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get().n, 1);
  await s.close();
});

test("a verified password account is linked and keeps its password and records", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile({email: "ama@example.com"});
  const s = await start(OAUTH_ENV, fake.fetch); const api = s.client();
  await api("POST", "/api/auth/signup", signupBody());
  await api("POST", "/api/submissions", {kind: "quote", record: quoteRecord()});
  s.db.sqlite.exec("UPDATE users SET email_verified = 1");
  const r = await oauthRun(s, "google");
  const me = await asUser(s, r.session)("/api/auth/me");
  assert.equal(me.user.hasPassword, true);
  const records = await asUser(s, r.session)("/api/me/records");
  assert.equal(records.quotes.length, 1);
  assert.equal((await s.client()("POST", "/api/auth/login", {email: "ama@example.com", password: "correct horse 9"})).status, 200);
  await s.close();
});

test("a Google-only account has no password to change, deletes by typing DELETE, and can add a password by reset", async () => {
  const fake = fakeProviders(); fake.profile = googleProfile();
  const s = await start(OAUTH_ENV, fake.fetch);
  const r = await oauthRun(s, "google");
  const call = async (method, path, body) => {
    const response = await fetch(s.base + path, {method, headers: {"Content-Type": "application/json", "X-Requested-With": "t", Origin: ORIGIN, Cookie: r.session}, body: JSON.stringify(body)});
    return {status: response.status, data: await response.json()};
  };
  assert.equal((await call("POST", "/api/auth/password", {currentPassword: "x", nextPassword: "new password 1", confirm: "new password 1"})).status, 400);
  assert.equal((await s.client()("POST", "/api/auth/login", {email: "ama@example.com", password: "anything at all"})).status, 401);
  const plain = s.client();
  await plain("POST", "/api/auth/forgot", {email: "ama@example.com"});
  const token = s.outbox[0].text.match(/token=([\w-]+)/)[1];
  assert.equal((await plain("POST", "/api/auth/reset", {token, password: "added password 1", confirm: "added password 1"})).status, 200);
  assert.equal((await s.client()("POST", "/api/auth/login", {email: "ama@example.com", password: "added password 1"})).status, 200);
  await s.close();

  const s2 = await start(OAUTH_ENV, fake.fetch);
  const r2 = await oauthRun(s2, "google");
  const del = async body => { const response = await fetch(s2.base + "/api/auth/delete", {method: "POST", headers: {"Content-Type": "application/json", "X-Requested-With": "t", Origin: ORIGIN, Cookie: r2.session}, body: JSON.stringify(body)}); return response.status; };
  assert.equal(await del({confirmText: "delete"}), 400);
  assert.equal(await del({confirmText: "DELETE"}), 200);
  assert.equal(s2.db.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get().n, 0);
  assert.equal(s2.db.sqlite.prepare("SELECT COUNT(*) AS n FROM oauth_identities").get().n, 0);
  await s2.close();
});
