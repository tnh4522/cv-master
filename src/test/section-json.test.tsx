import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  parseSectionItemsFromJson,
  getSectionJsonSample,
  normalizeExperienceItem,
  normalizeProjectItem,
  normalizeSkillItem,
  getSectionExportData,
  formatSectionExportJson,
  formatSectionExportFilename,
} from '@/services/sectionJsonService';
import { AddSectionItemJsonDialog } from '@/components/modals/AddSectionItemJsonDialog';
import { ExportSectionJsonDialog } from '@/components/modals/ExportSectionJsonDialog';
import { SectionListEditor } from '@/components/editor/SectionListEditor';
import { useResumeStore } from '@/store/useResumeStore';
import { DialogProvider } from '@/context/DialogContext';
import { LanguageProvider } from '@/context/LanguageContext';

describe('Section JSON Item Service & Dialog', () => {
  beforeEach(() => {
    useResumeStore.getState().resetResume();
  });

  describe('parseSectionItemsFromJson unit tests', () => {
    it('parses a single experience object correctly', () => {
      const single = {
        name: 'VNG Corporation',
        position: 'Backend Developer',
        dateRange: '2023 - 2024',
        location: 'Ho Chi Minh City',
        employmentType: 'Full-time',
        summary: '<p>Maintained high-throughput game servers.</p>',
      };

      const result = parseSectionItemsFromJson('experience', JSON.stringify(single));
      expect(result.error).toBeUndefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        name: 'VNG Corporation',
        position: 'Backend Developer',
        location: 'Ho Chi Minh City',
        employmentType: 'Full-time',
      });
      expect(result.items[0].id).toBeTruthy();
    });

    it('parses an array of project items correctly with various tag formats', () => {
      const projects = [
        {
          name: 'AI Agent Portal',
          description: 'LLM orchestration platform',
          date: '2025',
          keywords: ['React', 'TypeScript', 'Gemini'],
        },
        {
          title: 'Mobile Wallet',
          subtitle: 'Fintech mobile application',
          technologies: 'Flutter, Dart, GraphQL',
        },
      ];

      const result = parseSectionItemsFromJson('projects', JSON.stringify(projects));
      expect(result.error).toBeUndefined();
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('AI Agent Portal');
      expect((result.items[0] as any).keywords).toEqual(['React', 'TypeScript', 'Gemini']);
      expect(result.items[1].name).toBe('Mobile Wallet');
      expect((result.items[1] as any).keywords).toEqual(['Flutter', 'Dart', 'GraphQL']);
    });

    it('parses wrapped section objects like { skills: [...] } or { items: [...] }', () => {
      const wrapped = {
        skills: [
          {
            name: 'Cloud Infrastructure',
            keywords: ['AWS', 'Terraform', 'Kubernetes'],
          },
        ],
      };

      const result = parseSectionItemsFromJson('skills', JSON.stringify(wrapped));
      expect(result.error).toBeUndefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Cloud Infrastructure');
      expect((result.items[0] as any).keywords).toEqual(['AWS', 'Terraform', 'Kubernetes']);
    });

    it('returns error on invalid JSON syntax', () => {
      const invalid = '{ name: broken json without quotes }';
      const result = parseSectionItemsFromJson('experience', invalid);
      expect(result.error).toBe('INVALID_SYNTAX');
      expect(result.items).toHaveLength(0);
    });

    it('returns error when JSON object does not match section item schema', () => {
      const emptyObj = { foo: 'bar', baz: 123 };
      const result = parseSectionItemsFromJson('experience', JSON.stringify(emptyObj));
      expect(result.error).toBe('SCHEMA_ERROR');
      expect(result.items).toHaveLength(0);
    });

    it('generates valid JSON sample templates for all sections', () => {
      const sections = [
        'experience',
        'projects',
        'research',
        'education',
        'skills',
        'softSkills',
        'languages',
        'certifications',
        'awards',
        'volunteering',
        'interests',
      ] as const;

      for (const section of sections) {
        const sample = getSectionJsonSample(section);
        expect(sample).toBeTruthy();
        const parsed = parseSectionItemsFromJson(section, sample);
        expect(parsed.error).toBeUndefined();
        expect(parsed.items.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AddSectionItemJsonDialog & SectionListEditor integration', () => {
    it('opens dialog, loads sample, and adds items to store on submit', async () => {
      render(
        <LanguageProvider>
          <DialogProvider>
            <SectionListEditor sectionKey="experience" />
          </DialogProvider>
        </LanguageProvider>
      );

      // Verify the new "Add with JSON" button exists
      const addJsonBtn = screen.getByTestId('add-json-btn-experience');
      expect(addJsonBtn).toBeInTheDocument();
      fireEvent.click(addJsonBtn);

      // Verify dialog is open
      const textarea = await screen.findByTestId('section-json-textarea');
      expect(textarea).toBeInTheDocument();

      // Click "Load Sample" button
      const loadSampleBtn = screen.getByText(/Mẫu gợi ý|Load Sample/i);
      fireEvent.click(loadSampleBtn);

      // Should render preview items
      await waitFor(() => {
        const previews = screen.getAllByTestId('parsed-json-item-preview');
        expect(previews.length).toBeGreaterThan(0);
      });

      // Confirm button should be enabled
      const confirmBtn = screen.getByTestId('confirm-add-section-json-btn');
      expect(confirmBtn).not.toBeDisabled();
      fireEvent.click(confirmBtn);

      // Verify the item was appended to the store
      const experiences = useResumeStore.getState().resumeData.experience;
      expect(experiences.length).toBeGreaterThanOrEqual(2);
      expect(experiences.some((exp) => exp.name === 'Company ABC')).toBe(true);
    });

    it('shows error banner when invalid JSON is entered in textarea', async () => {
      render(
        <LanguageProvider>
          <DialogProvider>
            <AddSectionItemJsonDialog
              sectionKey="skills"
              open={true}
              onOpenChange={() => {}}
            />
          </DialogProvider>
        </LanguageProvider>
      );

      const textarea = screen.getByTestId('section-json-textarea');
      fireEvent.change(textarea, { target: { value: 'invalid json syntax...' } });

      await waitFor(() => {
        expect(screen.getByTestId('section-json-error-banner')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByTestId('confirm-add-section-json-btn');
      expect(confirmBtn).toBeDisabled();
    });

    it('handles file upload tab and parses uploaded JSON file', async () => {
      render(
        <LanguageProvider>
          <DialogProvider>
            <AddSectionItemJsonDialog
              sectionKey="languages"
              open={true}
              onOpenChange={() => {}}
            />
          </DialogProvider>
        </LanguageProvider>
      );

      // Switch to Upload File tab
      const fileTab = screen.getByTestId('tab-upload-json');
      fireEvent.click(fileTab);

      const fileInput = await screen.findByTestId('section-json-file-input');
      const testFile = new File(
        [
          JSON.stringify([
            {
              name: 'Japanese',
              level: 'Intermediate',
              certificate: 'JLPT N3',
              score: '115/180',
            },
          ]),
        ],
        'languages.json',
        { type: 'application/json' }
      );

      fireEvent.change(fileInput, { target: { files: [testFile] } });

      await waitFor(() => {
        expect(screen.getByText('Japanese')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByTestId('confirm-add-section-json-btn');
      fireEvent.click(confirmBtn);

      const languages = useResumeStore.getState().resumeData.languages;
      expect(languages.some((l) => l.name === 'Japanese' && l.certificate === 'JLPT N3')).toBe(true);
    });
  });

  describe('Section Export JSON service & dialog', () => {
    it('exports list sections in array and wrapped formats', () => {
      const resumeData = useResumeStore.getState().resumeData;

      // Array format
      const arrayData = getSectionExportData('experience', resumeData, {
        format: 'array',
      });
      expect(Array.isArray(arrayData)).toBe(true);
      expect((arrayData as any[]).length).toBe(resumeData.experience.length);

      // Wrapped format
      const wrappedData = getSectionExportData('experience', resumeData, {
        format: 'wrapped',
      }) as Record<string, any>;
      expect(wrappedData.experience).toBeDefined();
      expect(Array.isArray(wrappedData.experience)).toBe(true);

      // Pretty printed JSON string
      const jsonStr = formatSectionExportJson('experience', resumeData, {
        format: 'wrapped',
      });
      expect(jsonStr).toContain('"experience":');
      expect(JSON.parse(jsonStr).experience).toHaveLength(resumeData.experience.length);
    });

    it('filters out hidden items when excludeHidden is true', () => {
      const store = useResumeStore.getState();
      const firstExpId = store.resumeData.experience[0].id;

      // Without excludeHidden
      const withHidden = getSectionExportData('experience', store.resumeData, {
        excludeHidden: false,
        hiddenItemIds: [firstExpId],
      }) as any[];
      expect(withHidden.length).toBe(1);

      // With excludeHidden
      const withoutHidden = getSectionExportData('experience', store.resumeData, {
        excludeHidden: true,
        hiddenItemIds: [firstExpId],
      }) as any[];
      expect(withoutHidden.length).toBe(0);
    });

    it('exports basics and summary sections properly', () => {
      const resumeData = useResumeStore.getState().resumeData;

      const directBasics = getSectionExportData('basics', resumeData, {
        format: 'array',
      }) as any;
      expect(directBasics.name).toBe(resumeData.basics.name);

      const wrappedBasics = getSectionExportData('basics', resumeData, {
        format: 'wrapped',
      }) as any;
      expect(wrappedBasics.basics.name).toBe(resumeData.basics.name);

      const directSummary = getSectionExportData('summary', resumeData, {
        format: 'array',
      }) as any;
      expect(directSummary.content).toBe(resumeData.summary.content);

      const wrappedSummary = getSectionExportData('summary', resumeData, {
        format: 'wrapped',
      }) as any;
      expect(wrappedSummary.summary.content).toBe(resumeData.summary.content);
    });

    it('generates clean and safe export filenames', () => {
      const basics = { name: 'Trần Ngọc Huy', title: 'Software Engineer' };
      const expFilename = formatSectionExportFilename(basics, 'experience');
      expect(expFilename).toBe('Trần_Ngọc_Huy-experience.json');

      const emptyBasics = { name: '', title: '' };
      const emptyFilename = formatSectionExportFilename(emptyBasics, 'skills');
      expect(emptyFilename).toBe('Resume-skills.json');
    });

    it('renders ExportSectionJsonDialog with preview and format toggles', async () => {
      render(
        <LanguageProvider>
          <ExportSectionJsonDialog
            sectionKey="experience"
            open={true}
            onOpenChange={() => {}}
          />
        </LanguageProvider>
      );

      const textarea = screen.getByTestId('section-json-preview-textarea') as HTMLTextAreaElement;
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toContain('TechNova Solutions');

      // Toggle to wrapped format
      const wrappedBtn = screen.getByTestId('export-format-wrapped-btn');
      fireEvent.click(wrappedBtn);

      await waitFor(() => {
        expect(textarea.value).toContain('"experience": [');
      });

      // Toggle back to array format
      const arrayBtn = screen.getByTestId('export-format-array-btn');
      fireEvent.click(arrayBtn);

      await waitFor(() => {
        expect(textarea.value.trim().startsWith('[')).toBe(true);
      });

      // Check inline and footer copy buttons
      const copyBtn = screen.getByTestId('copy-section-json-btn');
      expect(copyBtn).toBeInTheDocument();
      fireEvent.click(copyBtn);

      // Check download button
      const downloadBtn = screen.getByTestId('download-section-json-btn');
      expect(downloadBtn).toBeInTheDocument();
    });

    it('opens ExportSectionJsonDialog directly from SectionListEditor header button', async () => {
      render(
        <LanguageProvider>
          <DialogProvider>
            <SectionListEditor sectionKey="skills" />
          </DialogProvider>
        </LanguageProvider>
      );

      const exportBtn = screen.getByTestId('export-section-json-btn-skills');
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('section-json-preview-textarea')).toBeInTheDocument();
      });
      const textarea = screen.getByTestId('section-json-preview-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toContain('Frontend & Languages');
    });
  });
});
