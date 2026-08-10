# Frontend Design Standardization

## Goal
Standardize spacing, typography, and responsiveness across the platform and remove clashing colors — presentation layer only, zero logic/routing/data changes.

## Role themes (preserved, one clarified)
- **Volunteer**: teal `#016A6D` surface, `#1C9290` active/accent.
- **Organization**: navy-teal `#043E52` surface, `#1C9290` active/accent. *(unchanged)*
- **Admin**: white/slate surface, **amber/gold accent** (`--brand-amber-*`, already defined in `globals.css` but unused) replaces the old `#043E52`/`#E16A3D` active-state, so Admin no longer shares its accent with Organization. Distinct identity: neutral + gold = "control/authority," separate from both teal-family dashboards.

## Token cleanup (`globals.css` + `tailwind.config.js`, no component logic touched)
- Collapse 11 stray one-off teal shades (`#033040`, `#157a78`, `#0C4A54`, `#168181`, `#014d4f`, `#006D5B`, `#125d56`, `#11666B`, `#015052`, `#021c25`, `#86A7AC`) into the existing brand teal scale.
- Status colors: **danger=red, warning=amber, success=emerald, info=blue** (per `--system-*` tokens already defined) — retire stray rose/orange-as-warning/indigo/yellow/lime usages found across components.
- Typography/spacing: keep the scale already defined in `globals.css` `@layer base` (h1–h4/p/label), enforce it consistently; standardize card padding and section gaps.
- Breakpoints: default Tailwind `sm/md/lg/xl/2xl`, no custom values needed.

## Rollout (phased, one reviewable chunk each)
0. Foundation — `globals.css`, `tailwind.config.js` only.
1. Landing/Auth — `LandingPage.tsx`, `LoginSignup.tsx`.
2. Volunteer dashboard — `Sidebar.tsx` + its ~15 components.
3. Organization dashboard — `OrganizationSidebar.tsx` + its ~12 components.
4. Admin dashboard — `AdminSidebar.tsx` + its 6 components (new gold accent applied here).

Fix colors, spacing, typography, and responsiveness together per file (single pass, not separate sweeps).

## Verification
Visual only (no logic changed): dev server checked at mobile/tablet/desktop widths per phase, plus `tsc`/build stays clean.
