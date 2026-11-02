import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  useResumeStore,
  usePdfSettingsStore,
} from '@/store/useResumeStore';
import {
  isValidPhotoUrl,
  uploadProfilePhoto,
  validatePhotoFile,
} from '@/services/photoService';
import {
  extractTextFromPdfFile,
  parseImageResumeFile,
  parsePdfResumeText,
  sanitizeAiJsonOutput,
  validateExtractedCvHeuristic,
  validateImageImportFile,
  validatePdfImportFile,
} from '@/services/importService';
import {
  buildStandaloneResumeHtml,
  exportResumeToPdf,
  formatExportFilename,
  validateBasicsForPdfExport,
} from '@/services/pdfService';
import { ResumeSheet } from '@/components/preview/ResumeSheet';

describe('Phase 3 Import & Export — PDF, Image, JSON & Profile Photo Adapters', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
    usePdfSettingsStore.getState().resetPdfSettings();
  });

  it('validates profile photo MIME types (png/jpeg/jpg/webp) and <= 2MB size limit', async () => {
    const validPng = new File([new Uint8Array(2048)], 'avatar.png', {
      type: 'image/png',
    });
    const validWebp = new File([new Uint8Array(2048)], 'avatar.webp', {
      type: 'image/webp',
    });
    const invalidGif = new File([new Uint8Array(2048)], 'anim.gif', {
      type: 'image/gif',
    });
    const oversizedPng = new File(
      [new Uint8Array(2 * 1024 * 1024 + 100)],
      'huge.png',
      { type: 'image/png' }
    );

    expect(validatePhotoFile(validPng).valid).toBe(true);
    expect(validatePhotoFile(validWebp).valid).toBe(true);
    expect(validatePhotoFile(invalidGif).valid).toBe(false);
    expect(validatePhotoFile(oversizedPng).valid).toBe(false);

    const dataUrl = await uploadProfilePhoto(validPng);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(isValidPhotoUrl(dataUrl)).toBe(true);
    expect(isValidPhotoUrl('https://example.com/photo.png')).toBe(true);
    expect(isValidPhotoUrl('ftp://invalid-url')).toBe(false);
  });

  it('validates PDF import files (1KB..20MB), extracts text, and parses structured resume fields', async () => {
    const tinyPdf = new File(['%PDF-1.4 short'], 'tiny.pdf', {
      type: 'application/pdf',
    });
    expect(validatePdfImportFile(tinyPdf).valid).toBe(false);

    const resumePdfStream =
      '%PDF-1.4\n' +
      '(Alan Turing)\n' +
      '(Principal Mathematician & Cryptanalyst)\n' +
      '(alan.turing@bletchley.org | +44 20 7946 0921 | https://linkedin.com/in/alanturing)\n' +
      '(Pioneered theoretical computer science, artificial intelligence, and algorithmic computation with TypeScript, Python, and React.)\n' +
      ' '.repeat(1200);

    const validPdf = new File([resumePdfStream], 'alan-turing-cv.pdf', {
      type: 'application/pdf',
    });

    expect(validatePdfImportFile(validPdf).valid).toBe(true);

    const { fullText, previewText } = await extractTextFromPdfFile(validPdf);
    expect(fullText.length).toBeGreaterThanOrEqual(50);
    expect(previewText.length).toBeLessThanOrEqual(1000);
    expect(fullText).toContain('alan.turing@bletchley.org');

    const { resumeData } = await parsePdfResumeText(fullText);
    expect(resumeData.basics.email).toBe('alan.turing@bletchley.org');
    expect(resumeData.basics.linkedin).toBe(
      'https://linkedin.com/in/alanturing'
    );
    expect(
      resumeData.skills.some((s) => s.keywords.includes('Python'))
    ).toBe(true);
  });

  it('sanitizes markdown fences from AI JSON responses (_u)', () => {
    const fenced =
      'Here is the extracted JSON:\n```json\n{"basics":{"name":"Linus Torvalds"}}\n```\nDone!';
    expect(sanitizeAiJsonOutput(fenced)).toBe(
      '{"basics":{"name":"Linus Torvalds"}}'
    );
  });

  it('validates Image import files (10KB..4MB) and enforces the 6-signal heuristic validator (Uu)', async () => {
    const smallImg = new File([new Uint8Array(1024)], 'small.png', {
      type: 'image/png',
    });
    expect(validateImageImportFile(smallImg).valid).toBe(false);

    const validCvImage = new File(
      [new Uint8Array(15 * 1024)],
      'Margaret_Hamilton_Resume.png',
      { type: 'image/png' }
    );
    expect(validateImageImportFile(validCvImage).valid).toBe(true);

    const parsed = await parseImageResumeFile(validCvImage);
    expect(parsed.resumeData.basics.name).toBe('Margaret Hamilton Resume');

    // Negative non-CV image (e.g. cooking recipe) must be rejected by `Uu`
    const recipeImage = new File(
      [new Uint8Array(15 * 1024)],
      'chocolate_cake_recipe_ingredients.jpg',
      { type: 'image/jpeg' }
    );
    await expect(parseImageResumeFile(recipeImage)).rejects.toThrow(
      /doesn't appear to be a CV\/Resume/i
    );

    // Direct heuristic check with < 2 signals
    expect(() =>
      validateExtractedCvHeuristic({
        basics: {
          name: 'Only Name',
          title: '',
          email: '',
          linkedin: '',
          website: '',
          phone: { value: '', breakAfter: false },
          location: { value: '', breakAfter: false },
          customFields: [],
          alignment: 'start',
          photo: { url: '', size: 100, borderRadius: 4, visible: true },
        },
        experience: [],
        education: [],
        projects: [],
        skills: [],
      })
    ).toThrow(/doesn't appear to be a CV\/Resume/i);
  });

  it('validates basics before PDF export, formats filenames, and strips page-break indicators in standalone HTML', async () => {
    const store = useResumeStore.getState();

    // Missing email '@' should fail pre-export validation
    store.updateBasics({ email: 'invalid-email' });
    expect(
      validateBasicsForPdfExport(useResumeStore.getState().resumeData.basics)
        .valid
    ).toBe(false);

    // Valid basics should pass and format `${name}-${title}.pdf`
    store.updateBasics({
      name: 'Katherine Johnson',
      title: 'Aerospace Mathematician',
      email: 'katherine@nasa.gov',
    });
    const basics = useResumeStore.getState().resumeData.basics;
    expect(validateBasicsForPdfExport(basics).valid).toBe(true);
    expect(formatExportFilename(basics, 'pdf')).toBe(
      'Katherine Johnson-Aerospace Mathematician.pdf'
    );
    expect(formatExportFilename(basics, 'json')).toBe(
      'Katherine Johnson-Aerospace Mathematician.json'
    );

    const { container } = render(<ResumeSheet mode="preview" />);
    const sheetEl = container.querySelector('.resume-sheet') as HTMLElement;
    expect(sheetEl).toBeTruthy();

    const pdfSettings = usePdfSettingsStore.getState().pdfSettings;
    const html = buildStandaloneResumeHtml(sheetEl, pdfSettings);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Katherine Johnson');
    expect(html).not.toContain('data-page-break-indicator="true"');

    // Verify browser print adapter completes cleanly without throwing
    await expect(
      exportResumeToPdf({
        resumeSheetElement: sheetEl,
        pdfSettings,
        fileName: formatExportFilename(basics, 'pdf'),
      })
    ).resolves.toBeUndefined();
  });

  it('supports photo visibility toggle and size/border-radius controls in BasicsEditor', () => {
    const store = useResumeStore.getState();
    store.updateBasics({
      photo: {
        url: 'https://example.com/avatar.png',
        size: 100,
        borderRadius: 4,
        visible: true,
      },
    });

    const { rerender } = render(<ResumeSheet mode="preview" />);
    expect(screen.getByAltText(store.resumeData.basics.name)).toBeInTheDocument();

    // Hide photo and verify it is excluded from the rendered CV sheet
    act(() => {
      store.updateBasics({
        photo: {
          ...useResumeStore.getState().resumeData.basics.photo,
          visible: false,
        },
      });
    });
    rerender(<ResumeSheet mode="preview" />);
    expect(
      screen.queryByAltText(store.resumeData.basics.name)
    ).not.toBeInTheDocument();
  });
});
