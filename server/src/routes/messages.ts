import { Router, Response } from 'express';
import { authenticateOptionalJwt } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import { tierRateLimit } from '../middleware/rateLimit.js';
import { AuthRequest } from '../types/index.js';
import { isValidPhoneNumber, isValidMessageContent, getSessionForUser } from '../utils/validators.js';
import whatsappService from '../services/whatsapp.service.js';
import db from '../db/index.js';

const router = Router();

// Messages routes support both JWT and API key auth
router.use(authenticateOptionalJwt);
router.use(authenticateApiKey);
router.use(tierRateLimit);

/**
 * POST /api/messages/send
 * Send a WhatsApp message through a connected session.
 */
router.post('/send', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tier = req.user!.tier;
    const { sessionId, to, message } = req.body;

    if (!sessionId || !to || !message) {
      res.status(400).json({ error: 'sessionId, to, and message are required' });
      return;
    }

    if (!isValidPhoneNumber(to)) {
      res.status(400).json({ error: 'Invalid recipient phone number format' });
      return;
    }

    if (!isValidMessageContent(message)) {
      res.status(400).json({ error: 'Invalid message content. Must be 1-4096 characters.' });
      return;
    }

    // Validate session ownership
    const session = getSessionForUser(sessionId, userId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    if (session.status !== 'connected') {
      res.status(400).json({ error: 'Session is not connected' });
      return;
    }

    // Check message-specific rate limit
    const rateCheck = whatsappService.checkMessageRateLimit(userId, tier);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: 'Daily message limit exceeded',
        sent: rateCheck.sent,
        limit: rateCheck.limit,
        tier,
      });
      return;
    }

    const result = await whatsappService.sendMessage(userId, sessionId, to, message);
    res.json({
      success: true,
      messageId: result.id,
    });
  } catch (error: any) {
    if (error.message === 'Session is not connected' || error.message === 'No active connection for this session') {
      res.status(400).json({ error: 'Session is not connected' });
    } else {
      console.error('Message send error:', error.message);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

/**
 * GET /api/messages/history
 * Get message history for a session.
 */
router.get('/history', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const { sessionId, limit, offset } = req.query;

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId query parameter is required' });
    return;
  }

  // Validate session ownership
  const session = getSessionForUser(sessionId as string, userId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const queryLimit = Math.min(parseInt(limit as string) || 50, 100);
  const queryOffset = parseInt(offset as string) || 0;

  const messages = db.prepare(
    'SELECT id, to_number, message_type, content, status, created_at FROM messages_log WHERE user_id = ? AND session_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(userId, sessionId, queryLimit, queryOffset) as Array<{ id: number; to_number: string; message_type: string; content: string; status: string; created_at: string }>;

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM messages_log WHERE user_id = ? AND session_id = ?'
  ).get(userId, sessionId) as { count: number };

  const serialized = messages.map(m => ({
    id: m.id,
    toNumber: m.to_number,
    messageType: m.message_type,
    content: m.content,
    status: m.status,
    createdAt: m.created_at,
  }));

  res.json({
    messages: serialized,
    pagination: {
      total: total.count,
      limit: queryLimit,
      offset: queryOffset,
    },
  });
});

export default router;
