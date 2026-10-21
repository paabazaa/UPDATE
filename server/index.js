// Starts the API server + serves the website frontend
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {loadConfig, checkConfig} from "./config.js";
import {createDatabase} from "./db.js";
import {createMailer} from "./mailer.js";
import {createApp} from "./app.js";

const config = loadConfig();
const problems = checkConfig(config);
if (problems.length) {
  console.error("Cannot start the API:\n- " + problems.join("\n- "));
  process.exit(1);
}

const db = createDatabase(config.database);

// AUTO-CREATE TABLES IF NOT EXISTS (Fix for Aiven empty DB)
try {
  await db.script(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      company VARCHAR(255),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL
    );
  `);
  console.log("✅ users table ready");
} catch (e) {
  console.error("DB migration error:", e.message);
}

const handler = createApp({db, config, mailer: createMailer(config)});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");

function serveStatic(req, res) {
  const cleanUrl = req.url.split("?")[0].split("#")[0];
  let filePath = path.join(distPath, cleanUrl === "/" ? "index.html" : cleanUrl);
  if (!filePath.startsWith(distPath)) filePath = path.join(distPath, "index.html");

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon" }[ext] || "application/octet-stream";
    res.writeHead(200, {"Content-Type": mime});
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  const hasExt = path.extname(cleanUrl) !== "";
  if (hasExt) {
    res.writeHead(404, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: "Not found: " + cleanUrl}));
    return;
  }
  const indexPath = path.join(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    res.writeHead(404, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: "Frontend not built."}));
    return;
  }
  res.writeHead(200, {"Content-Type": "text/html"});
  fs.createReadStream(indexPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  // === ADMIN CHECK: Who signed up / logged in ===
  if (req.url.startsWith("/api/admin/users")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const key = url.searchParams.get("key");
    if (key !== "surgiciss2024") {
      res.writeHead(401, {"Content-Type": "application/json"});
      res.end(JSON.stringify({error: "Wrong key. Use ?key=surgiciss2024"}));
      return;
    }
    try {
      let users = [];
      const [rows] = await db.script("SELECT id, email, name, company, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 100").then ? [] : [];
      // Use query method for mysql
      try {
        const result = await db.query("SELECT id, email, name, company, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 100");
        users = Array.isArray(result) ? result : result.rows || [];
      } catch(e) {
        users = [];
      }
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify({ count: users.length, users }, null, 2));
    } catch (err) {
      res.writeHead(500, {"Content-Type": "application/json"});
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (req.url.startsWith("/api/") || req.url === "/api") {
    handler(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(config.port, () => console.log(`SURGICISS API + Website listening on port ${config.port}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => db.close().finally(() => process.exit(0))));
}