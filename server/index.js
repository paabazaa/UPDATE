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
const handler = createApp({db, config, mailer: createMailer(config)});

// Serve frontend dist folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "..", "dist");

function serveStatic(req, res) {
  // Remove ?query from URL
  const cleanUrl = req.url.split("?")[0].split("#")[0];
  let filePath = path.join(distPath, cleanUrl === "/" ? "index.html" : cleanUrl);

  // Security: prevent ../
  if (!filePath.startsWith(distPath)) {
    filePath = path.join(distPath, "index.html");
  }

  // If file exists and is file, serve it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const mime = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon"
    }[ext] || "application/octet-stream";
    
    res.writeHead(200, {"Content-Type": mime});
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // For SPA: if no extension (like /about, /dashboard), serve index.html
  // If HAS extension (.js, .css) and not found, return 404 (don't return index.html)
  const hasExt = path.extname(cleanUrl) !== "";
  if (hasExt) {
    res.writeHead(404, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: "Not found: " + cleanUrl}));
    return;
  }

  // SPA fallback
  const indexPath = path.join(distPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    res.writeHead(404, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: "Frontend not built. Run npm run build"}));
    return;
  }
  
  res.writeHead(200, {"Content-Type": "text/html"});
  fs.createReadStream(indexPath).pipe(res);
}

const server = http.createServer((req, res) => {
  // API routes start with /api/
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
