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

const apiApp = createApp({ db, config, mailer });

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

// Static file MIME types
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf"
};

// Determine appropriate caching for static files
function setStaticCacheHeaders(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".html" || ext === ".htm") {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, max-age=86400"
  );
}

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

  // Serve static website files.
  if (clientDist && (req.method === "GET" || req.method === "HEAD")) {
    let pathname;

    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname
      );
    } catch {
      res.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      });

      return res.end("Bad Request");
    }

    // Resolve the requested file safely inside the client directory.
    const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

    const filePath = path.resolve(clientDist, requestedPath);

    // Prevent directory traversal outside the client directory.
    if (
      filePath !== clientDist &&
      !filePath.startsWith(clientDist + path.sep)
    ) {
      res.writeHead(403, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      });

      return res.end("Forbidden");
    }

    let finalPath = filePath;

    // Check whether the requested file exists.
    let fileExists = false;

    try {
      fileExists =
        fs.existsSync(finalPath) &&
        fs.statSync(finalPath).isFile();
    } catch {
      fileExists = false;
    }

    // Support frontend routes without file extensions.
    if (!fileExists) {
      const hasExtension = Boolean(path.extname(pathname));

      if (!hasExtension || pathname === "/") {
        finalPath = path.join(clientDist, "index.html");
        fileExists = fs.existsSync(finalPath);
      }
    }

    if (fileExists) {
      const ext = path.extname(finalPath).toLowerCase();

      res.setHeader(
        "Content-Type",
        contentTypes[ext] || "application/octet-stream"
      );

      setStaticCacheHeaders(res, finalPath);

      if (req.method === "HEAD") {
        res.writeHead(200);
        return res.end();
      }

      const stream = fs.createReadStream(finalPath);

      stream.on("error", () => {
        if (!res.headersSent) {
          res.writeHead(500, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          });
        }

        if (!res.writableEnded) {
          res.end("Internal Server Error");
        }
      });

      return stream.pipe(res);
    }
  }

  // Fallback to API for other routes.
  res.setHeader("Cache-Control", "no-store");
  return apiApp(req, res);
});

const port = config.port || Number(process.env.PORT) || 10000;

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
