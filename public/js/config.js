// Reads server settings from environment variables. See .env.example.
const toBool = (value, fallback) => (value === undefined || value === "" ? fallback : /^(1|true|yes)$/i.test(value));
const toList = value => String(value || "").split(",").map(item => item.trim().replace(/\/+$/, "")).filter(Boolean);

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const secureCookie = toBool(env.COOKIE_SECURE, production);
  return {
    production,
    port: Number(env.PORT || 3000),
    allowedOrigins: toList(env.ALLOWED_ORIGINS),
    siteUrl: String(env.SITE_URL || "").replace(/\/+$/, ""),
    trustProxy: toBool(env.TRUST_PROXY, false),
    // Public address of this API, used to build the sign-in return address registered with Google and Facebook.
    apiUrl: String(env.API_URL || "").replace(/\/+$/, ""),
    oauth: {
      google: {clientId: env.GOOGLE_CLIENT_ID || "", secret: env.GOOGLE_CLIENT_SECRET || ""},
      facebook: {clientId: env.FACEBOOK_APP_ID || "", secret: env.FACEBOOK_APP_SECRET || "", version: env.FACEBOOK_API_VERSION || "v23.0"},
      endpoints: {}
    },
    session: {
      days: Number(env.SESSION_DAYS || 14),
      cookieName: "surgiciss_session",
      secure: secureCookie,
      // Cross-site cookies (site and API on different domains) need SameSite=None, which requires Secure.
      sameSite: env.COOKIE_SAMESITE || (secureCookie ? "None" : "Lax")
    },
    database: {
      host: env.DB_HOST || "127.0.0.1",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER || "",
      password: env.DB_PASSWORD || "",
      database: env.DB_NAME || "",
      ssl: toBool(env.DB_SSL, false)
    },
    mail: {
      from: env.MAIL_FROM || "SURGICISS LTD <no-reply@localhost>",
      host: env.SMTP_HOST || "",
      port: Number(env.SMTP_PORT || 587),
      user: env.SMTP_USER || "",
      password: env.SMTP_PASSWORD || "",
      secure: toBool(env.SMTP_SECURE, false),
      // Where new quote requests and enquiries are announced. Set NOTIFY_EMAIL to change it.
      notifyTo: env.NOTIFY_EMAIL || "surgiciss@gmail.com",
      // Optional: send mail through Resend's web API instead of SMTP (hosts such as Render's free plan block SMTP ports).
      resendKey: env.RESEND_API_KEY || ""
    }
  };
}

export function checkConfig(config) {
  const problems = [];
  if (!config.database.user || !config.database.database) problems.push("DB_USER and DB_NAME must be set.");
  if (!config.allowedOrigins.length) problems.push("ALLOWED_ORIGINS must list the website address, for example https://example.com.");
  if (config.session.sameSite.toLowerCase() === "none" && !config.session.secure) problems.push("COOKIE_SAMESITE=None requires COOKIE_SECURE=true (HTTPS).");
  const anyOauth = ["google", "facebook"].some(name => config.oauth[name].clientId || config.oauth[name].secret);
  if (anyOauth && !config.apiUrl) problems.push("API_URL must be set (the public address of this API) when Google or Facebook sign-in is configured.");
  for (const name of ["google", "facebook"]) {
    if (Boolean(config.oauth[name].clientId) !== Boolean(config.oauth[name].secret)) problems.push(`Set both the ${name} client ID and secret, or neither.`);
  }
  if (config.production && !config.siteUrl) problems.push("SITE_URL must be set so password-reset emails link to the website.");
  return problems;
}
