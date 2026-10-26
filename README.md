<div align="center">

<img src="src/assets/athar-logo.png" alt="Athar logo: a heart drawn in fingerprint ridges" width="96" />

# Athar

**Volunteering that leaves a mark.**

A volunteer platform that verifies both sides, trains volunteers before a disaster, and lets response NGOs page a ready reserve matched on skills.

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-rolldown-646CFF?logo=vite&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-Functions-000000?logo=vercel&logoColor=white)

</div>

## Live demo

**[Open Athar →](https://athar-project-peach.vercel.app/)**

There are no shared demo logins. Signing up takes under a minute, and what you can do depends on who you sign up as:

| Sign up as | What you can do straight away |
|---|---|
| **Volunteer** | Build a profile<br>• browse and apply to opportunities<br>• take courses<br>• run the AI training simulator<br>• see the reserve (AVR) clearance checklist |
| **Organization, Tier 1**<br>(student club or youth forum) | Verified at sign-up<br>• post opportunities<br>• review applicants<br>• award hours and impact points |
| **Organization, Tier 2 or 3**<br>(NGO or disaster-response NGO) | Complete the profile and document checklist, then wait for an admin to approve it. Tier 3 then gets crisis management. |

A fresh volunteer account sees the reserve checklist rather than live alerts. Joining the reserve needs an admin to verify your ID and organizations to award impact points first.

Why there are no shared accounts: Athar has no demo mode. Nothing resets, so a shared login would let every visitor edit the same data. Admin accounts can't be created by signing up at all; they are set up by hand in the Firebase console ([docs/admin-setup.md](docs/admin-setup.md)).

## Why Athar

When a disaster hits, offers of help arrive faster than anyone can organize them. Organizations hear from hundreds of people they can't vet, and volunteers who want to help don't know where they're needed or whether they're ready. Most volunteer boards are a list of postings and do nothing before a crisis or during it. Athar covers both.

- **Trust runs both ways.** Organizations sign up in one of three tiers based on what they are, and Tier 2 and 3 are reviewed by an admin before they can post. Volunteers verify their identity the same way.
- **Readiness comes before the call.** Courses with prerequisites, skill paths and an AI role-play simulator build a record of what a volunteer has actually done, not a self-reported list of skills.
- **A reserve, not a crowd.** The Athar Volunteer Reserve (AVR) is open to volunteers with a verified ID and 500 impact points who have completed *Emergency Response Fundamentals* and passed two simulations at 90 or above.
- **Dispatch pages the right people, not everyone.** When a Tier 3 NGO declares a crisis, reserve members are ranked by how many of the required skills they have. The list is capped at three times the number needed (minimum 15), so a call for ten people doesn't page hundreds.
- **Organizations record impact; volunteers don't claim it.** Hours, completed projects and impact score are awarded by the organization when it closes an application. The security rules let an organization write those three fields on a volunteer's record and nothing else.

## Features

### For volunteers

- **Profile** with skills, languages, experience and education. Once the profile is complete, you can print a one-page **Impact CV** from it.
- **Identity verification**: submit an ID number, and an admin approves or rejects it.
- **Explore Missions**: browse opportunities, apply, and follow your applications in My Tasks. Organizations and causes have their own directories.
- **Training**: a course catalog with prerequisites, skill paths, and printable certificates of completion.
- **AI training simulator**: the model plays the other side of a field scenario, such as a distressed caller on a crisis text line, a dispatch report after an earthquake, or an angry civilian at a relief camp. It can also invent a new scenario. Every reply gets feedback and points, and a run passes at 90/100.
- **Crisis Response**: the reserve clearance checklist. Members get live alerts matched to their skills, can accept a deployment, and get a message channel for each crisis.
- **Reporting**: flag an opportunity or an organization. The reason chosen sets the report's severity in the admin queue.
- **Assistant**: a chat widget on every screen that adapts to whether it's talking to a guest, a volunteer or an organization.

### For organizations

- **Tiered sign-up.** Tier 1 (student club or youth forum) is verified at sign-up. Tier 2 (society or NGO) and Tier 3 (disaster-response NGO) also supply a registration ID, board and safeguarding policy, then go through admin review.
- **Opportunities**: post and manage roles. Tier 2 can keep a posting internal. Tier 3 postings are crisis roles shown only to the reserve.
- **Applications**: accept volunteers, then close each application by awarding hours and impact points.
- **Volunteer roster** showing each volunteer's profile and record.
- **Crisis management** (Tier 3, verified):
  - Declare an incident with a location and severity.
  - AI drafts a situation description and the five most critical skills.
  - Activating the crisis pages the ranked reserve.
  - Export the deployed team as CSV.
- **Messages**, including an AI **SitRep** that condenses a crisis channel's field messages into a situation report.
- **Reports**: volunteer and opportunity analytics, plus an AI-written impact report.

### For admins

- **Verification queue** for organization audits and volunteer IDs.
- **User management**, including creating accounts. A second, named Firebase app handles the sign-up, so the admin stays signed in.
- **Content moderation**: reports sorted by severity, each either dismissed or removed (removal hides the opportunity).
- **Platform analytics** and an AI-written compliance overview.
- **System settings** stored in a single Firestore document.

## How it's built

React 19, TypeScript, Vite (rolldown), Tailwind CSS v4 with shadcn/Radix components, Firebase Auth (email/password and Google) and Cloud Firestore, Vercel serverless functions in front of Gemini and OpenRouter, and Vitest with Testing Library and the Firebase emulator.

- **One app, three portals.** `App.tsx` picks the sidebar and screens by role. The role comes from a small `users/{uid}` "nametag" document, read at login and again on reload to restore the session. Organizations keep their full profile in `organizations/{uid}`. An account is an admin only if an `admins/{uid}` document exists, and no client can write one.
- **Live data.** Screens subscribe with Firestore `onSnapshot`, so a new application, alert or message appears without a reload.
- **AI keys never reach the browser.** The browser calls three Vercel functions in [`api/`](api/) (`gemini`, `openrouter` and `crisis-tasking`), and only those functions hold the keys. The keys are deliberately not `VITE_`-prefixed, so Vite can't inline them into the bundle.
- **AI fails fast instead of hanging.** Free-tier models come and go:
  - The Gemini proxy tries the requested model, then a lite alias, then a pinned model. Each gets 9 seconds, within a 22-second total, so the UI shows an error rather than a spinner that never stops.
  - OpenRouter calls work through a list of free models, moving on when one is gone (404), needs credits (402), is rate-limited (429) or fails (5xx).
- **The logic that matters is tested on its own.** Crisis matching, organization verification, report severity and auth error messages live in [`src/lib/`](src/lib/) as plain functions, pulled out of the components that use them.

## Security

[`firestore.rules`](firestore.rules) enforces the following, and 27 emulator tests in [`firestore-tests/`](firestore-tests/) check it:

- No one can make themselves an admin. Users can't change their own `role`, and clients can't write to `admins/*` at all.
- Only an admin can change `verified` or `tier`. A Tier 2 or 3 organization can't create itself as verified, and the only change it can make to its own status is from unverified to pending.
- A verification request can only be filed for your own account, and only an admin can approve it.
- An organization can update exactly three fields on a volunteer's record: hours, completed projects and impact score.
- Any collection the rules don't name is denied.

The Firebase web config in the client is public by design ([Firebase's explanation](https://firebase.google.com/docs/projects/api-keys)). The AI keys are server-side only.

**Known gaps.** The hardening above covers `users`, `admins`, `organizations` and `verificationRequests`. The other twelve collections (applications, messages, crises and so on), and each organization's team subcollection, are open to any signed-in user for reading and writing. A per-collection audit is the next piece of work. Some eligibility checks, such as reserve activation, run only in the client.

## Getting started

**Prerequisites:**
- Node 20.19+ or 22.12+.
- A Firebase project with Firestore and Email/Password sign-in enabled. Google sign-in is optional.
- Java, only for the Firestore emulator that the rules tests use.

```bash
npm install
cp .env.example .env               # then fill it in
npx firebase login
npx firebase deploy --only firestore:rules --project <your-project-id>
npm run dev                        # http://localhost:5173 (frontend only)
```

- **AI features need `npm run dev:api`.** `npm run dev` doesn't serve the `api/` functions, so the assistant, simulator, SitReps, reports and crisis tasking all return 404 under it. `npm run dev:api` runs `vercel dev`, which serves the frontend and functions together and reads the AI keys from `.env`. On a fresh clone, run `npx vercel link` once first.
- **Admin accounts** aren't created through the app. Follow [docs/admin-setup.md](docs/admin-setup.md).
- **Seed data.** `npm run seed` fills the project with:
  - ten organizations across all three tiers
  - five volunteers
  - opportunities and applications
  - two active crises
  - message threads and training records

  It creates real accounts that can log in, in whichever project `.env` points at, so don't point it at production. It's safe to re-run, because it never deletes anything. To mark the Tier 2 and 3 organizations verified, it signs in as `admin@athar.gov`. If that account isn't an admin in your project, those organizations stay pending until you approve them in the Verification tab.

<details>
<summary><strong>Environment variables</strong></summary>

| Variable | Required | Purpose |
|---|---|---|
| `VITE_FIREBASE_API_KEY`<br>`VITE_FIREBASE_AUTH_DOMAIN`<br>`VITE_FIREBASE_PROJECT_ID`<br>`VITE_FIREBASE_STORAGE_BUCKET`<br>`VITE_FIREBASE_MESSAGING_SENDER_ID`<br>`VITE_FIREBASE_APP_ID` | Yes | Firebase web config. Public by design; the security rules control access |
| `GEMINI_API_KEY` | For AI features | Server-only. Simulator, SitReps, impact and analytics reports |
| `OPENROUTER_API_KEY` | For AI features | Server-only. Assistant and crisis tasking |

On Vercel, set the two AI keys as project environment variables. Never give them a `VITE_` prefix.

</details>

<details>
<summary><strong>Project structure</strong></summary>

```
api/                  Vercel functions: the AI proxies (the keys live here)
  _shared/            OpenRouter model-fallback caller (not a route)
src/
  App.tsx             Session restore, role → portal
  components/         Volunteer screens and the landing page
    organization/     Organization screens
    admin/            Admin screens
    ui/               shadcn/Radix component kit
  chatbot/            Assistant widget
  lib/                Firebase setup, auth, matching, verification, reporting
firestore.rules       Security rules
firestore-tests/      Emulator tests for the rules
scripts/seed.mjs      Full-platform seed data
docs/                 Admin setup, design specs and implementation plans
```

</details>

## Testing

| Command | Covers |
|---|---|
| `npm test` | API handlers (Node) and components plus `src/lib` (jsdom). No emulator needed: 95 tests in 11 files |
| `npm run test:api` | The Node project only |
| `npm run test:unit` | The jsdom project only |
| `npm run test:rules` | Starts the Firestore emulator and runs the 27 rules tests |
| `npm run lint` | ESLint |

## Deployment

Hosted on Vercel. [`vercel.json`](vercel.json) sets the build command to `vite build`, which skips type-checking, because the codebase still has 79 older TypeScript errors. Until those are fixed, `npm run build` (which runs `tsc -b` first) fails locally. Firestore rules are deployed separately with the Firebase CLI, as shown in Getting started.

## Brand

*Athar* (أثر) is Arabic for a trace or mark: what is left behind after someone has passed through. The logo is a heart drawn in fingerprint ridges, combining care and identity, since verified identity is what the platform is built on. Each role has its own color:

- volunteers: teal `#016A6D`
- organizations: deep navy-teal `#043E52`
- admins: slate and gold

The full rules are in the [style guide](docs/superpowers/specs/2026-08-10-frontend-standardization-style-guide.md).

## Known gaps and next steps

- **Firestore rules:** the per-collection audit described under [Security](#security).
- **Verification documents:** the checklist records which documents an organization supplied, but doesn't store the files yet.
- **Placeholder content:** the landing page's headline numbers are placeholders, not live counts, and the Events page shows sample data.
- **Type errors:** clearing the TypeScript backlog so the build can type-check again.

## Status

Built by [ebaa-anas](https://github.com/ebaa-anas). All rights reserved; no license is granted.
