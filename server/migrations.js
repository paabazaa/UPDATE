// Database changes, applied in order and recorded in the schema_migrations table so each one runs only once.
// To change the database later, add a new file to server/migrations/ and list it below. Never edit one that has been released.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sqlFile = name => readFileSync(fileURLToPath(new URL("./migrations/" + name, import.meta.url)), "utf8");

const missingColumn = error => Boolean(error) && (
  error.code === "ER_BAD_FIELD_ERROR" || error.errno === 1054 || /no such column|unknown column/i.test(String(error.message))
);

export const migrations = [
  { id: "001-baseline", sql: () => sqlFile("001-baseline.sql") },
  { id: "002-widen-user-columns", sql: () => sqlFile("002-widen-user-columns.sql") },
  {
    // Databases created before profile pictures existed need the extra column.
    id: "003-user-avatar",
    async run(db) {
      try {
        await db.query("SELECT avatar FROM users LIMIT 1");
      } catch (error) {
        if (!missingColumn(error)) throw error;
        await db.execute("ALTER TABLE users ADD COLUMN avatar MEDIUMTEXT NULL");
      }
    }
  }
];

const splitStatements = text => text
  .split(/;\s*(?:\r?\n|$)/)
  .map(part => part.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

const stamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// Applies every migration that has not been applied yet. Stops at the first one that fails and reports it; the ones before it stay applied.
// Returns { applied: [ids], failed: { id, error } | null }.
export async function runMigrations(db, list = migrations, log = console) {
  await db.execute("CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR(100) NOT NULL PRIMARY KEY, applied_at DATETIME NOT NULL)");
  const done = new Set((await db.query("SELECT id FROM schema_migrations")).map(row => row.id));
  const applied = [];
  for (const migration of list) {
    if (done.has(migration.id)) continue;
    try {
      if (migration.run) await migration.run(db);
      else for (const statement of splitStatements(migration.sql())) await db.execute(statement);
      await db.execute("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)", [migration.id, stamp()]);
      applied.push(migration.id);
      log.log(`[db] Applied migration ${migration.id}`);
    } catch (error) {
      log.error(`[db] Migration ${migration.id} failed: ${String((error && error.message) || error).slice(0, 300)}`);
      return { applied, failed: { id: migration.id, error } };
    }
  }
  if (!applied.length) log.log("[db] Database is up to date");
  return { applied, failed: null };
}
