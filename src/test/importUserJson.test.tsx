import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { cvMasterJsonSchema } from '@/schemas/resumeSchemas';
import { useResumeStore, usePdfSettingsStore } from '@/store/useResumeStore';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import { validateBasicsForPdfExport, buildStandaloneResumeHtml, formatExportFilename } from '@/services/pdfService';
import type { ResumeData, PdfSettings } from '@/types/resume';

const USER_CV_JSON = {
  "basics": {
    "name": "Trần Ngọc Huy",
    "title": "Information Technology Engineer",
    "email": "tnh2045@gmail.com",
    "linkedin": "https://www.linkedin.com/in/tran-huy-183ba1194/",
    "website": "https://huytran-4522.vercel.app/",
    "phone": {
      "value": "0777 408 164",
      "breakAfter": true
    },
    "location": {
      "value": "Hoa Khanh, Da Nang",
      "breakAfter": true
    },
    "customFields": [],
    "alignment": "start",
    "photo": {
      "url": "https://res.cloudinary.com/daswys0i8/image/upload/v1792735129/profile-photos/ywakiddjw0ivqnffddyi.jpg",
      "size": 100,
      "borderRadius": 4,
      "visible": true
    }
  },
  "summary": {
    "sectionTitle": "Professional Summary",
    "content": "<p>Information Technology Engineer with a Very Good degree classification (GPA: 8.39/10) and over two years of experience developing and troubleshooting enterprise software at a French technology company. Foundational knowledge of LAN/WAN, TCP/IP, VLAN, DNS, DHCP, Windows/Linux, database administration, and information security. Academic hands-on practice with network configuration using Cisco Packet Tracer and Windows/Linux virtual machines. Seeking to develop a career in IT Support and IT Operations, applying analytical troubleshooting skills and cross-functional collaboration experience to support reliable IT operations in a hotel environment.</p>"
  },
  "experience": [
    {
      "name": "Lundi Matin Groupe (France)",
      "position": "Full-Stack Developer",
      "dateRange": "03/2024 – 10/2026",
      "location": "Da Nang, Vietnam",
      "employmentType": "Full-time",
      "website": "",
      "summary": "<ul><li>Developed, maintained, and troubleshot ERP, CRM, and e-commerce systems used by customers in France.</li><li>Investigated, reproduced, and resolved production issues; verified fixes to minimize disruption to system operations.</li><li>Diagnosed issues involving APIs, webhooks, scheduled jobs, connectors, and integrations with external services.</li><li>Collaborated with developers, QA, and project teams to investigate defects, review code, and perform testing before releases.</li><li>Worked with MySQL, MariaDB, PHP, JavaScript, Yii2, Symfony, WordPress, and Drupal; used GitHub/GitLab and CI/CD workflows in a Scrum environment.</li><li>Communicated and reported on work with international colleagues in English and French.</li></ul>",
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "name": "Tekup JSC",
      "position": "Front-End Developer Intern",
      "dateRange": "05/2023 – 07/2023",
      "location": "Da Nang, Vietnam",
      "employmentType": "Internship",
      "website": "",
      "summary": "<ul><li>Built responsive websites for clients using HTML, CSS, and JavaScript.</li><li>Received training in ReactJS, jQuery, Tailwind CSS, and Bootstrap.</li><li>Worked in a small team to plan tasks, coordinate responsibilities, and deliver work on schedule.</li></ul>"
    }
  ],
  "projects": [
    {
      "id": "p-networkquest-0004",
      "name": "Network Quest – Networking Practice Platform",
      "description": "Personal Project – Networking",
      "date": "2024",
      "website": "https://network-quest-omega.vercel.app/",
      "summary": "<ul><li>Developed a web application for practicing computer networking concepts, including CCNA and firewall/packet-filtering fundamentals.</li><li>Built an interactive firewall-rule simulation to demonstrate basic traffic filtering logic.</li><li>Organized networking concepts into scenario-based quizzes with answer explanations.</li></ul>",
      "keywords": [
        "Recharts",
        "Next.js 16",
        "React 19",
        "TypeScript"
      ]
    }
  ],
  "education": [
    {
      "name": "The University of Danang – University of Science and Technology",
      "degree": "Engineer’s Degree",
      "studyField": "Information Technology",
      "date": "09/2020 – 09/2025",
      "website": "",
      "summary": "<p>Very Good degree classification | GPA: 8.39/10 </p><p>Vietnamese–French High-Quality Engineer Training Program (PFIEV). </p><p><strong>Relevant coursework:</strong></p><ul><li><p>Computer Networks, Data Communications, Advanced Mobile Networks.</p></li><li><p>Network Design and Quality of Service.</p></li><li><p>Operating Systems, Computer Architecture, System Programming, and Linux Programming.</p></li><li><p>Network Security, Information Security, and Cryptography.</p></li><li><p>Database Systems, Advanced Databases, and Enterprise Information Systems (ERP).</p></li></ul>",
      "id": "b8c9d0e1-f2a3-4567-8901-890123456789"
    }
  ],
  "skills": [
    {
      "id": "it-networking",
      "name": "Networking",
      "keywords": [
        "LAN/WAN",
        "TCP/IP",
        "IPv4",
        "Subnetting",
        "VLAN",
        "Trunking",
        "DNS",
        "DHCP",
        "Wi-Fi"
      ]
    },
    {
      "id": "it-support",
      "name": "Operating Systems & Technical Support",
      "keywords": [
        "Windows",
        "Linux",
        "IP/network configuration",
        "User accounts and permissions",
        "Basic troubleshooting",
        "ping",
        "ipconfig",
        "tracert",
        "nslookup"
      ]
    },
    {
      "id": "it-tools",
      "name": "Technical Tools",
      "keywords": [
        "Cisco Packet Tracer",
        "VMware",
        "Wireshark",
        "Git"
      ]
    },
    {
      "id": "systems",
      "name": "Systems & Databases",
      "keywords": [
        "MySQL",
        "MariaDB",
        "Linux",
        "Docker",
        "REST APIs",
        "Application debugging and monitoring"
      ]
    },
    {
      "id": "software",
      "name": "Software Development & Integration",
      "keywords": [
        "PHP",
        "JavaScript/TypeScript",
        "ReactJS",
        "Vue.js",
        "AngularJS",
        "Yii2",
        "Symfony",
        "Drupal",
        "WordPress",
        "Webhooks",
        "Scheduled jobs"
      ]
    },
    {
      "id": "process",
      "name": "Tools & Methodologies",
      "keywords": [
        "GitHub",
        "GitLab",
        "CI/CD",
        "Jira",
        "Agile/Scrum",
        "Code Review",
        "Quality Assurance (QA)"
      ]
    }
  ],
  "languages": [
    {
      "id": "b2b2b2b2-c3c3-4d4d-8e5e-f6f6f6f6f6f6",
      "name": "English",
      "level": "Basic to Intermediate (TOEIC 510)"
    },
    {
      "id": "dca640d6-e4c1-4fc3-b99e-05b3f8fc4feb",
      "name": "French",
      "level": "Intermediate (DELF B1)"
    }
  ],
  "certifications": [
    {
      "name": "TOEIC – Test of English for International Communication",
      "issuer": "IIG Vietnam",
      "date": "01/2025 - 01/2027",
      "website": "",
      "summary": "<p>Score: 510/990</p>",
      "id": "b3c07945-d010-4f7f-a65e-3baef82e24b4"
    },
    {
      "name": "DELF B1 – French Language Certificate",
      "issuer": "France Éducation international",
      "date": "10/2022",
      "website": "",
      "summary": "<p>B1 level under the Common European Framework of Reference for Languages (CEFR).</p>",
      "id": "63a0a395-4d17-4e0e-8d93-d651b6e142dd"
    }
  ],
  "awards": [
    {
      "name": "First Prize – DUT Hackathon",
      "issuer": "KMS Technology",
      "date": "02/2023",
      "website": "",
      "summary": "",
      "id": "b0c1d2e3-f4a5-6789-0123-012345678901"
    },
    {
      "id": "c5d6e7f8-a9b0-1234-5678-567890123456",
      "name": "Second Prize – Technology Innovation Startup Competition",
      "date": "10/2024",
      "issuer": "The University of Danang",
      "website": "",
      "summary": ""
    },
    {
      "id": "d6e7f8a9-b0c1-2345-6789-678901234567",
      "name": "Third Prize, Technology Award – BKDN Techshow 2023–2024",
      "date": "01/2024",
      "issuer": "The University of Danang – University of Science and Technology",
      "website": "",
      "summary": ""
    },
    {
      "id": "e7f8a9b0-c1d2-3456-7890-789012345678",
      "name": "Second Prize & Special Prize – Smart Campus 2023",
      "date": "12/2023",
      "issuer": "DISC International Institute, The University of Danang",
      "website": "",
      "summary": ""
    }
  ],
  "volunteering": [
    {
      "name": "The University of Danang Summer Volunteer Campaign 2022",
      "position": "Volunteer",
      "date": "07/2022",
      "location": "Da Nang, Vietnam",
      "summary": "<p>Actively participated in the campaign; certificate issued by the Youth Union of The University of Danang (July 2022).</p>",
      "id": "d8e2f3a4-1b5c-4d6e-8f7a-8b9c0d1e2f3a"
    }
  ],
  "sectionTitles": {
    "summary": "Professional Summary",
    "experience": "Professional Experience",
    "projects": "Projects",
    "education": "Education",
    "skills": "Technical Skills",
    "languages": "Languages",
    "certifications": "Certifications",
    "awards": "Awards",
    "volunteering": "Volunteer Experience"
  },
  "pdfSettings": {
    "fontFamily": "Be Vietnam Pro",
    "fontSize": 14,
    "fontCategory": "sans-serif",
    "lineHeight": 6,
    "scale": 1.2,
    "verticalSpacing": 1,
    "skillsLayout": "inline",
    "margin": {
      "MIN": 10,
      "MAX": 50,
      "INITIAL": 20,
      "VALUE": 20
    },
    "pageBreakLine": true
  },
  "hiddenItemIds": [
    "p-foodmart-0001",
    "p-ashion-0002",
    "p-tarot-0003",
    "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "p-networkquest-0004"
  ]
};

describe('User CV JSON Import Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
    usePdfSettingsStore.getState().resetPdfSettings();
  });

  it('validates user JSON against cvMasterJsonSchema without any error', () => {
    const parseResult = cvMasterJsonSchema.safeParse(USER_CV_JSON);
    if (!parseResult.success) {
      console.error('Validation issues:', JSON.stringify(parseResult.error.issues, null, 2));
    }
    expect(parseResult.success).toBe(true);
  });

  it('correctly loads user JSON into useResumeStore and usePdfSettingsStore', () => {
    const parseResult = cvMasterJsonSchema.safeParse(USER_CV_JSON);
    expect(parseResult.success).toBe(true);
    if (!parseResult.success) return;

    const validatedData = parseResult.data;

    act(() => {
      useResumeStore.getState().setResumeData(validatedData as unknown as ResumeData);
      usePdfSettingsStore.getState().updatePdfSettings(validatedData.pdfSettings as PdfSettings);
      useResumeStore.getState().setHiddenItemIds(validatedData.hiddenItemIds || []);
    });

    const storeData = useResumeStore.getState().resumeData;
    expect(storeData.basics.name).toBe("Trần Ngọc Huy");
    expect(storeData.basics.title).toBe("Information Technology Engineer");
    expect(storeData.experience.length).toBe(2);
    expect(storeData.projects.length).toBe(1);
    expect(storeData.education.length).toBe(1);
    expect(storeData.skills.length).toBe(6);
    expect(storeData.languages.length).toBe(2);
    expect(storeData.certifications.length).toBe(2);
    expect(storeData.awards.length).toBe(4);
    expect(storeData.volunteering.length).toBe(1);

    // Verify hiddenItemIds
    const hiddenIds = useResumeStore.getState().hiddenItemIds;
    expect(hiddenIds).toContain("b2c3d4e5-f6a7-8901-bcde-f23456789012");
    expect(hiddenIds).toContain("p-networkquest-0004");

    // Verify pdfSettings
    const pdfSettings = usePdfSettingsStore.getState().pdfSettings;
    expect(pdfSettings.fontFamily).toBe("Be Vietnam Pro");
    expect(pdfSettings.fontSize).toBe(14);
    expect(pdfSettings.lineHeight).toBe(6);
  });

  it('renders ResumeSheet correctly and respects hiddenItemIds', () => {
    const parseResult = cvMasterJsonSchema.safeParse(USER_CV_JSON);
    expect(parseResult.success).toBe(true);
    if (!parseResult.success) return;

    const validatedData = parseResult.data;
    act(() => {
      useResumeStore.getState().setResumeData(validatedData as unknown as ResumeData);
      usePdfSettingsStore.getState().updatePdfSettings(validatedData.pdfSettings as PdfSettings);
      useResumeStore.getState().setHiddenItemIds(validatedData.hiddenItemIds || []);
    });

    const { container } = render(<ResumeSheet mode="preview" />);

    // Personal info
    expect(screen.getByText("Trần Ngọc Huy")).toBeInTheDocument();
    expect(screen.getByText("Information Technology Engineer")).toBeInTheDocument();
    expect(screen.getByText("0777 408 164")).toBeInTheDocument();
    expect(screen.getByText("Hoa Khanh, Da Nang")).toBeInTheDocument();

    // Summary section with custom title
    expect(screen.getByText("Professional Summary")).toBeInTheDocument();

    // Visible Experience
    expect(screen.getByText("Lundi Matin Groupe (France)")).toBeInTheDocument();

    // Hidden Experience ("Tekup JSC" with id "b2c3d4e5-f6a7-8901-bcde-f23456789012") should NOT be rendered
    expect(screen.queryByText("Tekup JSC")).not.toBeInTheDocument();

    // Hidden Project ("Network Quest – Networking Practice Platform" with id "p-networkquest-0004") should NOT be rendered
    expect(screen.queryByText("Network Quest – Networking Practice Platform")).not.toBeInTheDocument();

    // Education
    expect(screen.getByText("The University of Danang – University of Science and Technology")).toBeInTheDocument();

    // Skills
    expect(screen.getByText("Networking:")).toBeInTheDocument();

    // Languages
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("French")).toBeInTheDocument();

    // Certifications
    expect(screen.getByText("TOEIC – Test of English for International Communication")).toBeInTheDocument();

    // Awards
    expect(screen.getByText("First Prize – DUT Hackathon")).toBeInTheDocument();

    // Volunteering
    expect(screen.getByText("The University of Danang Summer Volunteer Campaign 2022")).toBeInTheDocument();

    // Verify standalone HTML generation and export validation
    const sheetEl = container.querySelector('.resume-sheet') as HTMLElement;
    expect(sheetEl).toBeTruthy();
    const basicsCheck = validateBasicsForPdfExport(useResumeStore.getState().resumeData.basics);
    expect(basicsCheck.valid).toBe(true);

    const filename = formatExportFilename(useResumeStore.getState().resumeData.basics, 'pdf');
    expect(filename).toBe("Trần Ngọc Huy-Information Technology Engineer.pdf");

    const html = buildStandaloneResumeHtml(sheetEl, usePdfSettingsStore.getState().pdfSettings);
    expect(html).toContain("Trần Ngọc Huy");
    expect(html).toContain("Be Vietnam Pro");
  });

  it('handles the full two-step Validate -> Import workflow in ImportDialog UI', async () => {
    const { ImportDialog } = await import('@/components/modals/ImportDialog');
    const { fireEvent, waitFor } = await import('@testing-library/react');
    let open = true;
    const handleOpenChange = (nextOpen: boolean) => {
      open = nextOpen;
    };

    render(<ImportDialog open={open} onOpenChange={handleOpenChange} />);

    // 1. Select the format "cv-master-json"
    // Radix SelectTrigger click opens content
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    const jsonOption = screen.getByText(/CV Master JSON/i);
    fireEvent.click(jsonOption);

    // 2. Upload the JSON file
    const file = new File(
      [JSON.stringify(USER_CV_JSON)],
      'tran-ngoc-huy-cv.json',
      { type: 'application/json' }
    );
    const fileInput = screen.getByTestId('import-file-input') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    // 3. Click "Validate"
    const validateButton = screen.getByRole('button', { name: /^Validate$/i });
    expect(validateButton).toBeEnabled();
    fireEvent.click(validateButton);

    // 4. Verify validation success message appears
    await waitFor(() => {
      expect(
        screen.getByText(/JSON file validated successfully/i)
      ).toBeInTheDocument();
    });

    // 5. Click "Import"
    const importButton = screen.getByRole('button', { name: /^Import$/i });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);

    // 6. Verify store has received user's imported data
    await waitFor(() => {
      expect(useResumeStore.getState().resumeData.basics.name).toBe("Trần Ngọc Huy");
      expect(usePdfSettingsStore.getState().pdfSettings.fontFamily).toBe("Be Vietnam Pro");
      expect(useResumeStore.getState().hiddenItemIds).toContain("p-networkquest-0004");
      expect(open).toBe(false);
    });
  });
});
