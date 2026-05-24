import Database from 'better-sqlite3';

export function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'disconnected',
      session_data_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_connected TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tier_limits (
      tier TEXT PRIMARY KEY,
      max_numbers INTEGER NOT NULL,
      max_requests_per_day INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_request_log_user_timestamp
      ON request_log (user_id, timestamp);
  `);
}

export function cleanupRequestLog(db: Database.Database): void {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM request_log WHERE timestamp < ?').run(cutoff);
}

export function seedTierLimits(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as count FROM tier_limits').get() as { count: number };
  if (existing.count === 0) {
    const insert = db.prepare('INSERT INTO tier_limits (tier, max_numbers, max_requests_per_day) VALUES (?, ?, ?)');
    insert.run('free', 1, 100);
    insert.run('pro', 5, 5000);
    insert.run('enterprise', 20, 50000);
  }
}
