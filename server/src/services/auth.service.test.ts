import { registerUser, loginUser, getUserById } from './auth.service.js';
import db from '../db/index.js';

describe('Auth Service', () => {
  beforeEach(() => {
    db.exec('DELETE FROM request_log');
    db.exec('DELETE FROM api_keys');
    db.exec('DELETE FROM whatsapp_sessions');
    db.exec('DELETE FROM users');
  });

  describe('registerUser', () => {
    it('should register a new user and return a token', async () => {
      const result = await registerUser('test@example.com', 'password123', 'Test User');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.user.tier).toBe('free');
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should not allow duplicate emails', async () => {
      await registerUser('test@example.com', 'password123', 'Test User');

      await expect(
        registerUser('test@example.com', 'password456', 'Another User')
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      await registerUser('test@example.com', 'password123', 'Test User');
      const result = await loginUser('test@example.com', 'password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await registerUser('test@example.com', 'password123', 'Test User');

      await expect(
        loginUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      await expect(
        loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const registered = await registerUser('test@example.com', 'password123', 'Test User');
      const user = getUserById(registered.user.id);

      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
      expect(user!.name).toBe('Test User');
    });

    it('should return null for non-existent id', () => {
      const user = getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});
