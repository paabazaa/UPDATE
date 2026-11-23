import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";
import { loadConfig } from "./config.js";
import { createMailer } from "./mailer.js";
import { runMigrations } from "./migrations.js";
import { httpsRedirect, securityHeaders } from "./security.js";
import crypto from "node:crypto";
import { createShield, internal, refuse } from "./shield.js";
import { createStaticFiles } from "./static.js";
import { createQueue } from "./queue.js";

const config = loadConfig();
const db = createDatabase(config.database);
const mailer = createMailer(config);
console.log(mailer.configured
  ? `[mail] Staff notifications: ON via ${config.mail.brevoKey ? "Brevo" : "Resend"}, sent to ${config.mail.notifyTo}`
  : "[mail] Staff notifications: OFF. Set BREVO_API_KEY or RESEND_API_KEY in the environment to receive quote and enquiry emails.");

// Brings the database up to date. A problem is logged but never stops the website from starting.
async function initDb() {
  const result = await runMigrations(db);
  if (result.failed) throw result.failed.error;
}

// Slow outside work (email) runs here, a few at a time with retries, never inside a visitor's request.
const queue = createQueue({ concurrency: Number(process.env.MAIL_CONCURRENCY) || 3 });
const apiApp = createApp({ db, config, mailer, queue });

// Find client folder
const clientPaths = [
  path.join(process.cwd(), "client", "dist"),
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "client", "build")
];

let clientDist = null;

for (const p of clientPaths) {
  if (
    fs.existsSync(p) &&
    fs.existsSync(path.join(p, "index.html"))
  ) {
    clientDist = path.resolve(p);
    break;
  }
}

console.log(
  "[static] Serving client from:",
  clientDist || "NOT FOUND - using API only"
);

const staticFiles = clientDist ? createStaticFiles(clientDist) : null;
if (staticFiles) console.log(`[static] ${staticFiles.count} files ready (compressed copies of text files kept in memory)`);

const shield = createShield({
  enabled: process.env.SHIELD !== "off",
  allowlist: String(process.env.SHIELD_ALLOWLIST || "").split(",").map(x => x.trim()).filter(Boolean)
});

// Optional: when ORIGIN_SECRET is set, only traffic that came through the edge firewall (which adds this secret as the
// X-Origin-Secret header) is served. Anyone hitting the Render address directly to get around the firewall is refused.
const originSecret = String(process.env.ORIGIN_SECRET || "");
function cameThroughFirewall(req) {
  const sent = String(req.headers["x-origin-secret"] || "");
  const a = Buffer.from(sent), b = Buffer.from(originSecret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function visitorAddress(req) {
  if (config.trustProxy || process.env.RENDER) {
    // Behind the edge firewall the real visitor address is in CF-Connecting-IP, and is only believed once the secret checks out.
    if (originSecret && cameThroughFirewall(req)) {
      const edge = String(req.headers["cf-connecting-ip"] || "").trim();
      if (edge) return edge;
    }
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress || "unknown";
}

const server = http.createServer((req, res) => {
  // The shield runs first, before any page or API code.
  const visitor = visitorAddress(req);
  if (originSecret && !internal(visitor) && !cameThroughFirewall(req)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    return res.end("Request blocked.");
  }
  const verdict = shield.inspect(req, visitor);
  if (verdict) {
    for (const [name, value] of Object.entries(securityHeaders(config, req))) res.setHeader(name, value);
    return refuse(res, verdict);
  }
  res.on("finish", () => shield.observe(req, visitor, res.statusCode));

  const secureAddress = httpsRedirect(config, req);
  if (secureAddress) {
    res.writeHead(301, { Location: secureAddress, "Cache-Control": "no-store" });
    return res.end();
  }
  for (const [name, value] of Object.entries(securityHeaders(config, req))) res.setHeader(name, value);

  // API and authentication requests must not be cached.
  if (
    req.url.startsWith("/api/") ||
    req.url.startsWith("/auth/")
  ) {
    res.setHeader("Cache-Control", "no-store");
    return apiApp(req, res);
  }

  // Serve static website files (from memory, compressed, with ETags). See server/static.js.
  if (staticFiles && staticFiles.serve(req, res)) return;

  // Fallback to API for other routes.
  res.setHeader("Cache-Control", "no-store");
  return apiApp(req, res);
});

const port = config.port || Number(process.env.PORT) || 10000;

// Slow or stuck connections are cut off instead of holding a slot for ever.
server.keepAliveTimeout = 65000; // longer than the host's load balancer keeps connections open, so it never reuses a dead one
server.headersTimeout = 66000;
server.requestTimeout = 30000;
server.maxRequestsPerSocket = 0;

// On a restart or deploy: stop taking new connections, let waiting email finish, then exit.
let stopping = false;
async function shutDown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[server] ${signal} received, finishing waiting jobs`);
  server.close();
  await queue.drain(8000);
  await db.close().catch(() => {});
  process.exit(0);
}
process.on("SIGTERM", () => shutDown("SIGTERM"));
process.on("SIGINT", () => shutDown("SIGINT"));

initDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`SURGICISS full stack running on port ${port}`);
    });
  })
  .catch(err => {
    console.error("initDb failed", err);

    server.listen(port, () => {
      console.log(`Running on port ${port} despite DB init error`);
    });
  });
