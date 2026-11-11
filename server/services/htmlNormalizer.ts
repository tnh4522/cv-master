import type { ResolvedMargins } from '../schemas/pdfSchema';

export interface NormalizeHtmlOptions {
  margins: ResolvedMargins;
  fontFamily?: string;
  title?: string;
}

export function buildServerGoogleFontUrl(
  fontFamily: string,
  weights: string[] = ['400', '500', '600', '700']
): string {
  const encodedFamily = encodeURIComponent(fontFamily);
  const weightSpec = weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightSpec}&display=swap`;
}

/**
 * Sanitizes a filename for PDF download and Content-Disposition headers.
 */
export function sanitizePdfFilename(rawName?: string): string {
  const base = (rawName || 'CV.pdf')
    .trim()
    .replace(/[\r\n\0<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!base) return 'CV.pdf';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

/**
 * Builds RFC 6266 / RFC 5987 Content-Disposition header value supporting Unicode (e.g. Vietnamese) filenames.
 */
export function buildContentDispositionHeader(fileName?: string): string {
  const safeName = sanitizePdfFilename(fileName);
  const asciiFallback = safeName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]+/g, '_')
    .replace(/["\\]/g, '_');

  const encodedUtf8 = encodeURIComponent(safeName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return `attachment; filename="${asciiFallback || 'CV.pdf'}"; filename*=UTF-8''${encodedUtf8}`;
}

/**
 * Strips dangerous active script/embed tags and inline JS event handlers from HTML
 * before loading into Headless Chromium.
 */
export function stripExecutableHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(
      /(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi,
      '$1="#"'
    );
}

/**
 * Builds the comprehensive A4 print + Tailwind v3 utility CSS block so the resume
 * renders with 100% visual accuracy even without external CSS dependencies.
 */
export function buildStandardA4PrintCss(
  margins: ResolvedMargins,
  fontFamily?: string
): string {
  const fontRule = fontFamily
    ? `font-family: "${fontFamily.replace(/"/g, '')}", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
    : '';

  return `
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
      ${fontRule}
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    h1, h2, h3, h4, h5, h6, p, ul, ol, li, figure, blockquote, dl, dd {
      margin: 0;
      padding: 0;
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
      color: #171717;
      box-sizing: border-box !important;
    }
    [data-page-break-indicator="true"] {
      display: none !important;
    }
    /* Essential Tailwind v3 utilities used by ResumeSheet */
    .relative { position: relative; }
    .flex { display: flex; }
    .inline-flex { display: inline-flex; }
    .grid { display: grid; }
    .flex-1 { flex: 1 1 0%; }
    .flex-col { flex-direction: column; }
    .flex-row { flex-direction: row; }
    .flex-row-reverse { flex-direction: row-reverse; }
    .flex-wrap { flex-wrap: wrap; }
    .shrink-0 { flex-shrink: 0; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .items-baseline { align-items: baseline; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .gap-x-3 { column-gap: 0.75rem; }
    .gap-x-6 { column-gap: 1.5rem; }
    .gap-y-1 { row-gap: 0.25rem; }
    .gap-y-1\\.5 { row-gap: 0.375rem; }
    .space-y-0\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.125rem; }
    .space-y-1\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.375rem; }
    .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
    .space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.625rem; }
    .w-full { width: 100%; }
    .h-3\\.5 { height: 0.875rem; }
    .w-3\\.5 { width: 0.875rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .ml-1\\.5 { margin-left: 0.375rem; }
    .pt-0\\.5 { padding-top: 0.125rem; }
    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
    .border-neutral-400 { border-color: #a3a3a3; }
    .bg-white { background-color: #ffffff; }
    .text-neutral-900 { color: #171717; }
    .text-neutral-800 { color: #262626; }
    .text-neutral-700 { color: #404040; }
    .text-neutral-600 { color: #525252; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-normal { font-weight: 400; }
    .italic { font-style: italic; }
    .underline { text-decoration-line: underline; }
    .decoration-neutral-400 { text-decoration-color: #a3a3a3; }
    .underline-offset-2 { text-underline-offset: 2px; }
    .tracking-tight { letter-spacing: -0.025em; }
    .whitespace-nowrap { white-space: nowrap; }
    .object-cover { object-fit: cover; }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    /* Rich text preview lists & links */
    .preview ul {
      list-style-type: disc;
      padding-left: 2rem;
      line-height: inherit;
    }
    .preview ol {
      list-style-type: decimal;
      padding-left: 2rem;
      line-height: inherit;
    }
    .preview a, a {
      color: inherit;
      text-decoration-line: underline;
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
  `;
}

/**
 * Normalizes any incoming HTML string (full document or `.resume-sheet` fragment)
 * into a complete, sanitized, A4-ready HTML document for Headless Chromium PDF generation.
 */
export function normalizeResumeHtmlForPdf(
  rawHtml: string,
  options: NormalizeHtmlOptions
): string {
  const { margins, fontFamily, title = 'CV' } = options;
  const sanitized = stripExecutableHtmlTags(rawHtml);

  let detectedFont = fontFamily;
  if (!detectedFont) {
    const match = sanitized.match(/font-family:\s*["']?([^"',;]+)["']?/i);
    if (match && match[1]) {
      detectedFont = match[1].trim();
    }
  }
  const effectiveFont = detectedFont || 'Work Sans';
  const fontUrl = buildServerGoogleFontUrl(effectiveFont, [
    '400',
    '500',
    '600',
    '700',
  ]);
  const normCss = buildStandardA4PrintCss(margins, effectiveFont);

  const hasFullDocument =
    /<!doctype\s+html/i.test(sanitized) || /<html[\s>]/i.test(sanitized);

  if (hasFullDocument) {
    let doc = sanitized;
    const hasFontLink = doc.includes('fonts.googleapis.com');
    const injectedHeadBlock = `${
      hasFontLink
        ? ''
        : `<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link rel="stylesheet" href="${fontUrl}" />\n`
    }<style id="cv-master-pdf-norm">${normCss}</style>`;

    if (/<\/head>/i.test(doc)) {
      doc = doc.replace(/<\/head>/i, `${injectedHeadBlock}\n</head>`);
    } else if (/<body[\s>]/i.test(doc)) {
      doc = doc.replace(
        /<body/i,
        `<head><meta charset="UTF-8" /><title>${title}</title>${injectedHeadBlock}</head><body`
      );
    } else {
      doc = `${injectedHeadBlock}\n${doc}`;
    }
    return doc;
  }

  const wrappedBody = sanitized.includes('resume-sheet')
    ? sanitized
    : `<div class="resume-sheet">${sanitized}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/[<>&"]/g, '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="${fontUrl}" />
  <style id="cv-master-pdf-norm">${normCss}</style>
</head>
<body>
  ${wrappedBody}
</body>
</html>`;
}
