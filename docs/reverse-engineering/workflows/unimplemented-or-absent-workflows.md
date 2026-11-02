# Unimplemented or Absent Workflows in CVMaster

**Target Application**: `https://cvmaster.app/`  
**Primary Evidence Records**:
- `ev_617be9be32d4ea29095351e89133a13948b0c17c9964bcda9b13bfa3818fffce` (`analyze_web_bundle`)
- `ev_aa23f6dbd7756f79a749b8b1da8825cfd0d8f7cef63488cab739b619d75f971d` (`export_web_scripts`)
- `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5` (`analyze_javascript_application` core bundles)
- `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`inspect_web_page`)

---

## Overview

The task instructions requested inspection of **registration, login, CV creation, editing, templates, preview, customization, and export, where accessible**. Through exhaustive static analysis of all 13 JavaScript chunks and runtime DOM/network inspection, several workflows commonly found in SaaS resume builders are verified to be **completely absent** from CVMaster.

---

## 1. User Registration, Login, and Authentication

### Finding W-ABS-01: Zero Authentication, Registration, or User Account Workflows
- **Description**:
  - CVMaster has **no** `/login`, `/register`, `/signup`, `/profile`, or `/dashboard` routes, modals, or UI components.
  - There are no authentication SDKs (no Clerk, Auth0, NextAuth, Firebase Auth, or Supabase Auth), no session cookies, no JWT tokens, and no password/OAuth forms anywhere in the bundle.
  - All user state lives exclusively in the browser's `window.localStorage` (`cv-storage`, `controls-storage`, `review-storage`, `cv-master-theme`).
- **Evidence source**:
  - `ev_617be9be32d4ea29095351e89133a13948b0c17c9964bcda9b13bfa3818fffce` (`analyze_web_bundle` routes: only `/` and `/review`)
  - `ev_fa6d6e41c78e797a47fa1b2f2b72a9d47c21a4d92c833522fd2fe363d8fc5950` (`cookies: []`, DOM/AX tree inspection)
  - `assets/index-B9ESfVPA.js` & `assets/state-LogT9lEE.js`
- **Verification status**: `Verified`
- **Implementation implications**:
  - Our equivalent CV builder does not require user registration or login to match CVMaster's anonymous, zero-friction UX. Users persist data locally and can port data across devices via JSON export/import.

---

## 2. Multi-Template Switching

### Finding W-ABS-02: Single Parameterized ATS Layout (No Multi-Template Gallery)
- **Description**:
  - Although `index.html` SEO metadata (`meta[name="description"]` and `script[type="application/ld+json"]`) mentions `"customizable templates"`, the application codebase implements **only one single-column ATS resume layout component (`$r`)**.
  - There is no template gallery modal, no `templateId` field in `cv-storage` or `controls-storage`, and no alternative layout components (such as two-column sidebar templates or creative banner templates).
  - Instead, visual customization is achieved entirely by parameterizing the single layout (`$r`) via `controls-storage`:
    - 6 font categories + hundreds of Google Fonts (`fontFamily`)
    - Font size (`12..18px`), line height (`1..2.5`), vertical spacing (`0.25..2.5`), and page margin (`10..50mm`)
    - Header alignment (`Left`, `Center`, `Right`)
    - Skills layout (`Inline`, `Grid Columns`, `Grid Rows`)
    - Profile photo visibility, size (`50..150px`), and border radius (`0..50%`)
    - Arbitrary section ordering (`sectionOrder`) and custom section titles.
- **Evidence source**:
  - `index.html` (`ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`)
  - `assets/index-B9ESfVPA.js` (symbols `Sa`, `$r`)
  - `assets/state-LogT9lEE.js` (stores `Y`, `ee`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Focus primary implementation effort on a rock-solid, highly customizable ATS-friendly layout (`$r`) driven by the `Controls` store; optionally, we can design our renderer architecture so additional template presets can be plugged in cleanly later.

---

## 3. Multi-Resume Management & Cloud Sync

### Finding W-ABS-03: Single Active Resume in `localStorage`
- **Description**:
  - `cv-storage` stores a single `resumeData` object at a time rather than an array/dictionary of multiple saved resumes.
  - To maintain multiple versions of a resume, users must either use the `"Hide from PDF"` item toggle (`hiddenItemIds`) or export/import `.json` snapshots (`<Name>_CV.json`).
- **Evidence source**:
  - `assets/state-LogT9lEE.js` (store `Y`)
- **Verification status**: `Verified`
- **Implementation implications**:
  - Match the single active `cv-storage` store for simplicity, while supporting instant JSON import/export and item-level `Hide from PDF` toggling.

---

## 4. Monetization, Paywalls, or Subscription Gates

### Finding W-ABS-04: Zero Paywalls or Billing Integrations
- **Description**:
  - Consistent with the JSON-LD declaration `"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }`, there are no Stripe/Paddle/LemonSqueezy integrations, no watermark restrictions, and no feature gates on PDF export or AI review.
- **Evidence source**:
  - `index.html` (`ev_2445cd04bdd6a6f1425a8803718dcca48c3471c84a269d7b60cf7118bbf153d8`)
  - `ev_9f1622136e724145a2541fd1139a2fbbf85723b588895c404b9a01e018973bf5`
- **Verification status**: `Verified`
- **Implementation implications**:
  - All features (editing, customization, AI writing, AI review, JSON/PDF import & export) should be unlocked and directly accessible.
