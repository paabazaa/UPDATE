// Checks the HTTP security headers and the HTTPS redirect.
import test from "node:test";
import assert from "node:assert/strict";
import {contentSecurityPolicy, httpsRedirect, securityHeaders} from "../security.js";
import {loadConfig} from "../config.js";

const live = loadConfig({RENDER: "true", ALLOWED_ORIGINS: "https://site.example", SITE_URL: "https://site.example"});
const local = loadConfig({});
const req = (proto, host = "site.example", url = "/products?x=1") => ({headers: {"x-forwarded-proto": proto, host}, url});

test("plain http requests are sent to https in production, keeping the address", () => {
  assert.equal(httpsRedirect(live, req("http")), "https://site.example/products?x=1");
  assert.equal(httpsRedirect(live, req("https")), null);
  assert.equal(httpsRedirect(live, {headers: {host: "internal"}, url: "/"}), null, "host health checks are left alone");
  assert.equal(httpsRedirect(local, req("http")), null, "local testing stays on http");
});

test("a hostile Host header cannot make the redirect point somewhere else", () => {
  const target = httpsRedirect(live, req("http", "evil.example/@x\r\nSet-Cookie: a=b"));
  assert.ok(!/[\r\n]/.test(target || ""));
});

test("HSTS is sent over https in production only", () => {
  assert.match(securityHeaders(live, req("https"))["Strict-Transport-Security"], /max-age=31536000/);
  assert.equal(securityHeaders(live, req("http"))["Strict-Transport-Security"], undefined);
  assert.equal(securityHeaders(local, req("https"))["Strict-Transport-Security"], undefined);
});

test("the content security policy blocks injected scripts, framing and outside connections", () => {
  const policy = contentSecurityPolicy(live);
  assert.match(policy, /script-src 'self'(;|$)/);
  assert.ok(!/script-src[^;]*unsafe/.test(policy), "no unsafe scripts");
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /connect-src 'self' https:\/\/site\.example/);
  const headers = securityHeaders(live, req("https"));
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
});
