// "Continue with Google / Facebook": the OAuth 2.0 authorization-code steps, using only fetch.
// Database work and sessions stay in app.js. fetchImpl is passed in so tests can stand in for the providers.
import crypto from "node:crypto";

const NAMES = ["google", "facebook"];
const DEFAULTS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile"
  },
  facebook: version => ({
    authUrl: `https://www.facebook.com/${version}/dialog/oauth`,
    tokenUrl: `https://graph.facebook.com/${version}/oauth/access_token`,
    userUrl: `https://graph.facebook.com/${version}/me`,
    scope: "email,public_profile"
  })
};

// Returns the settings for one provider, or null when it is not fully configured.
export function providerSettings(config, name) {
  if (!NAMES.includes(name) || !config.apiUrl) return null;
  const keys = config.oauth[name];
  if (!keys || !keys.clientId || !keys.secret) return null;
  const defaults = name === "facebook" ? DEFAULTS.facebook(keys.version || "v23.0") : DEFAULTS.google;
  return {name, clientId: keys.clientId, secret: keys.secret, ...defaults, ...((config.oauth.endpoints || {})[name] || {})};
}

export const enabledProviders = config => NAMES.filter(name => providerSettings(config, name));

export const callbackUrl = (config, name) => `${config.apiUrl}/api/auth/oauth/${name}/callback`;

export function newPkce() {
  const verifier = crypto.randomBytes(48).toString("base64url");
  return {verifier, challenge: crypto.createHash("sha256").update(verifier).digest("base64url")};
}

// Only plain paths on the website are allowed as the page to return to, never a full address.
const AUTH_PAGES = /^\/(login|sign-up|forgot-password|reset-password)(?:[/?]|$)/;
export function safeNextPath(value) {
  const path = String(value || "");
  const ok = /^\/(?!\/)[A-Za-z0-9\-._~/?=&%]{0,200}$/.test(path) && !AUTH_PAGES.test(path);
  return ok ? path : "/account";
}

export function authorizeUrl(settings, config, {state, challenge}) {
  const url = new URL(settings.authUrl);
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", callbackUrl(config, settings.name));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", settings.scope);
  url.searchParams.set("state", state);
  if (settings.name === "google") {
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
  }
  return url.toString();
}

async function readJson(response) {
  try { return await response.json(); } catch { return {}; }
}

// Swaps the one-time code for the person's profile. Returns {id, email, emailVerified, name}, or throws.
export async function fetchProfile(fetchImpl, settings, config, {code, verifier}) {
  const signal = AbortSignal.timeout(8000);
  let accessToken;
  if (settings.name === "google") {
    const response = await fetchImpl(settings.tokenUrl, {
      method: "POST",
      signal,
      headers: {"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
      body: new URLSearchParams({
        code, client_id: settings.clientId, client_secret: settings.secret,
        redirect_uri: callbackUrl(config, settings.name), grant_type: "authorization_code", code_verifier: verifier || ""
      }).toString()
    });
    accessToken = (await readJson(response)).access_token;
  } else {
    const url = new URL(settings.tokenUrl);
    url.searchParams.set("client_id", settings.clientId);
    url.searchParams.set("client_secret", settings.secret);
    url.searchParams.set("redirect_uri", callbackUrl(config, settings.name));
    url.searchParams.set("code", code);
    accessToken = (await readJson(await fetchImpl(url.toString(), {signal}))).access_token;
  }
  if (!accessToken) throw new Error("The provider did not return an access token.");

  if (settings.name === "google") {
    const profile = await readJson(await fetchImpl(settings.userUrl, {signal, headers: {Authorization: `Bearer ${accessToken}`}}));
    return {id: String(profile.sub || ""), email: String(profile.email || ""), emailVerified: profile.email_verified === true || profile.email_verified === "true", name: String(profile.name || "")};
  }
  const url = new URL(settings.userUrl);
  url.searchParams.set("fields", "id,name,email");
  url.searchParams.set("access_token", accessToken);
  const profile = await readJson(await fetchImpl(url.toString(), {signal}));
  // Facebook only returns an email address it has confirmed for the account.
  return {id: String(profile.id || ""), email: String(profile.email || ""), emailVerified: Boolean(profile.email), name: String(profile.name || "")};
}
