import { create } from "zustand";
import { CONFIG, resolveMargins } from "@/lib/utils";
import {
  mergeResumeData as computeMergedResumeData,
  mergeMultipleResumes as computeMultipleMergedResumes,
  type MergeCvOptions,
  type MergeCvResult,
} from "@/services/mergeService";
import type {
  BasicsData,
  ResumeData,
  SectionKey,
  ListSectionKey,
  SectionItemUnion,
  PdfSettings,
  MarginSetting,
  CVAnalysisResult,
} from "@/types/resume";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "projects",
  "research",
  "education",
  "skills",
  "softSkills",
  "languages",
  "certifications",
  "awards",
  "volunteering",
  "interests",
];

export const DEFAULT_RESUME_DATA: ResumeData = {
  cvLanguage: "en",
  basics: {
    name: "John Doe",
    title: "Software Developer",
    email: "youremail@domain.com",
    linkedin: "https://linkedin.com/in/johndoe",
    website: "https://johndoe.com",
    phone: { value: "+010101010", breakAfter: false },
    location: { value: "Cairo, Egypt", breakAfter: false },
    dateOfBirth: { value: "", breakAfter: false },
    customFields: [],
    alignment: "start",
    photo: {
      url: "",
      size: 100,
      borderRadius: 4,
      visible: true,
    },
  },
  summary: {
    sectionTitle: "Summary",
    content:
      "<p>Results-driven Software Developer with experience designing, building, and scaling modern web applications.</p>",
  },
  experience: [
    {
      id: "exp-default-1",
      name: "TechNova Solutions",
      position: "Senior Frontend Engineer",
      dateRange: "Jan 2022 - Present",
      location: "Remote",
      employmentType: "Full-time",
      website: "https://technova.example.com",
      summary:
        "<ul><li><p>Architected and delivered modular React and TypeScript applications serving 150K+ monthly active users.</p></li><li><p>Improved Core Web Vitals and reduced bundle size by 35% through code splitting and lazy loading.</p></li></ul>",
    },
  ],
  projects: [
    {
      id: "proj-default-1",
      name: "OpenMetrics Dashboard",
      description: "Real-time analytics and observability platform",
      date: "2024",
      website: "https://github.com/johndoe/openmetrics",
      summary:
        "<p>Built a customizable telemetry dashboard with interactive charts and instant PDF/JSON reporting.</p>",
      keywords: ["React", "TypeScript", "Tailwind CSS"],
    },
  ],
  research: [],
  education: [
    {
      id: "edu-default-1",
      name: "Cairo University",
      degree: "B.Sc.",
      studyField: "Computer Science",
      date: "2016 - 2020",
      website: "",
      summary: "<p>Graduated with Honors. Coursework in Algorithms, Distributed Systems, and Software Engineering.</p>",
    },
  ],
  skills: [
    {
      id: "skill-default-1",
      name: "Frontend & Languages",
      keywords: ["TypeScript", "JavaScript", "React", "Next.js", "Tailwind CSS", "HTML5/CSS3"],
    },
    {
      id: "skill-default-2",
      name: "Backend & Cloud",
      keywords: ["Node.js", "PostgreSQL", "Docker", "Git", "CI/CD"],
    },
  ],
  softSkills: [
    {
      id: "soft-skill-default-1",
      name: "Interpersonal & Collaboration",
      keywords: ["Communication", "Teamwork", "Problem Solving", "Time Management", "Adaptability"],
    },
  ],
  languages: [
    {
      id: "lang-default-1",
      name: "English",
      level: "Fluent",
    },
    {
      id: "lang-default-2",
      name: "Arabic",
      level: "Native or Bilingual",
    },
  ],
  certifications: [],
  awards: [],
  volunteering: [],
  interests: [],
  sectionTitles: {
    summary: "Summary",
    experience: "Experience",
    projects: "Projects",
    research: "Research",
    education: "Education",
    skills: "Skills",
    softSkills: "Soft Skills",
    languages: "Languages",
    certifications: "Certifications",
    awards: "Awards",
    volunteering: "Volunteering",
    interests: "Interests",
  },
};

export const DEFAULT_SECTION_TITLES_EN: Record<SectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  research: "Research",
  education: "Education",
  skills: "Skills",
  softSkills: "Soft Skills",
  languages: "Languages",
  certifications: "Certifications",
  awards: "Awards",
  volunteering: "Volunteering",
  interests: "Interests",
};

export const DEFAULT_SECTION_TITLES_VI: Record<SectionKey, string> = {
  summary: "Tóm tắt chuyên môn",
  experience: "Kinh nghiệm làm việc",
  projects: "Dự án",
  research: "Nghiên cứu khoa học",
  education: "Học vấn",
  skills: "Kỹ năng chuyên môn",
  softSkills: "Kỹ năng mềm",
  languages: "Ngoại ngữ",
  certifications: "Chứng chỉ",
  awards: "Giải thưởng",
  volunteering: "Hoạt động tình nguyện",
  interests: "Sở thích",
};

export const initialResumeData = DEFAULT_RESUME_DATA;

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  fontSize: 14,
  fontFamily: "Work Sans",
  fontCategory: "ATS-Friendly",
  scale: CONFIG.SCALE.INITIAL,
  lineHeight: 5,
  verticalSpacing: 1,
  margin: {
    MIN: CONFIG.MARGIN.MIN,
    MAX: CONFIG.MARGIN.MAX,
    INITIAL: CONFIG.MARGIN.INITIAL,
    VALUE: CONFIG.MARGIN.VALUE,
    STEP: CONFIG.MARGIN.STEP,
    TOP: CONFIG.MARGIN.VALUE,
    BOTTOM: CONFIG.MARGIN.VALUE,
    LEFT: CONFIG.MARGIN.VALUE,
    RIGHT: CONFIG.MARGIN.VALUE,
  },
  pageBreakLine: true,
  skillsLayout: "inline",
};

/**
 * Builds a complete margin setting. Legacy values that only have `VALUE`
 * are expanded so every side starts from that uniform margin.
 */
export function normalizeMargin(margin?: Partial<MarginSetting> | null): MarginSetting {
  const { top, bottom, left, right } = resolveMargins(margin);
  return {
    MIN: CONFIG.MARGIN.MIN,
    MAX: CONFIG.MARGIN.MAX,
    INITIAL: CONFIG.MARGIN.INITIAL,
    STEP: CONFIG.MARGIN.STEP,
    VALUE: left,
    TOP: top,
    BOTTOM: bottom,
    LEFT: left,
    RIGHT: right,
  };
}

export function readLocalStorage<T>(key: string, fallback: T | null = null): T | null {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return fallback;
  }
}

const persistedResumeData = readLocalStorage<Partial<ResumeData>>("resumeData");
const persistedSectionOrder = readLocalStorage<{ sectionOrder?: SectionKey[] }>("sectionOrder");
const persistedHiddenIds = readLocalStorage<{ hiddenItemIds?: string[] }>("hiddenItemIds");
const persistedHiddenSections = readLocalStorage<{ hiddenSections?: SectionKey[] }>("hiddenSections");

function buildMergedSectionOrder(persisted?: SectionKey[] | null): SectionKey[] {
  if (!Array.isArray(persisted) || persisted.length === 0) {
    return DEFAULT_SECTION_ORDER;
  }
  const validKeys = persisted.filter((key): key is SectionKey =>
    DEFAULT_SECTION_ORDER.includes(key)
  );
  const uniqueKeys = Array.from(new Set(validKeys));
  const missing = DEFAULT_SECTION_ORDER.filter((key) => !uniqueKeys.includes(key));
  return [...uniqueKeys, ...missing];
}

function buildMergedResumeData(persisted?: Partial<ResumeData> | null): ResumeData {
  const cleanSectionTitles = Object.fromEntries(
    Object.entries(persisted?.sectionTitles || {}).filter(
      ([, v]) => typeof v === "string" && v.trim().length > 0
    )
  );
  const mergedSummary = {
    ...DEFAULT_RESUME_DATA.summary,
    ...(typeof persisted?.summary === "object" && persisted?.summary !== null
      ? persisted.summary
      : {}),
  };

  return {
    ...DEFAULT_RESUME_DATA,
    cvLanguage: persisted?.cvLanguage ?? DEFAULT_RESUME_DATA.cvLanguage ?? "en",
    ...(persisted || {}),
    softSkills: Array.isArray(persisted?.softSkills)
      ? persisted.softSkills
      : DEFAULT_RESUME_DATA.softSkills,
    research: Array.isArray(persisted?.research)
      ? persisted.research
      : DEFAULT_RESUME_DATA.research,
    interests: Array.isArray(persisted?.interests)
      ? persisted.interests
      : DEFAULT_RESUME_DATA.interests,
    basics: {
      ...DEFAULT_RESUME_DATA.basics,
      ...(persisted?.basics || {}),
      phone: {
        ...DEFAULT_RESUME_DATA.basics.phone,
        ...(persisted?.basics?.phone || {}),
      },
      location: {
        ...DEFAULT_RESUME_DATA.basics.location,
        ...(persisted?.basics?.location || {}),
      },
      dateOfBirth: {
        value: persisted?.basics?.dateOfBirth?.value ?? "",
        breakAfter: Boolean(persisted?.basics?.dateOfBirth?.breakAfter),
      },
      photo: {
        ...DEFAULT_RESUME_DATA.basics.photo,
        ...(persisted?.basics?.photo || {}),
      },
      customFields: persisted?.basics?.customFields ?? DEFAULT_RESUME_DATA.basics.customFields,
    },
    summary: mergedSummary,
    hiddenSections:
      persisted?.hiddenSections ??
      (Array.isArray(persistedHiddenSections?.hiddenSections)
        ? persistedHiddenSections.hiddenSections
        : []),
    sectionTitles: {
      ...DEFAULT_RESUME_DATA.sectionTitles,
      ...(mergedSummary.sectionTitle ? { summary: mergedSummary.sectionTitle } : {}),
      ...cleanSectionTitles,
    },
  };
}

export interface ResumeStoreState {
  sectionOrder: SectionKey[];
  hiddenItemIds: string[];
  hiddenSections: SectionKey[];
  resumeData: ResumeData;
  setData: (partial: Partial<ResumeData>) => void;
  setResumeData: (data: ResumeData) => void;
  mergeResumeData: (
    incoming: Partial<ResumeData>,
    options?: MergeCvOptions
  ) => MergeCvResult;
  mergeMultipleResumeData: (
    incomingList: Partial<ResumeData>[],
    options?: MergeCvOptions
  ) => MergeCvResult;
  setCvLanguage: (
    lang: "en" | "vi",
    options?: { updateSectionTitles?: boolean }
  ) => void;
  updateBasics: (patch: Partial<BasicsData>) => void;
  resetPhotoSettings: () => void;
  updateSummary: (content: string) => void;
  updateSectionTitle: (section: SectionKey, title: string) => void;
  addSectionItem: (section: ListSectionKey, item: SectionItemUnion) => void;
  addSectionItems: (section: ListSectionKey, items: SectionItemUnion[]) => void;
  updateSectionItem: (section: ListSectionKey, item: SectionItemUnion, index?: number) => void;
  deleteSectionItem: (section: ListSectionKey, id: string) => void;
  duplicateSectionItem: (section: ListSectionKey, id: string) => void;
  reorderSectionItems: (section: ListSectionKey, items: SectionItemUnion[]) => void;
  moveSectionItem: (section: ListSectionKey, fromIndex: number, toIndex: number) => void;
  setSectionOrder: (order: SectionKey[]) => void;
  updateSectionOrder: (order: SectionKey[]) => void;
  resetSectionOrder: () => void;
  toggleHiddenItem: (id: string) => void;
  toggleHideItem: (id: string) => void;
  setHiddenItemIds: (ids: string[]) => void;
  toggleHideSection: (section: SectionKey) => void;
  setHiddenSections: (sections: SectionKey[]) => void;
  resetResume: () => void;
}

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  sectionOrder: buildMergedSectionOrder(persistedSectionOrder?.sectionOrder),
  hiddenItemIds: persistedHiddenIds?.hiddenItemIds ?? [],
  hiddenSections:
    (Array.isArray(persistedHiddenSections?.hiddenSections)
      ? persistedHiddenSections.hiddenSections
      : Array.isArray(persistedResumeData?.hiddenSections)
      ? (persistedResumeData.hiddenSections as SectionKey[])
      : []) as SectionKey[],
  resumeData: buildMergedResumeData(persistedResumeData),

  setData: (partial) => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        ...partial,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  setResumeData: (data) => {
    const merged = buildMergedResumeData(data);
    localStorage.setItem("resumeData", JSON.stringify(merged));
    const updates: Partial<ResumeStoreState> = { resumeData: merged };

    if (Array.isArray(data?.hiddenItemIds)) {
      localStorage.setItem(
        "hiddenItemIds",
        JSON.stringify({ hiddenItemIds: data.hiddenItemIds })
      );
      updates.hiddenItemIds = data.hiddenItemIds;
    }

    if (Array.isArray(data?.hiddenSections)) {
      localStorage.setItem(
        "hiddenSections",
        JSON.stringify({ hiddenSections: data.hiddenSections })
      );
      updates.hiddenSections = data.hiddenSections as SectionKey[];
    }

    if (Array.isArray((data as any)?.sectionOrder)) {
      const mergedOrder = buildMergedSectionOrder((data as any).sectionOrder);
      localStorage.setItem(
        "sectionOrder",
        JSON.stringify({ sectionOrder: mergedOrder })
      );
      updates.sectionOrder = mergedOrder;
    }

    set(updates as ResumeStoreState);
  },

  mergeResumeData: (incoming, options) => {
    const state = get();
    const result = computeMergedResumeData(state.resumeData, incoming, options);
    localStorage.setItem("resumeData", JSON.stringify(result.mergedData));
    if (Array.isArray(result.mergedData.hiddenSections)) {
      localStorage.setItem(
        "hiddenSections",
        JSON.stringify({ hiddenSections: result.mergedData.hiddenSections })
      );
      set({
        resumeData: result.mergedData,
        hiddenSections: result.mergedData.hiddenSections,
      });
    } else {
      set({ resumeData: result.mergedData });
    }
    return result;
  },

  mergeMultipleResumeData: (incomingList, options) => {
    const state = get();
    const result = computeMultipleMergedResumes(
      state.resumeData,
      incomingList,
      options
    );
    localStorage.setItem("resumeData", JSON.stringify(result.mergedData));
    if (Array.isArray(result.mergedData.hiddenSections)) {
      localStorage.setItem(
        "hiddenSections",
        JSON.stringify({ hiddenSections: result.mergedData.hiddenSections })
      );
      set({
        resumeData: result.mergedData,
        hiddenSections: result.mergedData.hiddenSections,
      });
    } else {
      set({ resumeData: result.mergedData });
    }
    return result;
  },

  setCvLanguage: (cvLanguage, options) => {
    set((state) => {
      const shouldUpdateTitles = options?.updateSectionTitles ?? true;
      let nextSectionTitles = { ...state.resumeData.sectionTitles };

      if (shouldUpdateTitles) {
        const targetTitles =
          cvLanguage === "vi"
            ? DEFAULT_SECTION_TITLES_VI
            : DEFAULT_SECTION_TITLES_EN;
        const sourceTitles =
          cvLanguage === "vi"
            ? DEFAULT_SECTION_TITLES_EN
            : DEFAULT_SECTION_TITLES_VI;

        const updated: Partial<Record<SectionKey, string>> = {};
        for (const [key, val] of Object.entries(nextSectionTitles)) {
          const sKey = key as SectionKey;
          if (
            !val ||
            val === sourceTitles[sKey] ||
            val === targetTitles[sKey]
          ) {
            updated[sKey] = targetTitles[sKey] || val;
          } else {
            updated[sKey] = val;
          }
        }
        nextSectionTitles = { ...nextSectionTitles, ...updated };
      }

      const nextResumeData: ResumeData = {
        ...state.resumeData,
        cvLanguage,
        sectionTitles: nextSectionTitles,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  updateBasics: (patch) => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        basics: {
          ...state.resumeData.basics,
          ...patch,
        },
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  resetPhotoSettings: () => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        basics: {
          ...state.resumeData.basics,
          photo: {
            url: "",
            size: CONFIG.PHOTO.SIZE.DEFAULT,
            borderRadius: CONFIG.PHOTO.RADIUS.DEFAULT,
            visible: true,
          },
        },
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  updateSummary: (content) => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        summary: {
          ...state.resumeData.summary,
          content,
        },
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  updateSectionTitle: (section, title) => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        sectionTitles: {
          ...state.resumeData.sectionTitles,
          [section]: title,
        },
        summary:
          section === "summary"
            ? { ...state.resumeData.summary, sectionTitle: title }
            : state.resumeData.summary,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  addSectionItem: (section, item) => {
    set((state) => {
      const list = state.resumeData[section] as SectionItemUnion[];
      const nextList = [...list, item];
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: nextList,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  addSectionItems: (section, items) => {
    if (!items || items.length === 0) return;
    set((state) => {
      const list = state.resumeData[section] as SectionItemUnion[];
      const nextList = [...list, ...items];
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: nextList,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  updateSectionItem: (section, item, index) => {
    set((state) => {
      const list = [...(state.resumeData[section] as SectionItemUnion[])];
      if (typeof index === "number" && index >= 0 && index < list.length) {
        list[index] = item;
      } else {
        const idx = list.findIndex((existing) => existing.id === item.id);
        if (idx !== -1) {
          list[idx] = item;
        }
      }
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: list,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  deleteSectionItem: (section, id) => {
    set((state) => {
      const list = state.resumeData[section] as SectionItemUnion[];
      const nextList = list.filter((item) => item.id !== id);
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: nextList,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  duplicateSectionItem: (section, id) => {
    set((state) => {
      const list = state.resumeData[section] as SectionItemUnion[];
      const idx = list.findIndex((item) => item.id === id);
      if (idx === -1) return state;
      const original = list[idx];
      const duplicate: SectionItemUnion = {
        ...original,
        id: `${section}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${original.name} (Copy)`,
      };
      const nextList = [
        ...list.slice(0, idx + 1),
        duplicate,
        ...list.slice(idx + 1),
      ];
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: nextList,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  reorderSectionItems: (section, items) => {
    set((state) => {
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: items,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  moveSectionItem: (section, fromIndex, toIndex) => {
    set((state) => {
      const list = [...((state.resumeData[section] || []) as SectionItemUnion[])];
      if (
        fromIndex < 0 ||
        fromIndex >= list.length ||
        toIndex < 0 ||
        toIndex >= list.length ||
        fromIndex === toIndex
      ) {
        return state;
      }
      const moved = list.slice();
      const [movedItem] = moved.splice(fromIndex, 1);
      moved.splice(toIndex, 0, movedItem);
      const nextResumeData: ResumeData = {
        ...state.resumeData,
        [section]: moved,
      };
      localStorage.setItem("resumeData", JSON.stringify(nextResumeData));
      return { resumeData: nextResumeData };
    });
  },

  setSectionOrder: (order) => {
    const mergedOrder = buildMergedSectionOrder(order);
    set(() => ({ sectionOrder: mergedOrder }));
    localStorage.setItem("sectionOrder", JSON.stringify({ sectionOrder: mergedOrder }));
  },

  updateSectionOrder: (order) => {
    const mergedOrder = buildMergedSectionOrder(order);
    set(() => ({ sectionOrder: mergedOrder }));
    localStorage.setItem("sectionOrder", JSON.stringify({ sectionOrder: mergedOrder }));
  },

  resetSectionOrder: () => {
    set(() => ({ sectionOrder: DEFAULT_SECTION_ORDER }));
    localStorage.setItem(
      "sectionOrder",
      JSON.stringify({ sectionOrder: DEFAULT_SECTION_ORDER })
    );
  },

  toggleHiddenItem: (id) => {
    const current = get().hiddenItemIds;
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    set({ hiddenItemIds: next });
    localStorage.setItem("hiddenItemIds", JSON.stringify({ hiddenItemIds: next }));
  },

  toggleHideItem: (id) => {
    get().toggleHiddenItem(id);
  },

  setHiddenItemIds: (ids) => {
    set({ hiddenItemIds: ids });
    localStorage.setItem("hiddenItemIds", JSON.stringify({ hiddenItemIds: ids }));
  },

  toggleHideSection: (section) => {
    const current = get().hiddenSections;
    const next = current.includes(section)
      ? current.filter((key) => key !== section)
      : [...current, section];
    set({ hiddenSections: next });
    localStorage.setItem("hiddenSections", JSON.stringify({ hiddenSections: next }));
    get().setData({ hiddenSections: next });
  },

  setHiddenSections: (sections) => {
    set({ hiddenSections: sections });
    localStorage.setItem("hiddenSections", JSON.stringify({ hiddenSections: sections }));
    get().setData({ hiddenSections: sections });
  },

  resetResume: () => {
    localStorage.removeItem("resumeData");
    localStorage.removeItem("sectionOrder");
    localStorage.removeItem("hiddenItemIds");
    localStorage.removeItem("hiddenSections");
    set({
      resumeData: DEFAULT_RESUME_DATA,
      sectionOrder: DEFAULT_SECTION_ORDER,
      hiddenItemIds: [],
      hiddenSections: [],
    });
  },
}));

const persistedPdfSettings = readLocalStorage<Partial<PdfSettings>>("pdfSetting");
if (persistedPdfSettings) {
  let hasChanges = false;
  if (persistedPdfSettings.skillsLayout === undefined) {
    persistedPdfSettings.skillsLayout = "inline";
    hasChanges = true;
  }
  if (
    persistedPdfSettings.lineHeight === undefined ||
    typeof persistedPdfSettings.lineHeight !== "number" ||
    Number.isNaN(persistedPdfSettings.lineHeight)
  ) {
    persistedPdfSettings.lineHeight = DEFAULT_PDF_SETTINGS.lineHeight; // 5 -> 1.25rem
    hasChanges = true;
  }
  if (hasChanges && typeof window !== "undefined") {
    try {
      localStorage.setItem("pdfSetting", JSON.stringify(persistedPdfSettings));
    } catch {
      // ignore
    }
  }
}

export interface PdfSettingsStoreState {
  pdfSettings: PdfSettings;
  setValue: <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => void;
  updatePdfSettings: (patch: Partial<PdfSettings>) => void;
  resetPdfSettings: () => void;
}

export const usePdfSettingsStore = create<PdfSettingsStoreState>((set) => ({
  pdfSettings: {
    ...DEFAULT_PDF_SETTINGS,
    ...persistedPdfSettings,
    lineHeight:
      typeof persistedPdfSettings?.lineHeight === "number" &&
      !Number.isNaN(persistedPdfSettings.lineHeight)
        ? persistedPdfSettings.lineHeight
        : DEFAULT_PDF_SETTINGS.lineHeight,
    margin: normalizeMargin(persistedPdfSettings?.margin),
  },
  setValue: (key, value) => {
    set((state) => {
      const nextSettings: PdfSettings = {
        ...state.pdfSettings,
        [key]: value,
      };
      localStorage.setItem("pdfSetting", JSON.stringify(nextSettings));
      return { pdfSettings: nextSettings };
    });
  },
  updatePdfSettings: (patch) => {
    set((state) => {
      const nextSettings: PdfSettings = {
        ...state.pdfSettings,
        ...patch,
        margin: normalizeMargin({
          ...state.pdfSettings.margin,
          ...(patch.margin || {}),
        }),
      };
      localStorage.setItem("pdfSetting", JSON.stringify(nextSettings));
      return { pdfSettings: nextSettings };
    });
  },
  resetPdfSettings: () => {
    localStorage.removeItem("pdfSetting");
    set({ pdfSettings: DEFAULT_PDF_SETTINGS });
  },
}));

export interface ReviewStoreState {
  currentAnalysis: CVAnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  setAnalysis: (analysis: CVAnalysisResult) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  clearAnalysis: () => void;
  setError: (error: string | null) => void;
}

export const useReviewStore = create<ReviewStoreState>((set) => ({
  currentAnalysis: readLocalStorage<CVAnalysisResult>("currentAnalysis", null),
  isAnalyzing: false,
  error: null,
  setAnalysis: (analysis) => {
    localStorage.setItem("currentAnalysis", JSON.stringify(analysis));
    set({ currentAnalysis: analysis });
  },
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  clearAnalysis: () => {
    localStorage.removeItem("currentAnalysis");
    set({ currentAnalysis: null });
  },
  setError: (error) => set({ error }),
}));
