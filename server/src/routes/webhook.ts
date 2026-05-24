import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import path from 'path';

const router = Router();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || path.resolve(__dirname, '../../../deploy.sh');

function verifySignature(payload: string, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET) return false;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

router.post('/github', (req: Request, res: Response) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string;
  const payload = JSON.stringify(req.body);

  // Verify webhook secret
  if (WEBHOOK_SECRET && !verifySignature(payload, signature)) {
    console.warn('Webhook signature verification failed');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  // Only deploy on push to main
  if (event === 'push') {
    const branch = req.body.ref;
    if (branch !== 'refs/heads/main') {
      res.json({ message: 'Ignored - not main branch' });
      return;
    }

    console.log('Deploying from GitHub push event...');

    exec(`bash ${DEPLOY_SCRIPT}`, { cwd: path.resolve(__dirname, '../../..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Deploy failed:', error.message);
        console.error('stderr:', stderr);
        return;
      }
      console.log('Deploy output:', stdout);
    });

    // Respond immediately, deploy runs in background
    res.json({ message: 'Deployment triggered', branch });
    return;
  }

  res.json({ message: `Event '${event}' received but not handled` });
});

// Health check for webhook
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    webhook: 'active',
    secret_configured: !!WEBHOOK_SECRET,
  });
});

export default router;
