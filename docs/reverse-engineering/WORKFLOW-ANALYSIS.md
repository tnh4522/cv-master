# CVMaster — End-to-End Workflow Analysis

**Phase**: Phase 1 — Codebase Audit  
**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Sources**:
- `assets/index-B9ESfVPA.js` (`248,019` B, SHA256 `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867`)
- `assets/DndSections-CIlCdOj4.js` (`1,313` B, SHA256 `f0ce236ccd7d47115d23302ca87c22a8fa7bc54e18d4c83d47d448e75b820f0e`)
- `assets/ReviewPage-BNk1S44H.js` (`20,237` B, SHA256 `8b36c0f57433369c5ed397f97437a3c9d9e70d0c9562e390155893915c45e4f0`)

---

## 1. Application Startup & Responsive Workspace Workflow (`yf`, `vf`, `Xp`, `Oi`, `Ca`)

1. **Error Boundary & Router Bootstrap**:
   - `#root` mounts `<jf>` (`ErrorBoundary`) -> `<BrowserRouter>` -> `<Routes>` with `/` (`<yf />`) and `/review` (`Suspense` -> `<wf />`).
2. **First-Visit Session Splash**:
   - `yf` checks `!sessionStorage.getItem("hasVisited")`.
   - On the first visit in a tab session, renders `<Ki message="Loading CV Master..." />` for `500ms`, then sets `sessionStorage.setItem("hasVisited", "true")` and mounts the workspace.
3. **Scroll Lock & Breakpoints**:
   - `yf` calls `$l()` (`useScrollLock`) to lock `document.body` scroll.
   - At `< 1024px` (`We().width < 1024`), renders `<Xp />` (`Tabs` with `"edit"` and `"preview"`, defaulting to `"preview"`). Also collapses the header action buttons (`Download`, `Import`, `AI Review`) into a `"Menu"` `DropdownMenu`.
   - At `>= 1024px`, renders `<Oi />` (left editor panel with quick-jump icon rail `<up />` + scrollable form sections) and `<Ca />` (right zoom/pan preview canvas) side-by-side.

---

## 2. Personal Info & Profile Photo Workflow (`Du`, `Yd`)

1. **Photo Upload & URL Input**:
   - Clicking the dashed `w-24 aspect-square` avatar box triggers a hidden file input (`accept="image/png,image/jpeg,image/jpg,image/webp"`).
   - Validates MIME type and `size <= 2MB`.
   - Reads the file via `FileReader.readAsDataURL` and immediately updates `basics.photo` (`{ url, size: 100, borderRadius: 4, visible: true }`).
   - Alternatively, users can paste an `https://` image URL directly into `#basics.photo.url` (validated via `z.string().url()`).
   - When `basics.photo.url` is present, renders `Size` (`40..200px`, default `100px`) and `Border radius` (`0..100px`, default `4px`) number inputs with individual reset buttons, plus `Hide`/`Show` (`visible`) and `Remove` (opens `<Ma />` confirmation dialog) buttons.
2. **Contact Fields & Line Breaks**:
   - `Full Name`, `Job Title`, `Email`, `LinkedIn`, `Portfolio`, `Phone`, and `Location` update `basics` on every change and show inline validation hints (`hasError` via `be.pick(...)`) when invalid:
     - Invalid Email hint: `"Use format: name@domain.com"`
     - Invalid LinkedIn / Portfolio hint: `"URL must start with: https://"`
   - `Phone` and `Location` include a `"Break after"` `Switch` (disabled if the input value is empty) that inserts a `<br />` after that item in `<Yd />` (`BasicsPreview`).
3. **Custom Fields (`customFields`)**:
   - Clicking `"Add Custom Field"` appends `{ id: crypto.randomUUID(), name: "", iconName: "link", value: "", breakAfter: false }`.
   - Each custom field row renders a 5x3 icon grid popover (`Yr`, 15 icons), `Name` input, `Value` input, and delete button.
   - In `<Yd />`, if `value` is a valid URL (`z.string().url().safeParse(value).success`) and `name` is non-empty, it renders the icon + `<a href={value} className="underline">{name}</a>`; otherwise it renders the icon + `{name}: {value}`.

---

## 3. Summary & Dynamic List Sections Workflow (`Wu`, `Ee`, `kp`, `fp`–`Tp`)

1. **Summary Section (`Wu`)**:
   - Heading (`sectionTitles.summary`) can be edited inline by clicking the heading or the pencil icon (`Enter`, `Escape`, or `onBlur` commits the change).
   - Content is edited via `<Ue />` (Tiptap rich-text editor) and debounced by `200ms` (`Yl(content, 200)`) before writing to `resumeData.summary.content`.
2. **List Sections (`Ee` for `experience`, `projects`, `education`, `skills`, `languages`, `certifications`, `awards`, `volunteering`)**:
   - **Empty State (`itemsCount === 0`)**: Renders a full-width dashed `"Add new item"` button (`h-12`).
   - **Populated State (`itemsCount > 0`)**: Renders animated `<li>` cards for each item plus a footer `"+ Add new item"` button.
   - **Item 3-Dot Actions Menu (`Ii`)**:
     - **Edit**: Calls `updateDialog(sectionId, itemIndex)`, opening the corresponding modal (`fp`–`Tp`) pre-populated with `resumeData[sectionId][index]`.
     - **Duplicate**: Clones the item with `id: crypto.randomUUID()` and appends it to `resumeData[sectionId]`.
     - **Hide from PDF / Show in PDF**: Calls `toggleHiddenItem(item.id)`. Hidden items render at `opacity-50` in the editor and are filtered out of `$r` (`!hiddenItemIds.includes(item.id)`).
     - **Delete**: Opens `<Ma />` (`AlertDialog`); confirming plays a `300ms` slide-out animation (`animate-out slide-out-to-left fade-out`) before removing the item at `index`.
3. **Sortable Keyword Chips in Projects & Skills Modals (`gp`, `jp`, `_i`)**:
   - Typing a keyword and pressing `Enter` or `,` (or pasting comma-separated text via `onPaste`) appends unique trimmed keywords to `keywords`.
   - Keywords render as rounded pills (`_i`) inside a `@dnd-kit/sortable` list (`rectSortingStrategy`), supporting drag reordering, individual removal (`300ms` slide-out), and a `"Clear All"` button.

---

## 4. Live Preview Canvas & Customization Controls Workflow (`Ca`, `Su`, `Sa`, `$r`)

1. **Interactive Canvas (`Ca`, `Su`)**:
   - Wraps `<$r mode="preview" />` inside a `bg-white shadow-2xl` container with `padding: ${margin.VALUE}px`.
   - Floating bar `<Su />` (visible on `>= 640px`) provides:
     - `Zoom In` (`+0.25`, max `2.0`)
     - `Zoom Out` (`-0.25`, min `0.4`)
     - `Reset Zoom` (resets to breakpoint default scale and centers view)
     - `Center View` (`instance.setCenter()`)
     - `scroll to pan` / `scroll to zoom` mode toggle (`wheelPanning`)
     - `Hide/Show Page Break Line` toggle (`pageBreakLine`)
     - `Controls` button (opens `<Sa />` sheet).
2. **Controls Sheet (`Sa`)**:
   - **Personal info layout**: 3 alignment buttons (`start`, `center`, `end`) updating `basics.alignment`.
     - `"start"`: Photo left, text left-aligned.
     - `"center"`: Photo centered above text (`flex-col justify-center items-center`), text centered.
     - `"end"`: Photo right (`flex-row-reverse`), text right-aligned.
   - **Skills layout**: RadioGroup (`"inline"`, `"grid-col"`, `"grid-row"`).
   - **Layout Reorder**: Lazy-loaded `<DndSections />` (`DndSections-CIlCdOj4.js`) reordering `sectionOrder` and displaying current `sectionTitles[key]`.
   - **Typography**:
     - Font family accordion (`mu`) with category filter (`du`: `ATS-Friendly`, `sans-serif`, `serif`, `display`, `monospace`, `handwriting`) and `cmdk` search.
     - `Font size` slider (`12..18px`, reset `14px`).
     - `Line height` slider (`4..10`, displayed as `lineHeight * 4 / 16` = `1.0..2.5`, applied as `${lineHeight * 0.25}rem`, reset `5` = `1.25`).
     - `Vertical spacing` slider (`1..10`, displayed as `verticalSpacing * 4 / 16`, applied as Tailwind `space-y-1` .. `space-y-10` on `.preview`, reset `2`).
   - **Page**:
     - `Margin` slider (`10..50px`, reset `20px`).
     - `Show break line` switch (`pageBreakLine`).

---

## 5. Import & Download Workflows (`ff`, `dn`, `Kp`)

1. **Import CV (`ff`)**:
   - File type selector (`Select`):
     - `"pdf"` (`PDF - High accuracy`, `.pdf`, `1KB..20MB`): Loads `pdf.js`, extracts text from all pages (`>= 50` chars required), shows an `"Extracted Text Preview"` box (first 1,000 chars), and sends text to `Fu` (AI parser) to populate `resumeData` and `pdfSettings`.
     - `"image"` (`Image - Medium accuracy`, `.png,.jpg,.jpeg`, `10KB..4MB`): Converts image to base64, calls Vision AI parser `zu`, validates with `Uu`, and populates `resumeData` and `pdfSettings`.
     - `"cv-master-json"` (`CV Master JSON - Fastest`, `.json`): Two-step flow—user clicks `"Validate"` (`df` runs `cf.safeParse`), then clicks `"Import"` (`uf` updates `resumeData`, `hiddenItemIds`, and `pdfSettings`).
     - `"json"` (`Generic JSON (.json) (Coming soon)`): Disabled option.
2. **Download CV (`dn`, `Kp`)**:
   - Clicking `"Download"` opens `<Kp />` (`Download Options` dialog):
     - **PDF**: Validates `basics.name`, `basics.title`, and `basics.email`, renders `<$r mode="print" />` to HTML, shows `<Gp />` (`"Generating your PDF..."`), generates/fetches the PDF, downloads `${name}-${title}.pdf`, and shows `<Wp />` (`"PDF downloaded!"`) for `1500ms`.
     - **JSON**: Serializes `{ ...resumeData, hiddenItemIds, pdfSettings }` (`JSON.stringify(..., null, 2)`) and downloads `${name}-${title}.json`.

---

## 6. AI Writing Assistant & AI CV Review Workflows (`Xu`, `gf`, `ReviewPage-BNk1S44H.js`)

1. **Tiptap AI Writing Actions (`Xu`)**:
   - Rendered beneath every Tiptap rich-text editor (`slotAfter`).
   - Buttons are disabled when plain text (`content.replace(/<[^>]*>/g, "").trim()`) is empty or while an action is running:
     - `"Improve Writing"` -> calls `Mu(content)`
     - `"Fix Typos"` -> calls `Lu(content)`
     - `"Customize"` (`Select` dropdown) -> calls `Ou(content, selectedPrompt)` with 6 options (`Shorter`, `Longer`, `More Formal`, `More Informal`, `More Creative`, `More Technical`).
   - While regenerating or customizing, `<Ue />` overlays a 3-line pulsing skeleton (`Zt`) over the editor and sets editor text opacity to `0`.
2. **AI CV Review (`gf` -> `/review`)**:
   - Clicking `"AI Review"` in the header opens `<gf />`.
   - If `currentAnalysis` already exists in `Hd`, shows a `"View last Review"` button that navigates directly to `/review`.
   - Clicking `"AI Review"` validates `jobTitle.length >= 5` and `jobDescription.length >= 100` (`hf`), displays a fullscreen `"AI is reviewing your CV..."` overlay, calls `Bu(JSON.stringify(resumeData), jobTitle, jobDescription)`, stores the result via `setAnalysis`, and navigates to `/review`.
   - `/review` (`ReviewPage-BNk1S44H.js`) renders the gradient header banner, 3-column summary metrics (`Overall Score` circular gauge, `Job Fit` circular gauge, `Candidate Level` pill + `estimatedImprovementTime`), and 4 tabs (`Overview`, `Detailed Analysis`, `Recommendations`, `Improvements` with interactive strikethrough checkboxes).
