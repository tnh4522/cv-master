import { nanoid } from 'nanoid';
import type {
  AwardItem,
  BasicsData,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  ListSectionKey,
  ProjectItem,
  ResearchItem,
  ResumeData,
  SectionItemUnion,
  SectionKey,
  SkillItem,
  SoftSkillItem,
  VolunteeringItem,
} from '@/types/resume';

function generateId(prefix: string): string {
  try {
    return `${prefix}-${nanoid(8)}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

/**
 * Normalizes an unknown record into a valid ExperienceItem.
 */
export function normalizeExperienceItem(
  raw: Record<string, unknown>
): ExperienceItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.company === 'string'
      ? raw.company
      : typeof raw.organization === 'string'
      ? raw.organization
      : '';

  const position =
    typeof raw.position === 'string'
      ? raw.position
      : typeof raw.role === 'string'
      ? raw.role
      : typeof raw.title === 'string'
      ? raw.title
      : '';

  if (!name.trim() && !position.trim()) {
    return null;
  }

  const dateRange =
    typeof raw.dateRange === 'string'
      ? raw.dateRange
      : typeof raw.date === 'string'
      ? raw.date
      : typeof raw.period === 'string'
      ? raw.period
      : '';

  const location =
    typeof raw.location === 'string'
      ? raw.location
      : typeof raw.city === 'string'
      ? raw.city
      : '';

  const employmentType =
    typeof raw.employmentType === 'string' && raw.employmentType.trim()
      ? raw.employmentType
      : 'Full-time';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : typeof raw.link === 'string'
      ? raw.link
      : '';

  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary;
  } else if (typeof raw.description === 'string') {
    summary = raw.description;
  } else if (Array.isArray(raw.highlights)) {
    summary = `<ul>${raw.highlights
      .filter((h) => typeof h === 'string' && h.trim())
      .map((h) => `<li><p>${h}</p></li>`)
      .join('')}</ul>`;
  } else if (Array.isArray(raw.responsibilities)) {
    summary = `<ul>${raw.responsibilities
      .filter((r) => typeof r === 'string' && r.trim())
      .map((r) => `<li><p>${r}</p></li>`)
      .join('')}</ul>`;
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('exp');

  return {
    id,
    name: name.trim() || 'Untitled Company',
    position: position.trim() || 'Untitled Position',
    dateRange: dateRange.trim(),
    location: location.trim(),
    employmentType,
    website: website.trim(),
    summary: summary.trim(),
  };
}

/**
 * Normalizes an unknown record into a valid ProjectItem.
 */
export function normalizeProjectItem(
  raw: Record<string, unknown>
): ProjectItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
      ? raw.title
      : typeof raw.projectName === 'string'
      ? raw.projectName
      : '';

  if (!name.trim()) return null;

  const description =
    typeof raw.description === 'string'
      ? raw.description
      : typeof raw.subtitle === 'string'
      ? raw.subtitle
      : '';

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.dateRange === 'string'
      ? raw.dateRange
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : typeof raw.link === 'string'
      ? raw.link
      : typeof raw.demo === 'string'
      ? raw.demo
      : typeof raw.github === 'string'
      ? raw.github
      : '';

  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary;
  } else if (Array.isArray(raw.highlights)) {
    summary = `<ul>${raw.highlights
      .filter((h) => typeof h === 'string' && h.trim())
      .map((h) => `<li><p>${h}</p></li>`)
      .join('')}</ul>`;
  }

  let keywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    keywords = raw.keywords
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.technologies)) {
    keywords = raw.technologies
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.tags)) {
    keywords = raw.tags
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (typeof raw.keyword === 'string' && raw.keyword.trim()) {
    keywords = raw.keyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  } else if (typeof raw.technologies === 'string' && raw.technologies.trim()) {
    keywords = raw.technologies
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('proj');

  return {
    id,
    name: name.trim(),
    description: description.trim(),
    date: date.trim(),
    website: website.trim(),
    summary: summary.trim(),
    keywords: Array.from(new Set(keywords)),
  };
}

/**
 * Normalizes an unknown record into a valid ResearchItem.
 */
export function normalizeResearchItem(
  raw: Record<string, unknown>
): ResearchItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
      ? raw.title
      : typeof raw.researchTitle === 'string'
      ? raw.researchTitle
      : '';

  if (!name.trim()) return null;

  const role =
    typeof raw.role === 'string'
      ? raw.role
      : typeof raw.position === 'string'
      ? raw.position
      : typeof raw.authors === 'string'
      ? raw.authors
      : '';

  const publisher =
    typeof raw.publisher === 'string'
      ? raw.publisher
      : typeof raw.journal === 'string'
      ? raw.journal
      : typeof raw.conference === 'string'
      ? raw.conference
      : typeof raw.institution === 'string'
      ? raw.institution
      : '';

  const description =
    typeof raw.description === 'string'
      ? raw.description
      : publisher;

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.dateRange === 'string'
      ? raw.dateRange
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : typeof raw.doi === 'string'
      ? raw.doi
      : typeof raw.link === 'string'
      ? raw.link
      : '';

  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary;
  } else if (typeof raw.abstract === 'string') {
    summary = `<p>${raw.abstract}</p>`;
  } else if (Array.isArray(raw.highlights)) {
    summary = `<ul>${raw.highlights
      .filter((h) => typeof h === 'string' && h.trim())
      .map((h) => `<li><p>${h}</p></li>`)
      .join('')}</ul>`;
  }

  let keywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    keywords = raw.keywords
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.tags)) {
    keywords = raw.tags
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (typeof raw.keyword === 'string' && raw.keyword.trim()) {
    keywords = raw.keyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('res');

  return {
    id,
    name: name.trim(),
    role: role.trim(),
    publisher: publisher.trim(),
    description: description.trim(),
    date: date.trim(),
    website: website.trim(),
    summary: summary.trim(),
    keywords: Array.from(new Set(keywords)),
  };
}

/**
 * Normalizes an unknown record into a valid EducationItem.
 */
export function normalizeEducationItem(
  raw: Record<string, unknown>
): EducationItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.institution === 'string'
      ? raw.institution
      : typeof raw.school === 'string'
      ? raw.school
      : typeof raw.university === 'string'
      ? raw.university
      : '';

  const degree =
    typeof raw.degree === 'string'
      ? raw.degree
      : typeof raw.qualification === 'string'
      ? raw.qualification
      : '';

  const studyField =
    typeof raw.studyField === 'string'
      ? raw.studyField
      : typeof raw.major === 'string'
      ? raw.major
      : typeof raw.field === 'string'
      ? raw.field
      : typeof raw.area === 'string'
      ? raw.area
      : '';

  if (!name.trim() && !degree.trim() && !studyField.trim()) {
    return null;
  }

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.dateRange === 'string'
      ? raw.dateRange
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : '';

  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary;
  } else if (typeof raw.description === 'string') {
    summary = raw.description;
  } else if (typeof raw.gpa === 'string' || typeof raw.gpa === 'number') {
    summary = `<p>GPA: ${raw.gpa}</p>`;
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('edu');

  return {
    id,
    name: name.trim() || 'University / Institution',
    degree: degree.trim(),
    studyField: studyField.trim() || 'General Studies',
    date: date.trim(),
    website: website.trim(),
    summary: summary.trim(),
  };
}

/**
 * Normalizes an unknown record into a valid SkillItem or SoftSkillItem.
 */
export function normalizeSkillItem(
  raw: Record<string, unknown>,
  prefix = 'skill'
): SkillItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.category === 'string'
      ? raw.category
      : typeof raw.group === 'string'
      ? raw.group
      : typeof raw.title === 'string'
      ? raw.title
      : '';

  let keywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    keywords = raw.keywords
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.skills)) {
    keywords = raw.skills
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.items)) {
    keywords = raw.items
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (typeof raw.keyword === 'string' && raw.keyword.trim()) {
    keywords = raw.keyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  } else if (typeof raw.skills === 'string' && raw.skills.trim()) {
    keywords = raw.skills
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  // If name is present but no keywords, and name is something like "React, Vue"
  if (keywords.length === 0 && name.includes(',')) {
    keywords = name.split(',').map((k) => k.trim()).filter(Boolean);
  } else if (keywords.length === 0 && name) {
    keywords = [name.trim()];
  }

  if (keywords.length === 0 && !name.trim()) {
    return null;
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId(prefix);

  return {
    id,
    name: name.trim() || 'Skills',
    keywords: Array.from(new Set(keywords)),
  };
}

/**
 * Normalizes an unknown record into a valid LanguageItem.
 */
export function normalizeLanguageItem(
  raw: Record<string, unknown>
): LanguageItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.language === 'string'
      ? raw.language
      : '';

  if (!name.trim()) return null;

  const level =
    typeof raw.level === 'string'
      ? raw.level
      : typeof raw.proficiency === 'string'
      ? raw.proficiency
      : '';

  const certificate =
    typeof raw.certificate === 'string'
      ? raw.certificate
      : typeof raw.certification === 'string'
      ? raw.certification
      : '';

  const score =
    typeof raw.score === 'string' || typeof raw.score === 'number'
      ? String(raw.score)
      : '';

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : '';

  const description =
    typeof raw.description === 'string'
      ? raw.description
      : typeof raw.summary === 'string'
      ? raw.summary
      : '';

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('lang');

  return {
    id,
    name: name.trim(),
    level: level.trim(),
    certificate: certificate.trim(),
    score: score.trim(),
    date: date.trim(),
    website: website.trim(),
    description: description.trim(),
    listening: typeof raw.listening === 'string' ? raw.listening.trim() : '',
    speaking: typeof raw.speaking === 'string' ? raw.speaking.trim() : '',
    reading: typeof raw.reading === 'string' ? raw.reading.trim() : '',
    writing: typeof raw.writing === 'string' ? raw.writing.trim() : '',
  };
}

/**
 * Normalizes an unknown record into a valid CertificationItem.
 */
export function normalizeCertificationItem(
  raw: Record<string, unknown>
): CertificationItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
      ? raw.title
      : typeof raw.certificate === 'string'
      ? raw.certificate
      : '';

  const issuer =
    typeof raw.issuer === 'string'
      ? raw.issuer
      : typeof raw.organization === 'string'
      ? raw.organization
      : typeof raw.authority === 'string'
      ? raw.authority
      : '';

  if (!name.trim() && !issuer.trim()) return null;

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.issueDate === 'string'
      ? raw.issueDate
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : typeof raw.credentialUrl === 'string'
      ? raw.credentialUrl
      : '';

  const summary =
    typeof raw.summary === 'string'
      ? raw.summary
      : typeof raw.description === 'string'
      ? raw.description
      : '';

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('cert');

  return {
    id,
    name: name.trim(),
    issuer: issuer.trim(),
    date: date.trim(),
    website: website.trim(),
    summary: summary.trim(),
  };
}

/**
 * Normalizes an unknown record into a valid AwardItem.
 */
export function normalizeAwardItem(
  raw: Record<string, unknown>
): AwardItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.title === 'string'
      ? raw.title
      : typeof raw.award === 'string'
      ? raw.award
      : '';

  const issuer =
    typeof raw.issuer === 'string'
      ? raw.issuer
      : typeof raw.organization === 'string'
      ? raw.organization
      : typeof raw.awarder === 'string'
      ? raw.awarder
      : '';

  if (!name.trim() && !issuer.trim()) return null;

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const website =
    typeof raw.website === 'string'
      ? raw.website
      : typeof raw.url === 'string'
      ? raw.url
      : '';

  const summary =
    typeof raw.summary === 'string'
      ? raw.summary
      : typeof raw.description === 'string'
      ? raw.description
      : '';

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('awd');

  return {
    id,
    name: name.trim() || 'Award',
    issuer: issuer.trim() || 'Issuer',
    date: date.trim(),
    website: website.trim(),
    summary: summary.trim(),
  };
}

/**
 * Normalizes an unknown record into a valid VolunteeringItem.
 */
export function normalizeVolunteeringItem(
  raw: Record<string, unknown>
): VolunteeringItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.organization === 'string'
      ? raw.organization
      : typeof raw.cause === 'string'
      ? raw.cause
      : '';

  const position =
    typeof raw.position === 'string'
      ? raw.position
      : typeof raw.role === 'string'
      ? raw.role
      : '';

  if (!name.trim() && !position.trim()) return null;

  const date =
    typeof raw.date === 'string'
      ? raw.date
      : typeof raw.dateRange === 'string'
      ? raw.dateRange
      : typeof raw.year === 'string' || typeof raw.year === 'number'
      ? String(raw.year)
      : '';

  const location =
    typeof raw.location === 'string'
      ? raw.location
      : typeof raw.city === 'string'
      ? raw.city
      : '';

  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary;
  } else if (typeof raw.description === 'string') {
    summary = raw.description;
  } else if (Array.isArray(raw.highlights)) {
    summary = `<ul>${raw.highlights
      .filter((h) => typeof h === 'string' && h.trim())
      .map((h) => `<li><p>${h}</p></li>`)
      .join('')}</ul>`;
  }

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('vol');

  return {
    id,
    name: name.trim() || 'Organization',
    position: position.trim() || 'Volunteer',
    date: date.trim(),
    location: location.trim(),
    summary: summary.trim(),
  };
}

/**
 * Normalizes an unknown record into a valid InterestItem.
 */
export function normalizeInterestItem(
  raw: Record<string, unknown>
): InterestItem | null {
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.interest === 'string'
      ? raw.interest
      : typeof raw.hobby === 'string'
      ? raw.hobby
      : '';

  let keywords: string[] = [];
  if (Array.isArray(raw.keywords)) {
    keywords = raw.keywords
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (Array.isArray(raw.tags)) {
    keywords = raw.tags
      .map((k) => String(k).trim())
      .filter(Boolean);
  } else if (typeof raw.keyword === 'string' && raw.keyword.trim()) {
    keywords = raw.keyword
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const description =
    typeof raw.description === 'string'
      ? raw.description
      : typeof raw.summary === 'string'
      ? raw.summary
      : '';

  if (!name.trim() && keywords.length === 0) return null;

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id
      : generateId('int');

  return {
    id,
    name: name.trim() || 'Interest',
    description: description.trim(),
    keywords: Array.from(new Set(keywords)),
  };
}

/**
 * Parses raw JSON string or object/array into a list of normalized SectionItemUnion.
 * Supports:
 *  1. Single item object: { name: "...", ... }
 *  2. Array of items: [ { name: "..." }, ... ]
 *  3. Wrapper object with sectionKey: { experience: [ ... ] } or { items: [ ... ] }
 *  4. Full CV backup where sectionKey array is extracted
 */
export function parseSectionItemsFromJson(
  sectionKey: ListSectionKey,
  rawInput: string | unknown
): {
  items: SectionItemUnion[];
  error?: string;
} {
  let parsed: unknown;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { items: [] };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return {
        items: [],
        error: 'INVALID_SYNTAX',
      };
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
    return {
      items: [],
      error: 'SCHEMA_ERROR',
    };
  }

  let candidates: Record<string, unknown>[] = [];

  if (Array.isArray(parsed)) {
    candidates = parsed.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    );
  } else if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;

    // Check if it's wrapped under sectionKey, e.g. { experience: [...] }
    if (Array.isArray(obj[sectionKey])) {
      candidates = (obj[sectionKey] as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      );
    } else if (
      obj.resumeData &&
      typeof obj.resumeData === 'object' &&
      Array.isArray((obj.resumeData as Record<string, unknown>)[sectionKey])
    ) {
      // Full CV Master JSON structure
      candidates = (
        (obj.resumeData as Record<string, unknown>)[sectionKey] as unknown[]
      ).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      );
    } else if (Array.isArray(obj.items)) {
      candidates = (obj.items as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      );
    } else if (Array.isArray(obj.data)) {
      candidates = (obj.data as unknown[]).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item)
      );
    } else {
      // Single item object
      candidates = [obj];
    }
  }

  const normalizedList: SectionItemUnion[] = [];

  for (const raw of candidates) {
    let item: SectionItemUnion | null = null;
    switch (sectionKey) {
      case 'experience':
        item = normalizeExperienceItem(raw);
        break;
      case 'projects':
        item = normalizeProjectItem(raw);
        break;
      case 'research':
        item = normalizeResearchItem(raw);
        break;
      case 'education':
        item = normalizeEducationItem(raw);
        break;
      case 'skills':
        item = normalizeSkillItem(raw, 'skill');
        break;
      case 'softSkills':
        item = normalizeSkillItem(raw, 'soft');
        break;
      case 'languages':
        item = normalizeLanguageItem(raw);
        break;
      case 'certifications':
        item = normalizeCertificationItem(raw);
        break;
      case 'awards':
        item = normalizeAwardItem(raw);
        break;
      case 'volunteering':
        item = normalizeVolunteeringItem(raw);
        break;
      case 'interests':
        item = normalizeInterestItem(raw);
        break;
    }

    if (item) {
      normalizedList.push(item);
    }
  }

  if (normalizedList.length === 0 && candidates.length > 0) {
    return {
      items: [],
      error: 'SCHEMA_ERROR',
    };
  }

  return { items: normalizedList };
}

/**
 * Returns a clean JSON sample template for each section.
 */
export function getSectionJsonSample(sectionKey: ListSectionKey): string {
  switch (sectionKey) {
    case 'experience':
      return JSON.stringify(
        [
          {
            name: 'Company ABC',
            position: 'Software Engineer',
            dateRange: 'Jan 2023 - Present',
            location: 'Da Nang, Vietnam',
            employmentType: 'Full-time',
            website: 'https://example.com',
            summary:
              '<ul><li><p>Developed core web applications using React and TypeScript.</p></li><li><p>Improved page performance and integrated RESTful APIs.</p></li></ul>',
          },
        ],
        null,
        2
      );

    case 'projects':
      return JSON.stringify(
        [
          {
            name: 'E-Commerce Platform',
            description: 'Full-stack online shopping solution',
            date: '2024',
            website: 'https://github.com/username/project',
            summary:
              '<p>Implemented payment gateway, product catalog, and real-time inventory tracking.</p>',
            keywords: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
          },
        ],
        null,
        2
      );

    case 'research':
      return JSON.stringify(
        [
          {
            name: 'Edge AI Quantization Optimization',
            role: 'Lead Researcher',
            publisher: 'IEEE Access',
            date: '2024',
            website: 'https://example.com/research',
            summary:
              '<p>Conducted extensive research on model compression and integer quantization for low-power IoT microcontrollers.</p>',
            keywords: ['Deep Learning', 'PyTorch', 'Quantization', 'Edge Computing'],
          },
        ],
        null,
        2
      );

    case 'education':
      return JSON.stringify(
        [
          {
            name: 'University of Science and Technology',
            degree: 'Bachelor of Science',
            studyField: 'Computer Science',
            date: '2020 - 2024',
            website: 'https://university.edu',
            summary:
              '<p>Graduated with High Distinction (GPA 3.6/4.0). Major in Software Engineering.</p>',
          },
        ],
        null,
        2
      );

    case 'skills':
      return JSON.stringify(
        [
          {
            name: 'Frontend Development',
            keywords: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'],
          },
          {
            name: 'Backend & Database',
            keywords: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
          },
        ],
        null,
        2
      );

    case 'softSkills':
      return JSON.stringify(
        [
          {
            name: 'Interpersonal Skills',
            keywords: [
              'Communication',
              'Teamwork',
              'Problem Solving',
              'Time Management',
            ],
          },
        ],
        null,
        2
      );

    case 'languages':
      return JSON.stringify(
        [
          {
            name: 'English',
            level: 'Advanced',
            certificate: 'TOEIC',
            score: '750',
            date: '2024',
            description: 'Fluent in technical communication and documentation',
          },
        ],
        null,
        2
      );

    case 'certifications':
      return JSON.stringify(
        [
          {
            name: 'AWS Certified Solutions Architect – Associate',
            issuer: 'Amazon Web Services',
            date: '2024',
            website: 'https://aws.amazon.com/verification',
            summary: '<p>Validation of cloud architecture and security practices.</p>',
          },
        ],
        null,
        2
      );

    case 'awards':
      return JSON.stringify(
        [
          {
            name: 'First Prize – National Coding Hackathon',
            issuer: 'Ministry of Science and Technology',
            date: '2023',
            website: 'https://hackathon.example.com',
            summary: '<p>Built an AI-driven agricultural monitoring solution in 48 hours.</p>',
          },
        ],
        null,
        2
      );

    case 'volunteering':
      return JSON.stringify(
        [
          {
            name: 'Tech For All Youth Program',
            position: 'Mentor & Coding Instructor',
            date: '2023 - 2024',
            location: 'Da Nang, Vietnam',
            summary:
              '<p>Taught web development fundamentals to 40+ high school students.</p>',
          },
        ],
        null,
        2
      );

    case 'interests':
      return JSON.stringify(
        [
          {
            name: 'Outdoor & Sports',
            description: 'Marathon running and mountain hiking',
            keywords: ['Trail Running', 'Trekking', 'Discipline'],
          },
        ],
        null,
        2
      );
  }
}

export type AnySectionKey = SectionKey | 'basics';

export type SectionExportFormat = 'array' | 'wrapped';

export interface ExportSectionOptions {
  format?: SectionExportFormat;
  excludeHidden?: boolean;
  hiddenItemIds?: string[];
}

/**
 * Returns structured data for exporting a section.
 */
export function getSectionExportData(
  sectionKey: AnySectionKey,
  resumeData: ResumeData,
  options: ExportSectionOptions = {}
): unknown {
  const { format = 'array', excludeHidden = false, hiddenItemIds = [] } = options;

  if (sectionKey === 'basics') {
    return format === 'wrapped' ? { basics: resumeData.basics } : resumeData.basics;
  }

  if (sectionKey === 'summary') {
    return format === 'wrapped' ? { summary: resumeData.summary } : resumeData.summary;
  }

  const items = (resumeData[sectionKey] || []) as SectionItemUnion[];
  const filtered = excludeHidden
    ? items.filter((it) => !hiddenItemIds.includes(it.id))
    : items;

  if (format === 'wrapped') {
    return {
      [sectionKey]: filtered,
    };
  }

  return filtered;
}

/**
 * Formats section data as pretty-printed JSON string.
 */
export function formatSectionExportJson(
  sectionKey: AnySectionKey,
  resumeData: ResumeData,
  options: ExportSectionOptions = {}
): string {
  const data = getSectionExportData(sectionKey, resumeData, options);
  return JSON.stringify(data, null, 2);
}

/**
 * Formats a clean, safe filename for exporting a section JSON file.
 */
export function formatSectionExportFilename(
  basics: Pick<BasicsData, 'name' | 'title'>,
  sectionKey: AnySectionKey
): string {
  const safeName = (basics.name || 'Resume')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]/g, '');
  return `${safeName || 'cv'}-${sectionKey}.json`;
}

/**
 * Triggers browser download of a JSON file.
 */
export function triggerJsonDownload(filename: string, jsonString: string): void {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
