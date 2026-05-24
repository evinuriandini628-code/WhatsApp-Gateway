import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { User } from '../types/index.js';
import { getJwtSecret } from '../utils/jwt.js';

const JWT_SECRET = getJwtSecret();
const TOKEN_EXPIRY = '7d';

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, tier, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, email, passwordHash, name, 'free', now, now);

  const user = {
    id,
    email,
    name,
    tier: 'free' as const,
    created_at: now,
    updated_at: now,
  };

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  return { user, token };
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  const { password_hash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export function getUserById(id: string): Omit<User, 'password_hash'> | null {
  const user = db.prepare('SELECT id, email, name, tier, created_at, updated_at FROM users WHERE id = ?').get(id) as Omit<User, 'password_hash'> | undefined;
  return user || null;
}
