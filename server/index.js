import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";
import { loadConfig } from "./config.js";
import { createMailer } from "./mailer.js";

const config = loadConfig();
const db = createDatabase(config.db || config);
const mailer = createMailer(config);

// Create Express app for static + API
const app = express();

// Try to find client build folder (works for UPDATE repo structure)
const possiblePaths = [
  path.join(process.cwd(), "client", "dist"),
  path.join(process.cwd(), "dist"),
  path.join(process.cwd(), "public"),
  path.join(process.cwd(), "client", "build"),
  path.join(process.cwd(), "..", "client", "dist")
];
let clientPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) { clientPath = p; break; }
}
console.log("[static] client path:", clientPath || "NOT FOUND - API only");

if (clientPath) {
  app.use(express.static(clientPath));
}

// Your API app
const apiApp = createApp({ db, config, mailer });

// Mount API under /api
app.use("/api", (req, res) => apiApp(req, res));

// For all other routes, serve index.html (for your #/ hash router + normal routes)
if (clientPath) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ ok: true, message: "SURGICISS API is live. Frontend not found in build, check build settings." });
  });
}

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
    try { await db.execute(sql); } catch (e) { console.log("[initDb]", e.message); }
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

const port = config.port || process.env.PORT || 10000;

initDb().then(() => {
  const server = http.createServer(app);
  server.listen(port, () => console.log(`SURGICISS full stack running on port ${port}`));
});
