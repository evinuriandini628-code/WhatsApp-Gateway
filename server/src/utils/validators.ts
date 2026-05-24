import db from '../db/index.js';
import { WhatsAppSession } from '../types/index.js';

/**
 * Validate phone number in E.164 format (digits only, no + prefix).
 * Expects 7-15 digits (country code + number).
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\d{7,15}$/.test(phone);
}

/**
 * Validate message content - must be non-empty string under 4096 chars.
 */
export function isValidMessageContent(content: string): boolean {
  return typeof content === 'string' && content.trim().length > 0 && content.length <= 4096;
}

/**
 * Check if the session belongs to the given user and return it.
 */
export function getSessionForUser(sessionId: string, userId: string): WhatsAppSession | null {
  const session = db.prepare(
    'SELECT * FROM whatsapp_sessions WHERE id = ? AND user_id = ?'
  ).get(sessionId, userId) as WhatsAppSession | undefined;

  return session || null;
}
