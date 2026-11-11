import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser } from 'puppeteer-core';
import type { ResolvedMargins } from '../schemas/pdfSchema';
import { normalizeResumeHtmlForPdf } from './htmlNormalizer';

export interface GeneratePdfBufferParams {
  htmlContent: string;
  margins: ResolvedMargins;
  fontFamily?: string;
  title?: string;
}

const CANDIDATE_BROWSER_PATHS: Record<string, string[]> = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(
      process.env.LOCALAPPDATA || '',
      'Google\\Chrome\\Application\\chrome.exe'
    ),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft\\Edge\\Application\\msedge.exe'
    ),
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/microsoft-edge',
  ],
};

/**
 * Resolves the local Chromium / Chrome / Edge executable path for headless PDF rendering.
 */
export function resolveBrowserExecutablePath(): string | null {
  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.EDGE_PATH;

  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const platformCandidates =
    CANDIDATE_BROWSER_PATHS[process.platform] || CANDIDATE_BROWSER_PATHS.linux;

  for (const candidate of platformCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Checks whether a URL targets a private/loopback host or disallowed protocol (SSRF / LFI protection).
 */
export function isSafeExternalResourceUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed === 'about:blank'
  ) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

let sharedBrowser: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

/**
 * Acquires a warm singleton Headless Chromium instance.
 */
export async function getPdfBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  const executablePath = resolveBrowserExecutablePath();
  if (!executablePath) {
    throw new Error(
      'No Chromium-based browser (Chrome, Edge, Chromium) found on the server. Set PUPPETEER_EXECUTABLE_PATH to a valid browser binary.'
    );
  }

  browserLaunchPromise = puppeteer
    .launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--force-color-profile=srgb',
        '--disable-extensions',
        '--disable-background-networking',
      ],
    })
    .then((browser) => {
      sharedBrowser = browser;
      browser.on('disconnected', () => {
        if (sharedBrowser === browser) {
          sharedBrowser = null;
        }
      });
      browserLaunchPromise = null;
      return browser;
    })
    .catch((err) => {
      browserLaunchPromise = null;
      throw err;
    });

  return browserLaunchPromise;
}

/**
 * Gracefully closes the shared browser instance if running.
 */
export async function closePdfBrowser(): Promise<void> {
  if (sharedBrowser) {
    const browserToClose = sharedBrowser;
    sharedBrowser = null;
    try {
      await browserToClose.close();
    } catch {
      // Ignore close errors
    }
  }
}

/**
 * Renders an HTML CV into a high-resolution, ATS-friendly, vector A4 PDF Buffer.
 */
export async function renderHtmlToPdfBuffer({
  htmlContent,
  margins,
  fontFamily,
  title,
}: GeneratePdfBufferParams): Promise<Buffer> {
  const normalizedHtml = normalizeResumeHtmlForPdf(htmlContent, {
    margins,
    fontFamily,
    title,
  });

  const browser = await getPdfBrowser();
  const page = await browser.newPage();

  try {
    // 1. Set exact A4 portrait viewport at 96 DPI (210mm x 297mm -> 794px x 1123px)
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // 2. Enforce SSRF / LFI protection on subresource requests
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (isSafeExternalResourceUrl(url)) {
        void req.continue().catch(() => undefined);
      } else {
        void req.abort('accessdenied').catch(() => undefined);
      }
    });

    // 3. Load HTML document and wait for fonts/stylesheets
    await Promise.race([
      page.setContent(normalizedHtml, {
        waitUntil: 'load',
        timeout: 12000,
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 6000)),
    ]).catch(() => {
      // Proceed even if an external image or stylesheet timed out
    });

    // 4. Ensure web fonts and images inside the page are ready
    await page
      .evaluate(async () => {
        const fontReady =
          document.fonts && typeof document.fonts.ready?.then === 'function'
            ? document.fonts.ready.catch(() => undefined)
            : Promise.resolve();

        const imgPromises = Array.from(document.images || []).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          });
        });

        await Promise.race([
          Promise.all([fontReady, ...imgPromises]),
          new Promise<void>((res) => setTimeout(res, 2500)),
        ]);
      })
      .catch(() => undefined);

    await page.emulateMediaType('print');

    // 5. Generate standard A4 PDF with tagged structure for ATS compatibility
    const pdfBytes = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      tagged: true,
      margin: {
        top: `${margins.top}px`,
        bottom: `${margins.bottom}px`,
        left: '0px',
        right: '0px',
      },
    });

    return Buffer.from(pdfBytes);
  } finally {
    await page.close().catch(() => undefined);
  }
}
