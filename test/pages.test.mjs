// Opens the real site in a browser and checks every page. Needs Playwright:
//   npm install --no-save playwright && npx playwright install chromium && npm run test:pages
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".pdf": "application/pdf", ".txt": "text/plain", ".xml": "application/xml"};
const DATA = new vm.Script(fs.readFileSync(path.join(root, "public/js/data.js"), "utf8") + "\nDATA;").runInNewContext({});

let server, browser, base;
before(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x").pathname;
    // Browser-only mode: no API address, so nothing is sent anywhere.
    if (url === "/js/config.js") { res.setHeader("Content-Type", "text/javascript"); return res.end('const SURGICISS_CONFIG={apiBase:"",company:{}};window.SURGICISS_CONFIG=SURGICISS_CONFIG;'); }
    // Like the real server: a page address without a file ending is answered with index.html.
    const file = url === "/" || !path.extname(url) ? path.join(root, "index.html") : path.join(root, "public", url);
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.statusCode = 404; return res.end("missing"); }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await new Promise(r => server.close(r)); });

async function open(hash, size = {width: 1280, height: 900}) {
  const page = await browser.newPage({viewport: size});
  const problems = [];
  page.on("pageerror", e => problems.push("script error: " + e.message));
  // A missing file on the site itself is a problem. The account calls to /api are expected to fail here: there is no server.
  page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(base) && !r.url().includes("/api/")) problems.push(`${r.status()} ${r.url().replace(base, "")}`); });
  await page.route(url => !url.href.startsWith(base), r => r.abort());
  await page.goto(`${base}${hash}`);
  await page.waitForSelector("main h1, main h2", {timeout: 5000});
  return {page, problems};
}
const headline = page => page.evaluate(() => document.querySelector("main h1")?.textContent.trim() || "");

const routes = ["/", "/about", "/products", "/software", "/services", "/programmes", "/count-sheet-holders", "/contact-us", "/generate-quote", "/faq", "/resources", "/search", "/privacy", "/terms", "/login", "/sign-up", "/forgot-password"]
  .concat(DATA.productCategories.map(c => "/product-category/" + c.slug))
  .concat(DATA.products.map(p => "/products/" + p.slug))
  .concat(DATA.software.map(s => "/software/" + s.slug))
  .concat(DATA.services.map(s => "/services/" + s.slug))
  .concat(DATA.programmes.map(s => "/programmes/" + s.slug));

test("every page opens with a heading and no script errors", async () => {
  for (const route of routes) {
    const {page, problems} = await open(route);
    const h = await headline(page);
    assert.ok(h || route === "/", `${route} has no heading`);
    assert.ok(!/can.t find that page/i.test(h), `${route} shows "page not found"`);
    assert.deepEqual(problems, [], `${route}: ${problems.join("; ")}`);
    await page.close();
  }
});

test("an unknown address shows the not-found page", async () => {
  const {page} = await open("/no-such-page");
  assert.match(await page.evaluate(() => document.querySelector("main").textContent), /can.t find that page/i);
  await page.close();
});

test("every link in the header and footer leads to a real page", async () => {
  const {page} = await open("/");
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll("header a[href^='/'], footer a[href^='/']")].map(a => a.getAttribute("href").split("?")[0]).filter(h => !/\.[a-z0-9]+$/i.test(h)))]);
  assert.ok(links.length > 10, "found too few links: " + links.length);
  for (const link of links) {
    await page.goto(`${base}${link}`);
    await page.waitForSelector("main h1, main h2");
    assert.ok(!/can.t find that page/i.test(await headline(page)), `${link} leads to "page not found"`);
  }
  await page.close();
});

test("pictures load on the home page, the products page and every product page", async () => {
  for (const route of ["/", "/products", ...DATA.products.map(p => "/products/" + p.slug)]) {
    const {page} = await open(route);
    await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach(i => i.removeAttribute("loading")));
    await page.waitForTimeout(400);
    const broken = await page.evaluate(() => [...document.images].filter(i => i.src && i.complete && i.naturalWidth === 0).map(i => i.getAttribute("src")));
    assert.deepEqual(broken, [], `${route} has pictures that do not load`);
    await page.close();
  }
});

test("the Master Wrap page offers the instructions for use PDF", async () => {
  const {page} = await open("/products/surgical-instrument-master-wrap");
  const href = await page.getAttribute(".ifu-dl a", "href");
  const res = await page.request.get(`${base}${href}`);
  assert.equal(res.status(), 200);
  assert.match(res.headers()["content-type"], /pdf/);
  assert.equal(await page.locator(".ifu-steps li").count(), 3);
  await page.close();
});

test("on the login page, Forgot password sits under the password box, before Sign in", async () => {
  const {page} = await open("/login");
  const order = await page.evaluate(() => {
    const y = sel => document.querySelector(sel).getBoundingClientRect().top;
    return [y("#password"), y(".forgot-row a"), y(".login-submit")];
  });
  assert.ok(order[0] < order[1] && order[1] < order[2], "wrong order: " + order.join(", "));
  await page.close();
});

test("a visitor who is not signed in cannot generate a quote, but can ask a question", async () => {
  const quote = await open("/generate-quote");
  assert.equal(await quote.page.locator("#quote-form, form[data-quote]").count(), 0, "the quote form is open to anyone");
  assert.match(await quote.page.evaluate(() => document.querySelector("main").textContent), /sign in|log in|create an account/i);
  await quote.page.close();
  const ask = await open("/contact-us");
  assert.ok(await ask.page.locator("#enquiry").count() > 0, "the question form is missing");
  await ask.page.close();
});

test("the phone layout has no sideways scrolling and the logo is the right size", async () => {
  for (const route of ["/", "/products", "/products/surgical-instrument-master-wrap", "/login"]) {
    const {page} = await open(route, {width: 390, height: 800});
    const m = await page.evaluate(() => ({wide: document.documentElement.scrollWidth - innerWidth, logo: document.querySelector(".logo img").getBoundingClientRect().height}));
    assert.ok(m.wide <= 1, `${route} scrolls sideways by ${m.wide}px on a phone`);
    assert.ok(m.logo >= 30 && m.logo <= 80, `${route} logo is ${m.logo}px tall on a phone`);
    await page.close();
  }
});

test("pages have real addresses and links open without reloading", async () => {
  const {page} = await open("/");
  await page.evaluate(() => { window.__same = true; });
  await page.click("header a[href='/products']");
  await page.waitForURL(`${base}/products`);
  assert.ok(await page.evaluate(() => window.__same === true), "the page was reloaded");
  assert.match(await headline(page), /product/i);
  await page.goBack();
  await page.waitForURL(`${base}/`);
  assert.ok(await page.evaluate(() => window.__same === true), "back reloaded the page");
  await page.close();
});

test("old links with a # address open the real page", async () => {
  const page = await browser.newPage();
  await page.route(url => !url.href.startsWith(base), r => r.abort());
  await page.goto(`${base}/#/products/surgical-instrument-master-wrap`);
  await page.waitForSelector("main h1");
  assert.equal(new URL(page.url()).pathname, "/products/surgical-instrument-master-wrap");
  assert.equal(new URL(page.url()).hash, "");
  await page.close();
});

test("every page has a search symbol that opens a search for products and software", async () => {
  for (const route of ["/", "/products", "/about", "/login", "/contact-us"]) {
    const {page} = await open(route);
    assert.equal(await page.locator(".bar-toggle").count(), 1, `${route} has no search symbol`);
    assert.ok(await page.locator(".bar-search").isHidden(), `${route} shows the box before it is pressed`);
    await page.close();
  }
  const {page} = await open("/about");
  await page.click(".bar-toggle");
  await page.fill(".bar-search", "master wrap");
  await page.waitForSelector(".bar-results a");
  assert.match(await page.textContent(".bar-results"), /Master Wrap/i);
  await page.click(".bar-results a");
  await page.waitForURL(/\/products\/surgical-instrument-master-wrap/);
  await page.click(".bar-toggle");
  await page.fill(".bar-search", "matrix");
  await page.press(".bar-search", "Enter");
  await page.waitForURL(`${base}/search`);
  assert.equal(await page.locator(".bar-toggle").count(), 0, "the search page should not show the symbol");
  assert.match(await page.inputValue("#site-search"), /matrix/);
  await page.close();
});
