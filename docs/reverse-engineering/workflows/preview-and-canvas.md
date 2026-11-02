# Workflow: Live Preview, Zoom/Pan Canvas, and Responsive Modes

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page` DOM & AX tree)
- `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`analyze_javascript_application` on `index-B9ESfVPA.js` and `utils-C_1XUkXG.js`)

---

## 1. Interactive Zoom, Pan & Pinch Canvas (`Ca`, `Su`)

### Finding W-PREV-01: `react-zoom-pan-pinch` Workspace & Responsive Initial Scale
- **Description**:
  - The right pane of the workspace (`Ca`) wraps the A4 resume sheet (`$r`) inside a `react-zoom-pan-pinch` `<TransformWrapper>` and `<TransformComponent>`:
    - `minScale`: `0.3` (`30%`)
    - `maxScale`: `2` (`200%`)
    - `centerOnInit`: `true`
    - `limitToBounds`: `false` (allows panning freely beyond sheet edges)
    - `wheel`: `{ step: 0.1 }`
    - `pinch`: `{ step: 5 }`
  - `initialScale` is computed dynamically from `window.innerWidth` via `We()` (`useWindowSize`):
    - `< 640px`: `0.42`
    - `640px–767px`: `0.55`
    - `768px–1023px`: `0.65`
    - `1024px–1279px`: `0.60`
    - `1280px–1535px`: `0.75`
    - `>= 1536px`: `0.85`
  - Whenever `window.innerWidth` changes across breakpoints, a `useEffect` calls `centerView(newScale)` after `100` ms so the A4 sheet stays centered and appropriately scaled.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbol `Ca`)
  - `assets/utils-C_1XUkXG.js` (`react-zoom-pan-pinch` bundle + `We` / `useWindowSize`)
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (DOM nodeIds `390`–`680`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Use `react-zoom-pan-pinch` with the same breakpoint scale table so the A4 sheet fits cleanly on mobile, tablet, laptop, and desktop screens.

### Finding W-PREV-02: Floating Canvas Control Toolbar (`Su`)
- **Description**:
  - Positioned at the bottom center of the preview pane (`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10`), `Su` renders a semi-transparent backdrop-blurred pill bar with 5 icon buttons:
    1. **Zoom In** (`ZoomIn` icon, `title="Zoom In"`): Calls `zoomIn(0.1)`.
    2. **Zoom Out** (`ZoomOut` icon, `title="Zoom Out"`): Calls `zoomOut(0.1)`.
    3. **Reset View** (`RotateCcw` icon, `title="Reset View"`): Calls `resetTransform()`.
    4. **Center View** (`Maximize2` / `Crosshair` icon, `title="Center View"`): Calls `centerView(initialScale)`.
    5. **Toggle Page Break Line** (`Scissors` / `FileMinus` icon, `title="Toggle Page Break Line"`): Toggles `showPageBreak` boolean state (`default: true`), changing button style between active (`bg-primary text-primary-foreground`) and ghost (`hover:bg-muted`).
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbol `Su`)
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (AX buttons `"Zoom In"`, `"Zoom Out"`, `"Reset View"`, `"Center View"`, `"Toggle Page Break Line"`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Provide all 5 floating canvas actions with accessible `aria-label` and `title` attributes.

---

## 2. A4 Geometry & Multi-Page Break Visualization (`$r`, `fu`)

### Finding W-PREV-03: 96-DPI A4 Sheet Sizing & Dynamic `ResizeObserver` Page Break Lines
- **Description**:
  - `#cv-preview` (`$r`) converts millimeter dimensions to CSS pixels using `Qr = 3.78` (`96 DPI / 25.4 mm/inch = 3.7795 px/mm`):
    - **Width**: `210 * 3.78 = 793.8px`
    - **Minimum Height (1 A4 Page)**: `297 * 3.78 = 1122.66px`
    - **Padding**: `margin.VALUE * 3.78 px` (`20mm` default = `75.6px`)
  - Component `fu` attaches a `ResizeObserver` to `#cv-preview` to track its rendered `scrollHeight` / `offsetHeight`:
    - Calculates `pageCount = Math.floor(contentHeight / 1122.66)`.
    - When `showPageBreak` is `true`, renders a horizontal dashed red divider (`border-t-2 border-dashed border-red-400 pointer-events-none print:hidden`) with a red pill label (`"Page Break"` / `"Page {i}"`) at `top: ${i * 1122.66}px` for each page boundary.
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `$r`, `fu`, constants `Qr = 3.78`, `Zr = 210`, `Jr = 297`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Strip or hide `<fu />` when serializing `#cv-preview.outerHTML` for PDF export so the dashed red indicator line never appears in the generated PDF. (In CVMaster's `gf` export handler, it clones `#cv-preview` and removes `[data-page-break]` / `.border-red-400` elements before serialization.)

---

## 3. Desktop Preview Mode vs. Mobile Tabbed Layout (`yf`, `vf`)

### Finding W-PREV-04: Desktop Sidebar Collapse (`previewMode`) and Mobile Tabs (`<1024px`)
- **Description**:
  1. **Desktop (`>= 1024px`, `hidden lg:flex`)**:
     - By default (`previewMode = false`), renders the left editor `<aside class="w-[450px] xl:w-[500px] border-r overflow-y-auto">` alongside the `<main class="flex-1 relative">` preview canvas.
     - Clicking the `"Preview"` button in the top header (`vf`) toggles `previewMode = true`, hiding the `<aside>` (`${previewMode ? "hidden" : "w-[450px] xl:w-[500px]"}`) so the zoom/pan canvas occupies 100% of the viewport width, and re-centers the A4 sheet.
  2. **Mobile & Tablet (`< 1024px`, `flex lg:hidden`)**:
     - The `"Preview"` toggle button in the top header is hidden (`hidden lg:flex`).
     - Instead, `yf` renders a full-height Radix `<Tabs defaultValue="editor">` with a 2-column `<TabsList class="grid w-full grid-cols-2">` at the top of the workspace (`"Editor"` and `"Preview"`), switching between `<up />` (the accordion editor list) and `<Ca />` (the interactive zoom/pan preview canvas).
- **Evidence source**:
  - `assets/index-B9ESfVPA.js` (symbols `yf`, `vf`)
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (DOM nodeIds `108`–`111`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Implement both the desktop collapsible sidebar (`previewMode`) and the `<1024px` two-tab switcher (`Editor` / `Preview`).
