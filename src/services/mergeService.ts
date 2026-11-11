import type {
  AwardItem,
  BasicsData,
  CertificationItem,
  CustomFieldItem,
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
  VolunteeringItem,
} from '@/types/resume';
import {
  DEFAULT_RESUME_DATA,
  DEFAULT_SECTION_ORDER,
} from '@/store/useResumeStore';
import { isDobCustomField } from '@/lib/utils';

export const LIST_SECTION_KEYS: ListSectionKey[] = [
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
];

const RECOGNIZED_CV_KEYS = new Set<string>([
  'basics',
  'summary',
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
  'sectionTitles',
]);

export interface MergeCvOptions {
  /**
   * When true, fields in `basics` and `summary` (and untouched default list items)
   * that still match the factory `DEFAULT_RESUME_DATA` ("John Doe" template)
   * are treated as missing/empty so incoming CV values can populate them.
   */
  replaceDefaultPlaceholders?: boolean;
}

export interface SectionMergeStat {
  section: SectionKey;
  addedCount: number;
  updatedCount: number;
  addedNames: string[];
  updatedNames: string[];
}

export interface MergeDiffSummary {
  filledBasicsFields: string[];
  summaryUpdated: boolean;
  addedCustomFieldsCount: number;
  updatedCustomFieldsCount: number;
  totalAddedItems: number;
  totalUpdatedItems: number;
  sectionStats: Record<SectionKey, SectionMergeStat>;
  hasAnyChanges: boolean;
}

export interface MergeCvResult {
  mergedData: ResumeData;
  summary: MergeDiffSummary;
}

export function normalizeComparisonKey(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isRichTextEmpty(
  html: unknown,
  defaultHtml?: string,
  replaceDefaults = false
): boolean {
  if (typeof html !== 'string') return true;
  const plain = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  if (plain.length === 0) return true;
  if (replaceDefaults && defaultHtml) {
    const defaultPlain = defaultHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (plain === defaultPlain) return true;
  }
  return false;
}

export function isMissingText(
  val: unknown,
  defaultVal?: string,
  replaceDefaults = false
): boolean {
  if (typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (trimmed.length === 0) return true;
  if (replaceDefaults && defaultVal && trimmed === defaultVal.trim()) {
    return true;
  }
  return false;
}

/**
 * Checks whether a resume still has the untouched factory default "John Doe" basics.
 */
export function isDefaultTemplateBasics(basics: BasicsData): boolean {
  return (
    basics.name.trim() === DEFAULT_RESUME_DATA.basics.name &&
    basics.email.trim() === DEFAULT_RESUME_DATA.basics.email
  );
}

/**
 * Parses and validates a raw JSON string or object for CV merging.
 * Supports both full CVMaster JSON backups and partial CV JSON objects containing a subset of sections/fields.
 */
export function parseCvJsonForMerge(
  rawInput: string | Record<string, unknown>
): Partial<ResumeData> {
  let parsed: unknown;
  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      throw new Error('Invalid JSON syntax. Please upload a valid .json file.');
    }
  } else {
    parsed = rawInput;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON root must be an object containing CV fields.');
  }

  const rootObj = parsed as Record<string, unknown>;
  const unwrapped: Record<string, unknown> =
    rootObj.resumeData &&
    typeof rootObj.resumeData === 'object' &&
    !Array.isArray(rootObj.resumeData)
      ? { ...rootObj, ...(rootObj.resumeData as Record<string, unknown>) }
      : rootObj;

  const hasRecognizedKey = Object.keys(unwrapped).some((k) =>
    RECOGNIZED_CV_KEYS.has(k)
  );

  if (!hasRecognizedKey) {
    throw new Error(
      'JSON file does not contain any recognizable CV sections (basics, summary, experience, education, skills, projects, etc.).'
    );
  }

  const result: Partial<ResumeData> = {};

  if (unwrapped.cvLanguage === 'en' || unwrapped.cvLanguage === 'vi') {
    result.cvLanguage = unwrapped.cvLanguage;
  }

  if (
    unwrapped.basics &&
    typeof unwrapped.basics === 'object' &&
    !Array.isArray(unwrapped.basics)
  ) {
    const b = unwrapped.basics as Record<string, unknown>;
    const rawPhone = b.phone;
    const rawLocation = b.location;
    const rawDob = b.dateOfBirth;
    const rawPhoto = b.photo as Record<string, unknown> | undefined;

    let resolvedDobValue =
      typeof rawDob === 'string'
        ? rawDob
        : rawDob &&
          typeof rawDob === 'object' &&
          typeof (rawDob as Record<string, unknown>).value === 'string'
        ? String((rawDob as Record<string, unknown>).value)
        : '';
    let resolvedDobBreakAfter = Boolean(
      rawDob &&
        typeof rawDob === 'object' &&
        (rawDob as Record<string, unknown>).breakAfter
    );

    const normalizedCustomFields = Array.isArray(b.customFields)
      ? b.customFields
          .filter((cf) => cf && typeof cf === 'object')
          .map((cf, idx) => {
            const item = cf as Record<string, unknown>;
            return {
              id:
                typeof item.id === 'string' && item.id.trim()
                  ? item.id
                  : `cf-import-${idx}`,
              name: typeof item.name === 'string' ? item.name : '',
              iconName:
                typeof item.iconName === 'string' && item.iconName.trim()
                  ? item.iconName
                  : 'link',
              value: typeof item.value === 'string' ? item.value : '',
              breakAfter: Boolean(item.breakAfter),
            };
          })
      : [];

    const legacyDobCf = normalizedCustomFields.find((cf) =>
      isDobCustomField(cf, resolvedDobValue)
    );
    if (!resolvedDobValue.trim() && legacyDobCf?.value?.trim()) {
      resolvedDobValue = legacyDobCf.value.trim();
      resolvedDobBreakAfter = legacyDobCf.breakAfter ?? false;
    }

    const cleanCustomFields = normalizedCustomFields.filter(
      (cf) => !isDobCustomField(cf, resolvedDobValue)
    );

    result.basics = {
      name: typeof b.name === 'string' ? b.name : '',
      title: typeof b.title === 'string' ? b.title : '',
      email: typeof b.email === 'string' ? b.email : '',
      linkedin: typeof b.linkedin === 'string' ? b.linkedin : '',
      website: typeof b.website === 'string' ? b.website : '',
      phone:
        typeof rawPhone === 'string'
          ? { value: rawPhone, breakAfter: false }
          : {
              value:
                rawPhone &&
                typeof rawPhone === 'object' &&
                typeof (rawPhone as Record<string, unknown>).value === 'string'
                  ? String((rawPhone as Record<string, unknown>).value)
                  : '',
              breakAfter: Boolean(
                rawPhone &&
                  typeof rawPhone === 'object' &&
                  (rawPhone as Record<string, unknown>).breakAfter
              ),
            },
      location:
        typeof rawLocation === 'string'
          ? { value: rawLocation, breakAfter: false }
          : {
              value:
                rawLocation &&
                typeof rawLocation === 'object' &&
                typeof (rawLocation as Record<string, unknown>).value === 'string'
                  ? String((rawLocation as Record<string, unknown>).value)
                  : '',
              breakAfter: Boolean(
                rawLocation &&
                  typeof rawLocation === 'object' &&
                  (rawLocation as Record<string, unknown>).breakAfter
              ),
            },
      dateOfBirth: {
        value: resolvedDobValue,
        breakAfter: resolvedDobBreakAfter,
      },
      customFields: cleanCustomFields,
      alignment:
        b.alignment === 'start' ||
        b.alignment === 'center' ||
        b.alignment === 'end'
          ? b.alignment
          : 'start',
      photo: {
        url:
          rawPhoto && typeof rawPhoto.url === 'string' ? rawPhoto.url : '',
        size:
          rawPhoto && typeof rawPhoto.size === 'number' ? rawPhoto.size : 100,
        borderRadius:
          rawPhoto && typeof rawPhoto.borderRadius === 'number'
            ? rawPhoto.borderRadius
            : 4,
        visible:
          rawPhoto && typeof rawPhoto.visible === 'boolean'
            ? rawPhoto.visible
            : true,
      },
    };
  }

  if (unwrapped.summary !== undefined) {
    if (typeof unwrapped.summary === 'string') {
      result.summary = {
        sectionTitle: '',
        content: unwrapped.summary,
      };
    } else if (
      unwrapped.summary &&
      typeof unwrapped.summary === 'object' &&
      !Array.isArray(unwrapped.summary)
    ) {
      const s = unwrapped.summary as Record<string, unknown>;
      result.summary = {
        sectionTitle:
          typeof s.sectionTitle === 'string' ? s.sectionTitle : '',
        content: typeof s.content === 'string' ? s.content : '',
      };
    }
  }

  for (const section of LIST_SECTION_KEYS) {
    if (Array.isArray(unwrapped[section])) {
      (result as Record<string, unknown>)[section] = (
        unwrapped[section] as unknown[]
      ).filter((item) => item && typeof item === 'object');
    }
  }

  if (
    unwrapped.sectionTitles &&
    typeof unwrapped.sectionTitles === 'object' &&
    !Array.isArray(unwrapped.sectionTitles)
  ) {
    result.sectionTitles = unwrapped.sectionTitles as ResumeData['sectionTitles'];
  }

  return result;
}

function ensureUniqueId(
  preferredId: string | undefined,
  usedIds: Set<string>,
  prefix: string
): string {
  const candidate = preferredId?.trim();
  if (candidate && !usedIds.has(candidate)) {
    usedIds.add(candidate);
    return candidate;
  }
  let counter = 1;
  let generated = `${prefix}-merged-${Date.now()}-${counter}`;
  while (usedIds.has(generated)) {
    counter++;
    generated = `${prefix}-merged-${Date.now()}-${counter}`;
  }
  usedIds.add(generated);
  return generated;
}

function normalizeIncomingItem(
  section: ListSectionKey,
  raw: Record<string, unknown>,
  usedIds: Set<string>
): SectionItemUnion {
  const id = ensureUniqueId(
    typeof raw.id === 'string' ? raw.id : undefined,
    usedIds,
    section
  );
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const strArr = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      : [];

  switch (section) {
    case 'experience':
      return {
        id,
        name: str(raw.name),
        position: str(raw.position),
        dateRange: str(raw.dateRange || raw.date),
        location: str(raw.location),
        employmentType: str(raw.employmentType),
        website: str(raw.website),
        summary: str(raw.summary),
      } satisfies ExperienceItem;
    case 'projects':
      return {
        id,
        name: str(raw.name),
        description: str(raw.description),
        date: str(raw.date),
        website: str(raw.website),
        summary: str(raw.summary),
        keywords: strArr(raw.keywords),
      } satisfies ProjectItem;
    case 'research':
      return {
        id,
        name: str(raw.name),
        role: str(raw.role),
        publisher: str(raw.publisher),
        description: str(raw.description),
        date: str(raw.date),
        website: str(raw.website),
        summary: str(raw.summary),
        keywords: strArr(raw.keywords),
      } satisfies ResearchItem;
    case 'education':
      return {
        id,
        name: str(raw.name),
        degree: str(raw.degree),
        studyField: str(raw.studyField),
        date: str(raw.date || raw.dateRange),
        website: str(raw.website),
        summary: str(raw.summary),
      } satisfies EducationItem;
    case 'skills':
    case 'softSkills':
      return {
        id,
        name: str(raw.name),
        keywords: strArr(raw.keywords),
      } satisfies SkillItem;
    case 'languages':
      return {
        id,
        name: str(raw.name),
        level: str(raw.level),
        certificate: str(raw.certificate),
        score: str(raw.score),
        date: str(raw.date),
        website: str(raw.website),
        listening: str(raw.listening),
        speaking: str(raw.speaking),
        reading: str(raw.reading),
        writing: str(raw.writing),
        description: str(raw.description),
      } satisfies LanguageItem;
    case 'certifications':
      return {
        id,
        name: str(raw.name),
        issuer: str(raw.issuer),
        date: str(raw.date),
        website: str(raw.website),
        summary: str(raw.summary),
      } satisfies CertificationItem;
    case 'awards':
      return {
        id,
        name: str(raw.name),
        issuer: str(raw.issuer),
        date: str(raw.date),
        website: str(raw.website),
        summary: str(raw.summary),
      } satisfies AwardItem;
    case 'volunteering':
      return {
        id,
        name: str(raw.name),
        position: str(raw.position),
        date: str(raw.date || raw.dateRange),
        location: str(raw.location),
        summary: str(raw.summary),
      } satisfies VolunteeringItem;
    case 'interests':
      return {
        id,
        name: str(raw.name),
        description: str(raw.description),
        keywords: strArr(raw.keywords),
      } satisfies InterestItem;
  }
}

function isItemMeaningful(section: ListSectionKey, item: Record<string, unknown>): boolean {
  const hasName = typeof item.name === 'string' && item.name.trim().length > 0;
  if (hasName) return true;

  if (section === 'skills' || section === 'softSkills' || section === 'interests' || section === 'projects' || section === 'research') {
    if (
      Array.isArray(item.keywords) &&
      item.keywords.some((k) => typeof k === 'string' && k.trim().length > 0)
    ) {
      return true;
    }
  }

  if (section === 'experience' || section === 'volunteering') {
    if (typeof item.position === 'string' && item.position.trim().length > 0) {
      return true;
    }
  }

  if (!isRichTextEmpty(item.summary) || !isMissingText(item.description)) {
    return true;
  }

  return false;
}

/**
 * Determines if two section items represent the same logical entry so that
 * missing fields on the existing item can be populated rather than duplicating the item.
 */
export function isSameSectionItem(
  section: ListSectionKey,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): boolean {
  const nameA = normalizeComparisonKey(existing.name);
  const nameB = normalizeComparisonKey(incoming.name);

  switch (section) {
    case 'experience': {
      const posA = normalizeComparisonKey(existing.position);
      const posB = normalizeComparisonKey(incoming.position);
      const dateA = normalizeComparisonKey(existing.dateRange);
      const dateB = normalizeComparisonKey(incoming.dateRange || incoming.date);

      if (!nameA || !nameB || nameA !== nameB) return false;
      if (posA && posB && posA !== posB) return false;
      if (dateA && dateB && dateA !== dateB) return false;
      return true;
    }
    case 'projects': {
      return Boolean(nameA && nameB && nameA === nameB);
    }
    case 'research': {
      return Boolean(nameA && nameB && nameA === nameB);
    }
    case 'education': {
      const degA = normalizeComparisonKey(existing.degree);
      const degB = normalizeComparisonKey(incoming.degree);
      const fieldA = normalizeComparisonKey(existing.studyField);
      const fieldB = normalizeComparisonKey(incoming.studyField);

      if (!nameA || !nameB || nameA !== nameB) return false;
      if (degA && degB && degA !== degB) return false;
      if (fieldA && fieldB && fieldA !== fieldB) return false;
      return true;
    }
    case 'skills':
    case 'softSkills': {
      // Both named categories with same name, OR both unnamed categories
      return nameA === nameB;
    }
    case 'languages': {
      return Boolean(nameA && nameB && nameA === nameB);
    }
    case 'certifications':
    case 'awards': {
      const issA = normalizeComparisonKey(existing.issuer);
      const issB = normalizeComparisonKey(incoming.issuer);
      if (!nameA || !nameB || nameA !== nameB) return false;
      if (issA && issB && issA !== issB) return false;
      return true;
    }
    case 'volunteering': {
      const posA = normalizeComparisonKey(existing.position);
      const posB = normalizeComparisonKey(incoming.position);
      if (!nameA || !nameB || nameA !== nameB) return false;
      if (posA && posB && posA !== posB) return false;
      return true;
    }
    case 'interests': {
      return Boolean(nameA && nameB && nameA === nameB);
    }
  }
}

const SECTION_SCALAR_FIELDS: Record<ListSectionKey, string[]> = {
  experience: [
    'name',
    'position',
    'dateRange',
    'location',
    'employmentType',
    'website',
    'summary',
  ],
  projects: ['name', 'description', 'date', 'website', 'summary'],
  research: [
    'name',
    'role',
    'publisher',
    'description',
    'date',
    'website',
    'summary',
  ],
  education: ['name', 'degree', 'studyField', 'date', 'website', 'summary'],
  skills: ['name'],
  softSkills: ['name'],
  languages: [
    'name',
    'level',
    'certificate',
    'score',
    'date',
    'website',
    'listening',
    'speaking',
    'reading',
    'writing',
    'description',
  ],
  certifications: ['name', 'issuer', 'date', 'website', 'summary'],
  awards: ['name', 'issuer', 'date', 'website', 'summary'],
  volunteering: ['name', 'position', 'date', 'location', 'summary'],
  interests: ['name', 'description'],
};

const SECTION_HAS_KEYWORDS = new Set<ListSectionKey>([
  'projects',
  'research',
  'skills',
  'softSkills',
  'interests',
]);

const DEFAULT_ITEM_IDS = new Set<string>([
  'exp-default-1',
  'proj-default-1',
  'edu-default-1',
  'skill-default-1',
  'skill-default-2',
  'soft-skill-default-1',
  'lang-default-1',
  'lang-default-2',
]);

function createInitialSectionStats(): Record<SectionKey, SectionMergeStat> {
  const stats = {} as Record<SectionKey, SectionMergeStat>;
  for (const key of DEFAULT_SECTION_ORDER) {
    stats[key] = {
      section: key,
      addedCount: 0,
      updatedCount: 0,
      addedNames: [],
      updatedNames: [],
    };
  }
  return stats;
}

/**
 * Merges `incoming` CV data into `base` (the currently edited CV).
 *
 * Rules:
 * 1. Existing non-empty fields in `base` are preserved.
 * 2. Empty/missing fields in `base` (`basics`, `summary`, `sectionTitles`, or fields within existing section items)
 *    are populated from `incoming`.
 * 3. Section items in `incoming` that do not exist in `base` are appended to `base`.
 * 4. For items with `keywords` (`skills`, `softSkills`, `projects`, `interests`), missing keywords from `incoming`
 *    are deduplicated and appended to the matched item in `base`.
 */
export function mergeResumeData(
  base: ResumeData,
  incoming: Partial<ResumeData>,
  options?: MergeCvOptions
): MergeCvResult {
  const replaceDefaults = Boolean(options?.replaceDefaultPlaceholders);
  const filledBasicsFields: string[] = [];
  let summaryUpdated = false;
  let addedCustomFieldsCount = 0;
  let updatedCustomFieldsCount = 0;
  let totalAddedItems = 0;
  let totalUpdatedItems = 0;
  const sectionStats = createInitialSectionStats();

  // 1. Merge Basics
  const baseLegacyDob = base.basics.customFields.find((cf) =>
    isDobCustomField(cf, base.basics.dateOfBirth?.value)
  );
  const resolvedBaseDob =
    (base.basics.dateOfBirth?.value || '').trim() ||
    (baseLegacyDob?.value || '').trim();

  const mergedBasics: BasicsData = {
    ...base.basics,
    phone: { ...base.basics.phone },
    location: { ...base.basics.location },
    dateOfBirth: {
      value: resolvedBaseDob,
      breakAfter: Boolean(
        base.basics.dateOfBirth?.breakAfter ?? baseLegacyDob?.breakAfter
      ),
    },
    photo: { ...base.basics.photo },
    customFields: base.basics.customFields
      .filter((cf) => !isDobCustomField(cf, resolvedBaseDob))
      .map((cf) => ({ ...cf })),
  };

  if (incoming.basics) {
    const incB = incoming.basics;
    const defB = DEFAULT_RESUME_DATA.basics;

    const scalarFields: Array<
      keyof Pick<BasicsData, 'name' | 'title' | 'email' | 'linkedin' | 'website'>
    > = ['name', 'title', 'email', 'linkedin', 'website'];

    for (const field of scalarFields) {
      if (
        isMissingText(mergedBasics[field], defB[field], replaceDefaults) &&
        !isMissingText(incB[field])
      ) {
        mergedBasics[field] = incB[field].trim();
        filledBasicsFields.push(field);
      }
    }

    if (
      isMissingText(
        mergedBasics.phone?.value,
        defB.phone.value,
        replaceDefaults
      ) &&
      !isMissingText(incB.phone?.value)
    ) {
      mergedBasics.phone = {
        value: incB.phone.value.trim(),
        breakAfter: incB.phone.breakAfter ?? mergedBasics.phone.breakAfter,
      };
      filledBasicsFields.push('phone');
    }

    if (
      isMissingText(
        mergedBasics.location?.value,
        defB.location.value,
        replaceDefaults
      ) &&
      !isMissingText(incB.location?.value)
    ) {
      mergedBasics.location = {
        value: incB.location.value.trim(),
        breakAfter: incB.location.breakAfter ?? mergedBasics.location.breakAfter,
      };
      filledBasicsFields.push('location');
    }

    if (
      isMissingText(
        mergedBasics.dateOfBirth?.value,
        defB.dateOfBirth?.value,
        replaceDefaults
      ) &&
      !isMissingText(incB.dateOfBirth?.value)
    ) {
      mergedBasics.dateOfBirth = {
        value: incB.dateOfBirth!.value.trim(),
        breakAfter:
          incB.dateOfBirth!.breakAfter ??
          mergedBasics.dateOfBirth?.breakAfter ??
          false,
      };
      filledBasicsFields.push('dateOfBirth');
    }

    if (
      isMissingText(mergedBasics.photo?.url) &&
      !isMissingText(incB.photo?.url)
    ) {
      mergedBasics.photo = {
        url: incB.photo.url.trim(),
        size: incB.photo.size || mergedBasics.photo.size || 100,
        borderRadius:
          incB.photo.borderRadius ?? mergedBasics.photo.borderRadius ?? 4,
        visible: incB.photo.visible ?? mergedBasics.photo.visible ?? true,
      };
      filledBasicsFields.push('photo');
    }

    // Merge Custom Fields
    if (Array.isArray(incB.customFields) && incB.customFields.length > 0) {
      const usedCfIds = new Set(mergedBasics.customFields.map((c) => c.id));
      for (const incCf of incB.customFields) {
        if (!incCf || (isMissingText(incCf.name) && isMissingText(incCf.value))) {
          continue;
        }
        if (isDobCustomField(incCf, mergedBasics.dateOfBirth?.value)) {
          if (
            isMissingText(
              mergedBasics.dateOfBirth?.value,
              defB.dateOfBirth?.value,
              replaceDefaults
            ) &&
            !isMissingText(incCf.value)
          ) {
            mergedBasics.dateOfBirth = {
              value: incCf.value.trim(),
              breakAfter:
                incCf.breakAfter ??
                mergedBasics.dateOfBirth?.breakAfter ??
                false,
            };
            if (!filledBasicsFields.includes('dateOfBirth')) {
              filledBasicsFields.push('dateOfBirth');
            }
          }
          continue;
        }
        const incNameKey = normalizeComparisonKey(incCf.name);
        const incValKey = normalizeComparisonKey(incCf.value);

        const matchIdx = mergedBasics.customFields.findIndex((existing) => {
          const exNameKey = normalizeComparisonKey(existing.name);
          const exValKey = normalizeComparisonKey(existing.value);
          if (incNameKey && exNameKey && incNameKey === exNameKey) return true;
          if (!incNameKey && !exNameKey && incValKey && incValKey === exValKey)
            return true;
          return false;
        });

        if (matchIdx !== -1) {
          const existing = mergedBasics.customFields[matchIdx];
          let cfUpdated = false;
          if (isMissingText(existing.value) && !isMissingText(incCf.value)) {
            existing.value = incCf.value.trim();
            cfUpdated = true;
          }
          if (isMissingText(existing.name) && !isMissingText(incCf.name)) {
            existing.name = incCf.name.trim();
            cfUpdated = true;
          }
          if (
            isMissingText(existing.iconName) &&
            !isMissingText(incCf.iconName)
          ) {
            existing.iconName = incCf.iconName.trim();
            cfUpdated = true;
          }
          if (cfUpdated) {
            updatedCustomFieldsCount++;
          }
        } else {
          const newCf: CustomFieldItem = {
            id: ensureUniqueId(incCf.id, usedCfIds, 'cf'),
            name: (incCf.name || '').trim(),
            iconName: (incCf.iconName || 'link').trim(),
            value: (incCf.value || '').trim(),
            breakAfter: Boolean(incCf.breakAfter),
          };
          mergedBasics.customFields.push(newCf);
          addedCustomFieldsCount++;
        }
      }
      if (addedCustomFieldsCount > 0 || updatedCustomFieldsCount > 0) {
        filledBasicsFields.push('customFields');
      }
    }
  }

  // 2. Merge Summary
  const mergedSummary = { ...base.summary };
  if (incoming.summary) {
    if (
      isRichTextEmpty(
        mergedSummary.content,
        DEFAULT_RESUME_DATA.summary.content,
        replaceDefaults
      ) &&
      !isRichTextEmpty(incoming.summary.content)
    ) {
      mergedSummary.content = incoming.summary.content;
      summaryUpdated = true;
      sectionStats.summary.updatedCount = 1;
      sectionStats.summary.updatedNames.push(
        mergedSummary.sectionTitle || 'Summary'
      );
    }
    if (
      isMissingText(
        mergedSummary.sectionTitle,
        DEFAULT_RESUME_DATA.summary.sectionTitle,
        replaceDefaults
      ) &&
      !isMissingText(incoming.summary.sectionTitle)
    ) {
      mergedSummary.sectionTitle = incoming.summary.sectionTitle.trim();
    }
  }

  // 3. Merge List Sections
  const mergedLists: Partial<Record<ListSectionKey, SectionItemUnion[]>> = {};
  const nextHiddenSections = new Set<SectionKey>(base.hiddenSections || []);

  for (const section of LIST_SECTION_KEYS) {
    const incomingItems = incoming[section] as
      | Array<Record<string, unknown>>
      | undefined;

    // Clone existing items deeply enough for safe mutation
    let baseList = (base[section] || []).map((item) => {
      const cloned = { ...item } as Record<string, unknown>;
      if (Array.isArray(cloned.keywords)) {
        cloned.keywords = [...(cloned.keywords as string[])];
      }
      return cloned;
    });

    if (
      Array.isArray(incomingItems) &&
      incomingItems.length > 0 &&
      replaceDefaults
    ) {
      // Remove untouched factory default items if incoming has real items for this section
      const hasMeaningfulIncoming = incomingItems.some((item) =>
        isItemMeaningful(section, item)
      );
      if (hasMeaningfulIncoming) {
        baseList = baseList.filter(
          (item) => !DEFAULT_ITEM_IDS.has(String(item.id || ''))
        );
      }
    }

    const wasEmpty = baseList.length === 0;
    const usedIds = new Set<string>(
      baseList.map((item) => String(item.id || '')).filter(Boolean)
    );

    if (Array.isArray(incomingItems) && incomingItems.length > 0) {
      const scalarFields = SECTION_SCALAR_FIELDS[section];
      const hasKeywords = SECTION_HAS_KEYWORDS.has(section);

      for (const rawInc of incomingItems) {
        if (!rawInc || typeof rawInc !== 'object') continue;
        if (!isItemMeaningful(section, rawInc)) continue;

        const matchIndex = baseList.findIndex((existing) =>
          isSameSectionItem(section, existing, rawInc)
        );

        if (matchIndex !== -1) {
          const target = baseList[matchIndex];
          let itemUpdated = false;

          for (const field of scalarFields) {
            const incomingValue =
              field === 'dateRange'
                ? rawInc.dateRange ?? rawInc.date
                : field === 'date'
                ? rawInc.date ?? rawInc.dateRange
                : rawInc[field];

            if (field === 'summary') {
              if (
                isRichTextEmpty(target.summary) &&
                !isRichTextEmpty(incomingValue)
              ) {
                target.summary = String(incomingValue);
                itemUpdated = true;
              }
            } else {
              if (
                isMissingText(target[field]) &&
                !isMissingText(incomingValue)
              ) {
                target[field] = String(incomingValue).trim();
                itemUpdated = true;
              }
            }
          }

          if (hasKeywords && Array.isArray(rawInc.keywords)) {
            const currentKeywords = Array.isArray(target.keywords)
              ? (target.keywords as string[])
              : [];
            const existingKwSet = new Set(
              currentKeywords.map((kw) => normalizeComparisonKey(kw))
            );
            const newKeywords: string[] = [];
            for (const kw of rawInc.keywords) {
              if (typeof kw !== 'string') continue;
              const norm = normalizeComparisonKey(kw);
              if (norm && !existingKwSet.has(norm)) {
                existingKwSet.add(norm);
                newKeywords.push(kw.trim());
              }
            }
            if (newKeywords.length > 0) {
              target.keywords = [...currentKeywords, ...newKeywords];
              itemUpdated = true;
            }
          }

          if (itemUpdated) {
            totalUpdatedItems++;
            sectionStats[section].updatedCount++;
            sectionStats[section].updatedNames.push(
              String(target.name || target.position || section)
            );
          }
        } else {
          const normalizedNewItem = normalizeIncomingItem(
            section,
            rawInc,
            usedIds
          );
          baseList.push(
            normalizedNewItem as unknown as Record<string, unknown>
          );
          totalAddedItems++;
          sectionStats[section].addedCount++;
          sectionStats[section].addedNames.push(
            String(
              normalizedNewItem.name ||
                (normalizedNewItem as ExperienceItem).position ||
                section
            )
          );
        }
      }
    }

    if (wasEmpty && baseList.length > 0 && nextHiddenSections.has(section)) {
      nextHiddenSections.delete(section);
    }

    mergedLists[section] = baseList as unknown as SectionItemUnion[];
  }

  // 4. Merge Section Titles
  const mergedSectionTitles = { ...base.sectionTitles };
  if (incoming.sectionTitles) {
    for (const key of DEFAULT_SECTION_ORDER) {
      const currentTitle = mergedSectionTitles[key];
      const defaultTitle = DEFAULT_RESUME_DATA.sectionTitles[key];
      const incomingTitle = incoming.sectionTitles[key];
      if (
        isMissingText(currentTitle, defaultTitle, replaceDefaults) &&
        !isMissingText(incomingTitle)
      ) {
        mergedSectionTitles[key] = incomingTitle!.trim();
      }
    }
  }
  if (
    mergedSummary.sectionTitle &&
    isMissingText(
      mergedSectionTitles.summary,
      DEFAULT_RESUME_DATA.sectionTitles.summary,
      replaceDefaults
    )
  ) {
    mergedSectionTitles.summary = mergedSummary.sectionTitle;
  }

  const mergedData: ResumeData = {
    ...base,
    cvLanguage: base.cvLanguage || incoming.cvLanguage || 'en',
    basics: mergedBasics,
    summary: mergedSummary,
    experience: mergedLists.experience as ExperienceItem[],
    projects: mergedLists.projects as ProjectItem[],
    research: mergedLists.research as ResearchItem[],
    education: mergedLists.education as EducationItem[],
    skills: mergedLists.skills as SkillItem[],
    softSkills: mergedLists.softSkills as SkillItem[],
    languages: mergedLists.languages as LanguageItem[],
    certifications: mergedLists.certifications as CertificationItem[],
    awards: mergedLists.awards as AwardItem[],
    volunteering: mergedLists.volunteering as VolunteeringItem[],
    interests: mergedLists.interests as InterestItem[],
    sectionTitles: mergedSectionTitles,
    hiddenSections: Array.from(nextHiddenSections),
  };

  const hasAnyChanges =
    filledBasicsFields.length > 0 ||
    summaryUpdated ||
    totalAddedItems > 0 ||
    totalUpdatedItems > 0;

  return {
    mergedData,
    summary: {
      filledBasicsFields,
      summaryUpdated,
      addedCustomFieldsCount,
      updatedCustomFieldsCount,
      totalAddedItems,
      totalUpdatedItems,
      sectionStats,
      hasAnyChanges,
    },
  };
}

/**
 * Merges multiple CV JSON payloads sequentially into the `base` ResumeData.
 */
export function mergeMultipleResumes(
  base: ResumeData,
  incomingList: Partial<ResumeData>[],
  options?: MergeCvOptions
): MergeCvResult {
  let currentData = base;
  const allFilledBasics = new Set<string>();
  let anySummaryUpdated = false;
  let totalAddedCf = 0;
  let totalUpdatedCf = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  const combinedStats = createInitialSectionStats();

  for (let i = 0; i < incomingList.length; i++) {
    // Only apply replaceDefaultPlaceholders on the first merge pass so items from the first file are never treated as defaults
    const passOptions: MergeCvOptions = {
      replaceDefaultPlaceholders:
        i === 0 ? options?.replaceDefaultPlaceholders : false,
    };
    const { mergedData, summary } = mergeResumeData(
      currentData,
      incomingList[i],
      passOptions
    );
    currentData = mergedData;

    for (const f of summary.filledBasicsFields) {
      allFilledBasics.add(f);
    }
    if (summary.summaryUpdated) {
      anySummaryUpdated = true;
    }
    totalAddedCf += summary.addedCustomFieldsCount;
    totalUpdatedCf += summary.updatedCustomFieldsCount;
    totalAdded += summary.totalAddedItems;
    totalUpdated += summary.totalUpdatedItems;

    for (const key of DEFAULT_SECTION_ORDER) {
      combinedStats[key].addedCount += summary.sectionStats[key].addedCount;
      combinedStats[key].updatedCount += summary.sectionStats[key].updatedCount;
      combinedStats[key].addedNames.push(
        ...summary.sectionStats[key].addedNames
      );
      combinedStats[key].updatedNames.push(
        ...summary.sectionStats[key].updatedNames
      );
    }
  }

  const hasAnyChanges =
    allFilledBasics.size > 0 ||
    anySummaryUpdated ||
    totalAdded > 0 ||
    totalUpdated > 0;

  return {
    mergedData: currentData,
    summary: {
      filledBasicsFields: Array.from(allFilledBasics),
      summaryUpdated: anySummaryUpdated,
      addedCustomFieldsCount: totalAddedCf,
      updatedCustomFieldsCount: totalUpdatedCf,
      totalAddedItems: totalAdded,
      totalUpdatedItems: totalUpdated,
      sectionStats: combinedStats,
      hasAnyChanges,
    },
  };
}
