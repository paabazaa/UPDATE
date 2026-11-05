// Checks the site's content without a browser: every product, software item, service and programme is complete,
// every picture and document it points to exists, and every page the menus link to is a real page.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = p => path.join(root, "public", p);
const read = p => fs.readFileSync(path.join(root, p), "utf8");

// data.js declares `const DATA`, so read it inside a sandbox.
const DATA = new vm.Script(read("public/js/data.js") + "\nDATA;").runInNewContext({});
const IMAGES = new vm.Script("(" + read("public/js/app.js").match(/const IMAGES = (\{[\s\S]*?\n\});/)[1] + ")").runInNewContext({});
const slugs = list => list.map(x => x.slug);

test("every list has unique slugs and the required fields", () => {
  for (const key of ["productCategories", "products", "software", "services", "programmes"]) {
    const list = DATA[key];
    assert.ok(list.length > 0, key + " is empty");
    assert.equal(new Set(slugs(list)).size, list.length, "duplicate slug in " + key);
    for (const item of list) {
      assert.match(item.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, key + " slug " + item.slug);
      assert.ok(String(item.name || "").trim(), key + "/" + item.slug + " has no name");
    }
  }
  for (const p of DATA.products) {
    for (const field of ["summary", "image", "category"]) assert.ok(p[field], p.slug + " is missing " + field);
    for (const field of ["body", "features", "applications", "specifications"]) assert.ok(Array.isArray(p[field]) && p[field].length, p.slug + " is missing " + field);
    assert.ok(slugs(DATA.productCategories).includes(p.category), p.slug + " has an unknown category");
  }
  for (const s of DATA.software) for (const field of ["summary", "image", "modules"]) assert.ok(s[field] && s[field].length, s.slug + " is missing " + field);
  for (const s of [...DATA.services, ...DATA.programmes]) assert.ok(s.summary && s.image, s.slug + " is missing a summary or image");
});

test("every picture used by the site exists", () => {
  for (const [key, file] of Object.entries(IMAGES)) assert.ok(fs.existsSync(pub(file)), `image "${key}" points to a missing file: ${file}`);
  for (const item of [...DATA.products, ...DATA.software, ...DATA.services, ...DATA.programmes]) {
    assert.ok(IMAGES[item.image], `${item.slug} uses an image key that is not defined: ${item.image}`);
  }
});

test("the Master Wrap instructions for use are complete and the PDF exists", () => {
  const wrap = DATA.products.find(p => p.slug === "surgical-instrument-master-wrap");
  assert.ok(wrap && wrap.ifu, "Master Wrap has no instructions for use");
  const u = wrap.ifu;
  assert.ok(fs.existsSync(pub(u.pdf)), "the PDF is missing: " + u.pdf);
  assert.equal(fs.readFileSync(pub(u.pdf)).subarray(0, 5).toString(), "%PDF-");
  assert.equal(u.steps.length, 3);
  for (const item of [...u.steps, ...u.views]) assert.ok(IMAGES[item.image] && fs.existsSync(pub(IMAGES[item.image])), "missing picture " + item.image);
});

test("the files named in index.html exist", () => {
  const html = read("index.html");
  for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|data:)([^"?]+)(?:\?[^"]*)?"/g)) {
    assert.ok(fs.existsSync(pub(m[1].replace(/^\//, ""))), "index.html points to a missing file: " + m[1]);
  }
});

test("the logo and icons are real pictures", () => {
  for (const f of ["images/logo.png", "apple-touch-icon.png"]) assert.equal(fs.readFileSync(pub(f)).subarray(1, 4).toString(), "PNG", f);
  assert.equal(fs.readFileSync(pub("favicon.ico")).readUInt16LE(2), 1, "favicon.ico is not an .ico file");
});

test("the sitemap and robots.txt point at the same address", () => {
  const site = read("public/sitemap.xml").match(/<loc>(https?:\/\/[^<]+?)\/?<\/loc>/)[1];
  assert.ok(read("public/robots.txt").includes(site + "/sitemap.xml"), "robots.txt does not name the sitemap");
});
