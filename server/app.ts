import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import {
  pdfExportRequestSchema,
  photoUploadRequestSchema,
  resolveServerMargins,
} from './schemas/pdfSchema';
import {
  buildContentDispositionHeader,
  sanitizePdfFilename,
} from './services/htmlNormalizer';
import { renderResumeDataToHtml } from './services/resumeHtmlRenderer';
import {
  renderHtmlToPdfBuffer,
  resolveBrowserExecutablePath,
  type GeneratePdfBufferParams,
} from './services/pdfGenerator';

export interface CreateBackendAppOptions {
  pdfRenderer?: (params: GeneratePdfBufferParams) => Promise<Buffer>;
}

/**
 * Creates the stateless CV Master backend Express application (Zero Database).
 * Supports both standalone execution and mounting inside Vite's dev/preview middleware.
 */
export function createBackendApp(
  options: CreateBackendAppOptions = {}
): Express {
  const app = express();
  const renderPdf = options.pdfRenderer ?? renderHtmlToPdfBuffer;

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
      exposedHeaders: ['Content-Disposition', 'Content-Length'],
    })
  );

  // Support up to 15MB JSON payloads for embedded Base64 profile photos and multi-page CVs
  app.use(express.json({ limit: '15mb' }));

  const handleHealth = (_req: Request, res: Response) => {
    const browserPath = resolveBrowserExecutablePath();
    res.status(200).json({
      status: 'ok',
      service: 'cv-master-pdf-backend',
      database: 'none',
      stateless: true,
      browserAvailable: Boolean(browserPath),
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/health', handleHealth);
  app.get('/api/health', handleHealth);

  const handleGeneratePdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = pdfExportRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid PDF export request payload',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      const {
        htmlContent: rawHtml,
        resumeData,
        pdfSettings,
        sectionOrder,
        hiddenItemIds,
        hiddenSections,
        margin,
        fileName: rawFileName,
      } = parsed.data;

      const settingsMargin =
        pdfSettings &&
        typeof pdfSettings.margin === 'object' &&
        pdfSettings.margin !== null
          ? (pdfSettings.margin as Record<string, number>)
          : undefined;

      const resolvedMargins = resolveServerMargins(margin ?? settingsMargin);
      const fontFamily =
        typeof pdfSettings?.fontFamily === 'string'
          ? pdfSettings.fontFamily
          : undefined;

      // Determine download filename
      let derivedName = rawFileName;
      if (!derivedName && resumeData?.basics) {
        const basics = resumeData.basics as { name?: string; title?: string };
        const n = (basics.name || 'John Doe').trim();
        const t = (basics.title || 'CV').trim();
        derivedName = `${n}-${t}.pdf`;
      }
      const safeFileName = sanitizePdfFilename(derivedName);
      const cleanTitle = safeFileName.replace(/\.pdf$/i, '');

      // Build HTML from either raw htmlContent or structured resumeData JSON
      const htmlToRender =
        typeof rawHtml === 'string' && rawHtml.trim().length > 0
          ? rawHtml
          : renderResumeDataToHtml({
              resumeData: (resumeData || {}) as Record<string, any>,
              pdfSettings: (pdfSettings || {}) as Record<string, any>,
              sectionOrder,
              hiddenItemIds,
              hiddenSections,
              title: cleanTitle,
            });

      const pdfBuffer = await renderPdf({
        htmlContent: htmlToRender,
        margins: resolvedMargins,
        fontFamily,
        title: cleanTitle,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        buildContentDispositionHeader(safeFileName)
      );
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.status(200).end(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  app.post('/pdf', handleGeneratePdf);
  app.post('/api/pdf', handleGeneratePdf);

  const handleUploadPhoto = (req: Request, res: Response) => {
    const parsed = photoUploadRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error:
          parsed.error.issues[0]?.message || 'Invalid photo upload payload',
        details: parsed.error.issues,
      });
      return;
    }

    // Stateless, database-free Data URL echo
    res.status(200).json({
      url: parsed.data.image.trim(),
    });
  };

  app.post('/upload-photo', handleUploadPhoto);
  app.post('/api/upload-photo', handleUploadPhoto);

  // Centralized error handler
  app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (
        typeof err === 'object' &&
        err !== null &&
        'type' in err &&
        (err as { type?: string }).type === 'entity.too.large'
      ) {
        res.status(413).json({
          error: 'Payload Too Large. Maximum allowed size is 15MB.',
        });
        return;
      }

      if (err instanceof SyntaxError && 'status' in err) {
        res.status(400).json({
          error: 'Malformed JSON in request body.',
        });
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate PDF document on the server.';

      res.status(500).json({
        error: message,
      });
    }
  );

  return app;
}
