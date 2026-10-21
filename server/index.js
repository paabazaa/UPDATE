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
    try { await db.execute(sql); console.log("[initDb] OK"); } catch (e) { console.log("[initDb] err", e.message); }
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
  if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
    clientDist = p;
    break;
  }
}
console.log("[static] Serving client from:", clientDist || "NOT FOUND - using API only");

const server = http.createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");

  // If /api/* or /auth/* -> go to API
  if (req.url.startsWith("/api/") || req.url.startsWith("/auth/")) {
    return apiApp(req, res);
  }

  // If client exists, try to serve static file
  if (clientDist) {
    let filePath = path.join(clientDist, req.url === "/" ? "index.html" : req.url.split("?")[0]);
    // If file is a directory or has no extension, serve index.html (for Vue/React hash router)
    if (!path.extname(filePath) || req.url.includes("#") || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(clientDist, "index.html");
    }
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
      res.setHeader("Content-Type", types[ext] || "application/octet-stream");
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // Fallback to API for other routes
  return apiApp(req, res);
});

const port = config.port || Number(process.env.PORT) || 10000;

initDb().then(() => {
  server.listen(port, () => console.log(`SURGICISS full stack running on port ${port}`));
}).catch(err => {
  console.error("initDb failed", err);
  server.listen(port, () => console.log(`Running on port ${port} despite DB init error`));
});
