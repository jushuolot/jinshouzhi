import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/jinshouzhi.db');

// 必须在打开数据库前创建目录（import 时就会执行，早于 index.js）
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('male','female','admin')),
      gender TEXT,
      birth_date TEXT,
      real_name TEXT,
      account_status TEXT NOT NULL DEFAULT 'pending',
      inviter_id TEXT,
      invite_code TEXT UNIQUE,
      open_success_at TEXT,
      receiving_enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deposit_accounts (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      total_paid INTEGER NOT NULL DEFAULT 0,
      balance INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT,
      pay_trade_no TEXT
    );

    CREATE TABLE IF NOT EXISTS student_verifies (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      enroll_status TEXT,
      education_level TEXT,
      school_name TEXT,
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS male_daily_assignment (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS match_assignments (
      id TEXT PRIMARY KEY,
      male_id TEXT NOT NULL REFERENCES users(id),
      female_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'matched',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL REFERENCES match_assignments(id),
      male_id TEXT NOT NULL,
      female_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS violation_tickets (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      conversation_id TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      deduct_amount INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refund_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      approved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO app_config(key,value) VALUES ('male_daily_assignment_limit','3');
    INSERT OR IGNORE INTO app_config(key,value) VALUES ('deposit_amount_cents','1000000');
    INSERT OR IGNORE INTO app_config(key,value) VALUES ('refund_min_days','30');
  `);
}

export function getConfig(key, fallback) {
  const row = db.prepare('SELECT value FROM app_config WHERE key=?').get(key);
  return row ? row.value : fallback;
}
