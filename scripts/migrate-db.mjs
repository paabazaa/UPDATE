// Creates the database and applies the database changes in server/migrations: npm run db:migrate
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { runMigrations } from "../server/migrations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "..", ".env");

// Settings come from the host's environment, and from a .env file when one exists.
let envText = "";
try { envText = fs.readFileSync(envPath, "utf8"); } catch {}
const env = { ...process.env };
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx === -1) continue;
  const k = line.slice(0, idx).trim();
  const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  env[k] = v;
}

const DB_HOST = env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(env.DB_PORT || 3306);
const DB_USER = env.DB_USER;
const DB_PASS = env.DB_PASSWORD || "";
const DB_NAME = env.DB_NAME;

console.log(`Connecting as ${DB_USER} to create ${DB_NAME} if not exists...`);

// 1) Connect WITHOUT database to create it
const rootConn = await mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
});
await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
await rootConn.end();
console.log(`Database ${DB_NAME} exists`);

// 2) Now connect WITH database and apply the migrations that have not run yet
const conn = await mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME
});

try {
  const db = {
    query: async (sql, params) => (await conn.query(sql, params))[0],
    execute: async (sql, params) => (await conn.query(sql, params))[0]
  };
  const result = await runMigrations(db);
  if (result.failed) process.exitCode = 1;
} finally {
  await conn.end();
}
