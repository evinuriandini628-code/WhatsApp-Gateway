import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/api-keys.js';
import whatsappRoutes from './routes/whatsapp.js';
import messagesRoutes from './routes/messages.js';
import tiersRoutes from './routes/tiers.js';
import whatsappService from './services/whatsapp.service.js';
import db from './db/index.js';
import { cleanupRequestLog } from './db/schema.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/tiers', tiersRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup old request_log entries on startup and every hour
cleanupRequestLog(db);
const cleanupInterval = setInterval(() => cleanupRequestLog(db), 60 * 60 * 1000);

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('HTTP server closed.');

    // Stop periodic cleanup
    clearInterval(cleanupInterval);

    // Close all WhatsApp connections
    whatsappService.shutdownAll();

    // Close the SQLite database
    db.close();
    console.log('Database connection closed.');

    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
