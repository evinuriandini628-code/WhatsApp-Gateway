import { User } from '../types/index.js';

/**
 * Serialize a user object from DB (snake_case) to API response (camelCase).
 */
export function serializeUser(user: Omit<User, 'password_hash'>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
