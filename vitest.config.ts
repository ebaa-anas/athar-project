import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest runs three separate projects because the code under test lives in
// three different worlds:
//
//   node  - the Vercel serverless handlers under api/ and the plain fetch
//           client in src/gemini.js. No DOM, no React.
//   dom   - React components and browser-facing lib code in src/. Needs jsdom
//           and the Testing Library matchers.
//   rules - the Firestore security-rules tests, which only run inside the
//           emulator (see the test:rules script).
//
// `npm test` runs node + dom only, so it needs no emulator. `npm run test:rules`
// starts the emulator and then runs `vitest --project rules`.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["api/**/*.test.ts", "src/gemini.test.js"],
        },
      },
      {
        plugins: [react()],
        test: {
          name: "dom",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          // src/gemini.test.js is a node test; keep it out of the dom project.
          exclude: ["src/gemini.test.js"],
        },
      },
      {
        test: {
          name: "rules",
          environment: "node",
          include: ["firestore-tests/**/*.test.ts"],
        },
      },
    ],
  },
});
