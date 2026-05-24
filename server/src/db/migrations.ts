import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      to_number TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id)
    );
  `);

  // Add key_hash and name columns to api_keys if not already present
  const columns = db.pragma('table_info(api_keys)') as Array<{ name: string }>;
  const columnNames = columns.map(c => c.name);

  if (!columnNames.includes('key_hash')) {
    db.exec(`ALTER TABLE api_keys ADD COLUMN key_hash TEXT`);
  }

  if (!columnNames.includes('name')) {
    db.exec(`ALTER TABLE api_keys ADD COLUMN name TEXT DEFAULT ''`);
  }
}
