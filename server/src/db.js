const mysql = require('mysql2/promise');
const config = require('./config');
const fs = require('fs');
const path = require('path');

let pool;

async function initDb() {
  pool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const schemaPath = path.join(__dirname, '..', 'scripts', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

    for (const stmt of statements) {
      try {
        await pool.execute(stmt);
      } catch (e) {
        if (!e.message.includes('Duplicate') && !e.message.includes('already exists')) {
          console.warn('[DB] Schema 语句跳过:', e.message.slice(0, 80));
        }
      }
    }
  }

  console.log('[DB] MySQL 连接池已初始化');
  return pool;
}

const db = {
  async get(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const [rows] = await pool.execute(sql, flatParams);
    return rows[0] || null;
  },

  async all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const [rows] = await pool.execute(sql, flatParams);
    return rows;
  },

  async run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const [result] = await pool.execute(sql, flatParams);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  },

  async exec(sql) {
    const conn = await pool.getConnection();
    try {
      const statements = sql.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of statements) {
        await conn.execute(stmt);
      }
    } finally {
      conn.release();
    }
  },

  getPool() {
    return pool;
  }
};

module.exports = { initDb, db };
