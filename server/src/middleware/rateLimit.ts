import { Response, NextFunction } from 'express';
import db from '../db/index.js';
import { AuthRequest, TierLimits } from '../types/index.js';

export function tierRateLimit(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const userId = req.user.id;
  const tier = req.user.tier;

  const limits = db.prepare('SELECT max_requests_per_day FROM tier_limits WHERE tier = ?').get(tier) as TierLimits | undefined;

  if (!limits) {
    res.status(500).json({ error: 'Tier configuration not found' });
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = db.prepare(
    'SELECT COUNT(*) as count FROM request_log WHERE user_id = ? AND timestamp >= ?'
  ).get(userId, todayStart.toISOString()) as { count: number };

  if (count.count >= limits.max_requests_per_day) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: limits.max_requests_per_day,
      tier: tier,
    });
    return;
  }

  db.prepare('INSERT INTO request_log (user_id) VALUES (?)').run(userId);
  next();
}
