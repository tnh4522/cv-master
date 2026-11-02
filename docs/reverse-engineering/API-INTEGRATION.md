# CVMaster — External API Integration & Service Adapter Specification

**Phase**: Phase 1 — Codebase Audit  
**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Sources**:
- `assets/index-B9ESfVPA.js` (`248,019` B, SHA256 `781f94d3b87ef06640d5c865b6ee640b913bc30fd04a1e8f59a01cfeb4d77867`)
- `assets/services-Cix8ANSZ.js` (`110,971` B, SHA256 `16471190df5726f377d5fd5d8b2f811be5d1c0bc72330dd944fd5b18c26fa5ef`)
- `ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8` (network wire captures)

---

## 1. Security & Architecture Policy for Reimplementation

Per the project architecture decisions:
1. **No Private Keys in Browser Bundles**: The original CVMaster bundle hardcoded a Groq API key (`gsk_...`) and a Google Webfonts API key (`AIzaSy...`) inside `assets/index-B9ESfVPA.js`. Our reimplementation **must never** embed private API keys in source code or client bundles.
2. **Independent Service Adapters with Automatic Mock Fallbacks**:
   - All external integrations (AI text enhancement, PDF/Image AI extraction, AI CV Review, Google Fonts catalog, PDF generation, and Profile Photo storage) must sit behind clean TypeScript adapter interfaces (`src/services/adapters/`).
   - If an environment variable (`VITE_GROQ_API_KEY`, `VITE_GOOGLE_FONTS_API_KEY`, `VITE_PDF_API_URL`) is not configured or if a network/API request fails or hits rate limits, the adapter must gracefully fall back to a deterministic local/browser implementation or mock adapter and surface a clear status indicator/toast.

---

## 2. External Integration 1: Groq AI Service (`Mu`, `Lu`, `Ou`, `Fu`, `zu`, `Bu`)

### 2.1 Original Client Configuration
- **SDK**: `groq-sdk` (`cc` in `assets/services-Cix8ANSZ.js`)
- **Endpoint**: `POST https://api.groq.com/openai/v1/chat/completions`

### 2.2 Function-by-Function Specification & Prompts

#### A. `improveContent` (`Mu`)
- **Model**: `"llama-3.1-8b-instant"`, `temperature: 0.1`, `max_tokens: 1024`, `top_p: 1`, `stream: false`
- **System Prompt**:
  ```text
  You are a professional content editor specializing in clear, concise business communication. Your task is to:
  1. Enhance the content to be more professional, polished, and impactful
  2. Maintain approximately the same length as the original
  3. Preserve all HTML tags and structure exactly as they appear
  4. Focus on clarity, precision, and professional tone
  5. Remove redundancies and unnecessary words
  6. Ensure proper business writing conventions

  Return only the improved content without any explanations or meta-text.
  ```
- **User Prompt**:
  ```text
  Please improve the following content while preserving all HTML markup. Make it more professional, concise, and impactful:

  ${content}
  ```

#### B. `fixTypos` (`Lu`)
- **Model**: `"llama-3.1-8b-instant"`, `temperature: 0.1`, `max_tokens: 1024`, `top_p: 1`, `stream: false`
- **Messages**:
  1. `role: "user"`: `Please proofread and correct any spelling, grammar, or punctuation errors in the following content, while preserving all HTML markup: "${content}"`
  2. `role: "system"`:
     ```text
     You are a professional proofreader and editor. Your task is to correct spelling, grammar, and punctuation errors while:
     1. Preserving all HTML tags and structure exactly as they appear
     2. Maintaining the original meaning and tone
     3. Only fixing genuine errors - do not rewrite or rephrase correct content
     4. Ensuring proper capitalization and spacing
     Return only the corrected content without any explanations.
     ```

#### C. `customizeContent` (`Ou`)
- **Model**: `"llama-3.1-8b-instant"`, `temperature: 0.1`, `max_tokens: 1024`, `top_p: 1`, `stream: false`
- **6 Preset Values (`te` in `Xu`)**:
  - **Shorter**: `"Make the response shorter by removing unnecessary information, focusing only on key points."`
  - **Longer**: `"Make the response longer by adding more information, focusing on key points and details."`
  - **More Formal**: `"Make the response more formal by using more professional language and tone."`
  - **More Informal**: `"Make the response more informal by using more casual language and tone."`
  - **More Creative**: `"Make the response more creative by using more creative language and tone."`
  - **More Technical**: `"Make the response more technical by using more technical language and tone."`
- **Messages**:
  1. `role: "user"`: `Customize the following content to make it more ${prompt}: "${content}"`
  2. `role: "system"`:
     ```text
     You are a professional content editor. Your task is to customize the provided content according to the user's prompt while following these strict guidelines:

     1. Preserve all HTML tags and structure exactly as they appear
     2. Maintain the original content's core message and intent
     3. Keep the output exactly the same length as the input, UNLESS the prompt specifically requests to make it shorter or longer
     4. Focus on adjusting tone, style, and word choice to match the customization request
     5. Ensure the output is clean - no explanations, headers, or additional formatting

     Return only the modified content.
     ```

#### D. `parsePdfResumeText` (`Fu`)
- **Model**: `"openai/gpt-oss-120b"`, `temperature: 1`, `max_tokens: 8096`, `top_p: 0.9`, `response_format: { type: "json_object" }`
- **Post-Processing**:
  - Sanitizes markdown fences via `_u(rawText)` (`replace(/```json\s*/g, "").replace(/```\s*/g, "")`, extracts substring from first `{` to last `}`).
  - Parses JSON and ensures `basics` and `pdfSettings` exist; on JSON parse error, falls back to `Vu()` (empty resume structure).

#### E. `parseImageResume` (`zu` + `Uu` Heuristic Validator)
- **Model**: `"meta-llama/llama-4-scout-17b-16e-instruct"`, `temperature: 1`, `max_tokens: 8096`, `top_p: 1`, `response_format: { type: "json_object" }`
- **Input**: Base64 string (`t`) and MIME type (`n`: `"image/png" | "image/jpg" | "image/jpeg"`), formatted as `data:${mimeType};base64,${base64Data}`.
- **Heuristic Validator (`Uu`)**:
  - Checks 6 signals:
    1. `basics.name || basics.email || basics.phone?.value`
    2. `experience.some(e => e.name || e.position)`
    3. `education.some(e => e.name || e.degree)`
    4. `projects.some(p => p.name || p.description)`
    5. `skills.some(s => s.name)`
    6. `summary?.content?.trim().length > 20`
  - If `< 2` signals are truthy -> throws `"This doesn't appear to be a CV/Resume. Please upload an image containing a CV or resume document."`
  - If none of `basics`, `experience`, or `education` are present -> throws `"Could not find essential CV information (name, contact details, experience, or education). Please ensure the image contains a clear CV/Resume."`
  - Checks negative keyword list (`["recipe", "cooking", "ingredients", "invoice", "receipt", ...]`) and positive CV keyword list (`["experience", "education", "skills", "resume", "cv", ...]`).

#### F. `analyzeResumeWithAi` (`Bu`)
- **Model**: `"openai/gpt-oss-120b"`, `temperature: 0.5`, `max_tokens: 8192`, `response_format: { type: "json_object" }`
- **Guard Clauses on Parsed JSON**:
  - If `result?.jobFitPercentage === 0` -> throws `"Please enter a valid job title and description"`
  - If `result?.isResume === false` -> throws `"cannot analyze an empty resume"`

---

## 3. External Integration 2: Google Fonts API (`cu`, `sa`, `Ns`, `Fd`)

- **Curated Local ATS-Friendly Font List (`Fd`, 21 fonts)**:
  - `sans-serif`: `IBM Plex Sans`, `Inter`, `Roboto`, `Source Sans Pro`, `Noto Sans`, `Lato`, `Work Sans`
  - `serif`: `IBM Plex Serif`, `Merriweather`, `Source Serif Pro`, `Crimson Text`, `Cormorant Garamond`, `Libre Baskerville`
  - `monospace`: `IBM Plex Mono`, `JetBrains Mono`, `Space Mono`, `Courier Prime`, `Fira Code`
  - `display`: `Playfair Display`, `Poppins`, `Montserrat`
- **Google Webfonts Catalog Fetch (`cu`)**:
  - `GET https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&category=${category}&sort=trending&capability=WOFF2`
  - If `category === "ATS-Friendly"`, returns `Fd` directly without a network request.
- **Stylesheet Injection (`sa`, `Ns`)**:
  - `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`
  - Appends `<link rel="stylesheet" href="...">` to `document.head` if not already present.
- **Adapter Strategy**:
  - Provide `Fd` + a built-in categorized catalog of popular Google Fonts (`sans-serif`, `serif`, `display`, `monospace`, `handwriting`) so font switching and Google Fonts CSS `<link>` loading work 100% without requiring a Google Cloud API key. If `VITE_GOOGLE_FONTS_API_KEY` is provided, optionally query the live Webfonts endpoint.

---

## 4. External Integration 3: PDF Generation & Photo Upload (`cvmaster-backend.vercel.app`)

### 4.1 Profile Photo Handling (`Du`)
- **Original Behavior**:
  1. Validates MIME type (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`) and size (`<= 2MB`).
  2. Immediately reads the file via `FileReader.readAsDataURL(file)` and sets `basics.photo.url = dataUrl` in `resumeData`!
  3. Then attempts `POST https://cvmaster-backend.vercel.app/upload-photo` with `{ image: dataUrl }`.
- **Reimplementation Adapter (`photoService`)**:
  - Because `FileReader.readAsDataURL` already produces a self-contained data URL that renders in both the preview canvas and exported PDFs, our local adapter resolves immediately with the validated DataURL (and optionally calls a configured upload endpoint if `VITE_PHOTO_UPLOAD_URL` is set).

### 4.2 PDF Export (`dn`)
- **Original Behavior**:
  1. Validates `basics.name`, `basics.title`, and `basics.email.includes("@")`.
  2. Renders `<$r mode="print" />` offscreen via `createRoot` + `flushSync` to obtain HTML markup without page-break indicator overlays.
  3. Wraps markup in an HTML document with Tailwind v2.2.19 CDN and the active Google Font stylesheet.
  4. Posts `{ htmlContent, margin: pdfSettings.margin }` to `POST https://cvmaster-backend.vercel.app/pdf` and downloads `${name}-${title}.pdf`.
  5. Silently uploads a copy to `POST /upload-pdf`.
- **Reimplementation Adapter (`pdfExportService`)**:
  - **Never** execute the silent `/upload-pdf` exfiltration call.
  - Provide a configurable PDF export adapter:
    - **Primary Browser-Native / Client-Side Print-to-PDF & Blob Generator**: Uses an isolated print iframe / print window with `@page { size: A4; margin: ... }` + client-side PDF generation so PDF export works 100% offline/frontend-only without depending on an external server, while optionally supporting `VITE_PDF_API_URL` if configured.
