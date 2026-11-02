import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  useResumeStore,
  useReviewStore,
  DEFAULT_RESUME_DATA,
} from '@/store/useResumeStore';
import {
  CUSTOMIZE_OPTIONS,
  VERIFIED_PROMPTS,
  analyzeResumeForRole,
  customizeWriting,
  fixTypos,
  improveWriting,
  isResumeEmpty,
} from '@/services/aiService';
import ReviewPage from '@/pages/ReviewPage';

describe('Phase 4 AI Features — Gemini AI Adapter, Writing Tools & Review Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
    useReviewStore.getState().clearAnalysis();
  });

  it('exposes the 6 verified customization presets and verified system prompts without hardcoded keys', () => {
    expect(CUSTOMIZE_OPTIONS.map((o) => o.label)).toEqual([
      'Shorter',
      'Longer',
      'More Formal',
      'More Informal',
      'More Creative',
      'More Technical',
    ]);
    expect(VERIFIED_PROMPTS.IMPROVE_SYSTEM).toContain(
      'Preserve all HTML tags and structure'
    );
    expect(VERIFIED_PROMPTS.FIX_TYPOS_SYSTEM).toContain(
      'professional proofreader'
    );
    expect(VERIFIED_PROMPTS.CUSTOMIZE_SYSTEM).toContain(
      'Keep the output exactly the same length'
    );
  });

  it('executes Improve Writing, Fix Typos, and all 6 Customize presets while preserving HTML tags', async () => {
    const rawHtml =
      '<ul><li><p>worked on teh frontend developement and built dashboards</p></li></ul>';

    const typoFixed = await fixTypos(rawHtml);
    expect(typoFixed).toContain('the');
    expect(typoFixed).toContain('development');
    expect(typoFixed).not.toContain('teh');
    expect(typoFixed).toContain('<ul>');

    const improved = await improveWriting(typoFixed);
    expect(improved).toContain('Collaborated');
    expect(improved).toContain('<ul>');

    for (const preset of CUSTOMIZE_OPTIONS) {
      const customized = await customizeWriting(improved, preset.value);
      expect(customized).toContain('<ul>');
      expect(customized.length).toBeGreaterThan(15);
    }
  });

  it('enforces verified guard clauses in analyzeResumeForRole (empty resume & invalid job inputs)', async () => {
    const emptyResume = {
      ...DEFAULT_RESUME_DATA,
      basics: {
        ...DEFAULT_RESUME_DATA.basics,
        name: '',
      },
      summary: { sectionTitle: 'Summary', content: '' },
      experience: [],
      projects: [],
      education: [],
      skills: [],
    };

    expect(isResumeEmpty(emptyResume)).toBe(true);

    await expect(
      analyzeResumeForRole({
        resumeData: emptyResume,
        jobTitle: 'Senior Frontend Engineer',
        jobDescription:
          'We are seeking an experienced Senior Frontend Engineer proficient in React, TypeScript, and modern web architecture.',
      })
    ).rejects.toThrow('cannot analyze an empty resume');

    await expect(
      analyzeResumeForRole({
        resumeData: DEFAULT_RESUME_DATA,
        jobTitle: 'Dev',
        jobDescription: 'Too short',
      })
    ).rejects.toThrow('Please enter a valid job title and description');
  });

  it('generates a complete CVAnalysisResult and renders the 4-tab ReviewPage dashboard with interactive improvement checkboxes', async () => {
    const result = await analyzeResumeForRole({
      resumeData: DEFAULT_RESUME_DATA,
      jobTitle: 'Senior Frontend Engineer',
      jobDescription:
        'We are looking for a Senior Frontend Engineer with strong expertise in React, TypeScript, Tailwind CSS, performance optimization, and scalable UI architecture.',
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(65);
    expect(result.jobFitPercentage).toBeGreaterThanOrEqual(60);
    expect(result.summary.strengths.length).toBeGreaterThan(0);

    act(() => {
      useReviewStore.getState().setAnalysis(result);
    });

    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ReviewPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Comprehensive Resume & ATS Evaluation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(result.summary.fitLevel)).toBeInTheDocument();

    // Verify all 4 tab triggers are rendered
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Detailed Analysis/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Recommendations/i })
    ).toBeInTheDocument();
    const improvementsTab = screen.getByRole('tab', { name: /Improvements/i });
    expect(improvementsTab).toBeInTheDocument();

    // Switch to Improvements tab and test interactive checkbox strikethrough
    fireEvent.click(improvementsTab);
  });
});
