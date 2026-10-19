// MySQL connection. The rest of the server only uses query() and execute(), so it stays easy to test.
import mysql from "mysql2/promise";

export function createDatabase(config) {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? {rejectUnauthorized: true} : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
    timezone: "Z"
  });
  const clean = params => params.map(value => (value === undefined ? null : value));
  return {
    async query(sql, params = []) {
      const [rows] = await pool.execute(sql, clean(params));
      return rows;
    },
    async execute(sql, params = []) {
      const [result] = await pool.execute(sql, clean(params));
      return {affectedRows: result.affectedRows};
    },
    // Runs a statement without preparing it (used for CREATE TABLE in the migration).
    script: sql => pool.query(sql),
    close: () => pool.end()
  };
}
