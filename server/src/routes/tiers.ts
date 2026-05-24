import { Router, Request, Response } from 'express';
import db from '../db/index.js';
import { TierLimits } from '../types/index.js';

const router = Router();

/**
 * GET /api/tiers
 * Returns tier limits from the database (public endpoint).
 */
router.get('/', (_req: Request, res: Response): void => {
  const tiers = db.prepare('SELECT tier, max_numbers, max_requests_per_day FROM tier_limits').all() as TierLimits[];

  const serialized = tiers.map(t => ({
    tier: t.tier,
    maxNumbers: t.max_numbers,
    maxRequestsPerDay: t.max_requests_per_day,
  }));

  res.json({ tiers: serialized });
});

export default router;
