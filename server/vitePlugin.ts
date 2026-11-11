import type { Connect, Plugin } from 'vite';
import { createBackendApp } from './app';

const BACKEND_ROUTE_PREFIXES = [
  '/pdf',
  '/api/pdf',
  '/upload-photo',
  '/api/upload-photo',
  '/health',
  '/api/health',
];

function isBackendApiPath(url?: string): boolean {
  if (!url) return false;
  const pathname = url.split('?')[0];
  return BACKEND_ROUTE_PREFIXES.includes(pathname);
}

/**
 * Vite plugin that mounts the stateless CV Master PDF backend directly into
 * Vite's development (`vite`) and preview (`vite preview`) servers.
 */
export function cvMasterBackendPlugin(): Plugin {
  const backendApp =
    createBackendApp() as unknown as Connect.NextHandleFunction;

  return {
    name: 'cv-master-pdf-backend',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (isBackendApiPath(req.url)) {
          backendApp(req, res, next);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (isBackendApiPath(req.url)) {
          backendApp(req, res, next);
          return;
        }
        next();
      });
    },
  };
}
