import React from 'react';
import { describe, it, expect, afterAll, vi } from 'vitest';
import request from 'supertest';
import { render } from '@testing-library/react';
import { createBackendApp } from '../../server/app';
import {
  pdfExportRequestSchema,
  photoUploadRequestSchema,
  resolveServerMargins,
} from '../../server/schemas/pdfSchema';
import {
  buildContentDispositionHeader,
  normalizeResumeHtmlForPdf,
  sanitizePdfFilename,
  stripExecutableHtmlTags,
} from '../../server/services/htmlNormalizer';
import { renderResumeDataToHtml } from '../../server/services/resumeHtmlRenderer';
import {
  closePdfBrowser,
  isSafeExternalResourceUrl,
  renderHtmlToPdfBuffer,
  resolveBrowserExecutablePath,
} from '../../server/services/pdfGenerator';
import {
  buildStandaloneResumeHtml,
  exportResumeToPdf,
  resolvePdfApiEndpoint,
} from '@/services/pdfService';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import {
  DEFAULT_PDF_SETTINGS,
  DEFAULT_RESUME_DATA,
} from '@/store/useResumeStore';

describe('Stateless PDF Export Backend (Zero Database)', () => {
  afterAll(async () => {
    await closePdfBrowser();
  });

  it('resolves margins and validates PDF & photo request schemas strictly', () => {
    // Numeric margin
    expect(resolveServerMargins(30)).toEqual({
      top: 30,
      bottom: 30,
      left: 30,
      right: 30,
    });

    // Per-side object margin
    expect(
      resolveServerMargins({
        VALUE: 20,
        TOP: 15,
        BOTTOM: 25,
        LEFT: 35,
        RIGHT: 40,
      })
    ).toEqual({
      top: 15,
      bottom: 25,
      left: 35,
      right: 40,
    });

    // Rejects empty PDF request
    expect(pdfExportRequestSchema.safeParse({}).success).toBe(false);

    // Accepts htmlContent request
    expect(
      pdfExportRequestSchema.safeParse({
        htmlContent: '<div class="resume-sheet"><h1>John Doe</h1></div>',
        margin: { VALUE: 20 },
      }).success
    ).toBe(true);

    // Accepts structured resumeData request without htmlContent
    expect(
      pdfExportRequestSchema.safeParse({
        resumeData: DEFAULT_RESUME_DATA,
        pdfSettings: DEFAULT_PDF_SETTINGS,
      }).success
    ).toBe(true);

    // Validates base64 photo upload schema
    const tinyPngBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(
      photoUploadRequestSchema.safeParse({ image: tinyPngBase64 }).success
    ).toBe(true);
    expect(
      photoUploadRequestSchema.safeParse({
        image: 'data:text/html;base64,PHNjcmlwdD4=',
      }).success
    ).toBe(false);
  });

  it('normalizes HTML, strips executable XSS tags, and formats Unicode Content-Disposition headers', () => {
    const dirtyHtml =
      '<div class="resume-sheet" onclick="evil()"><script>alert(1)</script><h1>Trần Ngọc Huy</h1><a href="javascript:alert(2)">Link</a></div>';
    const cleaned = stripExecutableHtmlTags(dirtyHtml);
    expect(cleaned).not.toContain('<script');
    expect(cleaned).not.toContain('onclick=');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).toContain('Trần Ngọc Huy');

    const normalized = normalizeResumeHtmlForPdf(dirtyHtml, {
      margins: { top: 24, bottom: 28, left: 32, right: 36 },
      fontFamily: 'Be Vietnam Pro',
      title: 'Trần Ngọc Huy - CV',
    });

    expect(normalized).toContain('<!DOCTYPE html>');
    expect(normalized).toContain('size: A4 portrait');
    expect(normalized).toContain('margin: 24px 0 28px 0');
    expect(normalized).toContain('padding: 0 36px 0 32px !important');
    expect(normalized).toContain('Be%20Vietnam%20Pro');

    const header = buildContentDispositionHeader(
      'Trần Ngọc Huy-Information Technology Engineer.pdf'
    );
    expect(header).toContain(
      'filename="Tran Ngoc Huy-Information Technology Engineer.pdf"'
    );
    expect(header).toContain(
      "filename*=UTF-8''Tr%E1%BA%A7n%20Ng%E1%BB%8Dc%20Huy-Information%20Technology%20Engineer.pdf"
    );
    expect(sanitizePdfFilename('My:CV*File?.pdf')).toBe('My-CV-File-.pdf');
  });

  it('enforces SSRF and LFI protection on subresource URLs', () => {
    expect(isSafeExternalResourceUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeExternalResourceUrl('http://localhost:3001/health')).toBe(
      false
    );
    expect(isSafeExternalResourceUrl('http://127.0.0.1:8080/secret')).toBe(
      false
    );
    expect(
      isSafeExternalResourceUrl('http://169.254.169.254/latest/meta-data/')
    ).toBe(false);
    expect(isSafeExternalResourceUrl('http://192.168.1.1/admin')).toBe(false);
    expect(isSafeExternalResourceUrl('http://10.0.0.5/internal')).toBe(false);

    expect(
      isSafeExternalResourceUrl(
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'
      )
    ).toBe(true);
    expect(
      isSafeExternalResourceUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==')
    ).toBe(true);
  });

  it('renders structured ResumeData JSON directly into standalone A4 HTML on the server', () => {
    const html = renderResumeDataToHtml({
      resumeData: {
        ...DEFAULT_RESUME_DATA,
        basics: {
          ...DEFAULT_RESUME_DATA.basics,
          name: 'Trần Ngọc Huy',
          title: 'Full-Stack Engineer',
          email: 'tnh2045@gmail.com',
        },
      },
      pdfSettings: {
        ...DEFAULT_PDF_SETTINGS,
        fontFamily: 'Be Vietnam Pro',
      },
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Trần Ngọc Huy');
    expect(html).toContain('Full-Stack Engineer');
    expect(html).toContain('TechNova Solutions');
    expect(html).toContain('Be Vietnam Pro');
  });

  it('handles GET /api/health, POST /api/pdf, POST /pdf, and POST /api/upload-photo statelessly', async () => {
    const mockPdfBytes = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF',
      'utf-8'
    );
    const rendererSpy = vi.fn().mockResolvedValue(mockPdfBytes);
    const app = createBackendApp({ pdfRenderer: rendererSpy });

    // 1. Health check verifies stateless database-free configuration
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');
    expect(healthRes.body.database).toBe('none');
    expect(healthRes.body.stateless).toBe(true);

    // 2. POST /api/pdf with htmlContent
    const pdfRes = await request(app)
      .post('/api/pdf')
      .send({
        htmlContent: '<div class="resume-sheet"><h1>Trần Ngọc Huy</h1></div>',
        fileName: 'Trần Ngọc Huy-Engineer.pdf',
        margin: { VALUE: 20, TOP: 18, BOTTOM: 18, LEFT: 22, RIGHT: 22 },
      });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain(
      'filename="Tran Ngoc Huy-Engineer.pdf"'
    );
    expect(Buffer.from(pdfRes.body).toString('utf-8')).toContain('%PDF-1.4');
    expect(rendererSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        margins: { top: 18, bottom: 18, left: 22, right: 22 },
        title: 'Trần Ngọc Huy-Engineer',
      })
    );

    // 3. POST /pdf with structured resumeData JSON (no htmlContent required)
    const jsonToPdfRes = await request(app).post('/pdf').send({
      resumeData: DEFAULT_RESUME_DATA,
      pdfSettings: DEFAULT_PDF_SETTINGS,
    });
    expect(jsonToPdfRes.status).toBe(200);
    expect(jsonToPdfRes.headers['content-type']).toContain('application/pdf');
    expect(jsonToPdfRes.headers['content-disposition']).toContain(
      'John Doe-Software Developer.pdf'
    );

    // 4. POST /api/pdf validation error on empty body
    const badRes = await request(app).post('/api/pdf').send({});
    expect(badRes.status).toBe(400);
    expect(badRes.body.error).toMatch(/Invalid PDF export request/i);

    // 5. POST /api/upload-photo stateless data URL validation
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const photoRes = await request(app)
      .post('/api/upload-photo')
      .send({ image: tinyPng });
    expect(photoRes.status).toBe(200);
    expect(photoRes.body.url).toBe(tinyPng);
  });

  it('generates a real A4 PDF binary via Headless Chromium from ResumeSheet HTML', async () => {
    const browserPath = resolveBrowserExecutablePath();
    if (!browserPath) {
      return;
    }

    const { container, unmount } = render(<ResumeSheet mode="print" />);
    const sheetEl = container.querySelector('.resume-sheet') as HTMLElement;
    expect(sheetEl).toBeTruthy();

    const htmlContent = buildStandaloneResumeHtml(
      sheetEl,
      DEFAULT_PDF_SETTINGS
    );

    const pdfBuffer = await renderHtmlToPdfBuffer({
      htmlContent,
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      fontFamily: DEFAULT_PDF_SETTINGS.fontFamily,
      title: 'John Doe - Software Developer',
    });

    unmount();

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(5000);
    expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(
      pdfBuffer.subarray(pdfBuffer.length - 10).toString('ascii')
    ).toContain('%%EOF');
  }, 25000);

  it('downloads the binary PDF file in exportResumeToPdf when the backend returns application/pdf', async () => {
    expect(resolvePdfApiEndpoint()).toBe('/api/pdf');
    expect(resolvePdfApiEndpoint('http://localhost:3001')).toBe(
      'http://localhost:3001/pdf'
    );
    expect(resolvePdfApiEndpoint('http://localhost:3001/api/pdf')).toBe(
      'http://localhost:3001/api/pdf'
    );

    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(fakePdfBytes, {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      })
    );

    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'resume-sheet';
    sheetDiv.innerHTML = '<h1>Trần Ngọc Huy</h1>';

    await exportResumeToPdf({
      resumeSheetElement: sheetDiv,
      pdfSettings: DEFAULT_PDF_SETTINGS,
      fileName: 'Trần Ngọc Huy-Engineer.pdf',
      apiUrl: 'http://localhost:3001/api/pdf',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3001/api/pdf',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(createObjectUrlSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    createObjectUrlSpy.mockRestore();
  });
});
