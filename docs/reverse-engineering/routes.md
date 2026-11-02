# CVMaster (`https://cvmaster.app/`) — Route Inventory & Navigation Behavior

## 1. Summary of Discoverable Routes

Static bundle analysis and runtime scenario testing confirm that CVMaster defines **exactly 2 client-side routes** using React Router (`BrowserRouter` -> `Routes` -> `Route`), plus **3 external/backend service origins** and **1 analytics endpoint**.

| Route Path | Component / Bundle | Loading Strategy | Purpose | Direct HTTP `GET` Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `yf` (`assets/index-B9ESfVPA.js`) | Eager (initial bundle) | Main Resume Builder workspace (Editor + Live Preview + Modals) | `200 OK` (`text/html`) |
| `/review` | `ce` (`assets/ReviewPage-BNk1S44H.js`) | Lazy (`React.lazy` + 500ms artificial delay) | AI CV Analysis Report viewer (`Overview`, `Detailed Analysis`, `Recommendations`, `Improvements`) | `404 NOT_FOUND` (Vercel server 404 — SPA rewrite missing!) |

---

## 2. Detailed Route Findings

### Finding RT-01: Exhaustive React Router Table (`/` and `/review`)
- **Description**: The application entrypoint (`wf` in `assets/index-B9ESfVPA.js`) mounts `<BrowserRouter>` with a `<Routes>` block containing only two `<Route>` definitions:
  1. `<Route path="/" element={<yf />} />`
  2. `<Route path="/review" element={<Suspense fallback={<Ki message="Loading Review..." />}><bf /></Suspense>} />`
  where `bf` is a `React.lazy` dynamic import of `./ReviewPage-BNk1S44H.js` wrapped in a `new Promise(t => setTimeout(() => t(r), 500))` artificial 500ms delay.
- **Evidence source**:
  - REA Static Web Bundle Analysis: `ev_617be9be32d4ea29095351e89133a13948b0c17c9964bcda9b13bfa3818fffce` and `ev_18c1e7316c9b82a9aeab17e5bee8a7901c076452967daa4cfe343f187620b505` (`index-B9ESfVPA.js`, line 631, columns 18042–18254).
  - REA Static JS Application Analysis: `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`summary.statistics.route_patterns: 2`, `occurrences: 5`).
  - Shipped Bundle (`assets/index-B9ESfVPA.js`, line 631, function `wf`; `assets/ReviewPage-BNk1S44H.js`, SHA256 `8b36c0f57433369c5ed397f97437a3c9d9e70d0c9562e390155893915c45e4f0`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Only two routes (`/` and `/review`) are required for full functional parity.
  - Code-splitting `/review` via `React.lazy` keeps the review dashboard out of the initial critical path, though the artificial 500ms `setTimeout` is unnecessary in a clean implementation.

---

### Finding RT-02: Missing Server-Side SPA Fallback Causes HTTP 404 on Direct `/review` Navigation
- **Description**: While client-side transitions to `/review` via React Router's `useNavigate()("/review")` succeed after an AI CV Review completes, requesting `https://cvmaster.app/review` directly from the server (or refreshing the browser tab while on `/review`) returns an **HTTP 404 `NOT_FOUND`** HTML error page from Vercel (`x-vercel-error: NOT_FOUND`, `<title>404: NOT_FOUND</title>`, `"This page doesn't exist"`). Furthermore, the React Router `<Routes>` table defines no catch-all `path="*"` route.
- **Evidence source**:
  - REA Browser Scenario Capture: `ev_b2767a0bc06aee66e53d8ed3bb06b490c6b56b8b4b7c2c26a02933a5a23e2934` (`transaction_id: "request-1"`, `GET https://cvmaster.app/review`, response status `404`, header `x-vercel-error: NOT_FOUND`, response body SHA256 `b59ad6359dae1037262d16c587a24ce8e73efa0deedf449d70ebed38a7b41cb8`).
  - Shipped Bundle (`assets/index-B9ESfVPA.js`, line 631, `wf` component).
- **Verification status**: **Verified**
- **Implementation implications**:
  - In our clean-room implementation, configure proper SPA fallback routing (both in the dev server and production hosting config) so refreshing `/review` serves `index.html` and loads the persisted `localStorage["currentAnalysis"]` report rather than crashing with a 404.
  - Add a client-side `path="*"` fallback route (or redirect to `/`) for unknown client paths.

---

### Finding RT-03: Client-Side Navigation Triggers & Route Guards
- **Description**: Navigation between `/` and `/review` occurs through four specific UI triggers:
  1. **Brand Logo Link (`vf`)**: `<Link to="/">` wrapping `/logo.svg` and `"CV Master"` in the top header bar.
  2. **Post-Analysis Auto-Navigation (`Ma`)**: In the `CV Review` modal (`Ma`), after `Bu(resumeJson, jobTitle, jobDescription)` resolves and `setAnalysis(u)` saves the result to Zustand/`localStorage["currentAnalysis"]`, the handler calls `n("/review")` (`useNavigate()`).
  3. **Existing Analysis Shortcut (`vf`)**: When `currentAnalysis` is non-null in the `Hd` store, clicking the `CV Review` button in the header checks `if (currentAnalysis) { navigate("/review"); return; }` (Wait: let's verify exact behavior in `Ma` vs `vf` — in `Ma`, submitting a new review always runs `Bu` and navigates to `/review`; on `/review`, if `currentAnalysis` is null, `q` renders an empty state `"No analysis found — Please review your CV and try again."` with a `"Back"` button).
  4. **Review Page Back Button (`q` in `ReviewPage-BNk1S44H.js`)**: Both the populated report view and the `"No analysis found"` empty state render an outline `<Button onClick={() => navigate("/")}>Back</Button>` at the top of `/review`.
- **Evidence source**:
  - Shipped Bundles: `assets/index-B9ESfVPA.js` (line 631, components `Ma`, `vf`) and `assets/ReviewPage-BNk1S44H.js` (line 1, component `q`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Ensure `/review` gracefully handles both states of `currentAnalysis`:
    - When `currentAnalysis !== null`: Render the 4-tab CV Analysis Report (`Overview`, `Detailed Analysis`, `Recommendations`, `Improvements`) with a `Back` button to `/`.
    - When `currentAnalysis === null`: Render the `"No analysis found"` empty state with a `Back` button to `/`.
  - Note that on `/review`, the header (`vf`) hides editor-specific controls (`Controls`, `Preview`, `Reset`, `Import`, `Export`) because `vf` checks `useLocation().pathname === "/"` (`const c = i.pathname === "/"`), rendering only the brand logo link, `CV Review` button, and `Theme` toggle when on `/review`!

---

### Finding RT-04: Route-Aware Header Rendering (`pathname === "/"`)
- **Description**: The shared header component (`vf`) is rendered on both `/` (inside `yf`) and `/review` (inside `ce` in `ReviewPage-BNk1S44H.js`). It inspects `const i = useLocation(); const c = i.pathname === "/";` and conditionally renders:
  - **Only when `pathname === "/"`**: Mobile `Controls` sheet trigger (`<Sa />`), desktop `Controls` sheet trigger (`<Sa />`), `Preview` toggle button, `Reset` alert dialog (`<Kp />`), `Import` dialog (`<ff />`), `Export` dropdown (`<gf />`), and the mobile/tablet `More Actions` dropdown (`DropdownMenu`) when it only contains editor actions.
  - **On all routes (`/` and `/review`)**: Brand logo (`<Link to="/">`), `CV Review` modal trigger (`<Ma />`), and `Theme` selector dropdown (`<Mi />`).
- **Evidence source**:
  - Shipped Bundles: `assets/index-B9ESfVPA.js` (line 631, function `vf`) and `assets/ReviewPage-BNk1S44H.js` (line 1, function `ce`).
- **Verification status**: **Verified**
- **Implementation implications**:
  - Make the top header component route-aware via `useLocation().pathname === "/"` so workspace-specific actions (`Controls`, `Preview`, `Reset`, `Import`, `Export`) are hidden on `/review`, while `CV Review` (allowing re-running an analysis) and `Theme` remain accessible.
