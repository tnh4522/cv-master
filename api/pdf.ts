import type { IncomingMessage, ServerResponse } from 'node:http';
import { createBackendApp } from '../server/app';

const backendApp = createBackendApp();

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): void {
  if (!req.url || (!req.url.startsWith('/api/pdf') && !req.url.startsWith('/pdf'))) {
    req.url = '/api/pdf';
  }
  backendApp(req as any, res as any);
}
