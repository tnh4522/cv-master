import type { FontCategory } from "@/lib/utils";

export type SectionKey =
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "awards"
  | "volunteering"
  | "interests";

export type ListSectionKey = Exclude<SectionKey, "summary">;

export type AlignmentType = "start" | "center" | "end";
export type SkillsLayoutType = "inline" | "grid-col" | "grid-row";

export type CustomFieldIconName =
  | "email"
  | "phone"
  | "whatsapp"
  | "location"
  | "link"
  | "website"
  | "user"
  | "briefcase"
  | "linkedin"
  | "github"
  | "behance"
  | "dribbble"
  | "facebook"
  | "x"
  | "youtube";

export interface CustomFieldItem {
  id: string;
  name: string;
  iconName: string;
  value: string;
  breakAfter?: boolean;
}

export type CustomField = CustomFieldItem;

export type SectionItemUnion =
  | ExperienceItem
  | ProjectItem
  | EducationItem
  | SkillItem
  | LanguageItem
  | CertificationItem
  | AwardItem
  | VolunteeringItem
  | InterestItem;

export interface PhotoConfig {
  url: string;
  size: number;
  borderRadius: number;
  visible: boolean;
}

export interface BasicsData {
  name: string;
  title: string;
  email: string;
  linkedin: string;
  website: string;
  phone: {
    value: string;
    breakAfter: boolean;
  };
  location: {
    value: string;
    breakAfter: boolean;
  };
  dateOfBirth?: {
    value: string;
    breakAfter: boolean;
  };
  customFields: CustomFieldItem[];
  alignment: AlignmentType;
  photo: PhotoConfig;
}

export interface SummaryData {
  sectionTitle: string;
  content: string;
}

export interface ExperienceItem {
  id: string;
  name: string;
  position: string;
  dateRange: string;
  location: string;
  employmentType: string;
  website: string;
  summary: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  date: string;
  website: string;
  summary: string;
  keywords: string[];
  keyword?: string;
}

export interface EducationItem {
  id: string;
  name: string;
  degree: string;
  studyField: string;
  date: string;
  website: string;
  summary: string;
}

export interface SkillItem {
  id: string;
  name: string;
  keywords: string[];
  keyword?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
  certificate?: string;
  score?: string;
  date?: string;
  website?: string;
  listening?: string;
  speaking?: string;
  reading?: string;
  writing?: string;
  description?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  website: string;
  summary: string;
}

export interface AwardItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  website: string;
  summary: string;
}

export interface VolunteeringItem {
  id: string;
  name: string;
  position: string;
  date: string;
  location: string;
  summary: string;
}

export interface InterestItem {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  keyword?: string;
}

export type SectionTitlesMap = Record<SectionKey, string>;

export interface ResumeData {
  basics: BasicsData;
  summary: SummaryData;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  skills: SkillItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  volunteering: VolunteeringItem[];
  interests: InterestItem[];
  sectionTitles: SectionTitlesMap;
  pdfSettings?: PdfSettings;
  hiddenItemIds?: string[];
}

export interface MarginSetting {
  MIN: number;
  MAX: number;
  INITIAL: number;
  VALUE: number;
  STEP?: number;
}

export interface PdfSettings {
  fontSize: number;
  fontFamily: string;
  fontCategory: FontCategory;
  scale: number;
  lineHeight: number;
  verticalSpacing: number;
  margin: MarginSetting;
  pageBreakLine: boolean;
  skillsLayout: SkillsLayoutType;
}

export interface CVAnalysisResult {
  overallScore: number;
  jobFitPercentage: number;
  summary: {
    strengths: string[];
    weaknesses: string[];
    fitLevel: "Excellent" | "Good" | "Fair" | "Poor" | string;
  };
  detailedAnalysis: {
    contentAlignment: {
      score: number;
      feedback: string;
      matchingSkills: string[];
      missingSkills: string[];
    };
    experienceRelevance: {
      score: number;
      feedback: string;
      relevantExperience: string[];
      experienceGaps: string[];
    };
    resumeStructure: {
      score: number;
      feedback: string;
      sectionsToImprove: Array<{
        sectionName: string;
        improvement: string;
      }>;
    };
    atsCompatibility: {
      score: number;
      feedback: string;
      missingKeywords: string[];
    };
  };
  recommendations: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
  specificImprovements: Record<string, string[]>;
  nextSteps: string[];
  estimatedImprovementTime: string;
  isResume?: boolean;
}
