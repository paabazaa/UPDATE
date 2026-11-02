import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

export function createDatabase(cfg) {
  const c = cfg || {};
  const host = c.host || process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = c.user || process.env.DB_USER || process.env.MYSQL_USER;
  const password = c.password || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS;
  const database = c.name || c.database || process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const port = c.port || process.env.DB_PORT || 3306;

  if (!host) {
    throw new Error("DB config missing host - check ENV");
  }

  // Load Aiven's trusted CA certificate
  const caFile = process.env.DB_SSL_CA_FILE || "/etc/secrets/aiven-ca.pem";

  let caCertificate;

  try {
    caCertificate = readFileSync(caFile);
  } catch (error) {
    throw new Error(
      `Unable to load database SSL CA certificate from ${caFile}: ${error.message}`
    );
  }

  const pool = mysql.createPool({
    host,
    port: Number(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
      ca: caCertificate,
      rejectUnauthorized: true,
    },
  });

  // ===== FIX FOR GOOGLE + FACEBOOK OAUTH - auto-fix users table =====
  // This fixes: Column 'password_hash' cannot be null
  pool.query("ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL").then(()=>console.log("[db] Fixed password_hash NULL for OAuth")).catch(()=>{});
  pool.query("ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT ''").catch(()=>{});
  pool.query("ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT ''").catch(()=>{});
  pool.query("ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT ''").catch(()=>{});
  pool.query("ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT ''").catch(()=>{});
  pool.query("ALTER TABLE users MODIFY delivery_location TEXT NULL").catch(()=>{});
  pool.query("ALTER TABLE users MODIFY avatar MEDIUMTEXT NULL").catch(()=>{});

  return {
    // Return rows only, not [rows, fields]
    query: async (sql, params) => {
      const [rows] = await pool.query(sql, params);
      return rows;
    },
    execute: async (sql, params) => {
      const [result] = await pool.execute(sql, params);
      return result;
    },
    script: (sql) => pool.query(sql),
    close: () => pool.end(),
    pool,
  };
}
