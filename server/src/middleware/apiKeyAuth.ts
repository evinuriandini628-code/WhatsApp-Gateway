import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import db from '../db/index.js';
import { AuthRequest, User } from '../types/index.js';

/**
 * Middleware that checks for X-API-Key header as an alternative to JWT auth.
 * If the header is present and valid, attaches the user to the request.
 * If neither JWT nor API key auth succeeds, returns 401.
 */
export function authenticateApiKey(req: AuthRequest, res: Response, next: NextFunction): void {
  // If user is already set by JWT auth, skip
  if (req.user) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Authentication required. Provide a Bearer token or X-API-Key header.' });
    return;
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const keyRecord = db.prepare(
    'SELECT user_id FROM api_keys WHERE key_hash = ?'
  ).get(keyHash) as { user_id: string } | undefined;

  if (!keyRecord) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Update last_used timestamp
  db.prepare(
    "UPDATE api_keys SET last_used = datetime('now') WHERE key_hash = ?"
  ).run(keyHash);

  const user = db.prepare(
    'SELECT id, email, name, tier, created_at, updated_at FROM users WHERE id = ?'
  ).get(keyRecord.user_id) as Omit<User, 'password_hash'> | undefined;

  if (!user) {
    res.status(401).json({ error: 'User associated with API key not found' });
    return;
  }

  req.user = user;
  next();
}
