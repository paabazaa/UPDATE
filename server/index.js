import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";
import { createApp } from "./app.js";
import * as cfgMod from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

async function start() {
  const config = cfgMod.loadConfig ? cfgMod.loadConfig() : (cfgMod.default || cfgMod);
  let db;
  try {
    const dbCfg = config.db || config;
    db = createDatabase(dbCfg && dbCfg.host ? dbCfg : undefined);
  } catch { db = createDatabase(); }

  try {
    await db.script(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(255), phone VARCHAR(50), organisation VARCHAR(255), country VARCHAR(100), city VARCHAR(100), delivery_location TEXT, password_hash VARCHAR(255) NOT NULL, email_verified TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);`);
    console.log("✅ users table ready");
  } catch(e){}

  const apiHandler = await createApp({ db, config });

  const possiblePaths = [
    path.join(rootDir, "dist"),
    path.join(rootDir, "build"),
    path.join(rootDir, "public"),
  ];
  let staticDir = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { staticDir = p; console.log(`Found static: ${p}`); break; }
  }

  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) return apiHandler(req, res);

    if (staticDir) {
      const cleanUrl = req.url.split("?")[0].split("#")[0];
      const filePath = path.join(staticDir, cleanUrl === "/" ? "index.html" : cleanUrl);

      // If file exists and is a file, serve it
      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        const ext = path.extname(filePath).toLowerCase();
        const mime = { ".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".ico":"image/x-icon" };
        res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      // File NOT found but request is for JS/CSS/image -> 404, DON'T return index.html
      if (path.extname(cleanUrl)) {
        res.writeHead(404);
        res.end();
        return;
      }

      // Only for routes without extension (like / , /#/login ) -> return index.html
      const indexFile = path.join(staticDir, "index.html");
      if (fs.existsSync(indexFile)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(indexFile).pipe(res);
        return;
      }
    }

    return apiHandler(req, res);
  });

  const port = process.env.PORT || 10000;
  server.listen(port, () => console.log(`SURGICISS API + Website listening on port ${port}`));
}
start().catch(e=>{console.error(e); process.exit(1);});