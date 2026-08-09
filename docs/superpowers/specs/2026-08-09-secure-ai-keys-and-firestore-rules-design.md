# Secure AI Keys and Firestore Writes — Design

## Problem

Two related client-trust issues in the current app:

1. **AI API keys are shipped to the browser.** `VITE_GEMINI_API_KEY` and `VITE_OPENROUTER_API_KEY` are inlined into the production bundle by Vite (any `VITE_`-prefixed env var is client-visible). `src/gemini.js` calls OpenRouter directly with the key; `TrainingSimulator.tsx` and `OrganizationMessages.tsx` instantiate `GoogleGenerativeAI` directly with the Gemini key. Anyone can extract these keys from devtools/network inspection and use them outside the app.

2. **Firestore writes are unvalidated on the server.** `src/lib/authService.ts` writes directly from the browser via the Firestore client SDK, with no security rules in the repo (default rules or none). Concretely, today:
   - `updateVolunteerProfile(uid, updatedData: any)` and `updateOrganizationProfile(uid, updatedData: any)` pass arbitrary client-supplied objects straight to `updateDoc`. Because Firestore rules — not app code — are the actual security boundary (anyone can call the Firestore SDK directly from a browser console, bypassing these functions entirely), a user can currently set `role: "admin"` on their own `users/{uid}` doc, or an organization can set `verified: true` / `verificationStatus: "verified"` on its own `organizations/{uid}` doc, self-granting privileges.
   - `signUpAdmin()` in `authService.ts` creates an `admins/{uid}` doc and a `users/{uid}` doc with `role: "admin"` for whoever calls it. It is not currently wired to any UI (confirmed via grep — the only reference is the export itself), but it is shipped in the bundle and callable directly.

## Scope

**In scope:**
1. Vercel serverless functions that proxy Gemini and OpenRouter calls, holding the real API keys server-side.
2. Firestore Security Rules that stop client-side privilege escalation (self-granted `role`/`verified`/`verificationStatus`/`tier`) while preserving the legitimate write paths the app already relies on (admin verifying an org, org submitting a verification request).
3. Removal of the dead, dangerous `signUpAdmin()` public path, replaced with a documented manual admin-creation process.
4. A focused Firestore rules test suite (via the Firebase Rules Emulator) covering the specific privilege-escalation cases this design closes.

**Out of scope (deferred to future rounds):**
- General app test suite (unit/component tests) — separate initiative.
- Rewriting `authService.ts` error handling (`alert()` → toast), `console.log` cleanup, `any`-type tightening.
- An admin-invite system — admin creation stays a manual Firebase Console operation for now.
- Wiring up `react-router-dom` / real routing.
- Changing the existing tier-1-auto-verify business rule (see note under Firestore Rules below) — preserved as-is, just enforced server-side instead of trusted from the client.

## Architecture

```
Before:
  Component ──(holds VITE_GEMINI_API_KEY)──> Gemini API
  Component ──(holds VITE_OPENROUTER_API_KEY)──> OpenRouter API

After:
  Component ──fetch──> /api/gemini (Vercel fn, holds GEMINI_API_KEY) ──> Gemini API
  Component ──fetch──> /api/openrouter (Vercel fn, holds OPENROUTER_API_KEY) ──> OpenRouter API
```

- Two new serverless functions: `api/gemini.ts`, `api/openrouter.ts`. Each accepts the request payload the frontend currently sends to the provider SDK/API directly, attaches the real key from a non-`VITE_`-prefixed server env var, calls the provider, and returns the provider's response (or a generic error — see Error Handling).
- Frontend call sites updated to fetch these endpoints instead of calling the provider directly:
  - `src/gemini.js` (OpenRouter chatbot fallback)
  - `src/components/TrainingSimulator.tsx` (Gemini scenario simulation)
  - `src/components/organization/OrganizationMessages.tsx` (Gemini-assisted messaging)
- Firebase Auth and Firestore remain client-SDK-direct, exactly as today — only the *rules* change, not the code path. No Cloud Functions, no Blaze plan needed.
- Deployment: one Vercel project serves the static frontend and the `api/` functions together (app is not yet deployed, so no migration/CORS concerns).

## Firestore Security Rules

An `isAdmin()` helper gates all admin-only branches:

```
function isAdmin() {
  return request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

| Collection | Read | Create | Update |
|---|---|---|---|
| `users/{uid}` | `request.auth != null` (needed for org/volunteer browsing, messaging features that list other users) | only `request.auth.uid == uid`; `role` must be `"volunteer"` or `"organization"` — never `"admin"` | only own uid, and `role`/`verified`/`verificationStatus`/`tier` unchanged from `resource.data` — **unless** `isAdmin()` |
| `organizations/{uid}` | `request.auth != null` | only own uid; `verified` may only be `true` at creation when `request.resource.data.tier == "tier1"` (preserves the existing intentional tier-1-auto-verify rule — see note below), otherwise `verified` must be absent/`false` | only own uid; `verified`/`tier` unchanged, **and** `verificationStatus` may only move `"unverified" → "pending"` (the one legitimate self-service transition, used by `submitVerificationRequest`) — **unless** `isAdmin()`, which can write any field |
| `admins/{uid}` | `isAdmin()` only | **denied** — no client writes | **denied** |
| `verificationRequests/{id}` | `isAdmin()`, or `request.auth.uid == resource.data.orgId` | `request.auth.uid == request.resource.data.orgId` | **`isAdmin()` only** (approve/reject sets `status`, `verified`, etc.) |

Note on tier-1 auto-verify: this is existing product behavior (student clubs bypass audit by design), not a bug introduced here. The rule reproduces it server-side rather than removing it — anyone can still claim `tier: "tier1"` to get instant verification, same as today. If that's actually unwanted, it's a separate product decision, not part of this security fix.

## `signUpAdmin()` removal

- Delete the function and its export from `src/lib/authService.ts` (confirmed dead: no other file references it besides its own declaration).
- Document the replacement manual process (e.g. in a short `docs/admin-setup.md` or README section): create the Firebase Auth user via Console, then manually create matching `admins/{uid}` and `users/{uid}` (`role: "admin"`) documents via the Firestore Console. This is an accepted manual-ops tradeoff for an app with presumably few admins.

## Error Handling (Vercel functions)

- On provider failure, the proxy returns a generic `502` (upstream failure) or `500` (unexpected) with a short message — it does not forward the raw provider error body, since that can leak account/key details.
- Frontend call sites keep their existing fallback UI behavior (e.g. chatbot's existing "couldn't get a response" path), just pointed at the new endpoint instead of the provider.

## Testing

Firebase's local Rules Emulator (`@firebase/rules-unit-testing`) is free on any plan (emulators don't require Blaze — only *deployed* Cloud Functions do). Add a rules test file covering:
- Volunteer cannot set `role: "admin"` on their own `users` doc (create or update).
- Organization (tier2/tier3) cannot set `verified: true` / `verificationStatus: "verified"` on its own doc.
- Organization *can* perform the legitimate `unverified → pending` transition via `submitVerificationRequest`'s write shape.
- Admin (a uid present in `admins/`) *can* write `verified`/`verificationStatus` on an organization's doc.
- No client (including an authenticated admin's own uid, since admin docs are console-managed) can create/update/delete under `admins/*`.
- Tier1 organization can self-verify at creation (documenting the preserved existing behavior); tier2/tier3 cannot.

This is scoped narrowly to the rules this design introduces — not a general app test suite.

## Migration / Rollout Notes

- App is not yet deployed, so there's no live-traffic migration concern. New Vercel env vars (`GEMINI_API_KEY`, `OPENROUTER_API_KEY` — unprefixed) need to be set in the Vercel project; the old `VITE_`-prefixed key vars can be removed from `.env` once the frontend call sites are updated.
- Firestore rules should be deployed (`firebase deploy --only firestore:rules`) before or alongside the `authService.ts` changes, so there's no window where the old trust model is live without the new rules backing it.
