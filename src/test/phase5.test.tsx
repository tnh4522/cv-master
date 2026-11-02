import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App, ErrorBoundary } from '@/App';
import {
  useResumeStore,
  usePdfSettingsStore,
  useReviewStore,
} from '@/store/useResumeStore';
import {
  ResumeSheet,
  sanitizeSummaryHtml,
  normalizeHref,
} from '@/components/preview/ResumeSheet';
import {
  improveWriting,
  fixTypos,
  customizeWriting,
  analyzeResumeForRole,
} from '@/services/aiService';
import { parsePdfResumeText } from '@/services/importService';
import { fetchGoogleFontsByCategory } from '@/services/fontsService';
import { uploadProfilePhoto } from '@/services/photoService';
import {
  exportResumeToPdf,
  buildStandaloneResumeHtml,
} from '@/services/pdfService';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

describe('Phase 5 Quality Assurance — Workflows, Responsive UI, Persistence, Pagination, API Resilience & Security', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useResumeStore.getState().resetResume();
    usePdfSettingsStore.getState().resetPdfSettings();
    useReviewStore.getState().clearAnalysis();
    window.history.pushState({}, '', '/');
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('supports full CRUD lifecycle across all 8 dynamic sections, custom fields, and section titles', () => {
    const store = useResumeStore.getState();

    // 1. Add and update custom fields & breakAfter in basics
    store.updateBasics({
      ...store.resumeData.basics,
      alignment: 'center',
      phone: { value: '+1 555 0199', breakAfter: true },
      location: { value: 'San Francisco, CA', breakAfter: true },
      customFields: [
        {
          id: 'cf-1',
          name: 'GitHub',
          iconName: 'github',
          value: 'https://github.com/alexrivera',
          breakAfter: false,
        },
        {
          id: 'cf-2',
          name: 'Citizenship',
          iconName: 'flag',
          value: 'US Citizen',
          breakAfter: true,
        },
      ],
    });

    // 2. Exercise CRUD across all 8 list sections
    store.addSectionItem('experience', {
      id: 'exp-qa-1',
      name: 'Acme Cloud',
      position: 'Principal Architect',
      dateRange: '2023 - Present',
      location: 'Remote',
      employmentType: 'Full-time',
      website: 'https://acme.example.com',
      summary: '<p>Architected multi-region platform.</p>',
    });
    store.addSectionItem('projects', {
      id: 'proj-qa-1',
      name: 'CVMaster Open',
      description: 'Resume Builder',
      date: '2025',
      website: 'https://cvmaster.example.com',
      summary: '<p>Built with React & TypeScript.</p>',
      keywords: ['React', 'TypeScript', 'Tailwind'],
    });
    store.addSectionItem('education', {
      id: 'edu-qa-1',
      name: 'MIT',
      degree: 'M.S.',
      studyField: 'Computer Science',
      date: '2018 - 2020',
      website: 'https://mit.edu',
      summary: '<p>Graduated with honors.</p>',
    });
    store.addSectionItem('skills', {
      id: 'skill-qa-1',
      name: 'Cloud & DevOps',
      keywords: ['AWS', 'Kubernetes', 'Terraform'],
    });
    store.addSectionItem('languages', {
      id: 'lang-qa-1',
      name: 'Vietnamese',
      level: 'Native',
      certificate: 'IELTS',
      score: '8.0',
      date: '2024',
      website: 'https://ielts.org',
      listening: '8.5',
      speaking: '7.5',
      reading: '8.5',
      writing: '7.5',
      description: 'Bilingual technical communication',
    });
    store.addSectionItem('certifications', {
      id: 'cert-qa-1',
      name: 'CKA',
      issuer: 'CNCF',
      date: '2024',
      website: 'https://cncf.io',
      summary: '<p>Certified Kubernetes Administrator.</p>',
    });
    store.addSectionItem('awards', {
      id: 'award-qa-1',
      name: 'Best Systems Paper',
      issuer: 'ACM',
      date: '2023',
      website: 'https://acm.org',
      summary: '<p>Awarded for distributed consensus research.</p>',
    });
    store.addSectionItem('volunteering', {
      id: 'vol-qa-1',
      name: 'Code.org',
      position: 'Mentor',
      date: '2022 - Present',
      location: 'Online',
      summary: '<p>Mentored 50+ high school students.</p>',
    });
    store.addSectionItem('interests', {
      id: 'int-qa-1',
      name: 'Photography',
      description: 'Landscape & street photography',
      keywords: ['35mm Film', 'Lightroom'],
    });

    // Update section title
    store.updateSectionTitle('awards', 'Honors & Awards');

    const updated = useResumeStore.getState().resumeData;
    expect(updated.sectionTitles.awards).toBe('Honors & Awards');
    expect(updated.experience.some((i) => i.id === 'exp-qa-1')).toBe(true);
    expect(updated.projects.some((i) => i.id === 'proj-qa-1')).toBe(true);
    expect(updated.education.some((i) => i.id === 'edu-qa-1')).toBe(true);
    expect(updated.skills.some((i) => i.id === 'skill-qa-1')).toBe(true);
    expect(updated.languages.some((i) => i.id === 'lang-qa-1')).toBe(true);
    expect(updated.certifications.some((i) => i.id === 'cert-qa-1')).toBe(true);
    expect(updated.awards.some((i) => i.id === 'award-qa-1')).toBe(true);
    expect(updated.volunteering.some((i) => i.id === 'vol-qa-1')).toBe(true);
    expect(updated.interests.some((i) => i.id === 'int-qa-1')).toBe(true);

    // Render ResumeSheet and verify all sections, custom fields, and skills layouts render
    const { unmount } = render(<ResumeSheet mode="preview" />);
    expect(screen.getByText('Honors & Awards')).toBeInTheDocument();
    expect(screen.getByText('Best Systems Paper')).toBeInTheDocument();
    expect(screen.getByText('Code.org')).toBeInTheDocument();
    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText(/Citizenship: US Citizen/)).toBeInTheDocument();

    // Verify skillsLayout switching ('grid-col', 'grid-row', 'inline')
    act(() => {
      usePdfSettingsStore
        .getState()
        .updatePdfSettings({ skillsLayout: 'grid-col' });
    });
    expect(screen.getByTestId('skills-layout-container').className).toContain(
      'grid-cols-2'
    );

    act(() => {
      usePdfSettingsStore
        .getState()
        .updatePdfSettings({ skillsLayout: 'grid-row' });
    });
    expect(screen.getByTestId('skills-layout-container').className).toContain(
      'grid-cols-1'
    );

    act(() => {
      usePdfSettingsStore
        .getState()
        .updatePdfSettings({ skillsLayout: 'inline' });
    });
    expect(screen.getByTestId('skills-layout-container').className).toContain(
      'flex-wrap'
    );

    unmount();
  });

  it('adapts UI layout across desktop (>= 1024px) and mobile (< 1024px) viewports and persists theme state', () => {
    // 1. Mobile viewport (< 1024px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });
    window.dispatchEvent(new Event('resize'));

    const { unmount } = render(<App />);

    // Mobile bottom bar has Content & Preview toggle buttons
    const contentBtn = screen.getByRole('button', { name: /Content/i });
    const previewBtn = screen.getByRole('button', { name: /Preview/i });
    expect(contentBtn).toBeInTheDocument();
    expect(previewBtn).toBeInTheDocument();

    // Switch to mobile Preview tab
    fireEvent.click(previewBtn);
    expect(screen.getByTestId('resume-sheet')).toBeInTheDocument();

    // Switch back to mobile Content tab
    fireEvent.click(contentBtn);
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    unmount();

    // 2. Theme persistence verification (storageKey = "cv-master-theme")
    function ThemeProbe() {
      const { theme, setTheme } = useTheme();
      return (
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          Current:{theme}
        </button>
      );
    }

    const { unmount: unmountTheme } = render(
      <ThemeProvider defaultTheme="dark" storageKey="cv-master-theme">
        <ThemeProbe />
      </ThemeProvider>
    );
    const toggleBtn = screen.getByRole('button', { name: /Current:/i });
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem('cv-master-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    unmountTheme();
  });

  it('renders multi-page A4 page-break indicators in preview mode and strips them in print/export HTML', () => {
    // Mock offsetHeight on HTMLDivElement to simulate a 2,500px tall multi-page CV (3 A4 pages)
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
      .mockReturnValue(2500);

    const { container, unmount } = render(<ResumeSheet mode="preview" />);
    const breakIndicators = container.querySelectorAll(
      '[data-page-break-indicator="true"]'
    );
    expect(breakIndicators.length).toBe(2);
    expect(screen.getByText('Page 2 starts')).toBeInTheDocument();
    expect(screen.getByText('Page 3 starts')).toBeInTheDocument();

    // Verify buildStandaloneResumeHtml removes all page-break indicators
    const sheetEl = screen.getByTestId('resume-sheet');
    const standaloneHtml = buildStandaloneResumeHtml(
      sheetEl,
      usePdfSettingsStore.getState().pdfSettings
    );
    expect(standaloneHtml).not.toContain('data-page-break-indicator');
    expect(standaloneHtml).not.toContain('Page 2 starts');
    expect(standaloneHtml).toContain('@page');

    unmount();

    // Verify mode="print" never renders page-break indicators even when sheet is 2,500px tall
    const { container: printContainer, unmount: unmountPrint } = render(
      <ResumeSheet mode="print" />
    );
    expect(
      printContainer.querySelectorAll('[data-page-break-indicator="true"]').length
    ).toBe(0);

    unmountPrint();
    offsetHeightSpy.mockRestore();
  });

  it('recovers gracefully when external APIs fail (Gemini AI, Google Fonts, Photo Upload, PDF Service) and when ErrorBoundary catches errors', async () => {
    // Force global fetch to reject with a network failure
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('Network unavailable'));

    // 1. AI Writing & Review services fall back cleanly without throwing
    const improved = await improveWriting('<p>Led backend team</p>');
    expect(improved).toContain('<p>');

    const fixed = await fixTypos('<p>Teh backend service recieve data</p>');
    expect(fixed).toContain('The backend service receive data');

    const customized = await customizeWriting(
      '<p>Built distributed queue</p>',
      'more_technical'
    );
    expect(customized).toContain('automated CI/CD pipelines');

    const review = await analyzeResumeForRole({
      resumeData: useResumeStore.getState().resumeData,
      jobTitle: 'Senior Full Stack Engineer',
      jobDescription:
        'We are looking for a Senior Full Stack Engineer with React, TypeScript, Node.js, AWS, Docker, and Kubernetes experience.',
    });
    expect(review.overallScore).toBeGreaterThan(0);

    // 2. PDF Import AI parser falls back to deterministic parser when fetch fails
    const parsedPdf = await parsePdfResumeText(
      'Jane Doe\nStaff Engineer\njane@example.com | +1 555 234 5678\nSummary\nExperienced Staff Engineer building scalable cloud systems.'
    );
    expect(parsedPdf.resumeData.basics.email).toBe('jane@example.com');

    // 3. Google Fonts service falls back to local catalog
    const fonts = await fetchGoogleFontsByCategory('sans-serif');
    expect(fonts.length).toBeGreaterThan(0);

    // 4. Photo upload service falls back to local Data URL
    const validPng = new File([new Uint8Array(2048)], 'avatar.png', {
      type: 'image/png',
    });
    const photoDataUrl = await uploadProfilePhoto(validPng);
    expect(photoDataUrl).toMatch(/^data:image\/png;base64,/);

    // 5. PDF export service falls back to browser print helper when remote endpoint is absent/unavailable
    const sheetDiv = document.createElement('div');
    sheetDiv.innerHTML = '<h1>Jane Doe</h1>';
    await expect(
      exportResumeToPdf({
        resumeSheetElement: sheetDiv,
        pdfSettings: usePdfSettingsStore.getState().pdfSettings,
        fileName: 'Jane Doe-Staff Engineer.pdf',
      })
    ).resolves.toBeUndefined();

    fetchSpy.mockRestore();

    // 6. ErrorBoundary catches rendering crashes and offers workspace reset
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    function CrashingChild(): React.ReactElement {
      throw new Error('Simulated component crash');
    }

    render(
      <ErrorBoundary>
        <CrashingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Simulated component crash')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reset Workspace & Reload/i })
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('enforces XSS sanitization on rich-text HTML, href links, and profile photo URLs', () => {
    const maliciousHtml =
      '<p onclick="alert(1)">Hello <strong>World</strong></p><script>window.pwned = true;</script><iframe src="https://evil.example.com"></iframe><img src="x" onerror="alert(2)" /><a href="javascript:alert(3)">Click</a>';

    const sanitized = sanitizeSummaryHtml(maliciousHtml);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('<strong>World</strong>');

    // Verify normalizeHref blocks dangerous protocols
    expect(normalizeHref('javascript:alert(1)')).toBe('#');
    expect(normalizeHref('data:text/html,<script>alert(1)</script>')).toBe('#');
    expect(normalizeHref('vbscript:msgbox(1)')).toBe('#');
    expect(normalizeHref('github.com/alex')).toBe('https://github.com/alex');

    // Verify unsafe photo URL is blocked from rendering in ResumeSheet
    const store = useResumeStore.getState();
    store.updateBasics({
      ...store.resumeData.basics,
      photo: {
        url: 'javascript:alert(1)',
        visible: true,
        size: 100,
        borderRadius: 4,
      },
    });
    const { container, unmount } = render(<ResumeSheet mode="preview" />);
    expect(container.querySelector('img')).toBeNull();
    unmount();
  });

  it('supports switching to Vietnamese (vi) language and persists selection in localStorage', () => {
    const { unmount } = render(<App />);

    // Default is English
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();

    // Open language switcher and select Vietnamese
    const switcherBtn = screen.getByTestId('language-switcher');
    fireEvent.click(switcherBtn);

    const viOption = screen.getByTestId('lang-option-vi');
    fireEvent.click(viOption);

    // Verify localStorage persistence and HTML lang attribute
    expect(localStorage.getItem('cv-master-lang')).toBe('vi');
    expect(document.documentElement.lang).toBe('vi');

    // Verify Vietnamese translations in Header & Editor
    expect(screen.getByText('Thông tin cá nhân')).toBeInTheDocument();
    expect(screen.getByText('Họ và tên')).toBeInTheDocument();
    expect(screen.getByText('Đánh giá CV bằng AI')).toBeInTheDocument();
    expect(screen.getByText('Tải xuống')).toBeInTheDocument();
    expect(screen.getByText('Nhập CV')).toBeInTheDocument();

    unmount();
  });
});
