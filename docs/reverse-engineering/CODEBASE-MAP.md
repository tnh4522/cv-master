# CVMaster — Codebase Map & Module Architecture Audit

**Phase**: Phase 1 — Codebase Audit  
**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Sources**:
- Exported production bundle in `scratch/exported_scripts/files/origins/8548a4773eab10a4a4d1b43b03857f303578c84594608cd8fe66f8f022dff3e5/assets/*` (`ev_aa23f6dbd7756f79a749b8b1da8825cfd0d8f7cef63488cab739b619d75f971d`)
- Lazy-loaded chunks `assets/DndSections-CIlCdOj4.js` and `assets/ReviewPage-BNk1S44H.js` (`ev_5c7ff687c41ba2d956c4b0ad4f650d6a8c92e69697d94efe53263f18b4201846`)
- Wire capture of `index.html`, `assets/index-dt7n0t0W.css`, `logo.svg`, and `site.webmanifest` (`ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`)

---

## 1. Current Workspace & Extracted Bundle Inventory

### 1.1 Workspace Status (`d:\cv-master`)
- Currently, `d:\cv-master` contains only documentation under `docs/reverse-engineering/`. No application source files exist yet in `d:\cv-master`.
- All reverse-engineered frontend bundles from `https://cvmaster.app/` have been captured and decoded via REA and are mapped below to guide the clean-room Vite + React + TypeScript reimplementation in Phase 2–4.

### 1.2 Production Bundle File Inventory

| Bundle File | Size (Bytes) | SHA256 Digest | Contents & Third-Party Dependencies |
|---|---:|---|---|
| `index.html` | `5,138` | `0e605734291520b174e873e376c19956bc2b274366c8b2c0e4844f5c0e5e5cb0` | SPA entry HTML, SEO meta, JSON-LD `WebApplication`, `<div id="root">` |
| `assets/index-dt7n0t0W.css` | `60,673` | *(wire capture `ev_2445cd04...`)* | Tailwind CSS v3, shadcn/ui CSS variables (`--background`, `--primary`, etc.), `.animate-dash`, Tiptap `.editor-container` rules |
| `assets/index-B9ESfVPA.js` | `248,019` | `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867` | All core application components, stores (`Y`, `ee`, `Hd`), Zod schemas, AI functions (`Mu`, `Lu`, `Ou`, `Fu`, `zu`, `Bu`), `react-zoom-pan-pinch` (`Nd`, `Pd`, `Td`), and router bootstrap |
| `assets/DndSections-CIlCdOj4.js` *(lazy)* | `1,313` | `f0ce236ccd7d47115d23302ca87c22a8fa7bc54e18d4c83d47d448e75b820f0e` | Lazy-loaded section reorder list (`W`, `K`) inside the `Controls` drawer |
| `assets/ReviewPage-BNk1S44H.js` *(lazy)* | `20,237` | `8b36c0f57433369c5ed397f97437a3c9d9e70d0c9562e390155893915c45e4f0` | Lazy-loaded `/review` AI CV Analysis Report page (`ce`, `q`, `c`, `b`, `C`, `J`, `W`, `Z`, `Q`) |
| `assets/state-LogT9lEE.js` | `665` | `8c2957b65bf0494f754d9e894c879ff4fa20c139469fc5eb2cd13993dd90c6fb` | Zustand `create` (`hs`) store factory (`useSyncExternalStore`) |
| `assets/services-Cix8ANSZ.js` | `110,971` | `16471190df5726f377d5fd5d8b2f811be5d1c0bc72330dd944fd5b18c26fa5ef` | `groq-sdk` (`cc` class) HTTP client & streaming/multipart helpers |
| `assets/utils-C_1XUkXG.js` | `46,356` | `1fe03e2f5b17e645646fd681dddc3e6cc46f76a98e6ab1be8632746dd750ebae` | `tailwind-merge` (`Ul`), `clsx` (`gr`), `class-variance-authority` (`Mt`), `cmdk` (`le`), `query-string` (`Bl`), `usehooks-ts` (`Hl` `useIntersectionObserver`, `We` `useWindowSize`, `Yl` `useDebounceValue`, `$l` `useScrollLock`) |
| `assets/react-vendor-BUnTq23-.js` | `162,487` | `7a38767d70ca1395432506d60e018fa330b75bf7357b471b27a1385c42e81ef9` | `react` (`18.3.1`), `react-dom/client`, `react-router-dom` (`v6`: `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`, `useLocation`) |
| `assets/radix-BU6_lYRH.js` | `124,043` | `d1924cb9d05fc96f13a7241e3c462cd0f2d987e30df01bb8c80217500b57978f` | Radix UI primitives (`Accordion`, `AlertDialog`, `Checkbox`, `Dialog`, `DropdownMenu`, `Label`, `Popover`, `RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Slider`, `Slot`, `Switch`, `Tabs`, `Toast`, `Tooltip`) |
| `assets/tiptap-D0TUE6zV.js` | `368,266` | `fd38370fc74d7477292bf9b385a3a982e8e233e235c9c487c2473c1732419eb7` | `@tiptap/react` (`EditorProvider` `lc`, `useCurrentEditor` `gs`), `@tiptap/extension-*` (`Document`, `Text`, `Bold`, `Italic`, `Paragraph`, `ListItem`, `BulletList`, `OrderedList`, `History`, `Link`) |
| `assets/forms-DW1-mji3.js` / `forms-DCdeFFAP.js` | `80,295` | `f82f4e993b5a7c037be1b5a045dc27b9b2429c2c9d72b150e0e43fb51268b1df` | `zod` (`v`, `W`, `ae`, `ce`, `ze`, `xr`, `Se`, `Xt`), `react-hook-form` (`useForm` `Ie`, `FormProvider` `Gl`, `Controller` `Wl`, `useFormContext` `Xl`) |
| `assets/dnd-CY1-W-IF.js` | `48,468` | `6ef92e36ba8d8290ddbb04a6c2764f5bb4861e61f6db0880290e5f23210b2546` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `assets/icons-CXh8LH_w.js` / `icons-BFfL9nJq.js` | `26,337` | `4c99cc8bc293275a40219c16e4ff98ecbd85d79bd00fa8957363fc09866468eb` | `lucide-react` icon components |

---

## 2. Routing Architecture

| Route Path | Entry Symbol | Lazy Chunk | Component Tree & Behavior |
|---|---|---|---|
| `/` | `yf` | Bundled in `index-B9ESfVPA.js` | Locks body scroll (`$l()`), checks `sessionStorage.getItem("hasVisited")` to show `<Ki message="Loading CV Master..." />` for `500ms` on initial session visit, wraps workspace in `<Li>` (`ThemeProvider`) and `<kp>` (`DialogProvider`), renders `<vf />` (Header), and switches at `1024px` (`We().width < 1024`) between mobile `<Xp />` (`Edit` / `Preview` tabs) and desktop split view (`<Oi />` editor pane + `<Ca />` zoom/pan canvas) + `<Dp />` (`Toaster`) + `<Hp />` (`Analytics`). |
| `/review` | `wf` -> `ce` | `assets/ReviewPage-BNk1S44H.js` (with `500ms` artificial transition delay in `u.lazy`) | Renders `<Ki message="Loading Review..." />` fallback during `Suspense`, then mounts `ce` -> `<Li>` -> `<vf />` (Header) + `<q />` (CV Analysis Report). If `currentAnalysis` is `null`, renders `"No analysis found"` empty state with `"Back"` button to `/`. |

---

## 3. Complete Symbol-to-Component Map

### 3.1 Application Bootstrap, Providers & Layout Shell
| Minified Symbol | Clean Reimplementation Name | Source Chunk | Responsibility |
|---|---|---|---|
| `jf` | `ErrorBoundary` | `index-B9ESfVPA.js` | Class error boundary catching render errors with `"Something went wrong"`, `"Try again"`, and `"Reload page"` buttons. |
| `yf` | `HomePage` / `WorkspacePage` | `index-B9ESfVPA.js` | Main `/` route component managing `500ms` first-visit splash (`hasVisited`), responsive `<1024px` breakpoint, and providers. |
| `Ki` | `LoadingScreen` | `index-B9ESfVPA.js` | Fullscreen spinner with customizable `message` (defaults to `"Loading CV Master..."`, or `"Loading Review..."` for `/review`). |
| `Li` / `dp` | `ThemeProvider` / `useTheme` | `index-B9ESfVPA.js` | Manages `"light" | "dark" | "system"` theme persisted in `localStorage["cv-master-theme"]`. |
| `ls` | `ThemeSwitch` | `index-B9ESfVPA.js` | Animated pill toggle switch (`horizontal` in header on `<1024px` and `/review`; `vertical` at bottom of desktop left icon rail `up`). |
| `kp` / `Ce` | `DialogProvider` / `useDialog` | `index-B9ESfVPA.js` | Context managing which section modal (`experience`, `projects`, `education`, `skills`, `languages`, `certifications`, `awards`, `volunteering`) is open and the edited item's array `index` (`null` when creating). |
| `vf` | `Header` | `index-B9ESfVPA.js` | `h-16` top navigation bar containing `<xf />` (Logo), `<ls />` (ThemeSwitch), `<Sa />` (`Controls` button on `<640px`), and desktop action buttons (`<mn />` AI Review, `<un />` Import, `<dn />` Download) or `<1024px` `"Menu"` dropdown. |
| `Xp` | `MobileWorkspaceTabs` | `index-B9ESfVPA.js` | `<1024px` 2-tab switcher (`defaultValue="preview"`, tabs `"edit"` -> `<Oi />` and `"preview"` -> `<Ca />`). |
| `Oi` | `EditorPanel` | `index-B9ESfVPA.js` | Left pane (`basis-[40%] 2xl:basis-[35%]`) containing desktop quick-jump icon rail `<up />` and scrollable editor container (`<Du />`, `<Wu />`, and eight `<Ee />` section lists). |
| `up` | `SectionNavRail` | `index-B9ESfVPA.js` | Desktop (`hidden lg:flex`) vertical icon rail with 10 quick-scroll buttons (`basics`, `summary`, `experience`, `projects`, `education`, `skills`, `languages`, `certifications`, `awards`, `volunteering`) + vertical `<ls />` theme toggle. |

### 3.2 Editor Sections & Modals
| Minified Symbol | Clean Reimplementation Name | Source Chunk | Responsibility |
|---|---|---|---|
| `Du` | `BasicsEditor` | `index-B9ESfVPA.js` | `"Personal Info"` section editor: photo upload/URL/size/radius/visibility/delete, `Full Name`, `Job Title`, `Email`, `LinkedIn`, `Portfolio`, `Phone` (+ `Break after` switch), `Location` (+ `Break after` switch), and `customFields` with 15-icon picker (`Yr`). |
| `Wu` | `SummaryEditor` | `index-B9ESfVPA.js` | `"Summary"` section editor with inline-editable heading, `200ms` debounced (`Yl`) updates, and embedded `<Ue />` rich-text editor. |
| `Ee` | `SectionListEditor` | `index-B9ESfVPA.js` | Generic list section editor (`experience`, `projects`, `education`, `skills`, `languages`, `certifications`, `awards`, `volunteering`) with inline title editing, item cards, 3-dot `Actions` menu (`Edit`, `Duplicate`, `Hide from PDF` / `Show in PDF`, `Delete` via `<Ma />`), and `"Add new item"` button. |
| `Ma` | `DeleteConfirmDialog` | `index-B9ESfVPA.js` | Radix `AlertDialog` (`"Are you absolutely sure? This action cannot be undone. This will permanently delete this item."`). |
| `fp` | `ExperienceDialog` | `index-B9ESfVPA.js` | Add/Edit Experience form modal (`pp` schema). |
| `gp` | `ProjectsDialog` | `index-B9ESfVPA.js` | Add/Edit Project form modal (`hp` schema) with sortable keyword chips (`_i`). |
| `vp` | `EducationDialog` | `index-B9ESfVPA.js` | Add/Edit Education form modal (`xp` schema). |
| `jp` | `SkillsDialog` | `index-B9ESfVPA.js` | Add/Edit Skill group form modal (`yp` schema) with sortable keyword chips (`_i`). |
| `bp` | `LanguagesDialog` | `index-B9ESfVPA.js` | Add/Edit Language form modal (`wp` schema). |
| `Sp` | `CertificationsDialog` | `index-B9ESfVPA.js` | Add/Edit Certification form modal (`Np` schema). |
| `Pp` | `AwardsDialog` | `index-B9ESfVPA.js` | Add/Edit Award form modal (`Cp` schema). |
| `Tp` | `VolunteeringDialog` | `index-B9ESfVPA.js` | Add/Edit Volunteering form modal (`Ep` schema). |
| `_i` | `SortableKeywordChip` | `index-B9ESfVPA.js` | `@dnd-kit/sortable` pill chip used inside `ProjectsDialog` (`gp`) and `SkillsDialog` (`jp`). |
| `Ue`, `$u`, `Xu`, `Gu` | `RichTextEditor`, `EditorToolbar`, `AiEditorActions`, `EditorContentSync` | `index-B9ESfVPA.js` | Tiptap editor (`slotBefore`: formatting toolbar `$u`; `slotAfter`: AI buttons `Xu` for `Improve Writing`, `Fix Typos`, `Customize`; skeleton overlay `Zt` while regenerating). |

### 3.3 Preview Canvas, Template Renderer & Controls Sheet
| Minified Symbol | Clean Reimplementation Name | Source Chunk | Responsibility |
|---|---|---|---|
| `Ca`, `Cu` | `PreviewCanvas`, `useDebouncedZoomSync` | `index-B9ESfVPA.js` | `TransformWrapper` (`Nd`) + `TransformComponent` (`Pd`) + floating toolbar `<Su />` (rendered on `>=640px`). |
| `Su` | `CanvasFloatingToolbar` | `index-B9ESfVPA.js` | Floating rounded pill bar with `Zoom In`, `Zoom Out`, `Reset Zoom`, `Center View`, `scroll to pan` / `scroll to zoom` toggle, `Hide/Show Page Break Line` toggle, and `Controls` sheet trigger button. |
| `Sa` | `ControlsSheet` | `index-B9ESfVPA.js` | Radix `Sheet` (`side="left"` on `<640px`, `side="right"` on `>=640px`) containing `Personal info layout` alignment buttons, `Skills layout` radio group, `Layout Reorder` (`Suspense` -> `Nu`), `Typography` (`mu` font picker + sliders for `Font size`, `Line height`, `Vertical spacing`), and `Page` (`Margin` slider + `Show break line` switch). |
| `mu`, `du` | `FontPickerAccordion`, `FontCategoryCombobox` | `index-B9ESfVPA.js` | Category combobox (`Hr`) + `cmdk` searchable font list with `IntersectionObserver` (`Hl`) lazy Google Font loading (`Ns`). |
| `Nu` -> `W`, `K` | `DndSections`, `SortableSectionItem` | `DndSections-CIlCdOj4.js` | Lazy-loaded `@dnd-kit/sortable` vertical list for reordering the 9 CV sections (`sectionOrder`). |
| `$r` | `ResumeSheet` | `index-B9ESfVPA.js` | A4 resume sheet (`mode: "preview" | "print"`, `793.8px x 1122.66px`) rendering `<Yd />` (`Basics`) and ordered section components (`Kd`, `Xd`, `Gd`, `Wd`, `$d`, `Jd`, `Zd`, `qd`, `Qd`) + `<eu />` (`PageBreakIndicators`). |
| `Yd`, `Kd`, `Xd`, `Gd`, `Wd`, `$d`, `Jd`, `Zd`, `qd`, `Qd` | `BasicsPreview`, `SummaryPreview`, `ExperiencePreview`, `ProjectsPreview`, `SkillsPreview`, `EducationPreview`, `LanguagesPreview`, `CertificationsPreview`, `AwardsPreview`, `VolunteeringPreview` | `index-B9ESfVPA.js` | Individual section renderers inside `$r`, filtering out items in `hiddenItemIds` and stripping literal `"• "` prefixes from HTML summaries. |
| `eu`, `tu` | `PageBreakLines`, `useElementHeight` | `index-B9ESfVPA.js` | `ResizeObserver` hook tracking `$r` height and rendering dashed horizontal lines + `"Page N starts"` pills when `mode === "preview"` and `pageBreakLine === true`. |

### 3.4 Import, Download & AI Review Components
| Minified Symbol | Clean Reimplementation Name | Source Chunk | Responsibility |
|---|---|---|---|
| `dn`, `Kp`, `Gp`, `Wp` | `DownloadButton`, `DownloadDialog`, `GeneratingPdfState`, `PdfSuccessState` | `index-B9ESfVPA.js` | Opens `"Download Options"` modal with `PDF` (validates `name`, `title`, `email`; renders `$r` in `mode="print"`, posts to `/pdf` and `/upload-pdf`) and `JSON` download options. |
| `un`, `ff`, `df`, `uf`, `mf`, `pf` | `ImportButton`, `ImportDialog`, `useJsonValidation`, `useJsonImport`, `usePdfImport`, `useImageImport` | `index-B9ESfVPA.js` | Multi-format import modal (`pdf`, `image`, `cv-master-json`, disabled `json` coming soon) with extracted PDF text preview and AI parsing. |
| `mn`, `gf` | `AiReviewButton`, `AiReviewDialog` | `index-B9ESfVPA.js` | `"Review Your CV with AI"` modal (`jobTitle` min 5 chars, `jobDescription` min 100 chars, `"View last Review"` shortcut if `currentAnalysis` exists, fullscreen `"AI is reviewing your CV..."` overlay while `isAnalyzing`). |
| `ce`, `q`, `c`, `b`, `C`, `J`, `W`, `Z`, `Q` | `ReviewPage`, `ReviewReport`, `ScoreCircle`, `SkillBadges`, `ReviewCheckbox`, `OverviewTab`, `DetailedAnalysisTab`, `RecommendationsTab`, `ImprovementsTab` | `ReviewPage-BNk1S44H.js` | Lazy-loaded `/review` page displaying overall score, job fit, candidate fit level, and 4 tabs of analysis. |
