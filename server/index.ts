import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createBackendApp } from './app';
import {
  closePdfBrowser,
  resolveBrowserExecutablePath,
} from './services/pdfGenerator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT) || 3001;
const app = createBackendApp();

// If built frontend assets exist in ../dist, serve them for single-server production deployment
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/api/') ||
      req.path === '/pdf' ||
      req.path === '/upload-photo' ||
      req.path === '/health'
    ) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const server = app.listen(port, () => {
  const browserPath = resolveBrowserExecutablePath();
  console.log(
    `[CV Master Backend] Stateless PDF server listening on http://localhost:${port}`
  );
  console.log(
    `[CV Master Backend] Endpoints: POST /pdf, POST /api/pdf, GET /health (Database: none)`
  );
  console.log(
    `[CV Master Backend] Chromium engine: ${browserPath ?? 'Not detected (set PUPPETEER_EXECUTABLE_PATH)'}`
  );
});

const shutdown = async () => {
  await closePdfBrowser();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

export { app, server };
