import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Hoisted so the vi.mock factory can close over the same fns the test asserts on.
const h = vi.hoisted(() => ({
  signUpOrganization: vi.fn(),
  signUpVolunteer: vi.fn(),
  loginUser: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock("../lib/firebase", () => ({ auth: { name: "mock-auth" } }));
vi.mock("../lib/authService", () => ({
  signUpOrganization: h.signUpOrganization,
  signUpVolunteer: h.signUpVolunteer,
  loginUser: h.loginUser,
  loginWithGoogle: h.loginWithGoogle,
  friendlyAuthError: (e: unknown) => String(e),
}));
vi.mock("firebase/auth", () => ({ sendPasswordResetEmail: vi.fn() }));

import { LoginSignup } from "./LoginSignup";

beforeEach(() => {
  vi.clearAllMocks();
});

async function openOrgSignup() {
  const user = userEvent.setup();
  render(<LoginSignup userType="organization" onLogin={vi.fn()} onClose={vi.fn()} />);
  await user.click(screen.getByRole("tab", { name: /sign up/i }));
  return user;
}

describe("LoginSignup — organization signup", () => {
  it("does not ask for a tax / registration number", async () => {
    await openOrgSignup();

    expect(screen.queryByLabelText(/tax\s*\/\s*registration/i)).toBeNull();
    expect(screen.queryByText(/tax\s*\/\s*registration no/i)).toBeNull();
  });

  it("registers a tier 1 org from name, email, phone and password alone", async () => {
    h.signUpOrganization.mockResolvedValue({ success: true });
    const user = await openOrgSignup();

    await user.type(screen.getByLabelText(/organization name/i), "Campus Robotics Club");
    await user.type(screen.getByLabelText(/official email/i), "club@campus.edu");
    await user.type(screen.getByLabelText(/contact number/i), "+905551112233");
    await user.type(screen.getByLabelText(/create password/i), "pw123456");
    await user.type(screen.getByLabelText(/confirm password/i), "pw123456");
    await user.click(screen.getByText(/i certify that the information provided is accurate/i));

    await user.click(screen.getByRole("button", { name: /submit registration request/i }));

    await waitFor(() => expect(h.signUpOrganization).toHaveBeenCalledTimes(1));
    expect(h.signUpOrganization).toHaveBeenCalledWith(
      "club@campus.edu",
      "pw123456",
      "Campus Robotics Club",
      "tier1",
      "+905551112233"
    );
  });
});
