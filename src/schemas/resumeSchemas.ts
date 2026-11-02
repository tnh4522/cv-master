import { z } from "zod";

export const basicsFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  title: z.string().trim().min(1, { message: "Title is required" }),
  email: z.string().email(),
  linkedin: z.literal("").or(z.string().url()),
  website: z.literal("").or(z.string().url()),
  phone: z.object({
    value: z.string(),
    breakAfter: z.boolean(),
  }),
  location: z.object({
    value: z.string(),
    breakAfter: z.boolean(),
  }),
  customFields: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      iconName: z.string(),
      value: z.string(),
      breakAfter: z.boolean().optional(),
    })
  ),
});

export const experienceItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Company is required" }),
  position: z.string().trim().min(1, { message: "Position is required" }),
  dateRange: z.string().trim().min(1, { message: "Date range is required" }),
  location: z.string().trim(),
  employmentType: z.string().min(1, { message: "Employment Type is required" }),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});

export const projectItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  description: z.string().trim(),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string(),
  keyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const educationItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  degree: z.string().trim(),
  studyField: z.string().trim().min(1, { message: "Study Field is required" }),
  date: z.string().trim().min(1, { message: "Date range is required" }),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});

export const skillItemSchema = z.object({
  name: z.string().trim(),
  keyword: z.string().optional(),
  keywords: z.array(z.string()).min(1, { message: "Keywords are required" }),
});

export const languageItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  level: z.string().min(1, { message: "Level is required" }),
  certificate: z.string().trim().optional(),
  score: z.string().trim().optional(),
  date: z.string().trim().optional(),
  website: z.literal("").or(z.string().url()).optional(),
  listening: z.string().trim().optional(),
  speaking: z.string().trim().optional(),
  reading: z.string().trim().optional(),
  writing: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const certificationItemSchema = z.object({
  name: z.string().trim().optional(),
  issuer: z.string().trim().optional(),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});

export const awardItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  issuer: z.string().trim().min(1, { message: "Issuer is required" }),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});

export const volunteeringItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Organization is required" }),
  position: z.string().trim().min(1, { message: "Position is required" }),
  date: z.string().trim(),
  location: z.string().trim(),
  summary: z.string().trim(),
});

export const interestItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  description: z.string().trim().optional(),
  keyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const aiReviewInputSchema = z.object({
  jobTitle: z.string().min(5),
  jobDescription: z.string().min(100),
});

export const importBasicsSchema = z.object({
  name: z.string(),
  title: z.string(),
  email: z.literal("").or(z.string().email()),
  linkedin: z.literal("").or(z.string().url()),
  website: z.literal("").or(z.string().url()),
  phone: z.object({
    value: z.string(),
    breakAfter: z.boolean(),
  }),
  location: z.object({
    value: z.string(),
    breakAfter: z.boolean(),
  }),
  customFields: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      iconName: z.string(),
      value: z.string(),
      breakAfter: z.boolean().optional(),
    })
  ),
  alignment: z.enum(["start", "center", "end"]).optional(),
  photo: z
    .object({
      url: z.string(),
      size: z.number().min(40).max(200),
      borderRadius: z.number().min(0).max(100),
      visible: z.boolean(),
    })
    .optional(),
});

export const importSummarySchema = z.object({
  sectionTitle: z.string(),
  content: z.string(),
});

export const importExperienceSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  dateRange: z.string(),
  location: z.string(),
  employmentType: z.string(),
  website: z.literal("").or(z.string().url()),
  summary: z.string(),
});

export const importProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  date: z.string(),
  website: z.literal("").or(z.string().url()),
  summary: z.string(),
  keywords: z.array(z.string()),
});

export const importEducationSchema = z.object({
  id: z.string(),
  name: z.string(),
  degree: z.string(),
  studyField: z.string(),
  date: z.string(),
  website: z.literal("").or(z.string().url()),
  summary: z.string(),
});

export const importSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  keywords: z.array(z.string()).optional(),
});

export const importLanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
  certificate: z.string().optional(),
  score: z.string().optional(),
  date: z.string().optional(),
  website: z.literal("").or(z.string().url()).optional(),
  listening: z.string().optional(),
  speaking: z.string().optional(),
  reading: z.string().optional(),
  writing: z.string().optional(),
  description: z.string().optional(),
});

export const importInterestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const importSectionTitlesSchema = z.object({
  summary: z.string(),
  experience: z.string(),
  projects: z.string(),
  education: z.string(),
  skills: z.string(),
  languages: z.string(),
  certifications: z.string(),
  awards: z.string(),
  volunteering: z.string(),
  interests: z.string().optional(),
});

export const importPdfSettingsSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number(),
  fontCategory: z.enum([
    "serif",
    "sans-serif",
    "monospace",
    "display",
    "handwriting",
    "ATS-Friendly",
  ]),
  lineHeight: z.number(),
  verticalSpacing: z.number(),
  skillsLayout: z.enum(["inline", "grid-col", "grid-row"]).or(z.string()),
  pageBreakLine: z.boolean(),
  scale: z.number().optional(),
  margin: z.object({
    MIN: z.number(),
    MAX: z.number(),
    VALUE: z.number(),
    INITIAL: z.number(),
    STEP: z.number().optional(),
  }),
});

export const cvMasterJsonSchema = z.object({
  basics: importBasicsSchema,
  summary: importSummarySchema,
  experience: z.array(importExperienceSchema),
  projects: z.array(importProjectSchema),
  education: z.array(importEducationSchema),
  skills: z.array(importSkillSchema),
  languages: z.array(importLanguageSchema),
  certifications: z.array(z.any()),
  awards: z.array(z.any()),
  volunteering: z.array(z.any()),
  interests: z.array(importInterestSchema).optional(),
  sectionTitles: importSectionTitlesSchema,
  pdfSettings: importPdfSettingsSchema,
  hiddenItemIds: z.array(z.string()).optional(),
});
