import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest, ApiKey } from '../types/index.js';

const router = Router();

router.use(authenticate);

router.post('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const id = uuidv4();
  const key = `wag_${crypto.randomBytes(32).toString('hex')}`;

  db.prepare('INSERT INTO api_keys (id, user_id, key) VALUES (?, ?, ?)').run(id, userId, key);

  res.status(201).json({ id, key, created_at: new Date().toISOString() });
});

router.get('/', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const keys = db.prepare('SELECT id, key, created_at, last_used FROM api_keys WHERE user_id = ?').all(userId) as Omit<ApiKey, 'user_id'>[];
  res.json({ keys });
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

export default router;
