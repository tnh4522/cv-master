# CVMaster Interactive Workflows Index

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page`)
- `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8` (`capture_browser_scenario`)
- `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846` (`capture_browser_scenario` lazy chunks)
- `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`analyze_javascript_application` core bundles)
- `ev_d4721be36551ad83b213a9ce8e88eb21139d01a77308e34ce54e9050fed14e11` (`analyze_javascript_application` lazy chunks)

---

## Workflow Documentation Directory

This directory documents every interactive workflow in **CVMaster**, organized by functional domain:

1. **[cv-creation-and-editing.md](./cv-creation-and-editing.md)**  
   Covers default template hydration, editing Basics (`dp`), uploading and styling profile photos (`ip`), managing custom contact fields (`op`), editing the rich-text Summary (`Ue`), inline renaming of section headings (`cp`), CRUD operations and Zod validation across all 8 list sections (`fp`–`Tp`), non-destructive item hiding (`toggleHideItem`), and full resume reset (`Kp`).

2. **[customization-and-controls.md](./customization-and-controls.md)**  
   Covers the left-side `Controls` sheet (`Sa`), font category filtering (`Hr`), `cmdk` font search and `IntersectionObserver`-driven Google Fonts lazy loading (`mu`, `du`, `wu`), typography and A4 margin sliders (`ya`), header alignment and skills layout radio groups (`ba`), and drag-and-drop section reordering (`DndSections-CIlCdOj4.js`).

3. **[preview-and-canvas.md](./preview-and-canvas.md)**  
   Covers the `react-zoom-pan-pinch` canvas (`Ca`), floating zoom/center/page-break toolbar (`Su`), real-time A4 sheet rendering (`$r`, `793.8px x 1122.66px`), `ResizeObserver` page-break line indicator (`fu`), desktop `Preview` sidebar collapse mode, and mobile `<1024px` `Editor` / `Preview` tabs.

4. **[import-and-export.md](./import-and-export.md)**  
   Covers importing resumes via JSON (`hf`), PDF text extraction + Groq LLM parsing (`mf`, `Fu`), and Image Vision LLM parsing + heuristic validation (`pf`, `zu`, `Uu`), as well as exporting resumes to JSON (`<Name>_CV.json`) and server-rendered PDF (`POST /pdf` + background `POST /upload-pdf`).

5. **[ai-features-and-review.md](./ai-features-and-review.md)**  
   Covers the embedded Tiptap AI Writing Assistant (`Xu`: `Improve Writing`, `Fix Typos`, and 6 `Customize` presets with a 30-character minimum) and the end-to-end AI CV Review workflow (`Ma` modal -> `Bu` Groq analysis -> `/review` 4-tab interactive report dashboard).

6. **[unimplemented-or-absent-workflows.md](./unimplemented-or-absent-workflows.md)**  
   Documents workflows commonly expected in commercial resume builders that are verified to be **absent** in CVMaster: User Registration, Login/Authentication, Cloud Account Sync, Multi-Resume Management, and Multi-Template Switching.

---

## Summary Matrix of Workflows & Verification Status

| Workflow | Document | Static Code Verification | Runtime DOM/Network Verification | Requires Manual End-to-End Human Inspection? |
|---|---|---|---|---|
| Default CV Hydration & LocalStorage Persistence | `cv-creation-and-editing.md` | `Verified` | `Verified` | No |
| Basics & Custom Fields Editing | `cv-creation-and-editing.md` | `Verified` | `Verified` | No |
| Profile Photo Upload (`POST /upload-photo`) | `cv-creation-and-editing.md` | `Verified` | `Inferred` (endpoint contract verified; live upload not triggered) | **Yes** (verify live image upload & returned URL host) |
| Section Item CRUD, Hide-from-PDF & Inline Rename | `cv-creation-and-editing.md` | `Verified` | `Verified` | No |
| Reset Resume (`Kp`) | `cv-creation-and-editing.md` | `Verified` | `Verified` | No |
| Typography, Margins, Alignment & Section DND (`Sa`) | `customization-and-controls.md` | `Verified` | `Verified` (lazy chunk `DndSections-CIlCdOj4.js` fetched) | No |
| Zoom/Pan Canvas, Page Break Indicator & Preview Mode | `preview-and-canvas.md` | `Verified` | `Verified` | No |
| JSON Import & Export | `import-and-export.md` | `Verified` | `Verified` | No |
| PDF & Image Resume Import (Groq AI Parsing) | `import-and-export.md` | `Verified` | `Inferred` (`pdf.min.js` loaded; Groq prompts & schemas verified) | **Yes** (test live PDF/Image file parsing accuracy & latency) |
| PDF Export (`POST /pdf` & `POST /upload-pdf`) | `import-and-export.md` | `Verified` | `Inferred` (HTML serializer & payload verified) | **Yes** (verify server-rendered PDF pagination & font fidelity) |
| Tiptap AI Writing Assistant (`Improve`, `Fix Typos`, `Customize`) | `ai-features-and-review.md` | `Verified` | `Inferred` (Groq SDK calls & prompts verified) | **Yes** (verify live Groq `llama-3.1-8b-instant` response behavior) |
| AI CV Review (`Ma` -> `/review` Report Dashboard) | `ai-features-and-review.md` | `Verified` | `Verified` (lazy chunk `ReviewPage-BNk1S44H.js` fetched) | **Yes** (verify live Groq `openai/gpt-oss-120b` JSON output against `/review` UI) |
| Registration, Login & Multi-Template Selection | `unimplemented-or-absent-workflows.md` | `Verified` (Confirmed Absent) | `Verified` (Confirmed Absent) | No |
