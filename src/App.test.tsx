import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";

// Shared mock fns, hoisted so the vi.mock factories below can close over them.
const h = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
}));

vi.mock("./lib/firebase", () => ({ auth: { name: "mock-auth" }, db: { name: "mock-db" } }));
// Some components (e.g. admin/UserManagement) call initializeApp/getAuth at
// module scope, which runs as soon as App imports them. Stub the factory
// functions so those imports don't blow up.
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: h.onAuthStateChanged,
  signOut: h.signOut,
  getAuth: vi.fn(() => ({})),
}));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  getDoc: h.getDoc,
  getFirestore: vi.fn(() => ({})),
}));

// Stub the heavy children App renders so the test exercises App's own
// session/routing logic and nothing else.
vi.mock("./chatbot/ChatbotWidget", () => ({ default: () => null }));
vi.mock("./components/LandingPage", () => ({
  LandingPage: () => <div data-testid="landing-page" />,
}));
vi.mock("./components/LoginSignup", () => ({
  LoginSignup: ({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) => (
    <div data-testid="login-signup">
      <button data-testid="do-login" onClick={onLogin} />
      <button data-testid="do-close" onClick={onClose} />
    </div>
  ),
}));
vi.mock("./components/Sidebar", () => ({
  Sidebar: ({ onLogout }: { onLogout: () => void }) => (
    <button data-testid="volunteer-logout" onClick={onLogout} />
  ),
}));
vi.mock("./components/organization/OrganizationSidebar", () => ({
  OrganizationSidebar: ({ onLogout }: { onLogout: () => void }) => (
    <button data-testid="org-logout" onClick={onLogout} />
  ),
}));
vi.mock("./components/admin/AdminSidebar", () => ({
  AdminSidebar: ({ onLogout }: { onLogout: () => void }) => (
    <button data-testid="admin-logout" onClick={onLogout} />
  ),
}));
vi.mock("./components/OverviewDashboard", () => ({
  OverviewDashboard: () => <div data-testid="volunteer-overview" />,
}));
vi.mock("./components/organization/OrganizationOverview", () => ({
  OrganizationOverview: () => <div data-testid="org-overview" />,
}));
vi.mock("./components/admin/AdminOverview", () => ({
  AdminOverview: () => <div data-testid="admin-overview" />,
}));

import App from "./App";

// Capture the callback App hands to onAuthStateChanged so the test can decide
// when — and with what user — Firebase "reports back".
let authCallback: (user: unknown) => unknown;

beforeEach(() => {
  vi.clearAllMocks();
  h.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => unknown) => {
    authCallback = cb;
    return vi.fn(); // the unsubscribe fn
  });
});

async function reportUser(user: unknown) {
  await act(async () => {
    await authCallback(user);
  });
}

describe("App session restore", () => {
  it("shows a loading spinner until Firebase reports the auth state", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.queryByTestId("landing-page")).toBeNull();
  });

  it("shows the landing page when there is no persisted session", async () => {
    const { container } = render(<App />);
    await reportUser(null);
    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("restores a logged-in organization straight to its dashboard", async () => {
    h.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "organization" }),
    });
    render(<App />);
    await reportUser({ uid: "org-1" });

    expect(screen.getByTestId("org-logout")).toBeInTheDocument();
    expect(screen.getByTestId("org-overview")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-page")).toBeNull();
  });

  it("stays logged out when the session has no matching profile doc", async () => {
    h.getDoc.mockResolvedValue({ exists: () => false });
    render(<App />);
    await reportUser({ uid: "ghost" });

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
    expect(screen.queryByTestId("org-logout")).toBeNull();
  });

  it("stays logged out when the profile role is not a recognised portal", async () => {
    h.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "wizard" }),
    });
    render(<App />);
    await reportUser({ uid: "u-1" });

    expect(screen.getByTestId("landing-page")).toBeInTheDocument();
  });

  it("ends the Firebase session and returns to the landing page on logout", async () => {
    h.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "organization" }),
    });
    render(<App />);
    await reportUser({ uid: "org-1" });

    await act(async () => {
      fireEvent.click(screen.getByTestId("org-logout"));
    });

    expect(h.signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByTestId("landing-page")).toBeInTheDocument());
  });
});
