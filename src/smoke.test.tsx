import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Smoke test for the component-testing setup itself: proves jsdom is the
// environment, @vitejs/plugin-react compiles JSX/TSX, @testing-library/react
// can mount a component, and the jest-dom matchers from vitest.setup.ts are
// registered. Real component tests build on top of this.
function Hello({ name }: { name: string }) {
  return <p>Hello, {name}</p>;
}

describe("component testing infrastructure", () => {
  it("renders a component into jsdom", () => {
    render(<Hello name="Athar" />);
    expect(screen.getByText("Hello, Athar")).toBeInTheDocument();
  });

  it("has a working DOM global", () => {
    expect(typeof document).toBe("object");
    expect(document.createElement("div")).toBeInstanceOf(HTMLElement);
  });
});
