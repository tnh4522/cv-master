import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  useResumeStore,
  usePdfSettingsStore,
  useReviewStore,
  DEFAULT_SECTION_ORDER,
} from '@/store/useResumeStore';
import {
  basicsFormSchema,
  experienceItemSchema,
  projectItemSchema,
  educationItemSchema,
  skillItemSchema,
  languageItemSchema,
  certificationItemSchema,
  awardItemSchema,
  volunteeringItemSchema,
  interestItemSchema,
  aiReviewInputSchema,
  cvMasterJsonSchema,
} from '@/schemas/resumeSchemas';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import { App } from '@/App';

describe('Phase 2 Core Implementation — Stores, Schemas, Editor & Preview', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
    usePdfSettingsStore.getState().resetPdfSettings();
    useReviewStore.getState().clearAnalysis();
  });

  it('persists resumeData, sectionOrder, and hiddenItemIds to exact verified localStorage keys', () => {
    const store = useResumeStore.getState();

    store.updateBasics({ name: 'Ada Lovelace', title: 'Analytical Engine Architect' });
    expect(useResumeStore.getState().resumeData.basics.name).toBe('Ada Lovelace');

    const rawResumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
    expect(rawResumeData.basics.name).toBe('Ada Lovelace');

    // Reorder sections
    const reversedOrder = [...DEFAULT_SECTION_ORDER].reverse();
    store.updateSectionOrder(reversedOrder);
    const rawOrder = JSON.parse(localStorage.getItem('sectionOrder') || '{}');
    expect(rawOrder.sectionOrder).toEqual(reversedOrder);

    // Toggle hide item
    const firstExpId = store.resumeData.experience[0].id;
    store.toggleHideItem(firstExpId);
    const rawHidden = JSON.parse(localStorage.getItem('hiddenItemIds') || '{}');
    expect(rawHidden.hiddenItemIds).toContain(firstExpId);
  });

  it('supports adding, updating, duplicating, and deleting section items across all 8 sections', () => {
    const store = useResumeStore.getState();
    const initialCount = store.resumeData.skills.length;

    store.addSectionItem('skills', {
      id: 'skill-test-1',
      name: 'Cloud Infrastructure',
      keywords: ['AWS', 'Terraform', 'Kubernetes'],
    });
    expect(useResumeStore.getState().resumeData.skills.length).toBe(
      initialCount + 1
    );

    store.updateSectionItem('skills', {
      id: 'skill-test-1',
      name: 'Cloud & DevOps',
      keywords: ['AWS', 'Terraform', 'Docker'],
    });
    const updated = useResumeStore
      .getState()
      .resumeData.skills.find((i) => i.id === 'skill-test-1');
    expect(updated?.name).toBe('Cloud & DevOps');

    store.duplicateSectionItem('skills', 'skill-test-1');
    expect(useResumeStore.getState().resumeData.skills.length).toBe(
      initialCount + 2
    );

    store.deleteSectionItem('skills', 'skill-test-1');
    expect(useResumeStore.getState().resumeData.skills.length).toBe(
      initialCount + 1
    );
  });

  it('persists pdfSettings to localStorage key "pdfSetting"', () => {
    const pdfStore = usePdfSettingsStore.getState();
    pdfStore.updatePdfSettings({
      fontSize: 16,
      fontFamily: 'Inter',
      skillsLayout: 'grid-col',
    });

    const saved = JSON.parse(localStorage.getItem('pdfSetting') || '{}');
    expect(saved.fontSize).toBe(16);
    expect(saved.fontFamily).toBe('Inter');
    expect(saved.skillsLayout).toBe('grid-col');
  });

  it('validates all 8 section schemas, basicsFormSchema, aiReviewInputSchema, and cvMasterJsonSchema', () => {
    expect(
      basicsFormSchema.safeParse({
        name: 'Jane Doe',
        title: 'Principal Engineer',
        email: 'jane@example.com',
        linkedin: 'https://linkedin.com/in/janedoe',
        website: 'https://janedoe.dev',
        phone: { value: '+1 555-0100', breakAfter: false },
        location: { value: 'New York, NY', breakAfter: false },
        customFields: [],
      }).success
    ).toBe(true);

    expect(
      basicsFormSchema.safeParse({
        name: '',
        title: '',
        email: 'not-an-email',
      }).success
    ).toBe(false);

    expect(
      experienceItemSchema.safeParse({
        name: 'Google',
        position: 'Staff Software Engineer',
        dateRange: '2021 - Present',
        location: 'Mountain View, CA',
        employmentType: 'Full-time',
        website: 'https://google.com',
        summary: '<p>Built distributed systems.</p>',
      }).success
    ).toBe(true);

    expect(
      projectItemSchema.safeParse({
        name: 'CVMaster Clone',
        description: 'Frontend CV Builder',
        date: '2025',
        website: '',
        summary: '<p>Created A4 preview.</p>',
        keywords: ['React', 'TypeScript'],
      }).success
    ).toBe(true);

    expect(
      educationItemSchema.safeParse({
        name: 'MIT',
        degree: 'B.S.',
        studyField: 'Computer Science',
        date: '2016 - 2020',
        website: '',
        summary: '',
      }).success
    ).toBe(true);

    expect(
      skillItemSchema.safeParse({
        name: 'Languages',
        keywords: ['TypeScript', 'Rust'],
      }).success
    ).toBe(true);

    expect(
      languageItemSchema.safeParse({
        name: 'English',
        level: 'Native or Bilingual',
        certificate: 'IELTS Academic',
        score: '8.5',
        date: '2024',
        website: 'https://ielts.org/verify',
        listening: '9.0',
        speaking: '8.0',
        reading: '9.0',
        writing: '8.0',
        description: 'Full professional proficiency',
      }).success
    ).toBe(true);

    expect(
      certificationItemSchema.safeParse({
        name: 'CKA',
        issuer: 'CNCF',
        date: '2024',
        website: '',
        summary: '',
      }).success
    ).toBe(true);

    expect(
      awardItemSchema.safeParse({
        name: 'Best Paper Award',
        issuer: 'ACM',
        date: '2023',
        website: '',
        summary: '',
      }).success
    ).toBe(true);

    expect(
      volunteeringItemSchema.safeParse({
        name: 'Girls Who Code',
        position: 'Instructor',
        date: '2022',
        location: 'Remote',
        summary: '',
      }).success
    ).toBe(true);

    expect(
      interestItemSchema.safeParse({
        name: 'Photography',
        description: 'Street & landscape photography',
        keywords: ['35mm Film', 'Lightroom'],
      }).success
    ).toBe(true);

    expect(
      aiReviewInputSchema.safeParse({
        jobTitle: 'Frontend Architect',
        jobDescription:
          'We are looking for a Senior Frontend Architect with 5+ years of experience building scalable React and TypeScript applications and leading design systems.',
      }).success
    ).toBe(true);

    const defaultResume = useResumeStore.getState().resumeData;
    const defaultPdfSettings = usePdfSettingsStore.getState().pdfSettings;
    expect(
      cvMasterJsonSchema.safeParse({
        ...defaultResume,
        pdfSettings: defaultPdfSettings,
        hiddenItemIds: [],
      }).success
    ).toBe(true);
  });

  it('renders ResumeSheet with live basics, sections, and respects hiddenItemIds', () => {
    const store = useResumeStore.getState();
    const firstExp = store.resumeData.experience[0];

    const { rerender } = render(<ResumeSheet mode="preview" />);
    expect(screen.getByText(store.resumeData.basics.name)).toBeInTheDocument();
    expect(screen.getByText(firstExp.name)).toBeInTheDocument();

    // Hide the first experience item and verify it disappears from the rendered sheet
    act(() => {
      store.toggleHideItem(firstExp.id);
    });
    rerender(<ResumeSheet mode="preview" />);
    expect(screen.queryByText(firstExp.name)).not.toBeInTheDocument();
  });

  it('renders the main WorkspacePage application and updates live preview when Personal Info changes', () => {
    render(<App />);
    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'Grace Hopper' } });
    expect(useResumeStore.getState().resumeData.basics.name).toBe('Grace Hopper');

    // Test Date of Birth
    const dobInput = screen.getByLabelText(/Date of Birth/i) as HTMLInputElement;
    expect(dobInput).toBeInTheDocument();
    fireEvent.change(dobInput, { target: { value: '15/01/1995' } });
    expect(useResumeStore.getState().resumeData.basics.dateOfBirth?.value).toBe('15/01/1995');
    expect(screen.getByText('15/01/1995')).toBeInTheDocument();
  });

  it('dynamically applies lineHeight to the entire ResumeSheet and personal info contact header', () => {
    const { container, rerender } = render(<ResumeSheet mode="preview" />);
    const sheetEl = container.querySelector('[data-testid="resume-sheet"]') as HTMLElement;
    const headerEl = container.querySelector('[data-testid="personal-info-header"]') as HTMLElement;
    const contactsEl = container.querySelector('[data-testid="personal-info-contacts"]') as HTMLElement;

    expect(sheetEl.style.lineHeight).toBe('1.25rem'); // default lineHeight = 5 (5 * 0.25rem = 1.25rem)
    expect(headerEl.style.lineHeight).toBe('1.25rem');
    expect(contactsEl.style.lineHeight).toBe('1.25rem');

    // Update lineHeight to 8 (2.00rem)
    act(() => {
      usePdfSettingsStore.getState().updatePdfSettings({ lineHeight: 8 });
    });
    rerender(<ResumeSheet mode="preview" />);
    expect(sheetEl.style.lineHeight).toBe('2rem');
    expect(headerEl.style.lineHeight).toBe('2rem');
    expect(contactsEl.style.lineHeight).toBe('2rem');

    // Reset back to default
    act(() => {
      usePdfSettingsStore.getState().updatePdfSettings({ lineHeight: 5 });
    });
    rerender(<ResumeSheet mode="preview" />);
    expect(sheetEl.style.lineHeight).toBe('1.25rem');
    expect(headerEl.style.lineHeight).toBe('1.25rem');
    expect(contactsEl.style.lineHeight).toBe('1.25rem');
  });

  it('supports hiding an entire section and omits it from ResumeSheet preview', () => {
    const store = useResumeStore.getState();
    const { rerender } = render(<ResumeSheet mode="preview" />);

    // Initially, summary and experience are visible
    expect(screen.getByText(store.resumeData.sectionTitles.experience)).toBeInTheDocument();

    // Toggle hide 'experience' section
    act(() => {
      store.toggleHideSection('experience');
    });

    expect(useResumeStore.getState().hiddenSections).toContain('experience');
    const rawHidden = JSON.parse(localStorage.getItem('hiddenSections') || '{}');
    expect(rawHidden.hiddenSections).toContain('experience');

    rerender(<ResumeSheet mode="preview" />);
    // The section heading and items should not be rendered
    expect(screen.queryByText(store.resumeData.sectionTitles.experience)).not.toBeInTheDocument();

    // Unhide 'experience' section
    act(() => {
      store.toggleHideSection('experience');
    });
    expect(useResumeStore.getState().hiddenSections).not.toContain('experience');
    rerender(<ResumeSheet mode="preview" />);
    expect(screen.getByText(store.resumeData.sectionTitles.experience)).toBeInTheDocument();
  });

  it('prevents duplicate date of birth display by removing legacy DOB customFields and migrating when needed', () => {
    const store = useResumeStore.getState();

    // Case 1: Both dateOfBirth and legacy "Ngày sinh" custom field exist
    act(() => {
      store.setResumeData({
        ...store.resumeData,
        basics: {
          ...store.resumeData.basics,
          name: 'Trần Ngọc Huy',
          dateOfBirth: { value: '04/05/2002', breakAfter: false },
          customFields: [
            {
              id: 'cf-dob',
              name: 'Ngày sinh',
              iconName: 'link',
              value: '04/05/2002',
              breakAfter: false,
            },
            {
              id: 'cf-gh',
              name: 'GitHub',
              iconName: 'github',
              value: 'https://github.com/tranhuy',
              breakAfter: false,
            },
          ],
        },
      });
    });

    // Store should have cleaned up the duplicate DOB custom field while keeping non-DOB custom fields
    const cleanedBasics = useResumeStore.getState().resumeData.basics;
    expect(cleanedBasics.dateOfBirth?.value).toBe('04/05/2002');
    expect(cleanedBasics.customFields).toHaveLength(1);
    expect(cleanedBasics.customFields[0].name).toBe('GitHub');

    const { rerender } = render(<ResumeSheet mode="preview" />);
    // Date of birth should appear only once, and "Ngày sinh: 04/05/2002" line must not exist
    expect(screen.getAllByText('04/05/2002')).toHaveLength(1);
    expect(screen.queryByText(/Ngày sinh:/i)).not.toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();

    // Case 2: dateOfBirth is empty, legacy "Date of Birth" custom field has value -> migrates to dateOfBirth
    act(() => {
      store.setResumeData({
        ...store.resumeData,
        basics: {
          ...store.resumeData.basics,
          dateOfBirth: { value: '', breakAfter: false },
          customFields: [
            {
              id: 'cf-dob-en',
              name: 'Date of Birth',
              iconName: 'calendar',
              value: '15/01/1995',
              breakAfter: false,
            },
          ],
        },
      });
    });

    const migratedBasics = useResumeStore.getState().resumeData.basics;
    expect(migratedBasics.dateOfBirth?.value).toBe('15/01/1995');
    expect(migratedBasics.customFields).toHaveLength(0);

    rerender(<ResumeSheet mode="preview" />);
    expect(screen.getAllByText('15/01/1995')).toHaveLength(1);
    expect(screen.queryByText(/Date of Birth:/i)).not.toBeInTheDocument();

    // Case 3: Even if store state was mutated directly with a legacy DOB custom field, ResumeSheet filters it out
    act(() => {
      useResumeStore.setState((s) => ({
        resumeData: {
          ...s.resumeData,
          basics: {
            ...s.resumeData.basics,
            dateOfBirth: { value: '04/05/2002', breakAfter: false },
            customFields: [
              {
                id: 'cf-dob-direct',
                name: 'Ngày sinh',
                iconName: 'link',
                value: '04/05/2002',
                breakAfter: false,
              },
            ],
          },
        },
      }));
    });

    rerender(<ResumeSheet mode="preview" />);
    expect(screen.getAllByText('04/05/2002')).toHaveLength(1);
    expect(screen.queryByText(/Ngày sinh:/i)).not.toBeInTheDocument();
  });
});
