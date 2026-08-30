// Runs before every file in the "dom" project (see vitest.config.ts).
// Registers the jest-dom matchers (toBeInTheDocument, toHaveTextContent, ...)
// on Vitest's expect. Testing Library's own cleanup() runs automatically
// because the dom project sets globals: true.
import "@testing-library/jest-dom/vitest";
