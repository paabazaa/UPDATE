import http from "node:http";
import { createApp } from "./app.js";
import { createDb } from "./db.js";
import { loadConfig } from "./config.js";
import { createMailer } from "./mailer.js";
import fs from "node:fs";

const config = loadConfig();
const db = createDb(config);
const mailer = createMailer(config);

// AUTO-CREATE TABLES ON STARTUP (fixes free Render with no Shell)
async function initDb() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      INDEX idx_sessions_user_id (user_id),
      INDEX idx_sessions_expires_at (expires_at)
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(254) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NULL DEFAULT '',
      organisation VARCHAR(255) NULL DEFAULT '',
      country VARCHAR(255) NULL DEFAULT '',
      city VARCHAR(255) NULL DEFAULT '',
      delivery_location TEXT NULL,
      password_hash VARCHAR(255) NULL,
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS oauth_states (
      id VARCHAR(128) PRIMARY KEY,
      provider VARCHAR(50) NOT NULL,
      verifier TEXT NOT NULL,
      next_path VARCHAR(500) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS oauth_identities (
      provider VARCHAR(50) NOT NULL,
      provider_user_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      email VARCHAR(254) NOT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (provider, provider_user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id VARCHAR(36) PRIMARY KEY,
      reference VARCHAR(50) NOT NULL UNIQUE,
      user_id VARCHAR(36) NULL,
      contact_email VARCHAR(254) NOT NULL,
      status VARCHAR(50) NOT NULL,
      payload JSON NOT NULL,
      created_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS enquiries (
      id VARCHAR(36) PRIMARY KEY,
      reference VARCHAR(50) NOT NULL UNIQUE,
      user_id VARCHAR(36) NULL,
      contact_email VARCHAR(254) NOT NULL,
      status VARCHAR(50) NOT NULL,
      payload JSON NOT NULL,
      created_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email VARCHAR(254) PRIMARY KEY,
      created_at DATETIME NOT NULL
    )`
  ];
  
  for (const sql of tables) {
    try {
      await db.execute(sql);
      console.log("[initDb] OK:", sql.slice(0, 50));
    } catch (e) {
      console.log("[initDb] Skip/Error:", e.message);
    }
  }
  
  // Fix old users table columns to allow empty
  try {
    await db.execute("ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY delivery_location TEXT NULL");
  } catch (e) {
    console.log("[initDb] alter skip:", e.message);
  }
  
  console.log("[initDb] Database ready!");
}

const app = createApp({ db, config, mailer });

const server = http.createServer((req, res) => {
  // Set no-cache headers to fix phone white screen
  res.setHeader("Cache-Control", "no-store");
  app(req, res);
});

const port = config.port || 3000;

initDb().then(() => {
  server.listen(port, () => {
    console.log(`SURGICISS API running on port ${port}`);
  });
}).catch(err => {
  console.error("DB init failed:", err);
  server.listen(port, () => {
    console.log(`SURGICISS API running on port ${port} (DB init failed)`);
  });
});
