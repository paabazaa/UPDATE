// Serves the website's own files quickly and safely.
//  - The list of files is read once at start (no disk lookups per request).
//  - Text files (pages, scripts, styles, svg, json) are compressed once with brotli and gzip and kept in memory, so a
//    thousand visitors cost one compression, not a thousand.
//  - Every file has an ETag, so a returning browser gets "304 Not Modified" with no body.
// Anything that is not a known file falls back to index.html for page addresses without an extension.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

export const contentTypes = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".otf": "font/otf", ".pdf": "application/pdf"
};
const COMPRESSIBLE = new Set([".html", ".htm", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".svg"]);
const SMALL = 1024;                  // not worth compressing below this
const MAX_CACHED_BYTES = 256 * 1024; // bigger files are streamed from disk instead of kept in memory

function walk(root, dir = root, found = new Map()) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(root, full, found);
    else if (entry.isFile()) found.set("/" + path.relative(root, full).split(path.sep).join("/"), full);
  }
  return found;
}

export function createStaticFiles(root) {
  const files = new Map();
  for (const [url, full] of walk(root)) {
    const ext = path.extname(full).toLowerCase();
    const size = fs.statSync(full).size;
    const entry = { full, ext, size, type: contentTypes[ext] || "application/octet-stream" };
    if (COMPRESSIBLE.has(ext) && size <= MAX_CACHED_BYTES) {
      const raw = fs.readFileSync(full);
      entry.etag = `"${crypto.createHash("sha1").update(raw).digest("base64url").slice(0, 20)}"`;
      entry.raw = raw;
      if (size >= SMALL) {
        entry.br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
        entry.gzip = zlib.gzipSync(raw, { level: 9 });
      }
    } else {
      const stat = fs.statSync(full);
      entry.etag = `"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`;
    }
    files.set(url, entry);
  }
  const index = files.get("/index.html");

  function lookup(pathname) {
    const direct = files.get(pathname);
    if (direct) return direct;
    // A page address such as /account/quotes (no file extension) is the single-page app: serve index.html.
    if (pathname === "/" || !path.extname(pathname)) return index || null;
    return null;
  }

  // Returns true when it answered the request.
  function serve(req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") return false;
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("Bad Request");
      return true;
    }
    if (pathname.includes("\0") || pathname.split("/").includes("..")) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("Forbidden");
      return true;
    }
    const entry = lookup(pathname);
    if (!entry) return false;

    res.setHeader("Content-Type", entry.type);
    res.setHeader("Cache-Control", entry.ext === ".html" || entry.ext === ".htm" ? "no-cache, must-revalidate" : "public, max-age=86400");
    res.setHeader("ETag", entry.etag);
    if (COMPRESSIBLE.has(entry.ext)) res.setHeader("Vary", "Accept-Encoding");

    const sent = String(req.headers["if-none-match"] || "");
    if (sent && sent.split(",").some(tag => tag.trim() === entry.etag || tag.trim() === "W/" + entry.etag)) {
      res.writeHead(304);
      res.end();
      return true;
    }

    let body = entry.raw;
    if (entry.raw && entry.br) {
      const accepted = String(req.headers["accept-encoding"] || "");
      if (/\bbr\b/.test(accepted)) { body = entry.br; res.setHeader("Content-Encoding", "br"); }
      else if (/\bgzip\b/.test(accepted)) { body = entry.gzip; res.setHeader("Content-Encoding", "gzip"); }
    }
    if (body) {
      res.setHeader("Content-Length", body.length);
      res.writeHead(200);
      res.end(req.method === "HEAD" ? undefined : body);
      return true;
    }
    res.setHeader("Content-Length", entry.size);
    res.writeHead(200);
    if (req.method === "HEAD") { res.end(); return true; }
    const stream = fs.createReadStream(entry.full);
    stream.on("error", () => { if (!res.writableEnded) res.destroy(); });
    stream.pipe(res);
    return true;
  }

  return { serve, count: files.size, lookup };
}
