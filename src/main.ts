import type { IncomingMessage, ServerResponse } from 'node:http';
import { createNestApp, startLocalServer } from './bootstrap';

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  startLocalServer().catch((error: unknown) => {
    console.error('Failed to start application', error);
    process.exit(1);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await createNestApp();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}
