import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";
import { createApp } from "./app.js";
import * as cfgMod from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function start() {
  const config = cfgMod.loadConfig ? cfgMod.loadConfig() : (cfgMod.default || cfgMod);

  // DB with ENV fallback (fixes host crash on Aiven)
  let db;
  try {
    const dbCfg = config.db || config;
    db = createDatabase(dbCfg && dbCfg.host ? dbCfg : undefined);
  } catch (e) {
    console.log("Retrying DB with ENV:", e.message);
    db = createDatabase();
  }

  // === FIX USERS TABLE - Full Schema ===
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

  // Create API handler (your app.js returns a function)
  const apiHandler = await createApp({ db, config });

  // Try to serve frontend static if exists (dist folder)
  const distPath = path.join(__dirname, "../dist");
  const hasDist = fs.existsSync(distPath);

  const server = http.createServer((req, res) => {
    // API routes -> go to your app.js handler
    if (req.url.startsWith("/api/")) {
      return apiHandler(req, res);
    }
    // Serve static frontend if built
    if (hasDist) {
      let filePath = path.join(distPath, req.url === "/" ? "index.html" : req.url);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, "index.html");
      }
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
        res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
    // Fallback to API handler for everything else (it will 404)
    return apiHandler(req, res);
  });

  const port = process.env.PORT || 10000;
  server.listen(port, () => {
    console.log(`SURGICISS API + Website listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});