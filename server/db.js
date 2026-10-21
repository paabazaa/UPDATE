import mysql from "mysql2/promise";

export function createDatabase(cfg) {
  // If no config passed, read from ENV directly (Aiven)
  const c = cfg || {};
  const host = c.host || process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = c.user || process.env.DB_USER || process.env.MYSQL_USER;
  const password = c.password || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS;
  const database = c.name || c.database || process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const port = c.port || process.env.DB_PORT || 3306;

  if (!host) {
    throw new Error("DB config missing host - check ENV");
  }

  const pool = mysql.createPool({
    host,
    port: Number(port),
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: false },
  });

  return {
    query: (sql, params) => pool.execute(sql, params),
    execute: (sql, params) => pool.execute(sql, params),
    script: (sql) => pool.query(sql),
    close: () => pool.end(),
    pool,
  };
}