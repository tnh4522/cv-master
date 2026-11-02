# CVMaster (`https://cvmaster.app/`) — Site Overview

## 1. Executive Summary

**CVMaster** (`https://cvmaster.app/`) is a client-heavy, single-page React web application (SPA) built with Vite, TypeScript/React, Tailwind CSS v3, Radix UI, Zustand, React Hook Form + Zod, Tiptap, `@dnd-kit`, and `react-zoom-pan-pinch`. Despite SEO metadata advertising "Free resume templates", the live application boots directly into an interactive two-pane resume editor/preview workspace at `/` with **no separate marketing landing page**, **no user authentication (registration/login)**, and **a single parameterized ATS-friendly resume layout**. All user resume state is persisted locally in browser `localStorage`, while AI capabilities (text rewriting, PDF/image resume parsing, and job-targeted CV analysis) call the Groq API directly from the browser and PDF rendering/photo hosting call a secondary backend at `https://cvmaster-backend.vercel.app`.

---

## 2. Core Findings

### Finding SO-01: Direct-to-Workspace Architecture (No Separate Marketing Landing Page)
- **Description**: Navigating to `https://cvmaster.app/` does not render a promotional landing page, hero banner, pricing table, or onboarding wizard. Instead, the root route `/` renders the main resume builder workspace (`yf` component), preceded only by a 500 ms splash loader (`"Loading CV Master..."`) on the first visit in a browser session (`sessionStorage["hasVisited"]`).
- **Evidence source**:
  - REA Passive Page Inspection: `ev_f2cbecffad129e7e26c727c5786bfe9d3ee068bebdc0b4aed9e98cea945a8c9b` and `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (DOM root `#root` (`node_id: 6`), `header` (`node_id: 8`), `aside` (`node_id: 62`), pan/zoom preview container (`node_id: 639`), and `sessionStorage` keys `["hasVisited"]`).
  - Shipped Bundle Analysis (`assets/index-B9ESfVPA.js`, SHA256 `bf1e83bf44d35612bfb491f686336b1683ba07a8a7c37da1219ac69ad02e7122`, line 631): `yf` component checks `sessionStorage.getItem("hasVisited")`; if absent, displays `<Ki message="Loading CV Master..." />` for `500` ms and sets `sessionStorage.setItem("hasVisited", "true")`.
- **Verification status**: **Verified**
- **Implementation implications**:
  - The clean-room implementation should boot directly into the functional editor/preview workspace at `/`.
  - A short initial hydration/loading spinner is optional; if implemented, gate it behind `sessionStorage.getItem("hasVisited")` so subsequent refreshes or route returns from `/review` do not delay rendering.

---

### Finding SO-02: Local-First, Accountless Persistence Model
- **Description**: CVMaster has no user accounts, cloud database sync for resume state, registration forms, or login flows. All user data, layout settings, section ordering, item visibility overrides, theme preference, and AI review reports are persisted in `window.localStorage`.
- **Evidence source**:
  - REA Passive Page Inspection: `ev_f2cbecffad129e7e26c727c5786bfe9d3ee068bebdc0b4aed9e98cea945a8c9b` (`storage.local_storage.key_count: 0` on fresh session before mutations; `storage.session_storage.keys: ["hasVisited"]`).
  - REA Static JS Application Analysis: `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e01897bf5` & `ev_1580fe515c62ea71da1bd8bfb6d27e8a2cd23b91d1a54e9e59b846a3307ed8c9` (`storage_access` facts at `index-B9ESfVPA.js` lines 31–33 and 631).
  - Shipped Bundle (`assets/index-B9ESfVPA.js`, line 33):
    - `localStorage["resumeData"]`: JSON-serialized resume content (`basics`, `summary`, `experience`, `projects`, `education`, `skills`, `languages`, `certifications`, `awards`, `volunteering`, `sectionTitles`).
    - `localStorage["sectionOrder"]`: JSON array of section keys (`["summary", "experience", "projects", "education", "skills", "languages", "certifications", "awards", "volunteering"]`).
    - `localStorage["hiddenItemIds"]`: JSON array of item UUID strings excluded from the rendered CV preview/PDF.
    - `localStorage["pdfSetting"]`: JSON object storing typography, margin, spacing, scale, skills layout, and page-break line settings.
    - `localStorage["currentAnalysis"]`: JSON object storing the most recent AI CV review report.
    - `localStorage["cv-master-theme"]`: String (`"system"`, `"light"`, or `"dark"`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Implement reactive state stores (e.g., Zustand) that hydrate synchronously from `localStorage` on initialization and write through to `localStorage` on every mutation.
  - Provide JSON export/import and a full state reset (`Reset` alert dialog) as the user's primary backup/portability mechanism.

---

### Finding SO-03: Application Shell & Desktop Two-Pane Layout (`>= 1024px`)
- **Description**: On desktop viewports (`lg` breakpoint, `width >= 1024px`), the main page (`yf`) locks `document.body.style.overflow = "hidden"` (via hook `wl` / `$l` in `utils-C_1XUkXG.js`) and renders a full-viewport (`h-screen`) application shell consisting of:
  1. **Top Navigation Bar (`vf`)**: Sticky top bar (`h-16`) containing the brand logo/link (`CV Master`), `Controls` sheet trigger, `CV Review` dialog trigger, `Preview` toggle button, `Reset` confirmation dialog trigger, `Import` modal trigger, `Export` dropdown (`PDF` / `JSON`), and `Theme` dropdown (`Light` / `Dark` / `System`).
  2. **Left Editor Sidebar (`up`)**: Fixed-width panel (`w-[450px] xl:w-[500px] 2xl:w-[550px] shrink-0 h-[calc(100vh-4rem)]`) wrapped in a Radix `ScrollArea`, containing the `Basics` card (`dp`) followed by 9 collapsible section cards (`cp`). When `Preview` mode (`previewMode` state) is toggled on, the sidebar collapses to `w-0 opacity-0 pointer-events-none` with a `300ms` CSS transition.
  3. **Right Interactive Preview Canvas (`Ca`)**: Flex-1 pane (`h-[calc(100vh-4rem)]`) hosting a `react-zoom-pan-pinch` (`TransformWrapper` / `TransformComponent`) surface with floating top-right canvas controls (`Zoom In`, `Zoom Out`, `Reset View`, `Center View`, and `Hide/Show Page Break Line`) and an A4-proportioned CV sheet (`$r`, `793.8px × 1122.66px` minimum).
- **Evidence source**:
  - REA Passive Page Inspection: `ev_f2cbecffad129e7e26c727c5786bfe9d3ee068bebdc0b4aed9e98cea945a8c9b` (DOM nodes `8` (`header`), `60` (`div.relative.lg:flex`), `62` (`aside.h-[calc(100vh-4rem)]`), `639` (`div.w-full.h-[calc(100vh-4rem)].flex-1`)).
  - Shipped Bundles: `assets/index-B9ESfVPA.js` (line 631, components `vf`, `up`, `Ca`, `yf`) and `assets/utils-C_1XUkXG.js` (function `wl`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Lock `document.body` scroll on the `/` route so wheel/touch gestures inside the preview canvas or sidebar do not scroll the outer document.
  - Support toggling the left sidebar in and out of view via the `Preview` header button on `lg+` screens.

---

### Finding SO-04: Responsive Breakpoint Behavior (`< 1024px`, `< 1280px`, `< 640px`, `< 430px`)
- **Description**: CVMaster adapts its layout across four distinct viewport thresholds using both Tailwind responsive classes and a JavaScript `useWindowSize` hook (`Sl` / `We` in `utils-C_1XUkXG.js`):
  - **Mobile/Tablet Workspace (`width < 1024px`)**: `yf` checks `width < 1024` in JS and replaces the side-by-side split pane with a full-width Radix `Tabs` component (`defaultValue="editor"`) featuring a sticky two-tab bar (`Editor` and `Preview`) directly below the header. The desktop `Preview` toggle button in the header is hidden (`hidden lg:flex`).
  - **Header Action Compaction (`< 1280px`, `< 1024px`, `< 640px`)**:
    - On `< 1024px` (`lg:hidden`), the `Controls` drawer trigger moves to the left of the `CV Master` logo, and a `More Actions` (`MoreHorizontal` icon) dropdown consolidates `CV Review` (`sm:hidden`), `Import`, and `Reset`.
    - Between `640px` and `1279px`, `CV Review` is visible as a standalone button, while `Import` and `Reset` remain inside a `More Actions` dropdown (`hidden sm:flex xl:hidden`).
    - At `>= 1280px` (`xl:flex`), all action buttons (`Controls`, `CV Review`, `Preview`, `Reset`, `Import`, `Export`, `Theme`) are shown inline in the header with text labels visible on `xl:inline`.
  - **Initial Canvas Scale (`< 430px`, `< 640px`, `< 1280px`)**: On mount, `Ca` computes an initial zoom scale from `window.innerWidth`: `0.42` for `width < 430`, `0.5` for `width < 640`, `0.55` for `width < 1280`, and `pdfSetting.scale` (`0.65` default) for `width >= 1280`.
- **Evidence source**:
  - Shipped Bundle (`assets/index-B9ESfVPA.js`, line 631, components `Ca`, `vf`, `yf`; `assets/utils-C_1XUkXG.js`, function `Sl`).
  - REA Browser Scenario Capture (`ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846`, viewport `1280x720`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Implement both CSS media-query breakpoints and JS viewport-width detection (`< 1024px` tab switching and initial canvas scale calculation) so mobile users get a tabbed Editor/Preview interface and an appropriately scaled A4 canvas.

---

### Finding SO-05: Design System, Color Palette, and Theme Architecture
- **Description**: CVMaster uses a warm off-white / terracotta aesthetic inspired by modern editorial tools (similar to Claude's warm parchment palette):
  - **Brand Logo & Manifest Colors**: SVG logo fill `#C86442` (terracotta orange); `site.webmanifest` `theme_color` and `background_color` `#FAF9F8` (`display: "standalone"`).
  - **Light Mode CSS Variables (`:root`)**: `--background: 48 33.33% 97.05%` (`#FAF9F5`), `--foreground: 48 19.6% 20%`, `--primary: 15.1111 55.55% 52.35%` (`#C86442`), `--secondary: 46.1538 22.8% 88.82%`, `--muted: 44 29.41% 90%`, `--accent: 46.1538 22.8% 88.82%`, `--destructive: 0 84.23% 60.19%`, `--success: 142.1 76.2% 36.3%`, `--sidebar: 51.4286 25.92% 94.7%`.
  - **Dark Mode CSS Variables (`.dark`)**: `--background: 60 2.7% 14.5%`, `--foreground: 46.1538 9.77% 73.92%`, `--popover: 60 2.12% 18.43%`, `--primary: 14.7692 63.1% 59.6%`, `--sidebar: 30 3.33% 11.76%`.
  - **Default UI Font**: `"Work Sans", ui-sans-serif, system-ui, ...` loaded from Google Fonts (`https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap`).
  - **Important Contrast Rule**: While the application shell supports Light/Dark/System themes (toggling `.light` or `.dark` on `document.documentElement`), the **CV Preview Sheet (`$r`) is always hardcoded to `bg-white text-black`** so the resume preview accurately reflects printed/PDF output regardless of the active UI theme.
- **Evidence source**:
  - REA Scenario Capture (`ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`):
    - `request-12` (`assets/index-dt7n0t0W.css`, SHA256 `1dd49afc07fb2231b2ff686cbf007725fb2742271bb1f28ebd98f22a0d817343`)
    - `request-13` (`site.webmanifest`, SHA256 `494ec896f55d3f41afb3507822c42a094cba8a679b4312328e857c786c828ede`)
    - `request-18` (`logo.svg`, SHA256 `e34950083abaf80d85b0f6f9d36e4f331a83a8313b51080d7eb450439809a6e8`)
  - Shipped Bundle (`assets/index-B9ESfVPA.js`, line 631, components `Li`, `Mi`, `$r`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Use CSS custom properties (`HSL` channels) with `.dark` class toggling on `<html>` persisted to `localStorage`.
  - Keep the rendered CV sheet isolated from dark mode (`bg-white text-black`) while styling the surrounding workspace with theme-aware semantic tokens. Also use original branding/assets in our clean-room implementation per project constraints.
