import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnvFile } from "../env.js";
import { createStaticFiles } from "../static.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");

test("the .env file is read, comments and quotes handled, and real settings are not overwritten", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "env-")), ".env");
  fs.writeFileSync(file, '# note\nA=one\nB="two words"\nC=three # trailing\nexport D=four\nKEEP=from-file\n');
  const env = { KEEP: "from-host" };
  loadEnvFile(file, env);
  assert.deepEqual(env, { KEEP: "from-host", A: "one", B: "two words", C: "three", D: "four" });
  assert.equal(loadEnvFile(path.join(os.tmpdir(), "nope", ".env"), {}), 0);
});

test("git ignores .env and no secret file is tracked", () => {
  execFileSync("git", ["check-ignore", "-q", ".env"], { cwd: root });
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n");
  assert.deepEqual(tracked.filter(f => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example")), []);
});

test("the website never serves a .env file, even if one sits beside the pages", async t => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  fs.writeFileSync(path.join(site, "index.html"), "<html></html>");
  fs.writeFileSync(path.join(site, ".env"), "SECRET=1");
  const files = createStaticFiles(site);
  const server = http.createServer((req, res) => { if (!files.serve(req, res)) { res.writeHead(404); res.end("Not found"); } });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  for (const url of ["/.env", "/%2eenv", "/..%2f.env"]) {
    const reply = await fetch(`http://127.0.0.1:${server.address().port}${url}`);
    assert.ok(!(await reply.text()).includes("SECRET"), url);
  }
});
