import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tierRateLimit } from '../middleware/rateLimit.js';
import { AuthRequest } from '../types/index.js';
import { isValidPhoneNumber } from '../utils/validators.js';
import whatsappService from '../services/whatsapp.service.js';

const router = Router();

router.use(authenticate);

/**
 * POST /api/whatsapp/connect
 * Connect a new WhatsApp number using pairing code.
 */
router.post('/connect', tierRateLimit, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tier = req.user!.tier;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({ error: 'Invalid phone number format. Use digits only (E.164 without +), e.g. 628123456789' });
      return;
    }

    // Check tier limit
    const tierCheck = whatsappService.checkTierLimit(userId, tier);
    if (!tierCheck.allowed) {
      res.status(403).json({
        error: 'Number limit reached for your tier',
        current: tierCheck.current,
        max: tierCheck.max,
        tier,
      });
      return;
    }

    const result = await whatsappService.initConnection(userId, phoneNumber);
    res.status(201).json({
      sessionId: result.sessionId,
      pairingCode: result.pairingCode,
      message: 'Enter this pairing code in WhatsApp > Linked Devices > Link a Device',
    });
  } catch (error: any) {
    if (error.message === 'This phone number is already connected') {
      res.status(409).json({ error: error.message });
    } else {
      console.error('WhatsApp connect error:', error.message);
      res.status(500).json({ error: 'Failed to initiate WhatsApp connection' });
    }
  }
});

/**
 * GET /api/whatsapp/sessions
 * List all WhatsApp sessions for the authenticated user.
 */
router.get('/sessions', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const sessions = whatsappService.getUserSessions(userId);

  const serialized = sessions.map(s => ({
    id: s.id,
    phoneNumber: s.phone_number,
    status: s.status,
    createdAt: s.created_at,
    lastConnected: s.last_connected,
  }));

  res.json({ sessions: serialized });
});

/**
 * GET /api/whatsapp/sessions/:id/status
 * Get real-time status of a specific session.
 */
router.get('/sessions/:id/status', (req: AuthRequest, res: Response): void => {
  const userId = req.user!.id;
  const sessionId = req.params.id as string;

  const session = whatsappService.getSessionStatus(userId, sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    session: {
      id: session.id,
      phoneNumber: session.phone_number,
      status: session.status,
      createdAt: session.created_at,
      lastConnected: session.last_connected,
    },
  });
});

/**
 * DELETE /api/whatsapp/sessions/:id
 * Disconnect and remove a WhatsApp session.
 */
router.delete('/sessions/:id', tierRateLimit, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.id as string;

    await whatsappService.disconnectSession(userId, sessionId);
    res.json({ message: 'Session disconnected' });
  } catch (error: any) {
    if (error.message === 'Session not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('WhatsApp disconnect error:', error.message);
      res.status(500).json({ error: 'Failed to disconnect session' });
    }
  }
});

export default router;
