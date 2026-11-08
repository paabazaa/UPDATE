// Checks the migration runner with an in-memory SQLite database and the real migration list for mistakes.
import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrations, runMigrations } from "../migrations.js";

function memoryDb() {
  const sqlite = new DatabaseSync(":memory:");
  return {
    sqlite,
    async query(sql, params = []) { return sqlite.prepare(sql).all(...params); },
    async execute(sql, params = []) { return { affectedRows: sqlite.prepare(sql).run(...params).changes }; }
  };
}
const quiet = { log() {}, error() {} };
const ids = db => db.sqlite.prepare("SELECT id FROM schema_migrations ORDER BY id").all().map(r => r.id);

test("each migration is applied once and recorded", async () => {
  const db = memoryDb();
  const list = [
    { id: "001-a", sql: () => "CREATE TABLE a (x INTEGER);\nINSERT INTO a VALUES (1);\n" },
    { id: "002-b", async run(d) { await d.execute("CREATE TABLE b (y INTEGER)"); } }
  ];
  const first = await runMigrations(db, list, quiet);
  assert.deepEqual(first.applied, ["001-a", "002-b"]);
  assert.equal(first.failed, null);
  assert.deepEqual(ids(db), ["001-a", "002-b"]);
  const second = await runMigrations(db, list, quiet);
  assert.deepEqual(second.applied, [], "nothing should run twice");
  assert.equal(db.sqlite.prepare("SELECT COUNT(*) AS n FROM a").get().n, 1);
});

test("a new migration added later is the only one that runs", async () => {
  const db = memoryDb();
  const one = { id: "001-a", sql: () => "CREATE TABLE a (x INTEGER);" };
  await runMigrations(db, [one], quiet);
  const result = await runMigrations(db, [one, { id: "002-b", sql: () => "CREATE TABLE b (y INTEGER);" }], quiet);
  assert.deepEqual(result.applied, ["002-b"]);
});

test("a failing migration is reported, is not recorded, and stops the ones after it", async () => {
  const db = memoryDb();
  const errors = [];
  const list = [
    { id: "001-a", sql: () => "CREATE TABLE a (x INTEGER);" },
    { id: "002-bad", sql: () => "THIS IS NOT SQL;" },
    { id: "003-c", sql: () => "CREATE TABLE c (z INTEGER);" }
  ];
  const result = await runMigrations(db, list, { log() {}, error: m => errors.push(m) });
  assert.deepEqual(result.applied, ["001-a"]);
  assert.equal(result.failed.id, "002-bad");
  assert.deepEqual(ids(db), ["001-a"]);
  assert.match(errors[0], /002-bad failed/);
  assert.equal(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'c'").get(), undefined);
});

test("the real migrations have unique, ordered ids and non-empty SQL", () => {
  const found = migrations.map(m => m.id);
  assert.equal(new Set(found).size, found.length, "duplicate migration id");
  assert.deepEqual(found, [...found].sort(), "migrations must be listed in order");
  for (const m of migrations) {
    assert.match(m.id, /^\d{3}-[a-z0-9-]+$/, m.id);
    if (m.sql) assert.ok(m.sql().trim().length > 20, m.id + " is empty");
    else assert.equal(typeof m.run, "function", m.id + " needs sql or run");
  }
  assert.match(migrations[0].sql(), /CREATE TABLE IF NOT EXISTS users/);
});
