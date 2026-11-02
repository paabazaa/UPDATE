import mysql from "mysql2/promise";

let pool = null;

export function getPool() {
  if (pool) return pool;
  
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 28184),
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "defaultdb",
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  
  pool = mysql.createPool(config);
  return pool;
}

export async function initDb() {
  const db = getPool();
  
  // Fix users table for OAuth - MUST allow NULL password_hash
  try {
    await db.execute("ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL");
    console.log("[initDb] Fixed users.password_hash to allow NULL for Google/Facebook OAuth");
  } catch (e) {
    console.log("[initDb] users.password_hash fix:", e.message);
  }
  
  try {
    await db.execute("ALTER TABLE users MODIFY phone VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY organisation VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY country VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY city VARCHAR(255) NULL DEFAULT ''");
    await db.execute("ALTER TABLE users MODIFY delivery_location TEXT NULL");
  } catch (e) {
    console.log("[initDb] Other columns fix:", e.message);
  }

  const createTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NULL DEFAULT '',
      organisation VARCHAR(255) NULL DEFAULT '',
      country VARCHAR(255) NULL DEFAULT '',
      city VARCHAR(255) NULL DEFAULT '',
      delivery_location TEXT NULL,
      password_hash VARCHAR(255) NULL,
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      avatar MEDIUMTEXT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS oauth_states (
      id VARCHAR(255) PRIMARY KEY,
      provider VARCHAR(50) NOT NULL,
      verifier VARCHAR(255) NOT NULL,
      next_path VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS oauth_identities (
      provider VARCHAR(50) NOT NULL,
      provider_user_id VARCHAR(255) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL,
      PRIMARY KEY (provider, provider_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id VARCHAR(36) PRIMARY KEY,
      reference VARCHAR(20) NOT NULL UNIQUE,
      user_id VARCHAR(36) NULL,
      contact_email VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      payload JSON NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS enquiries (
      id VARCHAR(36) PRIMARY KEY,
      reference VARCHAR(20) NOT NULL UNIQUE,
      user_id VARCHAR(36) NULL,
      contact_email VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      payload JSON NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email VARCHAR(255) PRIMARY KEY,
      created_at DATETIME NOT NULL
    )`
  ];

  for (const sql of createTables) {
    try {
      await db.execute(sql);
      console.log("[initDb] OK");
    } catch (e) {
      console.log("[initDb] Table exists or error:", e.message.slice(0,100));
    }
  }

  console.log("[initDb] Database ready!");
  return db;
}

export const db = {
  query: async (sql, params) => {
    const [rows] = await getPool().execute(sql, params);
    return rows;
  },
  execute: async (sql, params) => {
    const [result] = await getPool().execute(sql, params);
    return result;
  }
};
