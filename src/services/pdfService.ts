import type { BasicsData, PdfSettings } from '@/types/resume';
import { buildGoogleFontUrl } from '@/services/fontsService';

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
  const fontUrl = buildGoogleFontUrl(pdfSettings.fontFamily);
  const styleSheets: string[] = [];

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="${fontUrl}" />
  ${styleSheets.join('\n')}
  <style>
    @page {
      size: A4 portrait;
      margin: ${pdfSettings.margin.VALUE}px 0;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent,
        margin: pdfSettings.margin,
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

function printHtmlViaIframe(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    const previousTitle = document.title;
    document.title = title.replace(/\.pdf$/i, '');

    doc.open();
    doc.write(html);
    doc.close();

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      document.title = previousTitle;
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 200);
      resolve();
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        if (typeof iframe.contentWindow?.print === 'function') {
          iframe.contentWindow.print();
        }
      } catch {
        // Ignore print errors in headless/JSDOM environments
      } finally {
        finish();
      }
    };

    // Safety fallback for JSDOM where iframe.onload may not fire synchronously
    setTimeout(finish, 250);
  });
}
