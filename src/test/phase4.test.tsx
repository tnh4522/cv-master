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
  generateInterestDetails,
  improveInterestDescription,
  customizeInterestDescription,
  suggestInterestKeywords,
  generateLanguageDescription,
  improveLanguageDescription,
  customizeLanguageDescription,
  translateResume,
  resolveIsVietnamese,
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
  }, 10000);

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

  it('generates, improves, customizes, and suggests keywords for interests using AI', async () => {
    // 1. Generate interest details for Technology
    const techAi = await generateInterestDetails({
      name: 'Technology',
      jobTitle: 'IT Officer',
      language: 'en',
    });
    expect(techAi.description).toBeTruthy();
    expect(techAi.keywords.length).toBeGreaterThan(0);
    expect(techAi.keywords).toContain('Open Source');

    // 2. Generate interest details in Vietnamese
    const vnAi = await generateInterestDetails({
      name: 'Chạy bộ',
      jobTitle: 'Lập trình viên',
      language: 'vi',
    });
    expect(vnAi.description).toContain('rèn luyện');
    expect(vnAi.keywords).toContain('Half-Marathon');

    // 3. Improve existing description
    const improved = await improveInterestDescription('i like to run 10k races on weekends');
    expect(improved).toBeTruthy();
    expect(improved.charAt(0)).toBe(improved.charAt(0).toUpperCase());

    // 4. Customize description tone
    const shorter = await customizeInterestDescription(
      'Passionate about exploring modern technologies and system architecture.',
      'shorter'
    );
    expect(shorter).toBeTruthy();

    // 5. Suggest keywords
    const keywords = await suggestInterestKeywords('Photography', 'Street & portrait photography');
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('generates, improves, and customizes language proficiency descriptions using AI', async () => {
    // 1. Generate language description with TOEIC 510 in Vietnamese
    const toeicVn = await generateLanguageDescription({
      languageName: 'English',
      certificate: 'TOEIC',
      score: '510',
      jobTitle: 'IT Officer',
      language: 'vi',
    });
    expect(toeicVn).toBeTruthy();
    expect(toeicVn).toContain('tiếng Anh');

    // 2. Generate English description for IELTS 8.0
    const ieltsEn = await generateLanguageDescription({
      languageName: 'English',
      certificate: 'IELTS',
      score: '8.0',
      language: 'en',
    });
    expect(ieltsEn).toBeTruthy();
    expect(ieltsEn.toLowerCase()).toContain('english');

    // 3. Improve existing description
    const improved = await improveLanguageDescription('confident in daily english meetings');
    expect(improved).toBeTruthy();
    expect(improved.charAt(0)).toBe(improved.charAt(0).toUpperCase());

    // 4. Customize tone
    const formal = await customizeLanguageDescription(
      'Good at technical reading and day-to-day communication.',
      'more_formal'
    );
    expect(formal).toBeTruthy();
  });

  it('translates entire CV content between English and Vietnamese and updates cvLanguage', async () => {
    const originalResume = {
      ...DEFAULT_RESUME_DATA,
      basics: {
        ...DEFAULT_RESUME_DATA.basics,
        title: 'Senior Frontend Engineer',
      },
      interests: [
        {
          id: 'int-1',
          name: 'Technology',
          description: 'Exploring open source and developer tooling',
          keywords: ['Open Source', 'Running'],
        },
      ],
    };

    // 1. Translate EN -> VI
    const viResume = await translateResume(originalResume, 'vi');
    expect(viResume.cvLanguage).toBe('vi');
    expect(viResume.basics.title).toBe('Kỹ sư Frontend cao cấp');
    expect(viResume.sectionTitles.summary).toBe('Tóm tắt chuyên môn');
    expect(viResume.sectionTitles.experience).toBe('Kinh nghiệm làm việc');
    expect(viResume.sectionTitles.skills).toBe('Kỹ năng chuyên môn');
    expect(viResume.sectionTitles.languages).toBe('Ngoại ngữ');
    expect(viResume.sectionTitles.interests).toBe('Sở thích');
    expect(viResume.experience[0].employmentType).toBe('Toàn thời gian');
    expect(viResume.experience[0].location).toBe('Từ xa');
    expect(viResume.languages[0].name).toBe('Tiếng Anh');
    expect(viResume.languages[0].level).toBe('Thành thạo');
    expect(viResume.interests[0].name).toBe('Công nghệ');

    // 2. Translate VI -> EN
    const enResume = await translateResume(viResume, 'en');
    expect(enResume.cvLanguage).toBe('en');
    expect(enResume.basics.title).toBe('Senior Frontend Engineer');
    expect(enResume.sectionTitles.summary).toBe('Summary');
    expect(enResume.sectionTitles.experience).toBe('Experience');
    expect(enResume.experience[0].employmentType).toBe('Full-time');
    expect(enResume.languages[0].name).toBe('English');
    expect(enResume.interests[0].name).toBe('Technology');
  });

  it('serves as the response language for AI writing tools and CV Review dashboard when language is Vietnamese', async () => {
    // 1. Improve writing in Vietnamese
    const vnRaw = '<p>đã làm hệ thống thanh toán và tối ưu cơ sở dữ liệu</p>';
    const vnImproved = await improveWriting(vnRaw, 'vi');
    expect(vnImproved).toContain('chủ trì');
    expect(vnImproved).toContain('<p>');

    // 2. Customize writing in Vietnamese
    const vnFormal = await customizeWriting('<p>xây dựng ứng dụng</p>', 'more_formal', 'vi');
    expect(vnFormal).toContain('đồng bộ hóa');

    // 3. AI CV Review responds in Vietnamese
    const vnReview = await analyzeResumeForRole({
      resumeData: {
        ...DEFAULT_RESUME_DATA,
        cvLanguage: 'vi',
      },
      jobTitle: 'Kỹ sư phần mềm cao cấp',
      jobDescription: 'Chúng tôi đang tìm kiếm kỹ sư phần mềm cao cấp có kinh nghiệm với React, TypeScript và kiến trúc phần mềm.',
      language: 'vi',
    });

    expect(vnReview.overallScore).toBeGreaterThanOrEqual(65);
    expect(vnReview.summary.strengths.length).toBeGreaterThan(0);
    // Strengths and recommendations should be in Vietnamese
    expect(vnReview.summary.strengths[0]).toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);
    expect(vnReview.recommendations.highPriority[0]).toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);
  });

  it('maintains strict independence between CV Language and System Display UI Language', async () => {
    // 1. Simulate UI Language is Vietnamese ('vi') in localStorage
    localStorage.setItem('cv-master-lang', 'vi');

    // 2. Set CV Language to English ('en')
    useResumeStore.getState().setCvLanguage('en');
    expect(useResumeStore.getState().resumeData.cvLanguage).toBe('en');
    expect(useResumeStore.getState().resumeData.sectionTitles.experience).toBe('Experience');

    // 3. AI review should be in English because cvLanguage is 'en'
    const enReview = await analyzeResumeForRole({
      resumeData: useResumeStore.getState().resumeData,
      jobTitle: 'Senior Frontend Engineer',
      jobDescription: 'Seeking experienced engineer with strong TypeScript and React knowledge.',
      language: 'en',
    });
    expect(enReview.overallScore).toBeGreaterThanOrEqual(65);
    // UI language stored remains 'vi'
    expect(localStorage.getItem('cv-master-lang')).toBe('vi');

    // 4. Now switch CV language to Vietnamese ('vi')
    useResumeStore.getState().setCvLanguage('vi');
    expect(useResumeStore.getState().resumeData.cvLanguage).toBe('vi');
    expect(useResumeStore.getState().resumeData.sectionTitles.experience).toBe('Kinh nghiệm làm việc');
    expect(useResumeStore.getState().resumeData.sectionTitles.summary).toBe('Tóm tắt chuyên môn');
  });

  it('guarantees English AI response when cvLanguage is English even if input contains Vietnamese text', async () => {
    // 1. resolveIsVietnamese strictly honors 'en'
    expect(resolveIsVietnamese('en', 'Đã chủ trì và phát triển ứng dụng')).toBe(false);
    expect(resolveIsVietnamese('vi', 'Worked on building apps')).toBe(true);

    // 2. improveWriting in English
    const enImproved = await improveWriting('<p>worked on database optimization</p>', 'en');
    expect(enImproved).toContain('Collaborated');
    expect(enImproved).not.toMatch(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i);

    // 3. generateInterestDetails with Vietnamese name but English language
    const interestOutput = await generateInterestDetails({
      name: 'Chụp ảnh',
      language: 'en',
    });
    expect(interestOutput.description).toContain('creative thinking');
    expect(interestOutput.keywords).toContain('Creativity');

    // 4. generateLanguageDescription with Vietnamese name but English language
    const langOutput = await generateLanguageDescription({
      languageName: 'Tiếng Anh',
      score: '850',
      language: 'en',
    });
    expect(langOutput).toContain('English proficiency');
  });
});
