# CVMaster — State Management & Persistence Reference

**Phase**: Phase 1 — Codebase Audit  
**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Sources**:
- `assets/state-LogT9lEE.js` (`665` B, SHA256 `8c2957b65bf0494f754d9e894c879ff4fa20c139469fc5eb2cd13993dd90c6fb`)
- `assets/index-B9ESfVPA.js` (`248,019` B, SHA256 `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867`, symbols `k`, `zd`, `_d`, `ct`, `Y`, `ee`, `Hd`, `Li`, `kp`)

---

## 1. Zustand Store Architecture Overview

CVMaster uses **Zustand** (`create` exported as `c` from `assets/state-LogT9lEE.js` and imported as `hs` in `assets/index-B9ESfVPA.js`). Rather than using Zustand's `persist` middleware wrapper, CVMaster uses a helper function `ct(key, fallback)` to hydrate initial state from `window.localStorage` at module evaluation time and explicitly calls `localStorage.setItem(...)` inside each store setter.

### Hydration Helper (`ct`)
```ts
const getFromLocalStorage = <T>(key: string, fallback: T | null = null): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return fallback;
  }
};
```

### Browser Storage Keys Summary
| Storage Type | Key Name | Managed By | Stored JSON Structure |
|---|---|---|---|
| `localStorage` | `"resumeData"` | Store `Y` (`useResumeStore`) | `ResumeData` object (`basics`, `summary`, 8 section arrays, `sectionTitles`) |
| `localStorage` | `"sectionOrder"` | Store `Y` (`useResumeStore`) | `{ sectionOrder: SectionKey[] }` |
| `localStorage` | `"hiddenItemIds"` | Store `Y` (`useResumeStore`) | `{ hiddenItemIds: string[] }` |
| `localStorage` | `"pdfSetting"` | Store `ee` (`usePdfSettingsStore`) | `PdfSettings` object (`fontSize`, `fontFamily`, `fontCategory`, `scale`, `lineHeight`, `verticalSpacing`, `margin`, `pageBreakLine`, `skillsLayout`) |
| `localStorage` | `"currentAnalysis"` | Store `Hd` (`useReviewStore`) | `CVAnalysisResult` object from AI CV Review |
| `localStorage` | `"cv-master-theme"` | Context `Li` (`ThemeProvider`) | Raw string: `"light"` \| `"dark"` \| `"system"` |
| `sessionStorage` | `"hasVisited"` | Component `yf` (`WorkspacePage`) | Raw string: `"true"` (suppresses the `500ms` initial splash screen on subsequent reloads within the same tab session) |

---

## 2. Global Configuration Constants (`k`, `Qs`, `en`)

Defined in `assets/index-B9ESfVPA.js`:

```ts
export const CONFIG = {
  SCALE: {
    MIN: 0.4,
    MAX: 2,
    INITIAL: 0.65,
    SMALL: 0.4,   // viewport width < 430px
    MEDIUM: 0.5,  // viewport width < 640px
    LARGE: 0.75,  // viewport width >= 1280px
    STEP: 0.25,
  },
  FONTSIZE: {
    MIN: 12,
    MAX: 18,
    INITIAL: 14,
    STEP: 1,
  },
  LINEHEIGHT: {
    MIN: 4,
    MAX: 10,
    INITIAL: 5,
    STEP: 1,
  },
  VERTICALSPACING: {
    MIN: 1,
    MAX: 10,
    INITIAL: 2,
    STEP: 1,
  },
  MARGIN: {
    MIN: 10,
    MAX: 50,
    INITIAL: 20,
    VALUE: 20,
    STEP: 1,
  },
  PHOTO: {
    SIZE: { MIN: 40, MAX: 200, DEFAULT: 100 },
    RADIUS: { MIN: 0, MAX: 100, DEFAULT: 4 },
  },
} as const;

export const A4_DIMENSIONS_MM = { width: 210, height: 297 };
export const MM_TO_PX = 3.78; // 210 * 3.78 = 793.8px width, 297 * 3.78 = 1122.66px height
```

---

## 3. Store 1: Resume Data Store (`Y` / `useResumeStore`)

### 3.1 Default Resume State (`zd`)
```ts
export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "languages",
  "certifications",
  "awards",
  "volunteering",
];

export const DEFAULT_RESUME_DATA: ResumeData = {
  basics: {
    name: "John Doe",
    title: "Software Developer",
    email: "youremail@domain.com",
    linkedin: "http://linkedin.com/in/johndoe",
    website: "http://johndoe.com",
    phone: { value: "+010101010", breakAfter: false },
    location: { value: "Cairo, Egypt", breakAfter: false },
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
    content: "",
  },
  experience: [],
  projects: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  awards: [],
  volunteering: [],
  sectionTitles: {
    summary: "Summary",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    certifications: "Certifications",
    awards: "Awards",
    volunteering: "Volunteering",
  },
};
```

### 3.2 Store Implementation & Actions
```ts
interface ResumeStoreState {
  sectionOrder: SectionKey[];
  hiddenItemIds: string[];
  resumeData: ResumeData;
  setData: (partial: Partial<ResumeData>) => void;
  setSectionOrder: (order: SectionKey[]) => void;
  toggleHiddenItem: (id: string) => void;
  setHiddenItemIds: (ids: string[]) => void;
}
```
- **Hydration Details**:
  - `Vd = getFromLocalStorage("resumeData")`
  - `Ud = getFromLocalStorage("sectionOrder")`
  - `Bd = getFromLocalStorage("hiddenItemIds")?.hiddenItemIds ?? []`
  - Initial state merges `{ sectionOrder: DEFAULT_SECTION_ORDER, ...Ud, hiddenItemIds: Bd, resumeData: { ...DEFAULT_RESUME_DATA, ...Vd } }`.
- **Action Behavior**:
  - `setData(partial)`: Shallow-merges `partial` into `state.resumeData`, saves the merged `resumeData` to `localStorage.setItem("resumeData", JSON.stringify(merged))`, and updates store state.
  - `setSectionOrder(order)`: Sets `sectionOrder: order` and writes `localStorage.setItem("sectionOrder", JSON.stringify({ sectionOrder: order }))`.
  - `toggleHiddenItem(id)`: If `id` is in `hiddenItemIds`, removes it; otherwise appends it. Writes `localStorage.setItem("hiddenItemIds", JSON.stringify({ hiddenItemIds: next }))`.
  - `setHiddenItemIds(ids)`: Replaces `hiddenItemIds` and writes `localStorage.setItem("hiddenItemIds", JSON.stringify({ hiddenItemIds: ids }))`.

---

## 4. Store 2: PDF & Typography Settings Store (`ee` / `usePdfSettingsStore`)

### 4.1 Default PDF Settings (`_d`)
```ts
export const DEFAULT_PDF_SETTINGS: PdfSettings = {
  fontSize: 14,
  fontFamily: "Work Sans",
  fontCategory: "ATS-Friendly",
  scale: 0.65,
  lineHeight: 5,
  verticalSpacing: 1,
  margin: {
    MIN: 10,
    MAX: 50,
    INITIAL: 20,
    VALUE: 20,
    STEP: 1,
  },
  pageBreakLine: true,
  skillsLayout: "inline",
};
```

### 4.2 Store Implementation & Backward-Compatibility Migration
- Before creating store `ee`, CVMaster runs a migration check on `Qe = getFromLocalStorage("pdfSetting")`:
  ```ts
  if (Qe && Qe.skillsLayout === undefined) {
    Qe.skillsLayout = "inline";
    localStorage.setItem("pdfSetting", JSON.stringify(Qe));
  }
  ```
- **Store Interface**:
  ```ts
  interface PdfSettingsStoreState {
    pdfSettings: PdfSettings;
    setValue: <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => void;
  }
  ```
- **Note on Known Quirks in Original `pf` (`useImageImport`)**:
  - In `pf` (`assets/index-B9ESfVPA.js`), the original code calls `d("pdfSettings.lineHeight", ...)` instead of `d("lineHeight", ...)`. In our clean reimplementation, we will normalize this to `setValue("lineHeight", ...)` so imported image settings properly update `lineHeight`, `verticalSpacing`, and `margin`.

---

## 5. Store 3: AI CV Review Store (`Hd` / `useReviewStore`)

### 5.1 Store Interface & Persistence
```ts
interface ReviewStoreState {
  currentAnalysis: CVAnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  setAnalysis: (analysis: CVAnalysisResult) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  clearAnalysis: () => void;
  setError: (error: string | null) => void;
}
```
- **Hydration**: `currentAnalysis: getFromLocalStorage("currentAnalysis", null)`.
- **Actions**:
  - `setAnalysis(analysis)`: Writes `localStorage.setItem("currentAnalysis", JSON.stringify(analysis))` and sets `{ currentAnalysis: analysis }`.
  - `setIsAnalyzing(isAnalyzing)`: Updates transient loading flag (used to display the fullscreen `"AI is reviewing your CV..."` overlay inside `gf`).
  - `clearAnalysis()`: Removes `"currentAnalysis"` from `localStorage` and sets `{ currentAnalysis: null }`.
  - `setError(error)`: Sets transient error string.

---

## 6. React Context Providers (`Li` ThemeProvider & `kp` DialogProvider)

1. **`Li` (`ThemeProvider`)**:
   - State: `theme` initialized from `localStorage.getItem("cv-master-theme") || "system"`.
   - Effect: Removes `"light"` and `"dark"` from `document.documentElement.classList`. If `theme === "system"`, resolves `window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"`, updates local state, and adds the resolved class to `document.documentElement`.
2. **`kp` (`DialogProvider` / `Fa`)**:
   - State:
     - `activeSection: SectionKey | null` (`null` when closed)
     - `index: number | null` (`null` when adding a new item; `0..N-1` when editing an existing item at that array index)
   - Methods:
     - `openDialog(section)`: Opens the modal for `section` in Create mode (`index = null`).
     - `updateDialog(section, itemIndex)`: Opens the modal for `section` in Edit mode (`index = itemIndex`).
     - `closeDialog()`: Resets `activeSection = null` and `index = null`.
     - `isOpen(section)`: Returns `activeSection === section`.
