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
  dateOfBirth: z
    .object({
      value: z.string(),
      breakAfter: z.boolean(),
    })
    .optional(),
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

export const researchItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  role: z.string().trim().optional().default(""),
  publisher: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
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

export const softSkillItemSchema = skillItemSchema;

export const languageItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  level: z.string().optional().default(""),
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
  email: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  website: z.string().optional().default(""),
  phone: z.object({
    value: z.string(),
    breakAfter: z.boolean().optional().default(false),
  }),
  location: z.object({
    value: z.string(),
    breakAfter: z.boolean().optional().default(false),
  }),
  dateOfBirth: z
    .object({
      value: z.string().optional().default(""),
      breakAfter: z.boolean().optional().default(false),
    })
    .optional()
    .default({ value: "", breakAfter: false }),
  customFields: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        iconName: z.string(),
        value: z.string(),
        breakAfter: z.boolean().optional(),
      })
    )
    .optional()
    .default([]),
  alignment: z.enum(["start", "center", "end"]).optional(),
  photo: z
    .object({
      url: z.string(),
      size: z.number(),
      borderRadius: z.number(),
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
  website: z.string().optional().default(""),
  summary: z.string(),
});

export const importProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  date: z.string(),
  website: z.string().optional().default(""),
  summary: z.string(),
  keywords: z.array(z.string()).optional().default([]),
});

export const importResearchSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional().default(""),
  publisher: z.string().optional().default(""),
  description: z.string().optional().default(""),
  date: z.string().optional().default(""),
  website: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  keywords: z.array(z.string()).optional().default([]),
});

export const importEducationSchema = z.object({
  id: z.string(),
  name: z.string(),
  degree: z.string(),
  studyField: z.string(),
  date: z.string(),
  website: z.string().optional().default(""),
  summary: z.string(),
});

export const importSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  keywords: z.array(z.string()).optional().default([]),
});

export const importLanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.string(),
  certificate: z.string().optional(),
  score: z.string().optional(),
  date: z.string().optional(),
  website: z.string().optional(),
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
  keywords: z.array(z.string()).optional().default([]),
});

export const importSectionTitlesSchema = z.object({
  summary: z.string().optional(),
  experience: z.string().optional(),
  projects: z.string().optional(),
  research: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
  softSkills: z.string().optional(),
  languages: z.string().optional(),
  certifications: z.string().optional(),
  awards: z.string().optional(),
  volunteering: z.string().optional(),
  interests: z.string().optional(),
});

export const importPdfSettingsSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number(),
  fontCategory: z
    .enum([
      "serif",
      "sans-serif",
      "monospace",
      "display",
      "handwriting",
      "ATS-Friendly",
    ])
    .or(z.string()),
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
    TOP: z.number().optional(),
    BOTTOM: z.number().optional(),
    LEFT: z.number().optional(),
    RIGHT: z.number().optional(),
  }),
});

export const cvMasterJsonSchema = z.object({
  cvLanguage: z.enum(['en', 'vi']).optional(),
  basics: importBasicsSchema,
  summary: importSummarySchema,
  experience: z.array(importExperienceSchema).optional().default([]),
  projects: z.array(importProjectSchema).optional().default([]),
  research: z.array(importResearchSchema).optional().default([]),
  education: z.array(importEducationSchema).optional().default([]),
  skills: z.array(importSkillSchema).optional().default([]),
  softSkills: z.array(importSkillSchema).optional().default([]),
  languages: z.array(importLanguageSchema).optional().default([]),
  certifications: z.array(z.any()).optional().default([]),
  awards: z.array(z.any()).optional().default([]),
  volunteering: z.array(z.any()).optional().default([]),
  interests: z.array(importInterestSchema).optional().default([]),
  sectionTitles: importSectionTitlesSchema.optional(),
  pdfSettings: importPdfSettingsSchema.optional(),
  hiddenItemIds: z.array(z.string()).optional().default([]),
  hiddenSections: z.array(z.string()).optional().default([]),
});
