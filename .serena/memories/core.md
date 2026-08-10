# Core

- Athar is a React SPA for volunteer coordination, with volunteer, organization, and admin experiences.
- App shell and role/section rendering live in `src/App.tsx`; UI navigation is local React state, not React Router.
- Functional domains: volunteer modules in `src/components/`; organization portal in `src/components/organization/`; administrative console in `src/components/admin/`; reusable generated UI primitives in `src/components/ui/`.
- Firebase Auth + Firestore are the persistence boundary. Shared initialization is `src/lib/firebase.ts`; identity/profile workflows are `src/lib/authService.ts`.
- Read `mem:tech_stack` for runtime/build dependencies; `mem:conventions` for architecture and code style; `mem:suggested_commands` for local workflows; `mem:task_completion` for validation.