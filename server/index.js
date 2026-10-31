import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";
import { loadConfig } from "./config.js";
import { createMailer } from "./mailer.js";

const config = loadConfig();
const db = createDatabase(config.database);
const mailer = createMailer(config);
console.log(mailer.configured
  ? `[mail] Staff notifications: ON via ${config.mail.resendKey ? "Resend" : "SMTP"}, sent to ${config.mail.notifyTo}`
  : "[mail] Staff notifications: OFF. Set RESEND_API_KEY (or SMTP_HOST) in the environment to receive quote and enquiry emails.");

async function initDb() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS sessions (id VARCHAR(128) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, created_at DATETIME NOT NULL, expires_at DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS oauth_states (id VARCHAR(128) PRIMARY KEY, provider VARCHAR(50) NOT NULL, verifier TEXT NOT NULL, next_path VARCHAR(500) NOT NULL, created_at DATETIME NOT NULL, expires_at DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS oauth_identities (provider VARCHAR(50) NOT NULL, provider_user_id VARCHAR(255) NOT NULL, user_id VARCHAR(36) NOT NULL, email VARCHAR(254) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (provider, provider_user_id))`,
    `CREATE TABLE IF NOT EXISTS password_resets (id VARCHAR(128) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, created_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME NULL)`,
    `CREATE TABLE IF NOT EXISTS quotes (id VARCHAR(36) PRIMARY KEY, reference VARCHAR(50) NOT NULL UNIQUE, user_id VARCHAR(36) NULL, contact_email VARCHAR(254) NOT NULL, status VARCHAR(50) NOT NULL, payload JSON NOT NULL, created_at DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS enquiries (id VARCHAR(36) PRIMARY KEY, reference VARCHAR(50) NOT NULL UNIQUE, user_id VARCHAR(36) NULL, contact_email VARCHAR(254) NOT NULL, status VARCHAR(50) NOT NULL, payload JSON NOT NULL, created_at DATETIME NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (email VARCHAR(254) PRIMARY KEY, created_at DATETIME NOT NULL)`
  ];

  for (const sql of tables) {
    try {
      await db.execute(sql);
      console.log("[initDb] OK");
    } catch (e) {
      console.log("[initDb] err", e.message);
    }
  }

  try {
    await db.execute("ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY delivery_location TEXT NULL");
  } catch {}

  console.log("[initDb] Database ready!");
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

// Apply baseline HTTP security headers
function applySecurityHeaders(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Enable HSTS only in production over HTTPS.
  // This supports deployments behind HTTPS reverse proxies.
  const forwardedProto = (
    req.headers["x-forwarded-proto"] || ""
  ).split(",")[0].trim().toLowerCase();

  if (
    config.nodeEnv === "production" &&
    forwardedProto === "https"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000"
    );
  }
}

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

const server = http.createServer((req, res) => {
  applySecurityHeaders(req, res);

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
