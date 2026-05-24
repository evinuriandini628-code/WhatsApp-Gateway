import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'baileys';
import { wrapSocket, type WrappedSocket } from 'baileys-antiban';
import { Boom } from '@hapi/boom';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../db/index.js';
import { WhatsAppSession, TierLimits } from '../types/index.js';

const SESSION_PATH = process.env.SESSION_PATH || './sessions';

interface ActiveConnection {
  socket: WrappedSocket<any>;
  sessionId: string;
  userId: string;
  phoneNumber: string;
  status: 'connecting' | 'connected' | 'disconnected';
  reconnectAttempts: number;
  reconnectTimeout?: ReturnType<typeof setTimeout>;
}

class WhatsAppService {
  private connections: Map<string, ActiveConnection> = new Map();

  private getConnectionKey(userId: string, phoneNumber: string): string {
    return `${userId}:${phoneNumber}`;
  }

  private getSessionDir(userId: string, phoneNumber: string): string {
    // Defense-in-depth: strip any non-digit characters to prevent path traversal
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9\-]/g, '');
    return path.join(SESSION_PATH, sanitizedUserId, sanitizedPhone);
  }

  /**
   * Initialize a new WhatsApp connection and return pairing code.
   */
  async initConnection(userId: string, phoneNumber: string): Promise<{ sessionId: string; pairingCode: string }> {
    const key = this.getConnectionKey(userId, phoneNumber);

    // Check if already connected
    const existing = this.connections.get(key);
    if (existing && existing.status === 'connected') {
      throw new Error('This phone number is already connected');
    }

    // Clean up any previous connection attempt
    if (existing) {
      this.cleanupConnection(key);
    }

    const sessionDir = this.getSessionDir(userId, phoneNumber);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    const safeSock = wrapSocket(sock);

    // Create or update session record in database
    let session = db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE user_id = ? AND phone_number = ?'
    ).get(userId, phoneNumber) as WhatsAppSession | undefined;

    let sessionId: string;
    if (session) {
      sessionId = session.id;
      db.prepare(
        'UPDATE whatsapp_sessions SET status = ? WHERE id = ?'
      ).run('connecting', sessionId);
    } else {
      sessionId = uuidv4();
      db.prepare(
        'INSERT INTO whatsapp_sessions (id, user_id, phone_number, status, session_data_path) VALUES (?, ?, ?, ?, ?)'
      ).run(sessionId, userId, phoneNumber, 'connecting', sessionDir);
    }

    const connection: ActiveConnection = {
      socket: safeSock,
      sessionId,
      userId,
      phoneNumber,
      status: 'connecting',
      reconnectAttempts: 0,
    };

    this.connections.set(key, connection);

    // Set up event handlers
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: any) => {
      this.handleConnectionUpdate(key, update);
    });

    // Request pairing code
    const pairingCode = await sock.requestPairingCode(phoneNumber);

    return { sessionId, pairingCode };
  }

  /**
   * Handle connection status updates from Baileys.
   */
  private handleConnectionUpdate(key: string, update: any): void {
    const connection = this.connections.get(key);
    if (!connection) return;

    const { connection: connStatus, lastDisconnect } = update;

    if (connStatus === 'open') {
      connection.status = 'connected';
      connection.reconnectAttempts = 0;
      db.prepare(
        'UPDATE whatsapp_sessions SET status = ?, last_connected = datetime(\'now\') WHERE id = ?'
      ).run('connected', connection.sessionId);
    } else if (connStatus === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      connection.status = 'disconnected';
      db.prepare(
        'UPDATE whatsapp_sessions SET status = ? WHERE id = ?'
      ).run('disconnected', connection.sessionId);

      if (shouldReconnect && connection.reconnectAttempts < 5) {
        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 60000);
        connection.reconnectAttempts++;
        connection.reconnectTimeout = setTimeout(() => {
          this.reconnect(key);
        }, delay);
      } else if (statusCode === DisconnectReason.loggedOut) {
        // Session was logged out, clean up auth state
        const sessionDir = this.getSessionDir(connection.userId, connection.phoneNumber);
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        db.prepare(
          'UPDATE whatsapp_sessions SET status = ? WHERE id = ?'
        ).run('logged_out', connection.sessionId);
        this.connections.delete(key);
      }
    }
  }

  /**
   * Attempt to reconnect a session.
   */
  private async reconnect(key: string): Promise<void> {
    const connection = this.connections.get(key);
    if (!connection) return;

    try {
      const sessionDir = this.getSessionDir(connection.userId, connection.phoneNumber);
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
      });

      const safeSock = wrapSocket(sock);
      connection.socket = safeSock;

      sock.ev.on('creds.update', saveCreds);
      sock.ev.on('connection.update', (update: any) => {
        this.handleConnectionUpdate(key, update);
      });
    } catch {
      // Reconnect failed, will try again if attempts remain
      if (connection.reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 60000);
        connection.reconnectAttempts++;
        connection.reconnectTimeout = setTimeout(() => {
          this.reconnect(key);
        }, delay);
      }
    }
  }

  /**
   * Disconnect a session by ID.
   */
  async disconnectSession(userId: string, sessionId: string): Promise<void> {
    const session = db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE id = ? AND user_id = ?'
    ).get(sessionId, userId) as WhatsAppSession | undefined;

    if (!session) {
      throw new Error('Session not found');
    }

    const key = this.getConnectionKey(userId, session.phone_number);
    this.cleanupConnection(key);

    db.prepare('UPDATE whatsapp_sessions SET status = ? WHERE id = ?').run('disconnected', sessionId);
  }

  /**
   * Get session status.
   */
  getSessionStatus(userId: string, sessionId: string): WhatsAppSession | null {
    const session = db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE id = ? AND user_id = ?'
    ).get(sessionId, userId) as WhatsAppSession | undefined;

    return session || null;
  }

  /**
   * Get all sessions for a user.
   */
  getUserSessions(userId: string): WhatsAppSession[] {
    return db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE user_id = ?'
    ).all(userId) as WhatsAppSession[];
  }

  /**
   * Send a message through a connected session.
   */
  async sendMessage(userId: string, sessionId: string, to: string, message: string): Promise<{ id: string }> {
    const session = db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE id = ? AND user_id = ?'
    ).get(sessionId, userId) as WhatsAppSession | undefined;

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'connected') {
      throw new Error('Session is not connected');
    }

    const key = this.getConnectionKey(userId, session.phone_number);
    const connection = this.connections.get(key);

    if (!connection || connection.status !== 'connected') {
      throw new Error('No active connection for this session');
    }

    // Format the JID
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    const result = await connection.socket.sendMessage(jid, { text: message });

    // Log the message
    db.prepare(
      'INSERT INTO messages_log (user_id, session_id, to_number, message_type, content, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, sessionId, to, 'text', message, 'sent');

    return { id: result?.key?.id || uuidv4() };
  }

  /**
   * Check the user's tier limit for number of connections.
   */
  checkTierLimit(userId: string, tier: string): { allowed: boolean; current: number; max: number } {
    const limits = db.prepare(
      'SELECT max_numbers FROM tier_limits WHERE tier = ?'
    ).get(tier) as Pick<TierLimits, 'max_numbers'> | undefined;

    if (!limits) {
      return { allowed: false, current: 0, max: 0 };
    }

    const activeSessions = db.prepare(
      'SELECT COUNT(*) as count FROM whatsapp_sessions WHERE user_id = ? AND status != ?'
    ).get(userId, 'logged_out') as { count: number };

    return {
      allowed: activeSessions.count < limits.max_numbers,
      current: activeSessions.count,
      max: limits.max_numbers,
    };
  }

  /**
   * Check daily message rate limit for a user.
   */
  checkMessageRateLimit(userId: string, tier: string): { allowed: boolean; sent: number; limit: number } {
    const limits = db.prepare(
      'SELECT max_requests_per_day FROM tier_limits WHERE tier = ?'
    ).get(tier) as Pick<TierLimits, 'max_requests_per_day'> | undefined;

    if (!limits) {
      return { allowed: false, sent: 0, limit: 0 };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = db.prepare(
      'SELECT COUNT(*) as count FROM messages_log WHERE user_id = ? AND created_at >= ?'
    ).get(userId, todayStart.toISOString()) as { count: number };

    return {
      allowed: count.count < limits.max_requests_per_day,
      sent: count.count,
      limit: limits.max_requests_per_day,
    };
  }

  /**
   * Clean up a connection (stop socket, clear timers).
   */
  private cleanupConnection(key: string): void {
    const connection = this.connections.get(key);
    if (!connection) return;

    if (connection.reconnectTimeout) {
      clearTimeout(connection.reconnectTimeout);
    }

    try {
      connection.socket.ev?.removeAllListeners?.('connection.update');
      connection.socket.ev?.removeAllListeners?.('creds.update');
      connection.socket.end?.(undefined);
    } catch {
      // Ignore cleanup errors
    }

    this.connections.delete(key);
  }

  /**
   * Shut down all active connections gracefully.
   */
  shutdownAll(): void {
    for (const key of this.connections.keys()) {
      this.cleanupConnection(key);
    }
    this.connections.clear();
  }

  /**
   * Restore sessions on server startup.
   */
  async restoreSessions(): Promise<void> {
    const sessions = db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE status = ?'
    ).all('connected') as WhatsAppSession[];

    for (const session of sessions) {
      const sessionDir = this.getSessionDir(session.user_id, session.phone_number);
      if (!fs.existsSync(sessionDir)) continue;

      try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const sock = makeWASocket({
          auth: state,
          printQRInTerminal: false,
        });

        const safeSock = wrapSocket(sock);
        const key = this.getConnectionKey(session.user_id, session.phone_number);

        const connection: ActiveConnection = {
          socket: safeSock,
          sessionId: session.id,
          userId: session.user_id,
          phoneNumber: session.phone_number,
          status: 'connecting',
          reconnectAttempts: 0,
        };

        this.connections.set(key, connection);

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', (update: any) => {
          this.handleConnectionUpdate(key, update);
        });
      } catch {
        // Mark as disconnected if restore fails
        db.prepare(
          'UPDATE whatsapp_sessions SET status = ? WHERE id = ?'
        ).run('disconnected', session.id);
      }
    }
  }
}

// Export singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;
