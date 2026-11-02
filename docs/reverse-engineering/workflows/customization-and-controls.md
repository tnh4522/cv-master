# Workflow: Customization, Typography, and Layout Controls

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page`)
- `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846` (`capture_browser_scenario` fetching `assets/DndSections-CIlCdOj4.js`)
- `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`analyze_javascript_application` core bundles)
- `ev_d4721be36551ad83b213a9ce8e88eb21139d01a77308e34ce54e9050fed14e11` (`analyze_javascript_application` lazy chunks)

---

## 1. Opening the Controls Drawer (`Sa`)

### Finding W-CTRL-01: Left-Side Controls Sheet & Google Fonts Catalog Hydration
- **Description**:
  - Clicking the `"Controls"` button (`Sliders` icon) in the top header opens a Radix `Sheet` (`side="left"`, `w-[320px] sm:w-[400px] overflow-y-auto`).
  - On mount (`useEffect` in `Sa`), if `Object.keys(fonts).length <= 1` (i.e. only the initial `"ATS-Friendly"` category `Fd` is loaded), it calls `yu()` in `assets/services-Cix8ANSZ.js` to fetch the full Google Webfonts catalog (`https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=...`), grouping fonts into `"sans-serif"`, `"serif"`, `"display"`, `"monospace"`, and `"handwriting"`, and merges them with `"ATS-Friendly"` (`Fd`, 19 curated ATS fonts) in the `ee` (`controls-storage`) store.
  - Also calls `wu(fontFamily)` whenever `fontFamily` changes so the active font stylesheet is injected into `document.head`.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbol `Sa`)
  - `assets/services-Cix8ANSZ.js` (symbols `yu`, `wu`)
  - `assets/state-LogT9lEE.js` (store `ee`, constant `Fd`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Ship the 19 ATS-friendly fonts plus a pre-bundled JSON list of top Google Fonts per category so the font selector works reliably without requiring an external Google API key on client load.

---

## 2. Font Category & Searchable Font Family Selection (`mu`, `du`)

### Finding W-CTRL-02: Category Filtering & IntersectionObserver Lazy Font Preview
- **Description**:
  1. **Font Category (`Select`)**:
     - Users choose from 6 categories (`Hr`): `"ATS-Friendly"`, `"sans-serif"`, `"serif"`, `"display"`, `"monospace"`, `"handwriting"`.
     - Selecting a category calls `setFontCategory(category)`. If the currently active `fontFamily` is not in `fonts[category]`, it automatically selects `fonts[category][0]`.
  2. **Font Family Combobox (`mu` & `du`)**:
     - Clicking the Font Family button opens a Radix `Popover` containing a `cmdk` `<Command>` search input (`"Search fonts..."`) and scrollable `<CommandList>`.
     - Each font option (`<du font={f} isSelected={...} onSelect={...} />`) attaches an `IntersectionObserver` (`bl` from `assets/utils-C_1XUkXG.js`, `threshold: 0.1`).
     - When a font item scrolls into the popover viewport, `isIntersecting` becomes `true`, triggering `wu(font)` to append `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=${font}:400,500,600,700&display=swap">` and rendering the item's label in `style={{ fontFamily: font }}`.
     - Selecting a font updates `fontFamily` in `controls-storage`, immediately updating `#cv-preview` and future PDF exports.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `Sa`, `Hr`, `mu`, `du`)
  - `assets/utils-C_1XUkXG.js` (hook `bl` / `useIntersectionObserver`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Replicate `IntersectionObserver`-based lazy `<link>` injection inside the `cmdk` font list so only visible fonts are fetched from `fonts.googleapis.com`.

---

## 3. Typography & Page Geometry Sliders (`ya`)

### Finding W-CTRL-03: Real-Time Sliders for Font Size, Line Height, Vertical Spacing, and Margin
- **Description**:
  - `Sa` renders four Radix `Slider` controls (`ya`), each persisted in `controls-storage` (`ee`) and applied inline to `#cv-preview` (`$r`):
    | Control Label | Store Key | Range (`min..max`, `step`) | Default | Displayed Value in UI | Applied CSS in `#cv-preview` |
    |---|---|---|---|---|---|
    | `Font Size` | `fontSize` | `12..18`, step `1` | `14` | `${fontSize}px` (e.g. `14px`) | `fontSize: "${fontSize}px"` (Header Name `1.6x`, Title `1.15x`) |
    | `Line Height` | `lineHeight` | `4..10`, step `1` | `5` | `${lineHeight / 4}` (e.g. `1.25`) | `lineHeight: lineHeight / 4` |
    | `Vertical Spacing` | `verticalSpacing` | `1..10`, step `1` | `1` | `${verticalSpacing / 4}` (e.g. `0.25`) | Section `marginBottom: "${verticalSpacing * 4}px"` |
    | `Page Margin` | `margin.VALUE` | `10..50`, step `1` | `20` | `${margin.VALUE}mm` (e.g. `20mm`) | `padding: "${margin.VALUE * 3.78}px"` & sent as `margin` to `POST /pdf` |
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `Sa`, `ya`, `$r`, constant `Qr = 3.78`)
  - `assets/state-LogT9lEE.js` (defaults `_d` in store `ee`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Preserve the exact scaling factors (`lineHeight / 4`, `verticalSpacing * 4` px, `margin.VALUE * 3.78` px) for visual parity.

---

## 4. Header Alignment & Skills Layout Modes (`ba`)

### Finding W-CTRL-04: Radio Groups for Header Alignment and Skills Layout
- **Description**:
  1. **Header Alignment (`headerAlignment`)**:
     - 3-button toggle group (`ba` using Radix `RadioGroup`):
       - `"start"` (`Left`): Applies `items-start text-left` to the Basics header (`eu`) and `justify-start` to contact rows.
       - `"center"` (`Center`, default): Applies `items-center text-center` and `justify-center`.
       - `"end"` (`Right`): Applies `items-end text-right` and `justify-end`.
  2. **Skills Layout (`skillsLayout`)**:
     - 3-button toggle group (`ba`):
       - `"inline"` (`Inline`, default): Renders skills in a vertical stack where each skill category and its comma-separated keywords appear inline on a single row (`<strong>{name} ({level}):</strong> {keywords.join(", ")}`).
       - `"grid-col"` (`Grid Columns`): Renders skill categories in a 2-column CSS grid (`grid-cols-2 gap-x-4 gap-y-2`).
       - `"grid-row"` (`Grid Rows`): Renders each skill category as a horizontal row with a left column for the category/level and right column for keywords.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `Sa`, `ba`, `eu`, `iu`)
  - `assets/state-LogT9lEE.js` (store `ee`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Implement all three header alignment states and all three skills layout modes in the preview renderer.

---

## 5. Drag-and-Drop Section Reordering (`DndSections-CIlCdOj4.js`)

### Finding W-CTRL-05: Sortable Section Order List (`W`, `K`)
- **Description**:
  - At the bottom of the `Controls` drawer under `"Layout"`, React `Suspense` loads `assets/DndSections-CIlCdOj4.js` (`W`).
  - Displays the 9 sections according to `sectionOrder` in `cv-storage` (`["summary", "experience", "projects", "education", "skills", "languages", "certifications", "awards", "volunteering"]`).
  - Note: The `Basics` section is always fixed at the top of the resume and is not part of `sectionOrder`.
  - Dragging a section card (`K`) via mouse/touch (`PointerSensor`) or keyboard (`KeyboardSensor` with `sortableKeyboardCoordinates`) triggers `handleDragEnd`, which updates `sectionOrder` via `arrayMove` and immediately reorders the sections rendered inside `#cv-preview` (`$r`).
- **Evidence source**:
  - `assets/DndSections-CIlCdOj4.js` (`1,313` B, SHA256 `f0ce236ccd7d47115d23302ca87c22a8fa7bc54e18d4c83d47d448e75b820f0e`, symbols `W`, `K`)
  - `ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846`
- **Verification status**: `Verified`
- **Implementation implications**:
  - Keep `Basics` pinned at the top of the sheet while allowing full reordering of the 9 body sections via `@dnd-kit/sortable`.
