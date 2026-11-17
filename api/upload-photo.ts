import type { IncomingMessage, ServerResponse } from 'node:http';
import { createBackendApp } from '../server/app';

const backendApp = createBackendApp();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default function handler(
  req: IncomingMessage,
  res: ServerResponse
): void {
  if (
    !req.url ||
    (!req.url.startsWith('/api/upload-photo') && !req.url.startsWith('/upload-photo'))
  ) {
    req.url = '/api/upload-photo';
  }
  backendApp(req as any, res as any);
}
