import type { IncomingMessage, ServerResponse } from 'node:http';
import { createNestApp } from '../dist/bootstrap';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await createNestApp();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}
