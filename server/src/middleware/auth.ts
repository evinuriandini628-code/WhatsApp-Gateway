import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { AuthRequest, User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.prepare('SELECT id, email, name, tier, created_at, updated_at FROM users WHERE id = ?').get(decoded.userId) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
