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
import { SummaryEditor } from '@/components/editor/SummaryEditor';
import { ImportDialog } from '@/components/modals/ImportDialog';
import { MergeCvDialog } from '@/components/modals/MergeCvDialog';
import {
  mergeResumeData,
  mergeMultipleResumes,
  parseCvJsonForMerge,
} from '@/services/mergeService';
import { cvMasterJsonSchema } from '@/schemas/resumeSchemas';
import { fireEvent, waitFor } from '@testing-library/react';

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
    expect(html).not.toContain('shadow-xl');
    expect(html).toContain('wght@400;500;600;700');
    expect(html).toContain('[data-resume-entry="true"]');
    expect(html).toContain('break-inside: avoid');

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

  it('imports a real-world CVMaster JSON backup via ImportDialog without losing Summary or sectionTitles', async () => {
    const userCvJson = {
      basics: {
        name: 'Trần Ngọc Huy',
        title: 'Information Technology Engineer',
        email: 'tnh2045@gmail.com',
        linkedin: 'https://www.linkedin.com/in/tran-huy-183ba1194/',
        website: 'https://huytran-4522.vercel.app/',
        phone: { value: '0777 408 164', breakAfter: true },
        location: { value: 'Hoa Khanh, Da Nang', breakAfter: true },
        customFields: [],
        alignment: 'start',
        photo: {
          url: 'https://res.cloudinary.com/daswys0i8/image/upload/v1792735129/profile-photos/ywakiddjw0ivqnffddyi.jpg',
          size: 100,
          borderRadius: 4,
          visible: true,
        },
      },
      summary: {
        sectionTitle: 'Professional Summary',
        content:
          '<p>Information Technology Engineer with a Very Good degree classification (GPA: 8.39/10) and over two years of experience developing and troubleshooting enterprise software at a French technology company.</p>',
      },
      experience: [
        {
          name: 'Lundi Matin Groupe (France)',
          position: 'Full-Stack Developer',
          dateRange: '03/2024 – 10/2026',
          location: 'Da Nang, Vietnam',
          employmentType: 'Full-time',
          website: '',
          summary:
            '<ul><li>Developed, maintained, and troubleshot ERP, CRM, and e-commerce systems used by customers in France.</li></ul>',
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          name: 'Tekup JSC',
          position: 'Front-End Developer Intern',
          dateRange: '05/2023 – 07/2023',
          location: 'Da Nang, Vietnam',
          employmentType: 'Internship',
          website: '',
          summary: '<ul><li>Built responsive websites for clients.</li></ul>',
        },
      ],
      projects: [
        {
          id: 'p-networkquest-0004',
          name: 'Network Quest – Networking Practice Platform',
          description: 'Personal Project – Networking',
          date: '2024',
          website: 'https://network-quest-omega.vercel.app/',
          summary: '<ul><li>Developed a web application for networking.</li></ul>',
          keywords: ['Recharts', 'Next.js 16', 'React 19', 'TypeScript'],
        },
      ],
      education: [
        {
          name: 'The University of Danang – University of Science and Technology',
          degree: 'Engineer’s Degree',
          studyField: 'Information Technology',
          date: '09/2020 – 09/2025',
          website: '',
          summary: '<p>Very Good degree classification | GPA: 8.39/10</p>',
          id: 'b8c9d0e1-f2a3-4567-8901-890123456789',
        },
      ],
      skills: [
        {
          id: 'it-networking',
          name: 'Networking',
          keywords: ['LAN/WAN', 'TCP/IP', 'IPv4', 'Subnetting', 'VLAN'],
        },
      ],
      languages: [
        {
          id: 'b2b2b2b2-c3c3-4d4d-8e5e-f6f6f6f6f6f6',
          name: 'English',
          level: 'Basic to Intermediate (TOEIC 510)',
        },
        {
          id: 'dca640d6-e4c1-4fc3-b99e-05b3f8fc4feb',
          name: 'French',
          level: 'Intermediate (DELF B1)',
        },
      ],
      certifications: [
        {
          name: 'TOEIC – Test of English for International Communication',
          issuer: 'IIG Vietnam',
          date: '01/2025 - 01/2027',
          website: '',
          summary: '<p>Score: 510/990</p>',
          id: 'b3c07945-d010-4f7f-a65e-3baef82e24b4',
        },
      ],
      awards: [
        {
          name: 'First Prize – DUT Hackathon',
          issuer: 'KMS Technology',
          date: '02/2023',
          website: '',
          summary: '',
          id: 'b0c1d2e3-f4a5-6789-0123-012345678901',
        },
      ],
      volunteering: [
        {
          name: 'The University of Danang Summer Volunteer Campaign 2022',
          position: 'Volunteer',
          date: '07/2022',
          location: 'Da Nang, Vietnam',
          summary: '<p>Actively participated in the campaign.</p>',
          id: 'd8e2f3a4-1b5c-4d6e-8f7a-8b9c0d1e2f3a',
        },
      ],
      sectionTitles: {
        summary: 'Professional Summary',
        experience: 'Professional Experience',
        projects: 'Projects',
        education: 'Education',
        skills: 'Technical Skills',
        languages: 'Languages',
        certifications: 'Certifications',
        awards: 'Awards',
        volunteering: 'Volunteer Experience',
      },
      pdfSettings: {
        fontFamily: 'Be Vietnam Pro',
        fontSize: 14,
        fontCategory: 'sans-serif',
        lineHeight: 6,
        scale: 1.2,
        verticalSpacing: 1,
        skillsLayout: 'inline',
        margin: {
          MIN: 10,
          MAX: 50,
          INITIAL: 20,
          VALUE: 20,
        },
        pageBreakLine: true,
      },
      hiddenItemIds: [
        'p-foodmart-0001',
        'p-ashion-0002',
        'p-tarot-0003',
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        'p-networkquest-0004',
      ],
    };

    const parsed = cvMasterJsonSchema.safeParse(userCvJson);
    expect(parsed.success).toBe(true);

    // Render SummaryEditor + ImportDialog + ResumeSheet together to verify no race condition overwrites summary
    render(
      <div>
        <SummaryEditor />
        <ImportDialog open={true} onOpenChange={() => {}} />
        <ResumeSheet mode="preview" />
      </div>
    );

    const jsonFile = new File([JSON.stringify(userCvJson)], 'tran-ngoc-huy-cv.json', {
      type: 'application/json',
    });

    const inputEl = screen.getByTestId('import-file-input');
    fireEvent.change(inputEl, { target: { files: [jsonFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/JSON file validated successfully/i)
      ).toBeInTheDocument();
    });

    const importBtn = screen.getByRole('button', { name: /^Import$/i });
    expect(importBtn).not.toBeDisabled();
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(useResumeStore.getState().resumeData.basics.name).toBe(
        'Trần Ngọc Huy'
      );
    });

    // Wait 300ms to ensure SummaryEditor never overwrites imported summary back to default
    await new Promise((r) => setTimeout(r, 300));

    const state = useResumeStore.getState();
    expect(state.resumeData.summary.content).toContain('GPA: 8.39/10');
    expect(state.resumeData.sectionTitles.summary).toBe('Professional Summary');
    expect(state.resumeData.sectionTitles.interests).toBe('Interests');
    expect(state.hiddenItemIds).toContain('b2c3d4e5-f6a7-8901-bcde-f23456789012');
    expect(usePdfSettingsStore.getState().pdfSettings.fontFamily).toBe(
      'Be Vietnam Pro'
    );
    expect(screen.getByText('Lundi Matin Groupe (France)')).toBeInTheDocument();
    expect(screen.queryByText('Tekup JSC')).not.toBeInTheDocument();
  });

  it('merges missing sections, items, and fields from uploaded CV (JSON) into the currently edited CV without overwriting existing edits', async () => {
    const store = useResumeStore.getState();

    // 1. Set up the currently edited CV ("edit gốc đang edit") with some fields filled and some missing
    store.setResumeData({
      ...store.resumeData,
      basics: {
        ...store.resumeData.basics,
        name: 'Trần Ngọc Huy',
        title: 'IT Engineer',
        email: 'tnh2045@gmail.com',
        linkedin: '', // missing in current CV
        website: '', // missing in current CV
        phone: { value: '0777 408 164', breakAfter: false },
        location: { value: '', breakAfter: false }, // missing in current CV
        dateOfBirth: { value: '', breakAfter: false }, // missing in current CV
        customFields: [
          {
            id: 'cf-1',
            name: 'GitHub',
            iconName: 'github',
            value: '', // missing value in current CV
          },
        ],
        photo: {
          url: '', // missing photo in current CV
          size: 100,
          borderRadius: 4,
          visible: true,
        },
      },
      summary: {
        sectionTitle: 'Summary',
        content: '<p>Current custom summary that must not be overwritten.</p>',
      },
      experience: [
        {
          id: 'exp-1',
          name: 'Lundi Matin Groupe',
          position: 'Full-Stack Developer',
          dateRange: '03/2024 – 10/2026',
          location: '', // missing in current item
          employmentType: 'Full-time',
          website: '', // missing in current item
          summary: '', // missing in current item
        },
      ],
      projects: [],
      education: [],
      skills: [
        {
          id: 'skill-1',
          name: 'Frontend',
          keywords: ['React', 'TypeScript'],
        },
      ],
      softSkills: [],
      languages: [
        {
          id: 'lang-1',
          name: 'English',
          level: '', // missing in current item
          certificate: '', // missing in current item
          score: '', // missing in current item
        },
      ],
      certifications: [],
      awards: [],
      volunteering: [],
      interests: [],
    });

    // 2. Incoming CV JSON #1: has missing fields for existing items + new items
    const incomingJson1 = parseCvJsonForMerge({
      basics: {
        name: 'Different Name Should Not Overwrite',
        title: 'Different Title Should Not Overwrite',
        email: 'other@example.com',
        linkedin: 'https://linkedin.com/in/tran-huy',
        website: 'https://huytran.dev',
        location: { value: 'Da Nang, Vietnam', breakAfter: true },
        dateOfBirth: { value: '20/04/2002', breakAfter: false },
        photo: {
          url: 'https://example.com/huy.jpg',
          size: 110,
          borderRadius: 8,
          visible: true,
        },
        customFields: [
          {
            id: 'cf-gh',
            name: 'GitHub',
            iconName: 'github',
            value: 'https://github.com/tranhuy',
          },
          {
            id: 'cf-gl',
            name: 'GitLab',
            iconName: 'link',
            value: 'https://gitlab.com/tranhuy',
          },
        ],
      },
      summary: {
        sectionTitle: 'Summary',
        content: '<p>Incoming summary should not overwrite non-empty summary.</p>',
      },
      experience: [
        {
          id: 'exp-inc-1',
          name: 'Lundi Matin Groupe',
          position: 'Full-Stack Developer',
          dateRange: '03/2024 – 10/2026',
          location: 'Da Nang, Vietnam',
          employmentType: 'Contract', // should NOT overwrite 'Full-time'
          website: 'https://lundimatin.fr',
          summary: '<ul><li>Built ERP & CRM modules.</li></ul>',
        },
        {
          id: 'exp-inc-2',
          name: 'Tekup JSC',
          position: 'Frontend Intern',
          dateRange: '05/2023 – 07/2023',
          location: 'Da Nang',
          employmentType: 'Internship',
          website: 'https://tekup.vn',
          summary: '<p>Developed client web apps.</p>',
        },
      ],
      skills: [
        {
          id: 'sk-inc-1',
          name: 'Frontend',
          keywords: ['React', 'Next.js 16', 'Tailwind CSS'],
        },
        {
          id: 'sk-inc-2',
          name: 'Networking',
          keywords: ['TCP/IP', 'VLAN'],
        },
      ],
      languages: [
        {
          id: 'lang-inc-1',
          name: 'English',
          level: 'Intermediate',
          certificate: 'TOEIC',
          score: '510',
          description: 'Good technical reading and communication',
        },
      ],
    });

    // 3. Incoming CV JSON #2: has certifications, awards, softSkills, interests
    const incomingJson2 = parseCvJsonForMerge({
      softSkills: [
        {
          id: 'soft-1',
          name: 'Collaboration',
          keywords: ['Teamwork', 'Problem Solving'],
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'TOEIC 510',
          issuer: 'IIG Vietnam',
          date: '2025',
          website: '',
          summary: '<p>Listening & Reading</p>',
        },
      ],
      awards: [
        {
          id: 'aw-1',
          name: 'First Prize – DUT Hackathon',
          issuer: 'KMS Technology',
          date: '02/2023',
          website: '',
          summary: '',
        },
      ],
      interests: [
        {
          id: 'int-1',
          name: 'Running',
          description: 'Weekend 10km runs',
          keywords: ['Endurance', 'Discipline'],
        },
      ],
    });

    // Render MergeCvDialog and upload both JSON files
    render(<MergeCvDialog open={true} onOpenChange={() => {}} />);

    const file1 = new File([JSON.stringify(incomingJson1)], 'cv-part-1.json', {
      type: 'application/json',
    });
    const file2 = new File([JSON.stringify(incomingJson2)], 'cv-part-2.json', {
      type: 'application/json',
    });

    const mergeInput = screen.getByTestId('merge-file-input');
    fireEvent.change(mergeInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByTestId('merge-preview-panel')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId('confirm-merge-cv-btn');
    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    const merged = useResumeStore.getState().resumeData;

    // Existing basics fields preserved
    expect(merged.basics.name).toBe('Trần Ngọc Huy');
    expect(merged.basics.title).toBe('IT Engineer');
    expect(merged.basics.email).toBe('tnh2045@gmail.com');
    expect(merged.basics.phone.value).toBe('0777 408 164');

    // Missing basics fields filled from incoming JSON
    expect(merged.basics.linkedin).toBe('https://linkedin.com/in/tran-huy');
    expect(merged.basics.website).toBe('https://huytran.dev');
    expect(merged.basics.location.value).toBe('Da Nang, Vietnam');
    expect(merged.basics.dateOfBirth?.value).toBe('20/04/2002');
    expect(merged.basics.photo.url).toBe('https://example.com/huy.jpg');

    // Custom fields: existing GitHub had its missing value filled, and new GitLab was added
    expect(merged.basics.customFields).toHaveLength(2);
    expect(merged.basics.customFields[0].value).toBe(
      'https://github.com/tranhuy'
    );
    expect(merged.basics.customFields[1].name).toBe('GitLab');

    // Existing summary preserved
    expect(merged.summary.content).toContain(
      'Current custom summary that must not be overwritten.'
    );

    // Experience: existing Lundi Matin Groupe had missing location, website, summary filled, while keeping employmentType 'Full-time'; new Tekup JSC added
    expect(merged.experience).toHaveLength(2);
    expect(merged.experience[0].name).toBe('Lundi Matin Groupe');
    expect(merged.experience[0].employmentType).toBe('Full-time');
    expect(merged.experience[0].location).toBe('Da Nang, Vietnam');
    expect(merged.experience[0].website).toBe('https://lundimatin.fr');
    expect(merged.experience[0].summary).toContain('Built ERP & CRM modules.');
    expect(merged.experience[1].name).toBe('Tekup JSC');

    // Skills: Frontend keywords deduplicated & merged, Networking category added
    expect(merged.skills).toHaveLength(2);
    expect(merged.skills[0].keywords).toEqual([
      'React',
      'TypeScript',
      'Next.js 16',
      'Tailwind CSS',
    ]);
    expect(merged.skills[1].name).toBe('Networking');

    // Languages: English had missing level, certificate, score, description filled
    expect(merged.languages).toHaveLength(1);
    expect(merged.languages[0].level).toBe('Intermediate');
    expect(merged.languages[0].certificate).toBe('TOEIC');
    expect(merged.languages[0].score).toBe('510');
    expect(merged.languages[0].description).toBe(
      'Good technical reading and communication'
    );

    // Sections from JSON #2 merged in
    expect(merged.softSkills).toHaveLength(1);
    expect(merged.certifications).toHaveLength(1);
    expect(merged.awards).toHaveLength(1);
    expect(merged.interests).toHaveLength(1);
  });
});
