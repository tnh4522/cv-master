import type { IncomingMessage, ServerResponse } from 'node:http';
import { createBackendApp } from '../server/app';

const backendApp = createBackendApp();

export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): void {
  if (!req.url || (!req.url.startsWith('/api/health') && !req.url.startsWith('/health'))) {
    req.url = '/api/health';
  }
  backendApp(req as any, res as any);
}
