// Tests for what keeps the site standing when many people use it: the email queue, the fast static files, the paged lists.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import zlib from "node:zlib";
import { createQueue, isRetryable } from "../queue.js";
import { createStaticFiles } from "../static.js";
import { createMailer } from "../mailer.js";

const quiet = { log: () => {} };

test("a failed email is retried with growing waits, then succeeds", async () => {
  const waits = [];
  const queue = createQueue({ ...quiet, sleep: async ms => waits.push(ms), random: () => 0.5 });
  let calls = 0;
  queue.add("mail", async () => { calls += 1; if (calls < 3) throw Object.assign(new Error("busy"), { status: 503 }); });
  await queue.drain();
  assert.equal(calls, 3);
  assert.equal(waits.length, 2);
  assert.ok(waits[1] > waits[0], "each wait is longer than the last");
  assert.equal(queue.stats.done, 1);
});

test("an error that cannot pass is not retried", async () => {
  const queue = createQueue({ ...quiet, sleep: async () => {} });
  let calls = 0;
  queue.add("mail", async () => { calls += 1; throw Object.assign(new Error("bad key"), { status: 401 }); });
  await queue.drain();
  assert.equal(calls, 1);
  assert.equal(queue.stats.failed, 1);
  assert.equal(isRetryable({ status: 400 }), false);
  assert.equal(isRetryable({ status: 429 }), true);
  assert.equal(isRetryable(new Error("socket hang up")), true);
});

test("it gives up after the set number of attempts and honours Retry-After", async () => {
  const waits = [];
  const queue = createQueue({ ...quiet, attempts: 3, sleep: async ms => waits.push(ms), random: () => 0 });
  let calls = 0;
  queue.add("mail", async () => { calls += 1; throw Object.assign(new Error("slow down"), { status: 429, retryAfterMs: 9000 }); });
  await queue.drain();
  assert.equal(calls, 3);
  assert.ok(waits.every(ms => ms >= 9000));
});

test("only a few jobs run at once, and a full line refuses new jobs", async () => {
  const queue = createQueue({ ...quiet, concurrency: 2, maxWaiting: 3 });
  let live = 0, peak = 0;
  const release = [];
  const work = () => async () => { live += 1; peak = Math.max(peak, live); await new Promise(r => release.push(r)); live -= 1; };
  const results = [1, 2, 3, 4, 5, 6].map(n => queue.add("job" + n, work()));
  assert.deepEqual(results, [true, true, true, true, true, false], "two running, three waiting, the sixth is refused");
  assert.equal(queue.stats.dropped, 1);
  while (queue.size()) { release.splice(0).forEach(r => r()); await new Promise(r => setImmediate(r)); }
  assert.equal(peak, 2);
});

test("the email service error carries its status so the queue can decide", async () => {
  const config = { mail: { brevoKey: "k", from: "SURGICISS <a@b.co>" }, production: true };
  const mailer = createMailer(config, async () => new Response("slow", { status: 429, headers: { "retry-after": "3" } }));
  await assert.rejects(mailer.send({ to: "x@y.z", subject: "s", text: "t" }), error => error.status === 429 && error.retryAfterMs === 3000);
});

function staticSite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  fs.writeFileSync(path.join(dir, "index.html"), "<!doctype html><title>Home</title>" + "<p>hello</p>".repeat(200));
  fs.mkdirSync(path.join(dir, "js"));
  fs.writeFileSync(path.join(dir, "js", "app.js"), "console.log('x');\n".repeat(300));
  fs.writeFileSync(path.join(dir, "logo.png"), Buffer.alloc(3000, 1));
  const files = createStaticFiles(dir);
  const server = http.createServer((req, res) => { if (!files.serve(req, res)) { res.writeHead(404); res.end("nf"); } });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => { server.closeAllConnections(); server.close(); }, dir })));
}
const get = (url, headers = {}) => new Promise((resolve, reject) => http.get(url, { headers, agent: false }, res => {
  const chunks = []; res.on("data", c => chunks.push(c)); res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })); }).on("error", reject));

test("static files: compressed, cached, revalidated and safe", async t => {
  const site = await staticSite();
  t.after(() => site.close());
  const plain = await get(site.base + "/js/app.js");
  assert.equal(plain.status, 200);
  const br = await get(site.base + "/js/app.js", { "Accept-Encoding": "br, gzip" });
  assert.equal(br.headers["content-encoding"], "br");
  assert.equal(zlib.brotliDecompressSync(br.body).toString(), plain.body.toString());
  assert.ok(br.body.length < plain.body.length / 5, "much smaller on the wire");
  const gz = await get(site.base + "/js/app.js", { "Accept-Encoding": "gzip" });
  assert.equal(zlib.gunzipSync(gz.body).toString(), plain.body.toString());
  assert.equal(gz.headers.vary, "Accept-Encoding");

  const again = await get(site.base + "/js/app.js", { "If-None-Match": plain.headers.etag });
  assert.equal(again.status, 304);
  assert.equal(again.body.length, 0);

  const page = await get(site.base + "/account/quotes");
  assert.equal(page.status, 200, "a page address falls back to index.html");
  assert.match(page.body.toString(), /<title>Home<\/title>/);
  assert.match(page.headers["cache-control"], /no-cache/);
  assert.match((await get(site.base + "/js/app.js")).headers["cache-control"], /max-age=86400/);

  const missing = await get(site.base + "/js/nothing.js");
  assert.equal(missing.status, 404, "a missing file is a 404, not the home page");
  const image = await get(site.base + "/logo.png", { "Accept-Encoding": "br" });
  assert.equal(image.headers["content-encoding"], undefined, "images are not recompressed");
  assert.equal(image.body.length, 3000);
  const traversal = await get(site.base + "/%2e%2e/etc/passwd");
  assert.ok(!/root:/.test(traversal.body.toString()), "nothing outside the site folder can be read");
  const dots = await get(site.base + "/js/..%2f..%2fetc/passwd");
  assert.ok(dots.status !== 200 || /<title>Home/.test(dots.body.toString()));
});
