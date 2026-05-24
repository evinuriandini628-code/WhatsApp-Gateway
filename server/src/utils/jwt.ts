export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV !== 'test') {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret || 'test-secret-do-not-use-in-production';
}
