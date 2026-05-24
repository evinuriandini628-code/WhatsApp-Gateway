import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

router.post('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const { name } = req.body as { name?: string };
  const id = uuidv4();
  const key = `wag_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = hashApiKey(key);

  db.prepare(
    'INSERT INTO api_keys (id, user_id, key, key_hash, name) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, '', keyHash, name || '');

  res.status(201).json({
    id,
    key,
    name: name || '',
    createdAt: new Date().toISOString(),
  });
});

router.get('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const keys = db.prepare(
    'SELECT id, name, created_at, last_used FROM api_keys WHERE user_id = ?'
  ).all(userId) as Array<{ id: string; name: string; created_at: string; last_used: string | null }>;

  const serialized = keys.map(k => ({
    id: k.id,
    name: k.name || '',
    createdAt: k.created_at,
    lastUsed: k.last_used,
  }));

  res.json({ keys: serialized });
});

router.delete('/:id', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const keyId = req.params.id;

  const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(keyId, userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'API key not found' });
    return;
  }

  res.json({ message: 'API key revoked' });
});

export { hashApiKey };
export default router;
