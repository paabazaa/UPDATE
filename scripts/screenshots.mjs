#!/usr/bin/env node
// Takes pictures of the main pages at desktop and phone width so a design change can be looked at, not just assumed.
//   npm run screenshots                 (serves the site itself and writes screenshots/*.png)
//   node scripts/screenshots.mjs https://staging.example.com   (photographs a running site instead)
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { createStaticFiles } from "../server/static.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "screenshots");
fs.mkdirSync(out, { recursive: true });

let base = process.argv[2];
let server;
if (!base) {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), "shots-"));
  fs.cpSync(path.join(root, "public"), site, { recursive: true });
  fs.copyFileSync(path.join(root, "index.html"), path.join(site, "index.html"));
  const files = createStaticFiles(site);
  server = http.createServer((req, res) => { if (!files.serve(req, res)) { res.writeHead(404); res.end("Not found"); } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}

const pages = ["/", "/products", "/software", "/services", "/contact-us", "/login", "/sign-up"];
const sizes = [["desktop", 1280, 800], ["phone", 390, 800]];
const browser = await chromium.launch();
for (const [label, width, height] of sizes) {
  for (const route of pages) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    if (!process.argv[2]) await page.route(url => !url.href.startsWith(base), r => r.abort()); // offline: only our own files
    await page.goto(base + route);
    await page.waitForSelector("main h1, main h2, .hero", { timeout: 8000 }).catch(() => {});
    await page.evaluate(async () => {            // scroll through so lazy images load
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    const name = `${label}-${route === "/" ? "home" : route.slice(1).replace(/\//g, "-")}.png`;
    await page.screenshot({ path: path.join(out, name), fullPage: true });
    console.log("saved", path.join("screenshots", name));
    await page.close();
  }
}
await browser.close();
server?.close();
