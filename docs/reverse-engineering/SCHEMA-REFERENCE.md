# CVMaster — Complete Zod Schema & Data Model Reference

**Phase**: Phase 1 — Codebase Audit  
**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Sources**:
- `assets/index-B9ESfVPA.js` (`248,019` B, SHA256 `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867`)
  - Editor & Form Schemas: `be`, `pp`, `hp`, `xp`, `yp`, `wp`, `Np`, `Cp`, `Ep`, `hf`
  - Import & Export Document Schemas: `Zp`, `qp`, `Qp`, `ef`, `tf`, `sf`, `nf`, `rf`, `af`, `of`, `lf`, `cf`
- `assets/ReviewPage-BNk1S44H.js` (`20,237` B, SHA256 `8b36c0f57433369c5ed397f97437a3c9d9e70d0c9562e390155893915c45e4f0`)

---

## 1. Zod Primitive Mapping in Bundle (`assets/forms-DW1-mji3.js`)

In `assets/index-B9ESfVPA.js`, Zod constructors are imported with the following minified aliases:
- `v` = `z.string`
- `W` = `z.object`
- `ae` = `z.array`
- `ce` = `z.literal`
- `ze` = `z.boolean`
- `xr` = `z.enum`
- `Se` = `z.number`
- `Xt` = `z.any`

---

## 2. Editor & Modal Form Validation Schemas

### 2.1 Personal Info / Basics Inline Validation Schema (`be`)
Used by `Du` (`BasicsEditor`) to compute real-time `hasError` flags on inputs (`!be.pick({ field: true }).safeParse({ field: value }).success`):

```ts
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
      breakAfter: z.boolean(),
    })
  ),
});
```
- **Supported `customFields[].iconName` keys (`Yr`)**:
  `"email" | "phone" | "whatsapp" | "location" | "link" | "website" | "user" | "briefcase" | "linkedin" | "github" | "behance" | "dribbble" | "facebook" | "x" | "youtube"`

### 2.2 Experience Modal Schema (`pp` in `fp`)
```ts
export const experienceItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Company is required" }),
  position: z.string().trim().min(1, { message: "Position is required" }),
  dateRange: z.string().trim().min(1, { message: "Date range is required" }),
  location: z.string().trim(),
  employmentType: z.string().min(1, { message: "Employment Type is required" }),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});
```
- **Select Options for `employmentType`**: `"Full-time"`, `"Part-time"`, `"Freelance"`, `"Internship"`.
- **Default Values**: `{ id: "", name: "", position: "", location: "", employmentType: "", dateRange: "", website: "", summary: "" }`.

### 2.3 Projects Modal Schema (`hp` in `gp`)
```ts
export const projectItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  description: z.string().trim(),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string(),
  keyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});
```
- **Default Values**: `{ id: "", name: "", description: "", date: "", website: "", summary: "", keyword: "", keywords: [] }`.

### 2.4 Education Modal Schema (`xp` in `vp`)
```ts
export const educationItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }), // UI Label: "School"
  degree: z.string().trim(),
  studyField: z.string().trim().min(1, { message: "Study Field is required" }),
  date: z.string().trim().min(1, { message: "Date range is required" }),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});
```
- **Default Values**: `{ id: "", name: "", degree: "", studyField: "", date: "", website: "", summary: "" }`.

### 2.5 Skills Modal Schema (`yp` in `jp`)
```ts
export const skillItemSchema = z.object({
  name: z.string().trim(),
  keyword: z.string().optional(),
  keywords: z.array(z.string()).min(1, { message: "Keywords are required" }),
});
```
- **Default Values**: `{ id: "", name: "", keyword: "", keywords: [] }`.

### 2.6 Languages Modal Schema (`wp` in `bp`)
```ts
export const languageItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  level: z.string().min(1, { message: "Level is required" }),
});
```
- **Select Options for `level`**: `"Basic"`, `"Conversational"`, `"Advanced"`, `"Fluent"`, `"Native or Bilingual"`.
- **Default Values**: `{ id: "", name: "", level: "" }`.

### 2.7 Certifications Modal Schema (`Np` in `Sp`)
```ts
export const certificationItemSchema = z.object({
  name: z.string().trim().optional(),
  issuer: z.string().trim().optional(),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});
```
- **Default Values**: `{ id: "", name: "", issuer: "", date: "", website: "", summary: "" }`.

### 2.8 Awards Modal Schema (`Cp` in `Pp`)
```ts
export const awardItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }), // UI Label: "Title"
  issuer: z.string().trim().min(1, { message: "Issuer is required" }),
  date: z.string().trim(),
  website: z.literal("").or(z.string().url()),
  summary: z.string().trim(),
});
```
- **Default Values**: `{ id: "", name: "", issuer: "", date: "", website: "", summary: "" }`.

### 2.9 Volunteering Modal Schema (`Ep` in `Tp`)
```ts
export const volunteeringItemSchema = z.object({
  name: z.string().trim().min(1, { message: "Organization is required" }), // UI Label: "Organization"
  position: z.string().trim().min(1, { message: "Position is required" }),
  date: z.string().trim(), // UI Label: "Date or Date Range"
  location: z.string().trim(),
  summary: z.string().trim(),
});
```
- **Default Values**: `{ id: "", name: "", position: "", date: "", location: "", summary: "" }`.

### 2.10 AI CV Review Request Schema (`hf` in `gf`)
```ts
export const aiReviewInputSchema = z.object({
  jobTitle: z.string().min(5),
  jobDescription: z.string().min(100),
});
```
- **Validation Error Toast**: `"Title must be at least 5 characters long and job description must be at least 100 characters long."`

---

## 3. CV Master JSON Import Validation Schema (`Zp`–`cf` in `df`)

Used when validating `.json` files in `Import -> CV Master JSON` (`df`):

```ts
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
    })
  ),
  alignment: z.enum(["start", "center", "end"]).optional(),
  photo: z.object({
    url: z.string(),
    size: z.number().min(40).max(200),
    borderRadius: z.number().min(0).max(100),
    visible: z.boolean(),
  }),
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
  skillsLayout: z.string(),
  pageBreakLine: z.boolean(),
  margin: z.object({
    MIN: z.number(),
    MAX: z.number(),
    VALUE: z.number(),
    INITIAL: z.number(),
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
  sectionTitles: importSectionTitlesSchema,
  pdfSettings: importPdfSettingsSchema,
  hiddenItemIds: z.array(z.string()).optional(),
});
```

---

## 4. AI CV Review Output Schema (`Bu` & `ReviewPage-BNk1S44H.js`)

The AI CV Review function (`Bu`) and `/review` dashboard (`ReviewPage-BNk1S44H.js`) consume the following structure:

```ts
export const cvAnalysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  jobFitPercentage: z.number().min(0).max(100),
  summary: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    fitLevel: z.enum(["Excellent", "Good", "Fair", "Poor"]).or(z.string()),
  }),
  detailedAnalysis: z.object({
    contentAlignment: z.object({
      score: z.number(),
      feedback: z.string(),
      matchingSkills: z.array(z.string()),
      missingSkills: z.array(z.string()),
    }),
    experienceRelevance: z.object({
      score: z.number(),
      feedback: z.string(),
      relevantExperience: z.array(z.string()),
      experienceGaps: z.array(z.string()),
    }),
    resumeStructure: z.object({
      score: z.number(),
      feedback: z.string(),
      sectionsToImprove: z.array(
        z.object({
          sectionName: z.string(),
          improvement: z.string(),
        })
      ),
    }),
    atsCompatibility: z.object({
      score: z.number(),
      feedback: z.string(),
      missingKeywords: z.array(z.string()),
    }),
  }),
  recommendations: z.object({
    highPriority: z.array(z.string()),
    mediumPriority: z.array(z.string()),
    lowPriority: z.array(z.string()),
  }),
  specificImprovements: z.record(z.string(), z.array(z.string())),
  nextSteps: z.array(z.string()),
  estimatedImprovementTime: z.string(),
  isResume: z.boolean().optional(),
});
```
- **Important Field Alignment Note**:
  - Notice that `estimatedImprovementTime` is a top-level field on `currentAnalysis` (`r?.estimatedImprovementTime` in `ReviewPage-BNk1S44H.js`), `experienceRelevance` uses `relevantExperience` and `experienceGaps`, `resumeStructure` uses `sectionsToImprove: Array<{ sectionName, improvement }>`, and `atsCompatibility` uses `missingKeywords`. Our schema and mock/live AI adapters must strictly match these property names.
