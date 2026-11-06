import type { BasicsData, PdfSettings } from '@/types/resume';
import { buildGoogleFontUrl } from '@/services/fontsService';
import { resolveMargins } from '@/lib/utils';

export interface GeneratePdfParams {
  resumeSheetElement: HTMLElement;
  pdfSettings: PdfSettings;
  fileName?: string;
}

export interface ExportValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates `basics.name`, `basics.title`, and `basics.email.includes("@")`
 * before allowing PDF export (`dn` in index-B9ESfVPA.js).
 */
export function validateBasicsForPdfExport(
  basics: BasicsData
): ExportValidationResult {
  if (!basics.name || !basics.name.trim()) {
    return {
      valid: false,
      error: 'Full Name is required before exporting your CV to PDF.',
    };
  }
  if (!basics.title || !basics.title.trim()) {
    return {
      valid: false,
      error: 'Job Title is required before exporting your CV to PDF.',
    };
  }
  if (!basics.email || !basics.email.includes('@')) {
    return {
      valid: false,
      error: 'A valid Email address (containing "@") is required before exporting to PDF.',
    };
  }
  return { valid: true };
}

/**
 * Formats the verified CVMaster export filename `${name}-${title}.${ext}`.
 */
export function formatExportFilename(
  basics: Pick<BasicsData, 'name' | 'title'>,
  ext: 'pdf' | 'json'
): string {
  const safeName = (basics.name || 'John Doe').trim();
  const safeTitle = (basics.title || 'CV').trim();
  return `${safeName}-${safeTitle}.${ext}`;
}

/**
 * Builds a complete standalone HTML document from the rendered `.resume-sheet` DOM node,
 * matching the verified CVMaster HTML-to-PDF payload structure (`dn`).
 */
export function buildStandaloneResumeHtml(
  resumeSheetElement: HTMLElement,
  pdfSettings: PdfSettings
): string {
  const fontUrl = buildGoogleFontUrl(pdfSettings.fontFamily, [
    '400',
    '500',
    '600',
    '700',
  ]);
  const styleSheets: string[] = [];
  const margins = resolveMargins(pdfSettings.margin);

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      styleSheets.push(`<style>${rules}</style>`);
    } catch {
      if (sheet.href) {
        styleSheets.push(`<link rel="stylesheet" href="${sheet.href}" />`);
      }
    }
  }

  const clone = resumeSheetElement.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll('[data-page-break-indicator="true"]')
    .forEach((el) => el.remove());

  // Normalize sheet box-model for clean A4 pagination without drop shadows or forced 96-DPI min-height
  clone.classList.remove('shadow-xl');
  clone.style.boxShadow = 'none';
  clone.style.width = '100%';
  clone.style.minWidth = '100%';
  clone.style.maxWidth = '210mm';
  clone.style.minHeight = 'auto';
  clone.style.margin = '0 auto';
  clone.style.padding = `0px ${margins.right}px 0px ${margins.left}px`;
  clone.style.boxSizing = 'border-box';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="${fontUrl}" />
  ${styleSheets.join('\n')}
  <style>
    @page {
      size: A4 portrait;
      margin: ${margins.top}px 0 ${margins.bottom}px 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      width: 210mm;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #171717;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .resume-sheet {
      width: 100% !important;
      min-width: 100% !important;
      max-width: 210mm !important;
      min-height: auto !important;
      box-shadow: none !important;
      filter: none !important;
      margin: 0 auto !important;
      padding: 0 ${margins.right}px 0 ${margins.left}px !important;
      background: #ffffff !important;
    }
    /* High-quality A4 print pagination rules */
    h1, h2, h3, h4, header {
      page-break-after: avoid;
      break-after: avoid-page;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    [data-resume-entry="true"], li, p, tr, img {
      page-break-inside: avoid;
      break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    a {
      color: inherit;
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;
}

/**
 * Exports the resume to PDF (`dn`).
 * 1. If `VITE_PDF_API_URL` is configured, sends `{ htmlContent, margin: pdfSettings.margin }`
 *    to the remote PDF service and triggers a binary `.pdf` download.
 * 2. Never executes the silent `/upload-pdf` exfiltration call.
 * 3. Otherwise uses a clean browser print iframe adapter so PDF export works without a backend.
 */
export async function exportResumeToPdf({
  resumeSheetElement,
  pdfSettings,
  fileName = 'CV.pdf',
}: GeneratePdfParams): Promise<void> {
  const htmlContent = buildStandaloneResumeHtml(resumeSheetElement, pdfSettings);
  const pdfApiUrl = import.meta.env.VITE_PDF_API_URL;

  if (pdfApiUrl) {
    const endpoint = pdfApiUrl.endsWith('/pdf')
      ? pdfApiUrl
      : `${pdfApiUrl.replace(/\/$/, '')}/pdf`;

    const remoteMargins = resolveMargins(pdfSettings.margin);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        margin: {
          ...pdfSettings.margin,
          TOP: remoteMargins.top,
          BOTTOM: remoteMargins.bottom,
          LEFT: remoteMargins.left,
          RIGHT: remoteMargins.right,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF service returned status ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Browser-native print-to-PDF adapter when no external backend is configured
  await printHtmlViaIframe(htmlContent, fileName);
}

function waitForIframeAssets(win: Window, doc: Document): Promise<void> {
  const isTestEnv =
    typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  const assetTimeoutMs = isTestEnv ? 50 : 2500;

  const fontPromise =
    doc.fonts && typeof doc.fonts.ready?.then === 'function'
      ? doc.fonts.ready.catch(() => undefined)
      : Promise.resolve();

  const images = Array.from(doc.images || []);
  const imagePromises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }
    return new Promise<void>((res) => {
      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        res();
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  });

  const links = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
  );
  const linkPromises = links.map((link) => {
    if (link.sheet) {
      return Promise.resolve();
    }
    return new Promise<void>((res) => {
      const done = () => {
        link.removeEventListener('load', done);
        link.removeEventListener('error', done);
        res();
      };
      link.addEventListener('load', done, { once: true });
      link.addEventListener('error', done, { once: true });
    });
  });

  return Promise.race([
    Promise.all([fontPromise, ...imagePromises, ...linkPromises]).then(
      () => undefined
    ),
    new Promise<void>((res) => win.setTimeout(res, assetTimeoutMs)),
  ]);
}

function printHtmlViaIframe(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const isTestEnv =
      typeof navigator !== 'undefined' &&
      /jsdom/i.test(navigator.userAgent || '');

    const iframe = document.createElement('iframe');
    // Render with exact A4 portrait width off-screen so browser layout engine computes crisp A4 metrics
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!doc || !win) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    const cleanTitle = title.replace(/\.pdf$/i, '');
    const previousTitle = document.title;
    document.title = cleanTitle;

    let settled = false;
    let printTriggered = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      document.title = previousTitle;
      setTimeout(
        () => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        },
        isTestEnv ? 50 : 600
      );
      resolve();
    };

    const triggerPrint = async () => {
      if (printTriggered || settled) return;
      printTriggered = true;

      try {
        doc.title = cleanTitle;
        await waitForIframeAssets(win, doc);

        if (!isTestEnv && typeof win.requestAnimationFrame === 'function') {
          await new Promise<void>((r) =>
            win.requestAnimationFrame(() => win.requestAnimationFrame(() => r()))
          );
        }

        if (!isTestEnv) {
          win.focus();
          if (typeof win.print === 'function') {
            win.addEventListener('afterprint', finish, { once: true });
            win.print();
          }
        }
      } catch {
        // Ignore print errors in headless/JSDOM environments
      } finally {
        finish();
      }
    };

    iframe.onload = () => {
      void triggerPrint();
    };

    doc.open();
    doc.write(html);
    doc.close();

    // Safety fallback if iframe.onload does not fire or already fired synchronously on doc.close()
    setTimeout(
      () => {
        if (!printTriggered) {
          void triggerPrint();
        } else {
          finish();
        }
      },
      isTestEnv ? 120 : 1200
    );
  });
}
