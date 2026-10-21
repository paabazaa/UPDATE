import { createDb } from "./db.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const db = createDb(config);

const sql = `
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  id VARCHAR(128) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  verifier TEXT NOT NULL,
  next_path VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_identities (
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(36) PRIMARY KEY,
  reference VARCHAR(50) NOT NULL UNIQUE,
  user_id VARCHAR(36) NULL,
  contact_email VARCHAR(254) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(36) PRIMARY KEY,
  reference VARCHAR(50) NOT NULL UNIQUE,
  user_id VARCHAR(36) NULL,
  contact_email VARCHAR(254) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email VARCHAR(254) PRIMARY KEY,
  created_at DATETIME NOT NULL
);
`;

async function run() {
  const statements = sql.split(";").map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    console.log("Running:", stmt.slice(0, 80));
    await db.execute(stmt);
  }
  console.log("ALL TABLES CREATED SUCCESSFULLY!");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
