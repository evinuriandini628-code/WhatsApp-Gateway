import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { AuthRequest, User } from '../types/index.js';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret || 'test-secret-do-not-use-in-production';
}

const JWT_SECRET = getJwtSecret();

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

/**
 * Tries JWT authentication first. If no Bearer token is present, passes through
 * so that API key middleware can handle it.
 */
export function authenticateOptionalJwt(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No JWT token - let API key middleware handle auth
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.prepare('SELECT id, email, name, tier, created_at, updated_at FROM users WHERE id = ?').get(decoded.userId) as Omit<User, 'password_hash'> | undefined;

    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid JWT - let API key middleware try
  }

  next();
}
