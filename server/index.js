import { createDatabase } from "./db.js";
import { createApp } from "./app.js";
import * as cfgMod from "./config.js";

async function start() {
  const config = cfgMod.loadConfig ? cfgMod.loadConfig() : (cfgMod.default || cfgMod);

  // Try with config.db, or config, or no args (env fallback)
  let db;
  try {
    const dbCfg = config.db || config;
    db = createDatabase(dbCfg.host ? dbCfg : undefined);
  } catch (e) {
    console.log("Retrying DB with ENV:", e.message);
    db = createDatabase();
  }

  // === FIX USERS TABLE SCHEMA ===
  try {
    await db.script(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        organisation VARCHAR(255),
        country VARCHAR(100),
        city VARCHAR(100),
        delivery_location TEXT,
        password_hash VARCHAR(255) NOT NULL,
        email_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    const alters = [
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50)",
      "ALTER TABLE users ADD COLUMN organisation VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN country VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN city VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN delivery_location TEXT",
      "ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0",
      "ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ];
    for (const sql of alters) {
      try { await db.script(sql); } catch {}
    }
    console.log("✅ users table ready");
  } catch (e) {
    console.error("DB migration error:", e.message);
  }

  const app = createApp({ db, config });
  const port = process.env.PORT || 10000;
  app.listen(port, () => {
    console.log(`SURGICISS API + Website listening on port ${port}`);
  });
}

start().catch(err => {
  console.error("Failed to start:", err);
  process.exit(1);
});