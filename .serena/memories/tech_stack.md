# Tech stack

- TypeScript + React 19 SPA, built and served by Vite (package aliases Vite to `rolldown-vite@7.1.14`).
- Styling: Tailwind CSS 4/PostCSS; component primitives under `src/components/ui` use Radix UI, CVA, clsx, and tailwind-merge.
- Backend services: Firebase Auth and Firestore; browser-side Gemini SDK (`@google/generative-ai`) appears in training, reporting, messaging and admin analytics surfaces.
- Other UI libraries: lucide-react, Recharts, React Hook Form, Sonner, Embla, and React Day Picker.
- npm lockfile present; use npm/NPM CMD on Windows.