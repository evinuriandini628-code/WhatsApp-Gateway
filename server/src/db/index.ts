import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createTables, seedTierLimits } from './schema.js';

const dbPath = process.env.DATABASE_PATH || './data/gateway.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

createTables(db);
seedTierLimits(db);

export default db;
