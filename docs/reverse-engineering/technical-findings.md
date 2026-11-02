# CVMaster Technical Findings

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8` (`capture_browser_scenario` initial load wire capture)
- `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846` (`capture_browser_scenario` lazy chunk capture)
- `ev_b2767a0bc06aee66e53d8ed3bb06b490c6b56b8b4b7c2c26a02933a5a23e2934` (`capture_browser_scenario` `/review` HTTP 404 verification)
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page` DOM, AX tree, console, and scripts)
- `ev_aa23f6dbd7756f79a749b8b1da8825cfd0d8f7cef63488cab739b619d75f971d` (`export_web_scripts`)
- `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`analyze_javascript_application` core chunks)
- `ev_d4721be36551ad83b213a9ce8e88eb21139d01a77308e34ce54e9050fed14e11` (`analyze_javascript_application` lazy chunks)

---

## 1. Build System & Bundle Topology

### Finding TF-01: Vite Manual Chunk Splitting & Asset Inventory
- **Description**:
  - CVMaster is built with **Vite** (`vite/preload-helper` signature `const scriptRel = 'modulepreload'` in `assets/index-B9ESfVPA.js`) using custom `build.rollupOptions.output.manualChunks` to split third-party libraries and application modules into 11 initial ES module chunks, 2 lazy-loaded route/component chunks, 1 CSS stylesheet, 1 external CDN script (`pdf.js`), and 1 Vercel Analytics script:
    | Asset Path / URL | Size (Bytes) | SHA256 Digest | Role |
    |---|---:|---|---|
    | `index.html` | `5,138` | `0e605734291520b174e873e376c19956bc2b274366c8b2c0e4844f5c0e5e5cb0` | SPA entry HTML, SEO meta, JSON-LD, modulepreload links |
    | `assets/index-dt7n0t0W.css` | `60,673` | *(captured in `ev_2445cd04...`)* | Tailwind CSS v3 + shadcn/ui CSS variables + `.prose` rules |
    | `assets/index-B9ESfVPA.js` | `157,802` | `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867` | Main application UI, components, modals, router, preview |
    | `assets/state-LogT9lEE.js` | `18,627` | `8c2957b65bf0494f754d9e894c879ff4fa20c139469fc5eb2cd13993dd90c6fb` | Zustand stores (`Y`, `ee`, `Hd`), Zod schemas, default template (`zd`), curated font list (`Fd`) |
    | `assets/services-Cix8ANSZ.js` | `110,971` | `16471190df5726f377d5fd5d8b2f811be5d1c0bc72330dd944fd5b18c26fa5ef` | Groq SDK client (`groq-sdk` v0.9.1), AI prompts/parsers (`Mu`, `Lu`, `Ou`, `Fu`, `zu`, `Bu`), Google Fonts loader (`yu`, `wu`) |
    | `assets/utils-C_1XUkXG.js` | `46,356` | `1fe03e2f5b17e645646fd681dddc3e6cc46f76a98e6ab1be8632746dd750ebae` | `clsx`, `tailwind-merge`, `react-zoom-pan-pinch`, `usehooks-ts` |
    | `assets/react-vendor-BUnTq23-.js` | `162,487` | `7a38767d70ca1395432506d60e018fa330b75bf7357b471b27a1385c42e81ef9` | React 18.3.1, React DOM, React Router DOM v6 |
    | `assets/radix-BU6_lYRH.js` | `124,043` | `d1924cb9d05fc96f13a7241e3c462cd0f2d987e30df01bb8c80217500b57978f` | Radix UI primitives + `cmdk` |
    | `assets/tiptap-D0TUE6zV.js` | `368,266` | `fd38370fc74d7477292bf9b385a3a982e8e233e235c9c487c2473c1732419eb7` | Tiptap (`@tiptap/react`, `starter-kit`, `extension-link`) + ProseMirror |
    | `assets/forms-DCdeFFAP.js` | `80,295` | `f82f4e993b5a7c037be1b5a045dc27b9b2429c2c9d72b150e0e43fb51268b1df` | `react-hook-form`, `@hookform/resolvers/zod`, `zod` |
    | `assets/dnd-CY1-W-IF.js` | `48,468` | `6ef92e36ba8d8290ddbb04a6c2764f5bb4861e61f6db0880290e5f23210b2546` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
    | `assets/icons-BFfL9nJq.js` | `26,337` | `4c99cc8bc293275a40219c16e4ff98ecbd85d79bd00fa8957363fc09866468eb` | `lucide-react` icons |
    | `assets/analytics-Be2h-7fd.js` | `2,598` | `4889a473a131f42c44f5ca33bc9bc933f0d9387ff018ef94ee8feefab2a0e0ec` | `@vercel/analytics/react` v1.5.0 |
    | `assets/DndSections-CIlCdOj4.js` *(lazy)* | `1,313` | `f0ce236ccd7d47115d23302ca87c22a8fa7bc54e18d4c83d47d448e75b820f0e` | Lazy-loaded section order drag-and-drop list |
    | `assets/ReviewPage-BNk1S44H.js` *(lazy)* | `20,237` | `8b36c0f57433369c5ed397f97437a3c9d9e70d0c9562e390155893915c45e4f0` | Lazy-loaded `/review` AI CV Review dashboard |
    | `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js` | `312,078` | `91bad6c8fa5fc2f99ab3de3a9cefc2c7d79a385f54c468b44c98e9d690aa11f7` | Global `window.pdfjsLib` for client-side PDF text extraction |
- **Evidence source**:
  - `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`
  - `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846`
  - `ev_aa23f6dbd7756f79a749b8b1da8825cfd0d8f7cef63488cab739b619d75f971d`
- **Verification status**: `Verified`
- **Implementation implications**:
  - Replicate clean modular boundaries (`state`, `services`, `components`, `utils`) in our codebase.

---

## 2. Client-Side State Architecture (`assets/state-LogT9lEE.js`)

### Finding TF-02: Three Persisted Zustand Stores (`cv-storage`, `controls-storage`, `review-storage`)
- **Description**:
  - All state management is implemented with **Zustand** (`create` + `persist` middleware backed by `window.localStorage`):
  1. **`Y` (`localStorage["cv-storage"]`)**:
     - State properties:
       - `resumeData`: Complete structured CV object (initialized to `zd`, a sample resume for `"John Doe"`, `"Full Stack Web Developer"`).
       - `sectionOrder`: Array of 9 section keys initialized to `Qd = ["summary", "experience", "projects", "education", "skills", "languages", "certifications", "awards", "volunteering"]`.
       - `hiddenItemIds`: `string[]` (initialized to `[]`) storing IDs of section items hidden from the PDF/preview.
       - `uuid`: Unique string ID generated once per client (`crypto.randomUUID()` or math fallback) and sent when uploading exported PDFs.
     - Actions:
       - `setResumeData(data)`
       - `updateBasics(partialBasics)`
       - `addCustomField({ id, name, value, breakAfter })`
       - `updateCustomField(id, partialField)`
       - `removeCustomField(id)`
       - `updateSummary(htmlString)`
       - `updateSectionTitle(sectionKey, title)`
       - `addSectionItem(sectionKey, item)`
       - `updateSectionItem(sectionKey, itemId, updatedItem)`
       - `deleteSectionItem(sectionKey, itemId)`
       - `setSectionOrder(newOrderArray)`
       - `toggleHideItem(itemId)`
       - `resetAll()` (restores `zd`, `Qd`, `hiddenItemIds: []`, and calls `localStorage.removeItem("cv-storage")`)
  2. **`ee` (`localStorage["controls-storage"]`)**:
     - State properties (initialized to `_d`):
       - `fontCategory`: `"ATS-Friendly"` (options: `"ATS-Friendly" | "sans-serif" | "serif" | "display" | "monospace" | "handwriting"`)
       - `fontFamily`: `"Inter"`
       - `fontSize`: `14` (`12..18` px)
       - `lineHeight`: `5` (`4..10`, divided by `4` at render time -> `1.25`)
       - `verticalSpacing`: `1` (`1..10`, multiplied by `4` px at render time -> `4px`)
       - `margin`: `{ VALUE: 20 }` (`10..50` mm, multiplied by `3.78` px/mm at render time -> `75.6px`)
       - `headerAlignment`: `"center"` (`"start" | "center" | "end"`)
       - `skillsLayout`: `"inline"` (`"inline" | "grid-col" | "grid-row"`)
       - `fonts`: `{ "ATS-Friendly": Fd }` (populated with Google Webfonts categories on hydration/fetch)
     - Actions: `setFontCategory`, `setFontFamily`, `setFontSize`, `setLineHeight`, `setVerticalSpacing`, `setMargin`, `setHeaderAlignment`, `setSkillsLayout`, `setFonts`, `resetControls`.
  3. **`Hd` (`localStorage["review-storage"]`)**:
     - State properties:
       - `analysis`: Nullable AI review report object (`null` by default).
     - Actions: `setAnalysis(analysis)`, `clearAnalysis()`.
- **Evidence source**:
  - `assets/state-LogT9lEE.js` (`18,627` B, SHA256 `8c2957b65bf0494f754d9e894c879ff4fa20c139469fc5eb2cd13993dd90c6fb`)
  - `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5`
- **Verification status**: `Verified`
- **Implementation implications**:
  - Maintaining compatibility with the `resumeData` JSON schema allows users to import/export JSON files seamlessly.

### Finding TF-03: Complete `resumeData` Schema & Zod Validation Schemas (`Id`, `$d`, `Cd`, `kd`, `Md`, `Nd`, `Td`, `Dd`)
- **Description**:
  - `resumeData` top-level shape:
    ```json
    {
      "basics": {
        "name": "string",
        "title": "string",
        "email": "string",
        "phone": { "value": "string", "breakAfter": false },
        "location": { "value": "string", "breakAfter": false },
        "website": "string",
        "linkedin": "string",
        "photo": { "url": "string", "visible": true, "size": 100, "borderRadius": 50 },
        "customFields": [{ "id": "string", "name": "string", "value": "string", "breakAfter": false }]
      },
      "summary": { "title": "Summary", "content": "<p>...</p>" },
      "experience": { "title": "Experience", "items": [] },
      "projects": { "title": "Projects", "items": [] },
      "education": { "title": "Education", "items": [] },
      "skills": { "title": "Skills", "items": [] },
      "languages": { "title": "Languages", "items": [] },
      "certifications": { "title": "Certifications", "items": [] },
      "awards": { "title": "Awards", "items": [] },
      "volunteering": { "title": "Volunteering", "items": [] }
    }
    ```
  - **Zod Validation Rules in `assets/state-LogT9lEE.js`**:
    - `Id` (`Experience`): `company` (`min(1, "Company name is required")`), `position` (`min(1, "Position is required")`), `location` (`optional`), `startDate` (`min(1, "Start date is required")`), `endDate` (`optional`), `current` (`boolean, default false`), `website` (`url("Invalid URL").optional().or(literal(""))`), `summary` (`optional`).
    - `$d` (`Projects`): `name` (`min(1, "Project name is required")`), `description` (`optional`), `startDate` (`optional`), `endDate` (`optional`), `current` (`boolean, default false`), `website` (`url("Invalid URL").optional().or(literal(""))`), `keywords` (`array(string()).default([])`), `summary` (`optional`).
    - `Cd` (`Education`): `institution` (`min(1, "Institution is required")`), `degree` (`min(1, "Degree is required")`), `field` (`optional`), `location` (`optional`), `startDate` (`optional`), `endDate` (`optional`), `current` (`boolean, default false`), `gpa` (`optional`), `website` (`url("Invalid URL").optional().or(literal(""))`), `courses` (`array(string()).default([])`), `summary` (`optional`).
    - `kd` (`Skills`): `name` (`min(1, "Skill name is required")`), `level` (`optional`), `keywords` (`array(string()).default([])`).
    - `Md` (`Languages`): `language` (`min(1, "Language is required")`), `fluency` (`min(1, "Fluency level is required")`).
    - `Nd` (`Certifications`): `name` (`min(1, "Certification name is required")`), `issuer` (`min(1, "Issuer is required")`), `date` (`min(1, "Date is required")`), `website` (`url("Invalid URL").optional().or(literal(""))`), `summary` (`optional`).
    - `Td` (`Awards`): `title` (`min(1, "Award title is required")`), `awarder` (`min(1, "Awarder is required")`), `date` (`min(1, "Date is required")`), `website` (`url("Invalid URL").optional().or(literal(""))`), `summary` (`optional`).
    - `Dd` (`Volunteering`): `organization` (`min(1, "Organization is required")`), `position` (`min(1, "Position is required")`), `location` (`optional`), `startDate` (`min(1, "Start date is required")`), `endDate` (`optional`), `current` (`boolean, default false`), `website` (`url("Invalid URL").optional().or(literal(""))`), `summary` (`optional`).
- **Evidence source**:
  - `assets/state-LogT9lEE.js` (symbols `zd`, `Id`, `$d`, `Cd`, `kd`, `Md`, `Nd`, `Td`, `Dd`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Use these exact Zod validation schemas and default values in our form layer.

---

## 3. External APIs, Backend Endpoints & Security Findings

### Finding TF-04: External Backend API (`https://cvmaster-backend.vercel.app`) & Silent PDF Archiving
- **Description**:
  - `assets/index-B9ESfVPA.js` hardcodes `const pf = "https://cvmaster-backend.vercel.app"` and communicates with three endpoints:
    1. **`POST https://cvmaster-backend.vercel.app/pdf`**:
       - Request headers: `Content-Type: application/json`
       - Request body: `{ htmlContent: string, margin: number }` where `htmlContent` is a complete HTML document wrapping `#cv-preview`'s `outerHTML` with `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">`, the active Google Font `<link>`, and custom `.prose` / page styling, and `margin` is `margin.VALUE` (`10..50` mm).
       - Response: `application/pdf` binary blob downloaded by the browser as `${resumeData.basics.name.replace(/\s+/g, "_")}_CV.pdf`.
    2. **`POST https://cvmaster-backend.vercel.app/upload-pdf`**:
       - Immediately after receiving the PDF blob from `/pdf`, the frontend converts the blob to a base64 DataURL via `FileReader.readAsDataURL` and silently posts `{ pdf: base64DataUrl, name: resumeData.basics.name, title: resumeData.basics.title, uuid }` to `/upload-pdf` in the background (`.catch(() => {})` swallows errors).
    3. **`POST https://cvmaster-backend.vercel.app/upload-photo`**:
       - Request body: `{ image: base64DataUrl }` (validated client-side `<= 2MB`, PNG/JPG/JPEG/WebP).
       - Response JSON: `{ url: string }` (hosted image URL placed into `basics.photo.url`).
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `ip`, `gf`)
  - `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5`
- **Verification status**: `Verified`
- **Implementation implications**:
  - **Privacy & Architectural Improvement**: In our independent implementation, we must **NOT** silently exfiltrate/upload user PDFs (`upload-pdf`) to an external server without consent. We should support self-contained client-side print/PDF generation (or our own local/serverless Playwright/Puppeteer PDF route) and local DataURL/IndexedDB photo storage.

### Finding TF-05: Client-Side Groq SDK Integration & Exposed API Key (`assets/services-Cix8ANSZ.js`)
- **Description**:
  - `assets/services-Cix8ANSZ.js` bundles `groq-sdk` v0.9.1 and instantiates the client directly in the browser with `dangerouslyAllowBrowser: true` and a hardcoded Groq API key (`gsk_...`, redacted here per security guidelines).
  - Calls `https://api.groq.com/openai/v1/chat/completions` across 6 functions using 3 LLM models:
    | Function | Feature | Model ID | Temperature | Max Tokens | Response Format |
    |---|---|---|---|---:|---|
    | `Mu(text)` | AI Writing: Improve Writing | `llama-3.1-8b-instant` | `0.7` | `1024` | Plain HTML string |
    | `Lu(text)` | AI Writing: Fix Typos | `llama-3.1-8b-instant` | `0.3` | `1024` | Plain HTML string |
    | `Ou(text, prompt)` | AI Writing: Customize (`Shorter`, `Longer`, etc.) | `llama-3.1-8b-instant` | `0.7` | `1024` | Plain HTML string |
    | `Fu(pdfText)` | PDF Resume Import Parser | `openai/gpt-oss-120b` | `0.2` | `4000` | `{ "type": "json_object" }` |
    | `zu(base64Image)` | Image Resume Import Parser (Vision) | `meta-llama/llama-4-scout-17b-16e-instruct` | `0.2` | `4000` | Extracted JSON (`/.../`) + `Uu` heuristic validator |
    | `Bu(resumeData, jobTitle, jobDesc)` | AI CV Review & ATS Analysis | `openai/gpt-oss-120b` | `0.3` | `4000` | `{ "type": "json_object" }` |
- **Evidence source**:
  - `assets/services-Cix8ANSZ.js` (`110,971` B, SHA256 `16471190df5726f377d5fd5d8b2f811be5d1c0bc72330dd944fd5b18c26fa5ef`, symbols `Mu`, `Lu`, `Ou`, `Fu`, `zu`, `Uu`, `Bu`)
  - `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5`
- **Verification status**: `Verified`
- **Implementation implications**:
  - Never ship raw LLM API keys in client-side bundles (`dangerouslyAllowBrowser: true`). Route AI requests through a backend API route or allow users to configure their own API key / server environment variable (`GROQ_API_KEY`).

### Finding TF-06: Google Webfonts API & Curated ATS Font Catalog (`yu`, `wu`, `Fd`)
- **Description**:
  - `assets/state-LogT9lEE.js` defines `Fd`, a curated list of 19 ATS-friendly fonts: `Inter`, `Roboto`, `Open Sans`, `Lato`, `Montserrat`, `Source Sans Pro`, `PT Sans`, `Noto Sans`, `Work Sans`, `Fira Sans`, `Nunito`, `Raleway`, `Ubuntu`, `Merriweather`, `PT Serif`, `Lora`, `Libre Baskerville`, `Source Serif Pro`, `Crimson Text`.
  - `yu()` in `assets/services-Cix8ANSZ.js` fetches `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=AIzaSy...` (hardcoded Google API key), groups the returned fonts by `category` (`sans-serif`, `serif`, `display`, `monospace`, `handwriting`), and merges them with `"ATS-Friendly": Fd` in the `ee` (`controls-storage`) store.
  - `wu(fontFamily)` checks if `link[href*="${formattedFont}"]` exists in `document.head`; if not, appends `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=${formattedFont}:400,500,600,700&display=swap">`.
- **Evidence source**:
  - `assets/state-LogT9lEE.js` (symbol `Fd`)
  - `assets/services-Cix8ANSZ.js` (symbols `yu`, `wu`)
  - `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8` (network request to `https://fonts.googleapis.com/css?family=Inter:400,500,600,700&display=swap`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Include the 19 curated ATS-friendly fonts (`Fd`) plus a static fallback catalog of popular Google Fonts by category so the font picker works out-of-the-box even without a Google Webfonts API key.

---

## 4. Network, Console, DOM & Accessibility Findings

### Finding TF-07: Initial Load Network Traffic & Console Health
- **Description**:
  - On initial load of `https://cvmaster.app/`, the browser executes 20 network requests:
    - HTML document (`index.html`), CSS (`assets/index-dt7n0t0W.css`), 11 ES module chunks (`assets/*.js`), `pdf.min.js` (`cdnjs.cloudflare.com`), `logo.svg`, `site.webmanifest`, Google Fonts CSS + `.woff2` (`Inter`), `/_vercel/insights/script.js`, and `POST https://cvmaster.app/_vercel/insights/view` (`{"o":"https://cvmaster.app/","sv":"0.1.3","sdkn":"@vercel/analytics/react","sdkv":"1.5.0","r":""}`, HTTP `200`).
  - Zero (`0`) console errors or warnings occur during initial page load and hydration.
  - Direct server request to `GET https://cvmaster.app/review` returns **HTTP 404 (`x-vercel-error: NOT_FOUND`)** because CVMaster's Vercel deployment lacks a catch-all SPA rewrite rule.
- **Evidence source**:
  - `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`console_messages: []`)
  - `ev_b2767a0bc06aee66e53d8ed3bb06b490c6b56b8b4b7c2c26a02933a5a23e2934` (`GET /review` -> HTTP `404`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Add SPA fallback routing (`rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`) so `/review` works on direct navigation or browser refresh.

### Finding TF-08: DOM Structure & Accessibility Tree Observations
- **Description**:
  - The hydrated workspace at `1280x720` contains `693` DOM nodes and `391` Accessibility (AX) nodes.
  - **Strengths**:
    - Radix UI primitives provide accessible roles (`banner`, `complementary`, `region`, `button`, `dialog`, `alertdialog`, `menu`) and `aria-expanded` / `aria-controls` attributes on all 10 sidebar accordions and header modal triggers.
    - Icon-only buttons in the header (`Toggle theme`, `View source on GitHub`) and canvas toolbar (`Zoom In`, `Zoom Out`, `Reset View`, `Center View`, `Toggle Page Break Line`) include explicit `aria-label` or `title` attributes.
  - **Accessibility & DOM Issues Identified**:
    1. **Duplicate `Controls` Trigger in DOM**: `vf` renders two `<Sa />` instances inside `<header>`—one inside `<div class="block lg:hidden">` (DOM `nodeId: 13`) and one inside `<div class="hidden lg:flex">` (DOM `nodeId: 28`). Automation locators or assistive technologies querying the first matching DOM node on desktop hit the hidden mobile trigger.
    2. **Hidden File Input Labeling**: `#photo-upload` is hidden (`class="hidden"`) and triggered programmatically by a button (`onClick={() => fileInputRef.current?.click()}`), which works for mouse/keyboard activation of the button.
- **Evidence source**:
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`dom_node_count: 693`, `ax_node_count: 391`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Render only a single `Controls` sheet trigger in the header and use CSS flex ordering or viewport media queries rather than duplicating the component in the DOM.
