// HTTP security headers and the HTTPS redirect, shared by the web server and the tests.

const forwardedProto = req => String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();

// Only the website's own files, Google Fonts and the website's own API may be loaded. This stops injected scripts from running or sending data out.
export function contentSecurityPolicy(config) {
  const own = ["'self'", ...config.allowedOrigins, config.siteUrl, config.apiUrl].filter(Boolean);
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src ${[...new Set(own)].join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ");
}

export function securityHeaders(config, req) {
  const headers = {
    "Content-Security-Policy": contentSecurityPolicy(config),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
  };
  // Tells browsers to use HTTPS only for the next year. Sent only over HTTPS in production.
  if (config.production && forwardedProto(req) === "https") headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return headers;
}

// In production, a request that reached the host over plain http is sent to the https address.
// Requests without a forwarded-protocol header (such as the host's own health checks) are left alone.
export function httpsRedirect(config, req) {
  if (!config.production || forwardedProto(req) !== "http") return null;
  const host = String(req.headers.host || "").replace(/[^a-zA-Z0-9.:-]/g, "");
  return host ? `https://${host}${req.url || "/"}` : null;
}
