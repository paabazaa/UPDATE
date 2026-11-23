#!/usr/bin/env node
// Load test: many pretend visitors use the site at the same time, then it reports speed and errors.
//
//   node scripts/loadtest.mjs --url http://localhost:3000 --users 200 --seconds 30
//   node scripts/loadtest.mjs --url https://staging.example.com --users 1000 --seconds 60 --yes
//
// Each pretend visitor loads the home page and its scripts and styles, calls the sign-in check, browses to other pages,
// pauses like a person would, and repeats. Pass --cookie "surgiciss_session=..." to also load a signed-in account's lists.
// Results: requests per second, response times (median, 95th and 99th percentile), errors, and a pass or fail.
//
// Read before running against the real site:
//  - Test a staging copy, or do it at a quiet hour and tell your host first. Hosts can treat a load test as an attack.
//  - The firewall and the built-in shield will throttle or ban the machine running the test, exactly as designed.
//    Put this machine's address in SHIELD_ALLOWLIST on the server for the length of the test, and pause the edge firewall's
//    rate rules for it. Remove both afterwards.
//  - The test only reads. It never signs up, logs in or sends forms, so it creates no accounts and no quote requests.
import http from "node:http";
import https from "node:https";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf("--" + name);
  return at >= 0 && args[at + 1] && !args[at + 1].startsWith("--") ? args[at + 1] : fallback;
};
const flag = name => args.includes("--" + name);
if (flag("help") || !option("url")) {
  console.log("Usage: node scripts/loadtest.mjs --url <address> [--users 200] [--seconds 30] [--ramp 10] [--cookie <session cookie>] [--yes]");
  process.exit(option("url") ? 0 : 1);
}

const target = new URL(option("url"));
const users = Math.max(1, Number(option("users", 200)));
const seconds = Math.max(1, Number(option("seconds", 30)));
const ramp = Math.min(seconds - 1, Math.max(0, Number(option("ramp", Math.min(10, seconds / 3)))));
const cookie = option("cookie", "");
const local = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
if (!local && !flag("yes")) {
  console.error(`This will send ${users} simultaneous visitors to ${target.origin}.\nRead the notes at the top of this file, then add --yes to go ahead.`);
  process.exit(1);
}

const lib = target.protocol === "https:" ? https : http;
const agent = new lib.Agent({ keepAlive: true, maxSockets: Math.min(users, 500) });
const samples = [];          // milliseconds
const statuses = new Map();
const failures = new Map();
let bytes = 0;

function request(path, headers = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const req = lib.request({ agent, hostname: target.hostname, port: target.port || undefined, path, method: "GET", timeout: 20000,
      headers: { "Accept-Encoding": "br, gzip", "User-Agent": "Mozilla/5.0 (loadtest)", ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      const chunks = [];
      res.on("data", chunk => { bytes += chunk.length; if (chunks.length < 64) chunks.push(chunk); });
      res.on("end", () => {
        const ms = performance.now() - started;
        samples.push(ms);
        statuses.set(res.statusCode, (statuses.get(res.statusCode) || 0) + 1);
        resolve({ status: res.statusCode, body: res.headers["content-encoding"] ? "" : Buffer.concat(chunks).toString("utf8") });
      });
    });
    const fail = reason => { failures.set(reason, (failures.get(reason) || 0) + 1); samples.push(performance.now() - started); resolve({ status: 0, body: "" }); };
    req.on("timeout", () => { req.destroy(); fail("timeout"); });
    req.on("error", error => fail(error.code || error.message));
    req.end();
  });
}

const pause = (min, max) => new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
const pages = ["/", "/software", "/products", "/contact-us", "/instrument-count-sheet-holders"];
let assets = ["/css/styles.css"];

async function discoverAssets() {
  const home = await request("/", { "Accept-Encoding": "identity" });
  const found = [...home.body.matchAll(/(?:src|href)="(\/[^"#]+\.(?:js|css)[^"]*)"/g)].map(match => match[1]);
  if (found.length) assets = found;
}

const stopAt = { time: 0 };
async function visitor(index) {
  await pause(0, ramp * 1000 * (index / users) * 2 || 1); // spread the arrivals over the ramp-up
  while (performance.now() < stopAt.time) {
    const page = pages[Math.floor(Math.random() * pages.length)];
    await request(page);
    await Promise.all(assets.map(asset => request(asset)));           // a browser loads these in parallel
    await Promise.all([request("/api/auth/me"), request("/api/auth/oauth/providers")]);
    if (cookie) await request("/api/me/records?limit=25");
    await pause(800, 3500);                                           // reading time
  }
}

const percentile = (sorted, p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;

await discoverAssets();
console.log(`Testing ${target.origin} with ${users} visitors for ${seconds}s (ramp-up ${ramp}s). ${assets.length} script/style files per page.`);
samples.length = 0; statuses.clear(); failures.clear(); bytes = 0;
const begin = performance.now();
stopAt.time = begin + seconds * 1000;
await Promise.all(Array.from({ length: users }, (_, i) => visitor(i)));
const elapsed = (performance.now() - begin) / 1000;

const sorted = [...samples].sort((a, b) => a - b);
const total = sorted.length;
const errors = [...statuses].filter(([code]) => code >= 500).reduce((sum, [, n]) => sum + n, 0) + [...failures.values()].reduce((a, b) => a + b, 0);
const blocked = [...statuses].filter(([code]) => code === 403 || code === 429).reduce((sum, [, n]) => sum + n, 0);
const p95 = percentile(sorted, 0.95);
const errorRate = total ? errors / total : 1;

console.log(`\nRequests:      ${total} (${(total / elapsed).toFixed(0)} per second), ${(bytes / 1048576).toFixed(1)} MB received`);
console.log(`Response time: median ${percentile(sorted, 0.5).toFixed(0)} ms, 95th ${p95.toFixed(0)} ms, 99th ${percentile(sorted, 0.99).toFixed(0)} ms, slowest ${(sorted.at(-1) || 0).toFixed(0)} ms`);
console.log(`Answers:       ${[...statuses].sort().map(([code, n]) => `${code}: ${n}`).join(", ") || "none"}`);
if (failures.size) console.log(`Failed:        ${[...failures].map(([why, n]) => `${why}: ${n}`).join(", ")}`);
console.log(`Error rate:    ${(errorRate * 100).toFixed(2)}%`);
if (blocked) console.log(`Note: ${blocked} requests were refused with 403 or 429. The firewall or shield is limiting this machine. See the notes at the top of this file.`);
const pass = errorRate < 0.01 && p95 < 1500 && !blocked;
console.log(`\n${pass ? "PASS" : "FAIL"}: needs under 1% errors, 95th percentile under 1500 ms, and nothing refused.`);
agent.destroy();
process.exit(pass ? 0 : 2);
