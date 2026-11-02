# Reverse Engineering Limitations & Manual Inspection Report

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_0a1e043f6b2c992c29f0d5430583d6a4135dd565da75df7b91efb3280b0d0576` (`list_browser_targets`)
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page`)
- `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8` (`capture_browser_scenario` initial load)
- `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846` (`capture_browser_scenario` lazy chunk capture)
- `ev_b2767a0bc06aee66e53d8ed3bb06b490c6b56b8b4b7c2c26a02933a5a23e2934` (`capture_browser_scenario` `/review` HTTP 404 verification)

---

## 1. Technical & Observational Limitations

### Finding LIM-01: Black-Box Server Implementation of `https://cvmaster-backend.vercel.app`
- **Description**:
  - While the frontend request payloads, headers, and response handling for `https://cvmaster-backend.vercel.app/pdf`, `/upload-pdf`, and `/upload-photo` are 100% verified from `assets/index-B9ESfVPA.js`, the server-side source code of `cvmaster-backend.vercel.app` is not publicly shipped to the browser:
    - The exact headless browser library used by `/pdf` (e.g., Puppeteer + `@sparticuz/chromium` or Playwright on Vercel Functions) and its exact PDF rendering flags (`printBackground: true`, `preferCSSPageSize`, etc.) are inferred from the HTML/CSS payload structure (`@page`, Tailwind v2.2.19 CDN, `margin: margin.VALUE`).
    - The storage provider backing `/upload-photo` and `/upload-pdf` (e.g., Cloudinary, AWS S3, Vercel Blob, or Supabase Storage) is unknown without executing a live file upload against the production backend.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `ip`, `gf`, constant `pf = "https://cvmaster-backend.vercel.app"`)
- **Verification status**: `Inferred` (server implementation details); `Unknown` (exact cloud storage bucket/provider backing `/upload-photo` and `/upload-pdf`)
- **Implementation implications**:
  - Our independent implementation does not need to replicate `cvmaster-backend.vercel.app`'s cloud storage; we can handle photo storage client-side (DataURL / IndexedDB) or via a local upload API, and handle PDF generation via a clean local Playwright/Puppeteer route or browser print stylesheet without silent PDF archiving (`/upload-pdf`).

### Finding LIM-02: Minified Production Bundles Without Source Maps
- **Description**:
  - CVMaster is deployed with minified Vite/Rollup bundles (`assets/*.js`) and no `.map` source maps on the production CDN.
  - While full symbol recovery, component tree reconstruction, Zod schema extraction, and store/service analysis were achieved by inspecting the exported JavaScript bundles (`ev_aa23f6db...`), original TypeScript interface names and local variable identifiers inside functions were minified (`wf`, `yf`, `vf`, `Sa`, `Ma`, `Kp`, `ff`, `gf`, `up`, `dp`, `cp`, `ap`, etc.).
- **Evidence source**:
  - `ev_aa23f6dbd7756f79a749b8b1da8825cfd0d8f7cef63488cab739b619d75f971d` (`export_web_scripts`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Use clean, descriptive TypeScript component and module names (e.g., `Header`, `ControlsSheet`, `ReviewDialog`, `ResetDialog`, `ImportDialog`, `ExportDropdown`, `EditorSidebar`, `BasicsSection`, `SectionCard`, `ResumePreview`) in our independent implementation.

### Finding LIM-03: CDP Screenshot Timeout on Backgrounded External Browser Window & Duplicate Responsive DOM Triggers
- **Description**:
  - During automated reconnaissance:
    1. Calling `capture_web_screenshot` on the external CDP target (`54E6EA8E7776E97706914994CFC1ACA5`) timed out at `20,000` ms because the external Chrome window was occluded/backgrounded on Windows, causing Chromium's compositor frame capture to stall while DOM, Accessibility Tree, and Network captures succeeded instantaneously.
    2. Automated `click` steps targeting `button[title="Controls"]` in `capture_browser_scenario` timed out waiting for visibility because `vf` renders two `<Sa />` trigger buttons in the DOM—the first inside `<div class="block lg:hidden">` (hidden at `1280x720` desktop resolution) and the second inside `<div class="hidden lg:flex">`.
- **Evidence source**:
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (DOM nodeIds `13` and `28`)
  - `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846`
- **Verification status**: `Verified`
- **Implementation implications**:
  - In our implementation, never duplicate interactive modal triggers in the DOM for mobile vs. desktop; render a single trigger button to avoid accessibility and test-automation ambiguity.

---

## 2. Workflows Requiring Manual End-to-End Human Inspection

Although **100% of the frontend code paths, state stores, Zod schemas, prompts, and lazy-loaded chunks (`DndSections-CIlCdOj4.js` and `ReviewPage-BNk1S44H.js`) have been statically and dynamically extracted**, we intentionally avoided sending real user files or triggering external third-party billable API mutations (`api.groq.com` and `cvmaster-backend.vercel.app`) during automated reconnaissance.

The following **5 interactive workflows** are recommended for manual human verification in the browser if live third-party service behavior needs to be observed prior to or alongside implementation:

1. **Profile Photo Upload (`POST https://cvmaster-backend.vercel.app/upload-photo`)**:
   - **What to inspect manually**: Expand `Basics`, upload a `<2MB` PNG/JPEG image, and inspect the Network tab response from `/upload-photo` to confirm the hosted image URL domain and CORS headers (important if `#cv-preview` images are rendered by the server-side PDF generator).
2. **Server-Side PDF Export (`POST https://cvmaster-backend.vercel.app/pdf`)**:
   - **What to inspect manually**: Click `Export -> PDF` and inspect the downloaded `<Name>_CV.pdf` file to verify how the backend headless browser handles multi-page breaks, Google Fonts rendering, and page margins (`10mm..50mm`).
3. **AI PDF Resume Import (`mf` -> `pdf.js` -> Groq `openai/gpt-oss-120b`)**:
   - **What to inspect manually**: Open `Import -> PDF`, upload a real single-page or multi-page PDF resume, and verify whether `https://api.groq.com/openai/v1/chat/completions` succeeds with CVMaster's embedded Groq API key or if the key is rate-limited/revoked, and inspect how accurately `Fu` populates `cv-storage`.
4. **AI Image Resume Import (`pf` -> Groq `meta-llama/llama-4-scout-17b-16e-instruct`)**:
   - **What to inspect manually**: Open `Import -> Image`, upload both a valid resume screenshot and a non-resume image, and verify the Vision model extraction (`zu`) and the heuristic rejection toast (`Uu`: `"The uploaded image does not appear to be a valid resume"`).
5. **Live AI Writing Assistant & AI CV Review (`Xu` & `Ma` -> `/review`)**:
   - **What to inspect manually**:
     - In any rich-text editor (`Summary`), test `Sparkles -> Improve Writing`, `Fix Typos`, and `Customize` on `<30` character text (to see the validation toast) and `>=30` character text (to observe live `llama-3.1-8b-instant` HTML replacement).
     - Open `CV Review` in the header, enter a Target Job Title and Job Description, click `Start Review`, and observe the live transition to `/review` and the rendered 4-tab report (`Overview`, `Detailed Analysis`, `Recommendations`, `Improvements`).
