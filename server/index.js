import http from "node:http";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";
import { loadConfig } from "./config.js";
import { createMailer } from "./mailer.js";

const config = loadConfig();
const db = createDatabase(config.db || config);
const mailer = createMailer(config);

async function initDb() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL
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
      console.log("[initDb] Created table OK");
    } catch (e) { 
      console.log("[initDb] Error:", e.message); 
    }
  }
  try {
    await db.execute("ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY delivery_location TEXT NULL");
  } catch (e) {}
  console.log("[initDb] Database ready - sessions table now exists!");
}

const app = createApp({ db, config, mailer });
const server = http.createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  app(req, res);
});
const port = config.port || process.env.PORT || 3000;

initDb().then(() => {
  server.listen(port, () => {
    console.log(`SURGICISS API running on port ${port}`);
  });
});
