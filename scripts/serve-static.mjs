// Minimal static file server for a built or unbuilt copy of the site.
// Usage: node scripts/serve-static.mjs [directory] [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(projectRoot, process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`No index.html found in ${root}. Run "npm run build" first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = path.normalize(path.join(root, pathname));
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
