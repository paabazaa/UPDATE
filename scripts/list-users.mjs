import { loadConfig } from "../server/config.js";
import { createDatabase } from "../server/db.js";

const config = loadConfig();
const db = createDatabase(config.database);

console.log("=== DATABASE TYPE:", config.database.type, "===\n");

try {
  // Show all tables
  const tables = config.database.type === 'mysql' 
    ? db.query ? await db.query("SHOW TABLES") : []
    : db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables:", tables);

  // Try common user table names
  const possibleTables = ["users", "accounts", "user", "Customers", "customers"];
  
  for (const table of possibleTables) {
    try {
      let rows;
      if (config.database.type === 'mysql') {
        const [r] = await db.query(`SELECT * FROM \`${table}\` LIMIT 100`);
        rows = r;
      } else {
        rows = db.prepare(`SELECT * FROM "${table}" LIMIT 100`).all();
      }
      if (rows.length > 0) {
        console.log(`\n--- ${table.toUpperCase()} (${rows.length} rows) ---`);
        console.table(rows);
      }
    } catch(e) {
      // table doesn't exist, ignore
    }
  }

} catch (err) {
  console.error("Error:", err.message);
} finally {
  if (db.close) db.close();
  if (db.end) await db.end();
  process.exit(0);
}
