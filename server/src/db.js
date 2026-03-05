const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'tanzhi.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME
  )
`);

try { db.exec('ALTER TABLE users ADD COLUMN last_active DATETIME'); } catch {}
try { db.exec('ALTER TABLE users RENAME COLUMN last_login TO last_active'); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_role TEXT NOT NULL,
    tags TEXT NOT NULL,
    heat TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    gradient TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    author_color TEXT NOT NULL,
    author_title TEXT NOT NULL,
    ai_first_message TEXT NOT NULL,
    quick_replies TEXT NOT NULL,
    source TEXT DEFAULT 'ai_generated',
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try { db.exec(`ALTER TABLE cards ADD COLUMN source TEXT DEFAULT 'ai_generated'`); } catch {}
try { db.exec(`ALTER TABLE cards ADD COLUMN source_url TEXT`); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS card_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    source TEXT,
    meta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tag_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    embedding TEXT,
    usage_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
