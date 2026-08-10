# Task completion

- Run `npm.cmd run build` (TypeScript project build followed by Vite bundle).
- Run `npm.cmd run lint`.
- As of onboarding, both commands fail on existing code: build has JSX/type errors and unused-import/type-check errors; lint reports 272 errors and 2 warnings (predominantly explicit `any` and unused symbols). Treat them as baseline debt unless the task changes the relevant file.
- Run `serena memories check` from project root after changing memory references.