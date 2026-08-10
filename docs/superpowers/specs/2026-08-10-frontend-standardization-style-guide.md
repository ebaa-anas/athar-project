# Frontend Standardization — Style Guide (for Phases 2-4)

Reference for applying the frontend design standardization to dashboard content
files. Companion to `2026-08-10-frontend-design-standardization-design.md`.
Presentation-layer only — never touch state, routing, Firestore queries, or
handler logic. Only `className` values (and, where explicitly noted, adding
purely-presentational UI state like a mobile toggle) are in scope.

## 1. Design tokens available (defined in `src/styles/globals.css`, already live)

Use these as plain Tailwind utility classes — `bg-`, `text-`, `border-`, `ring-`,
`shadow-`, all support them, with `/NN` opacity suffixes working normally:

| Token | Hex | Meaning |
|---|---|---|
| `role-volunteer` | `#016A6D` | Volunteer dashboard primary |
| `role-volunteer-dark` | `#014d4f` | Volunteer hover/darker |
| `role-org` | `#043E52` | Organization dashboard primary |
| `role-org-dark` | `#033040` | Organization hover/darker |
| `role-accent-teal` | `#1C9290` | Shared active-state accent (Volunteer + Organization only — never Admin) |
| `role-admin-accent` | `#f59e0b` (amber-500) | Admin's own accent (gold) — Admin never uses role-org/role-volunteer/role-accent-teal |
| `role-admin-accent-dark` | `#d97706` (amber-600) | Admin hover/darker |
| `brand-cta` | `#E16A3D` | Marketing/CTA orange — decorative only, not a role identity, use sparingly in dashboards (e.g. a genuine call-to-action button) |
| `brand-cta-dark` | `#c2562d` | CTA hover |
| `brand-cta-light` | `#FFA45D` | Lighter CTA tint |
| `danger` / `danger-dark` | red family | Errors, destructive actions |
| `warning` / `warning-dark` | amber family | Warnings, pending states |
| `success` / `success-dark` | emerald family | Success, verified/active states |
| `info` | blue family | Informational |

## 2. Stray brand-hex → token mapping (mechanical, apply wherever found)

| Raw hex found | Replace with |
|---|---|
| `#033040` | `role-org-dark` |
| `#157a78`, `#168181` | `role-accent-teal` |
| `#0C4A54` | `role-org` |
| `#014d4f`, `#125d56`, `#015052` | `role-volunteer-dark` |
| `#006D5B`, `#11666B` | `role-volunteer` |
| `#021c25` | `role-org-dark` |
| `#86A7AC` | `role-accent-teal` (add `/60` opacity if it was used as a muted/secondary tone) |
| `#c2562d` | `brand-cta-dark` |
| `#FFA45D` | `brand-cta-light` |
| `#94a3b8` | Tailwind `slate-400` |
| `#64748b` | Tailwind `slate-500` |
| `#e2e8f0` | Tailwind `slate-200` |
| `#f8fafc` | Tailwind `slate-50` |
| `#f1f5f9`, `#f0f0f0` | Tailwind `slate-100` |
| `#cbd5e1` | Tailwind `slate-300` |
| `#475569` | Tailwind `slate-600` |
| `#1e293b` | Tailwind `slate-800` |
| `#d97706` | `warning-dark` |
| `#e63946` | `danger` (or Tailwind `red-600`) |
| `#ccfbf1` | Tailwind `teal-100` |
| `#14b8a6` | Tailwind `teal-500`, or `role-accent-teal` if it's clearly acting as the shared accent |
| `#016A6D`, `#1C9290`, `#043E52`, `#E16A3D` | `role-volunteer` / `role-accent-teal` / `role-org` / `brand-cta` respectively (keep the existing `bg-`/`text-`/`border-` prefix, just replace the bracket hex) |

Any hex not listed here: judge by proximity — is it functioning as this role's
primary, its darker hover state, the shared teal accent, or a neutral slate? Pick
the nearest token. Never invent a new hex.

## 3. Status/semantic color cleanup

The app currently mixes families for the same meaning. Standardize per-file:

- **Danger/error/destructive** → Tailwind `red-*` (drop `rose-*` — same numeric
  shade, e.g. `rose-600` → `red-600`)
- **Warning/pending** → Tailwind `amber-*` (drop `orange-*` when it's being used
  for a status/warning meaning — e.g. a "pending" badge. Do NOT touch `orange-*`
  when it's genuinely decorative/CTA-adjacent; in dashboards that's rare, when in
  doubt prefer amber)
- **Success/verified/active** → Tailwind `emerald-*`
- **Info** → Tailwind `blue-*` (drop `indigo-*`, same numeric shade)
- Stray `yellow-*` → `amber-*`; stray `lime-*`/`fuchsia-*`/`sky-*`/`cyan-*`/`violet-*`/`pink-*` → nearest of red/amber/emerald/blue by what the color is actually communicating in context.
- Leave existing correct usages alone (e.g. `text-red-600` on an error message
  needs no change) — only fix the off-family ones.

## 4. Typography

Don't introduce new arbitrary `text-[Npx]` sizes. Use the standard Tailwind
scale, keeping this rough hierarchy consistent across every dashboard page:

- Page/section title: `text-2xl font-bold` (or `text-xl` for a sub-section)
- Card title: `text-lg font-semibold` or `text-base font-semibold`
- Body text: `text-sm` (default) or `text-base` for primary reading content
- Meta/caption/label: `text-xs`
- Avoid anything below `text-[10px]` except small numeric badges/pills, which
  already use `text-[10px]` consistently across the sidebars — that's fine to
  keep for badge counts specifically.

## 5. Spacing

- Card padding: `p-6` standard, `p-4` for compact/dense cards — pick one per
  card *type* and use it consistently for every instance of that card type
  within the file.
- Section vertical rhythm: `space-y-6` between major sections, `space-y-4`
  within a card.
- Grid/flex gaps: `gap-4` (dense) or `gap-6` (spacious) — match whatever the
  file's existing dominant pattern is rather than mixing both arbitrarily in
  the same grid.
- Fix any bare arbitrary spacing (`p-[18px]`, `gap-[10px]`, etc.) by rounding
  to the nearest standard Tailwind step (`4`→`1rem`/`p-4`, etc.).

## 6. Responsiveness checklist (apply to every file)

- Every multi-column grid must collapse on mobile: `grid-cols-1 md:grid-cols-2
  lg:grid-cols-3` (or similar) — never a bare `grid-cols-3` with no smaller
  breakpoint.
- Flex rows that hold several elements (stat cards, filter bars, action
  buttons) must wrap or stack on mobile: `flex-col sm:flex-row`, `flex-wrap`,
  or `overflow-x-auto` for things like tab bars.
- Watch for fixed pixel widths (`w-[400px]`) on containers that should shrink
  on mobile — replace with `w-full max-w-md` or similar.
- Tables: wrap in `overflow-x-auto` if not already, so they scroll instead of
  breaking layout on narrow screens.
- Modals/dialogs: confirm they don't exceed viewport width (`max-w-[90vw]` or
  Radix defaults are already fine — don't touch dialog primitives themselves).
- The sidebar/mobile-nav mechanism is already handled in `App.tsx` and the
  three sidebar components — nothing to do here for that.

## 7. Verification per file

1. `npx tsc --noEmit` — must not introduce new errors in the file you touched.
2. `npx vite build` — must succeed.
3. Grep the file for `#[0-9A-Fa-f]{6}` — should return nothing except inside
   image/unsplash URLs (leave those alone).
4. Commit with a message describing the file and what changed (colors,
   typography, spacing, responsiveness — mention whichever applied).
