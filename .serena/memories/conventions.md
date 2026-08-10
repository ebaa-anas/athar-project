# Conventions

- Role names are `volunteer`, `organization`, and `admin`; `App.tsx` owns the selected role, login state, and active dashboard section.
- Feature components usually query Firestore directly via live snapshots; several files initialize Firebase locally instead of consistently importing shared `src/lib/firebase.ts`.
- Canonical signup/login/profile mutations belong in `src/lib/authService.ts`; user records use Firestore `users/{uid}`, and organizations also have `organizations/{uid}` records.
- Most UI is single-file feature components with inline Tailwind class strings; generic design-system code lives under `src/components/ui/`.
- Chatbot behavior is deterministic keyword/follow-up logic in `src/chatbot/intentEngine.ts`, not an LLM call.