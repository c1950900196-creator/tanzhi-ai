#!/usr/bin/env node
/**
 * SQLite -> MySQL 数据迁移脚本
 * 用法: node scripts/migrate-sqlite-to-mysql.js [--sqlite-path path/to/tanzhi.db]
 */
require('dotenv').config();
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const path = require('path');

const SQLITE_PATH = process.argv.includes('--sqlite-path')
  ? process.argv[process.argv.indexOf('--sqlite-path') + 1]
  : path.join(__dirname, '..', 'data', 'tanzhi.db');

async function migrate() {
  console.log('=== 探知 SQLite -> MySQL 迁移工具 ===\n');

  console.log(`SQLite 路径: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'tanzhi',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tanzhi',
    waitForConnections: true,
    connectionLimit: 5
  });

  console.log('MySQL 连接成功\n');

  const tables = [
    {
      name: 'users',
      columns: 'id, username, password, role, tags, created_at, last_active'
    },
    {
      name: 'cards',
      columns: 'id, target_role, tags, heat, title, summary, gradient, author_name, author_avatar, author_color, author_title, ai_first_message, quick_replies, source, source_url, created_at'
    },
    {
      name: 'card_events',
      columns: 'id, user_id, card_id, event_type, source, meta, created_at'
    },
    {
      name: 'tag_library',
      columns: 'id, name, category, embedding, usage_count, created_at'
    }
  ];

  for (const table of tables) {
    console.log(`--- 迁移 ${table.name} ---`);

    const rows = sqlite.prepare(`SELECT ${table.columns} FROM ${table.name}`).all();
    console.log(`  SQLite 中有 ${rows.length} 条记录`);

    if (rows.length === 0) {
      console.log('  跳过（无数据）\n');
      continue;
    }

    const cols = table.columns.split(', ');
    const placeholders = cols.map(() => '?').join(', ');
    const insertSql = `INSERT INTO ${table.name} (${table.columns}) VALUES (${placeholders})`;

    let inserted = 0, skipped = 0;
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        for (const row of batch) {
          const values = cols.map(c => row[c] ?? null);
          try {
            await conn.execute(insertSql, values);
            inserted++;
          } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
              skipped++;
            } else {
              console.error(`  错误 (${table.name}):`, e.message);
            }
          }
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error(`  批次错误:`, e.message);
      } finally {
        conn.release();
      }
    }

    console.log(`  完成: 插入 ${inserted}, 跳过 ${skipped}\n`);
  }

  // 验证
  console.log('--- 验证数据完整性 ---');
  for (const table of tables) {
    const sqliteCount = sqlite.prepare(`SELECT count(*) as c FROM ${table.name}`).get().c;
    const [mysqlRows] = await pool.execute(`SELECT count(*) as c FROM ${table.name}`);
    const mysqlCount = mysqlRows[0].c;
    const match = sqliteCount === mysqlCount ? '✓' : '✗';
    console.log(`  ${match} ${table.name}: SQLite=${sqliteCount}, MySQL=${mysqlCount}`);
  }

  sqlite.close();
  await pool.end();
  console.log('\n迁移完成！');
}

migrate().catch(e => {
  console.error('迁移失败:', e);
  process.exit(1);
});
