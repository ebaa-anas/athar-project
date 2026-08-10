# Frontend Standardization — Phase 0 (Foundation) + Phase 1 (Landing/Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the design-token foundation and fix the landing/auth screens, per `docs/superpowers/specs/2026-08-10-frontend-design-standardization-design.md`.

**Architecture:** Pure CSS/JSX styling changes. No state, routing, props, or Firebase logic touched anywhere in this plan.

**Tech Stack:** Tailwind CSS v4 (CSS-first `@theme inline` config in `src/styles/globals.css`), React/TSX, `tailwind.config.js` (legacy content/plugins only).

## Global Constraints
- Zero functional changes: no logic, state, routing, or API/Firebase changes — presentation layer only.
- Preserve the three role-theme anchor colors: Volunteer `#016A6D`, Organization `#043E52`, shared active-state teal `#1C9290`.
- Admin gets its own distinct accent: replace Admin's reuse of `#043E52`/`#E16A3D` with the amber/gold scale (`--brand-amber-500` `#f59e0b` / `--brand-amber-600` `#d97706`), so Admin no longer shares an accent color with Organization.
- Status colors: danger=red, warning=amber, success=emerald, info=blue (existing `--system-*` tokens). No rose/orange-as-warning/indigo/yellow left after this work.
- No new npm dependencies.
- Verification is visual (dev server at mobile/tablet/desktop widths) plus `tsc` staying clean — no test framework exists for styling.

---

### Task 1: Foundation tokens — `globals.css` + `tailwind.config.js`

**Files:**
- Modify: `src/styles/globals.css:52-58` (system colors block) and `:root`/`@theme inline` blocks
- Modify: `tailwind.config.js` (no change expected — confirm default breakpoints are sufficient, documented only)

**Interfaces:**
- Produces these new CSS custom properties, consumed by every later task via Tailwind utility classes (`bg-role-volunteer`, `text-role-org`, `bg-role-admin-accent`, `text-danger`, `bg-warning/10`, etc.):
  - `--role-volunteer` (`#016A6D`), `--role-volunteer-dark` (`#014d4f`)
  - `--role-org` (`#043E52`), `--role-org-dark` (`#033040`)
  - `--role-accent-teal` (`#1C9290`) — shared active-state accent for Volunteer + Organization
  - `--role-admin-accent` (`var(--brand-amber-500)`), `--role-admin-accent-dark` (`var(--brand-amber-600)`)
  - `--brand-cta` (`#E16A3D`), `--brand-cta-dark` (`#c2562d`) — marketing/CTA orange, unrelated to role identity
  - `--color-danger` / `--color-warning` / `--color-success` / `--color-info` exposed as real Tailwind theme colors (currently `--system-*` exist in `:root` but aren't registered in `@theme inline`, so no `bg-danger`/`text-warning` utilities exist yet)

- [ ] **Step 1: Add role + brand-cta variables to `:root`**

In `src/styles/globals.css`, immediately after the `--system-orange: #f97316;` line (line 58), add:

```css
  /* Role Theme Anchors - the ONLY hex values role UI should reference */
  --role-volunteer: #016A6D;
  --role-volunteer-dark: #014d4f;
  --role-org: #043E52;
  --role-org-dark: #033040;
  --role-accent-teal: #1C9290;
  --role-admin-accent: var(--brand-amber-500);
  --role-admin-accent-dark: var(--brand-amber-600);
  --brand-cta: #E16A3D;
  --brand-cta-dark: #c2562d;
```

- [ ] **Step 2: Register the new colors as Tailwind utilities**

In the `@theme inline { ... }` block (starts line 170), add before the closing `}`:

```css
  --color-danger: var(--system-red);
  --color-danger-dark: var(--system-red-dark);
  --color-warning: var(--brand-amber-500);
  --color-warning-dark: var(--brand-amber-600);
  --color-success: var(--system-green);
  --color-success-dark: var(--system-green-dark);
  --color-info: var(--system-blue);
  --color-role-volunteer: var(--role-volunteer);
  --color-role-volunteer-dark: var(--role-volunteer-dark);
  --color-role-org: var(--role-org);
  --color-role-org-dark: var(--role-org-dark);
  --color-role-accent-teal: var(--role-accent-teal);
  --color-role-admin-accent: var(--role-admin-accent);
  --color-role-admin-accent-dark: var(--role-admin-accent-dark);
  --color-brand-cta: var(--brand-cta);
  --color-brand-cta-dark: var(--brand-cta-dark);
```

This makes `bg-role-volunteer`, `text-role-org`, `bg-role-admin-accent`, `bg-danger`, `text-warning`, `bg-success/10`, etc. available as plain Tailwind classes everywhere in the app.

- [ ] **Step 3: Verify build picks up the new tokens**

Run: `npm run dev` (or existing dev script), open any page, confirm no CSS errors in console/terminal. Then run:

```bash
npx tsc --noEmit
```

Expected: no new errors (this step only touches CSS, so this just confirms nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "Add role-theme and status-color design tokens to globals.css"
```

---

### Task 2: Landing page — token cleanup only

**Files:**
- Modify: `src/components/LandingPage.tsx`

**Interfaces:**
- Consumes: `bg-role-volunteer`, `bg-role-org`, `text-role-org`, `bg-role-accent-teal`, `text-role-accent-teal`, `bg-brand-cta`, `text-brand-cta`, `border-role-org` (and `/NN` opacity suffixes, e.g. `bg-role-accent-teal/10`) from Task 1.

The layout, spacing, and responsive breakpoints in this file are already sound (proper `md:`/`lg:`/`xl:` usage throughout, no arbitrary spacing) and its color usage is already internally consistent with the real dashboard colors — this is a **mechanical hex-to-token swap only**, no layout changes.

- [ ] **Step 1: Replace every hardcoded brand hex with its token equivalent**

Apply this exact substitution table across the file (find each hex literal, replace with the token class; keep any `/NN` opacity suffix, e.g. `bg-[#1C9290]/20` → `bg-role-accent-teal/20`):

| Find | Replace with |
|---|---|
| `[#043E52]` (as bg) | `role-org` |
| `[#043E52]` (as text) | `role-org` |
| `[#043E52]` (as border) | `role-org` |
| `[#1C9290]` (bg/text/border/ring/shadow) | `role-accent-teal` |
| `[#016A6D]` (bg/text/border) | `role-volunteer` |
| `[#E16A3D]` (bg/text/border) | `brand-cta` |
| `[#FFA45D]` (text/border, footer + Animal Welfare tile) | `brand-cta` with `/70` opacity (it's a lighter tint of the CTA orange — e.g. `text-[#FFA45D]` → `text-brand-cta/70`) |

Concretely this touches: header nav/logo/button classes (~L101-131), hero section background/badges/buttons/stats (~L137-229), Focus Areas tile colors (~L243-258), "Why Choose Athar" section background + icon tiles (~L267-303), "Choose Your Impact" cards (~L326-378), About section accents (~L392-423), footer (~L435-483).

Leave `bg-slate-*`, `text-slate-*`, and `border-slate-*` classes untouched — those are neutral, not brand colors.

- [ ] **Step 2: Visual check**

Run the dev server, view the landing page at 375px (mobile), 768px (tablet), and 1440px (desktop) widths. Confirm:
- Colors render identically to before (this is a token swap, not a redesign — a diff-by-eye against the pre-change screenshot should show no visible change).
- No layout shift or broken responsive behavior.

- [ ] **Step 3: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/components/LandingPage.tsx
git commit -m "Route LandingPage brand colors through design tokens"
```

---

### Task 3: Login/Signup — fix role-color mismatch + give Admin its own identity

**Files:**
- Modify: `src/components/LoginSignup.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: a corrected `getTheme()` return shape consumed by the render body — same three keys as before (`sidePanel`, `button`, plus existing `title`/`desc`/`stats`) so no other prop/type changes ripple out. Adds one new key, `accentText`, used by the two hardcoded-teal spots in the shared signup form (Step 3 below).

**The bug:** `getTheme()` (L41-68) currently assigns colors backwards relative to the real dashboards — `organization` gets `#016A6D` (that's actually the **Volunteer** dashboard's color) and the default/`volunteer` case gets `#1C9290` (the shared accent, not Volunteer's actual primary). Admin reuses `#043E52`, which is Organization's primary. Per the design spec, login-page panels must match each role's real dashboard identity, and Admin must get its own gold identity instead of reusing Organization's navy-teal.

- [ ] **Step 1: Fix `getTheme()`**

Replace lines 41-68 with:

```tsx
  const getTheme = () => {
    switch (userType) {
      case 'admin':
        return {
          sidePanel: 'bg-slate-900',
          button: 'bg-role-admin-accent hover:bg-role-admin-accent-dark text-slate-900',
          accentText: 'text-role-admin-accent',
          title: 'System Administration',
          desc: 'Secure access for platform management and oversight.',
          stats: [{ label: 'System Uptime', value: '99.9%' }, { label: 'Active Admins', value: '12' }, { label: 'Security Level', value: 'High' }]
        };
      case 'organization':
        return {
          sidePanel: 'bg-role-org',
          button: 'bg-role-org hover:bg-role-org-dark text-white',
          accentText: 'text-role-org',
          title: 'Organization Portal',
          desc: 'Manage your initiatives and connect with volunteers.',
          stats: [{ label: 'Organizations', value: '800+' }, { label: 'Opportunities', value: '5k+' }, { label: 'Impact Hours', value: '1.2M' }]
        };
      default: // Volunteer
        return {
          sidePanel: 'bg-role-volunteer',
          button: 'bg-role-volunteer hover:bg-role-volunteer-dark text-white',
          accentText: 'text-role-volunteer',
          title: 'Volunteer Community',
          desc: 'Join thousands making a real difference every day.',
          stats: [{ label: 'Volunteers', value: '15k+' }, { label: 'Events', value: '250+' }, { label: 'Communities', value: '81' }]
        };
    }
  };
```

Note the Admin `button` class now sets `text-slate-900` explicitly (gold buttons need dark text for contrast, unlike the white text the teal buttons use) — the two call sites (`className={... ${theme.button} text-white}` at L271 and L320/480) hardcode `text-white` after `theme.button`, which would fight this. Fix those three call sites in the same step: remove the trailing `text-white` from each `className` template literal since `theme.button` now carries its own text color:

- L271: `` className={`w-full h-11 ${theme.button}`} ``
- L320: `` className={`w-full h-11 ${theme.button}`} ``
- L480: `` className={`w-full h-11 mt-4 ${theme.button}`} ``

- [ ] **Step 2: Fix the Admin-only panel accent (L231-232)**

Replace:

```tsx
                  <ShieldAlert className="h-5 w-5 text-[#043E52]" />
                  <p className="text-xs font-bold text-[#043E52] uppercase tracking-wider">Authorized Personnel Only</p>
```

with:

```tsx
                  <ShieldAlert className="h-5 w-5 text-role-admin-accent-dark" />
                  <p className="text-xs font-bold text-role-admin-accent-dark uppercase tracking-wider">Authorized Personnel Only</p>
```

And the "Forgot password?" link at L251 — replace `text-[#043E52] hover:text-[#033040]` with `text-role-admin-accent-dark hover:text-role-admin-accent`.

- [ ] **Step 3: Make the shared signup form's teal accents theme-aware**

The signup tab (org-tier select ring at L401, checkbox check at L466, and the two Terms/Privacy links at L473/L475) is shared between Volunteer and Organization sign-up but is hardcoded to `#016A6D` (Volunteer's color) even when `userType === 'organization'`. Replace each hardcoded `[#016A6D]` in this block (L401, L466, L473, L475) with `theme.accentText`'s color equivalent — since these are mixed into `focus:ring-*`/`text-*` utility positions, use the token class directly instead of the string prop:
- L401 `focus:ring-[#016A6D]` → `focus:ring-role-org` (this field only renders when `userType === 'organization'`, so it's always the org color — use the literal token, not `theme.accentText`)
- L466 `text-[#016A6D]` (CheckSquare icon) → `` className={`h-5 w-5 ${theme.accentText}`} ``
- L473, L475 `text-[#016A6D]` (Terms/Privacy spans) → `` className={`${theme.accentText} font-semibold hover:underline mx-1`} `` (and matching for L475's `ml-1` variant)

- [ ] **Step 4: Visual check across all three `userType` values**

Run the dev server, open the login/signup screen for `volunteer`, `organization`, and `admin` (however the app switches `userType` — check `App.tsx` if unsure how to trigger each). At 375px, 768px, and 1440px widths, confirm:
- Volunteer panel is teal (`#016A6D`), Organization panel is navy-teal (`#043E52`) — no longer swapped.
- Admin panel is dark slate with gold button/accents — visually distinct from Organization's navy-teal.
- Organization's sign-up tab shows navy-teal checkbox/links, not volunteer-teal.
- Buttons have correct contrast (white text on teal/navy, dark text on gold).

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/components/LoginSignup.tsx
git commit -m "Fix login panel role-color mismatch and give Admin a distinct gold identity"
```

---

## What's next
Phases 2-4 (Volunteer dashboard, Organization dashboard, Admin dashboard — ~33 remaining component files) each get their own plan, written after this phase lands and is reviewed, so later plans can build on the actual committed state of the tokens rather than assumptions made now.
