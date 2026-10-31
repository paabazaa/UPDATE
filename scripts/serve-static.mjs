// Minimal static file server for a built or unbuilt copy of the site.
// Usage: node scripts/serve-static.mjs [directory] [port]

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const root = path.resolve(projectRoot, process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf"
};

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  console.error("Invalid server port.");
  process.exit(1);
}

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(
    `No index.html found in ${root}. Run "npm run build" first.`
  );
  process.exit(1);
}

// Apply baseline security headers to every response.
function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
}

// Set appropriate cache policies.
function applyCacheHeaders(res, file) {
  const ext = path.extname(file).toLowerCase();

  if (ext === ".html" || ext === ".htm") {
    res.setHeader(
      "Cache-Control",
      "no-cache, must-revalidate"
    );
    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, max-age=86400"
  );
}

const server = http.createServer((req, res) => {
  applySecurityHeaders(res);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(405, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Method Not Allowed");
    return;
  }

  let pathname;

  try {
    pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname
    );
  } catch {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Bad Request");
    return;
  }

  if (pathname.includes("\0")) {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(400, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Bad Request");
    return;
  }

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const requestedPath = pathname.replace(/^\/+/, "");
  const file = path.resolve(root, requestedPath);

  // Prevent directory traversal outside the configured root.
  if (
    file !== root &&
    !file.startsWith(root + path.sep)
  ) {
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Forbidden");
    return;
  }

  fs.stat(file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.setHeader("Cache-Control", "no-store");
      res.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(file).toLowerCase();

    res.setHeader(
      "Content-Type",
      contentTypes[ext] ?? "application/octet-stream"
    );

    applyCacheHeaders(res, file);

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    const stream = fs.createReadStream(file);

    stream.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(500, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        });
      }

      if (!res.writableEnded) {
        res.end("Internal Server Error");
      }
    });

    res.writeHead(200);
    stream.pipe(res);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving ${root} on port ${port}`);
});
