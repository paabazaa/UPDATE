// Search engine readiness: real server-rendered pages, honest status codes, one address per page, titles, structured data.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createSeo } from "../seo.js";
import { createStaticFiles } from "../static.js";

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const site = fs.mkdtempSync(path.join(os.tmpdir(), "seo-"));
fs.cpSync(path.join(repo, "public"), site, { recursive: true });
fs.copyFileSync(path.join(repo, "index.html"), path.join(site, "index.html"));
const BASE = "https://www.example.org";
const seo = createSeo({ root: site, config: { siteUrl: BASE }, verification: "token123" });
const text = html => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const tag = (html, re) => (html.match(re) || [])[1];

test("every public page is built on the server with real content", () => {
  const paths = seo.paths();
  assert.ok(paths.length >= 30, "found only " + paths.length);
  for (const p of paths) {
    const page = seo.page(p);
    assert.equal(page.status, 200, p);
    assert.ok(/<h1[ >]/.test(page.html), p + " has no h1 in the HTML the server sends");
    assert.ok(text(page.html.split('<div id="app">')[1]).length > 400, p + " arrives nearly empty");
    assert.ok(!page.html.includes("We can't find that page"), p);
  }
});

test("each page has its own title, a description of sensible length, and its canonical address", () => {
  const titles = new Map();
  for (const p of seo.paths()) {
    const { html } = seo.page(p);
    const title = tag(html, /<title>(.*?)<\/title>/);
    assert.ok(title && title.length <= 70, `${p} title: ${title}`);
    assert.ok(!titles.has(title), `${p} repeats the title of ${titles.get(title)}: ${title}`);
    titles.set(title, p);
    const description = tag(html, /<meta name="description" content="([^"]*)"/);
    assert.ok(description.length >= 50 && description.length <= 165, `${p} description is ${description.length} characters`);
    assert.equal(tag(html, /<link rel="canonical" href="([^"]*)"/), BASE + (p === "/" ? "/" : p));
    assert.equal(tag(html, /<meta property="og:url" content="([^"]*)"/), BASE + (p === "/" ? "/" : p));
    assert.ok(html.includes('content="token123"'), "search console verification tag is missing");
  }
});

test("no page is kept out of search by mistake, and private pages are kept out on purpose", () => {
  assert.ok(!fs.readFileSync(path.join(repo, "index.html"), "utf8").includes("noindex"), "index.html itself must not say noindex");
  for (const p of seo.paths()) assert.match(seo.page(p).html, /<meta name="robots" content="index, follow">/, p);
  for (const p of ["/login", "/sign-up", "/account", "/account/quotes", "/forgot-password"]) {
    const page = seo.page(p);
    assert.equal(page.status, 200, p);
    assert.match(page.html, /noindex, nofollow/, p);
    assert.ok(!page.html.includes("application/ld+json"), p);
  }
});

test("an address that does not exist is a real 404, not the home page", () => {
  for (const p of ["/nothing-here", "/products/not-a-product", "/software/x", "/a/b/c/d"]) {
    const page = seo.page(p);
    assert.equal(page.status, 404, p);
    assert.match(page.html, /noindex/);
    assert.match(page.html, /We can't find that page/);
  }
  assert.ok(seo.count() < 200, "unknown addresses must not each get their own cache entry");
});

test("one address per page: duplicates are redirected", () => {
  assert.equal(seo.redirectFor("/products/", "?a=1"), "/products?a=1");
  assert.equal(seo.redirectFor("/Products"), "/products");
  assert.equal(seo.redirectFor("/index.html"), "/");
  assert.equal(seo.redirectFor("/request-quote", "?item=x"), "/generate-quote?item=x");
  assert.equal(seo.redirectFor("/products"), null);
  assert.equal(seo.redirectFor("/"), null);
  assert.equal(seo.redirectFor("/images/Logo.PNG"), null, "files are left alone");
});

test("structured data is valid, specific to the page and built from facts on the page", () => {
  const read = p => [...seo.page(p).html.matchAll(/<script type="application\/ld\+json" data-ld>(.*?)<\/script>/g)].map(m => JSON.parse(m[1].replace(/\\u003c/g, "<")));
  const home = read("/");
  assert.ok(home.some(d => d["@type"] === "Organization" && d.name === "SURGICISS LTD" && d.address.addressCountry === "GH"));
  assert.ok(home.some(d => d["@type"] === "WebSite"));
  const product = read("/products/surgical-instrument-master-wrap");
  assert.ok(product.some(d => d["@type"] === "BreadcrumbList" && d.itemListElement.length === 3));
  const item = product.find(d => d["@type"] === "Product");
  assert.equal(item.name, "Surgical Instrument Master Wrap");
  assert.ok(item.url.startsWith(BASE) && item.image.startsWith(BASE));
  assert.ok(!("offers" in item) && !("aggregateRating" in item), "no invented prices or ratings");
  assert.ok(read("/software/sterile-matrix-ai").some(d => d["@type"] === "SoftwareApplication") || read(seo.paths().find(p => p.startsWith("/software/"))).some(d => d["@type"] === "SoftwareApplication"));
  const faq = read("/faq").find(d => d["@type"] === "FAQPage");
  assert.ok(faq.mainEntity.length >= 5 && faq.mainEntity.every(q => q.acceptedAnswer.text && !/[<>]/.test(q.acceptedAnswer.text)));
});

test("images have alt text and every link is a real link", () => {
  for (const p of seo.paths()) {
    const html = seo.page(p).html;
    for (const img of html.match(/<img\b[^>]*>/g) || []) assert.ok(/\balt="/.test(img), `${p}: image without alt: ${img.slice(0, 80)}`);
    assert.ok(!/href="#"|href="javascript:/i.test(html), p + " has a link that is not a real address");
  }
  const meaningful = seo.page("/products").html.match(/<img\b[^>]*>/g).filter(i => /alt="[^"]+"/.test(i));
  assert.ok(meaningful.length >= 6, "product pictures should describe the product");
});

test("the sitemap lists exactly the public pages, on the real address", () => {
  const xml = seo.sitemapXml(BASE);
  for (const p of seo.paths()) assert.ok(xml.includes(`<loc>${BASE}${p === "/" ? "/" : p}</loc>`), p);
  assert.ok(!/login|sign-up|account|search|request-quote|#/.test(xml));
  assert.ok(seo.robotsTxt(BASE).includes(`Sitemap: ${BASE}/sitemap.xml`));
  assert.ok(seo.robotsTxt(BASE).includes("Disallow: /api/"));
});

test("served over HTTP: real status codes, headers and compressed pages", async t => {
  const files = createStaticFiles(site, { page: seo.page });
  const server = http.createServer((req, res) => { if (!files.serve(req, res)) { res.writeHead(404); res.end("nf"); } });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const get = (p, headers = {}) => new Promise((resolve, reject) => http.get(`http://127.0.0.1:${server.address().port}${p}`, { headers, agent: false }, res => {
    const chunks = []; res.on("data", c => chunks.push(c)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() })); }).on("error", reject));
  const home = await get("/");
  assert.equal(home.status, 200);
  assert.match(home.body, /Simple innovations that get sterile processing right the first time/);
  const gone = await get("/this-is-not-a-page");
  assert.equal(gone.status, 404);
  assert.equal(gone.headers["x-robots-tag"], "noindex, nofollow");
  assert.equal((await get("/login")).headers["x-robots-tag"], "noindex, nofollow");
  assert.equal((await get("/products")).headers["x-robots-tag"], undefined);
  const again = await get("/products", { "If-None-Match": (await get("/products")).headers.etag });
  assert.equal(again.status, 304);
  assert.equal((await get("/js/data.js")).status, 200);
});
