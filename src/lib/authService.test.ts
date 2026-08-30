import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./firebase", () => ({ auth: { name: "mock-auth" }, db: { name: "mock-db" } }));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  getDoc: vi.fn(),
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { setDoc, getDoc } from "firebase/firestore";
import {
  friendlyAuthError,
  signUpVolunteer,
  signUpOrganization,
  loginUser,
} from "./authService";

const createUser = vi.mocked(createUserWithEmailAndPassword);
const signIn = vi.mocked(signInWithEmailAndPassword);
const mockSignOut = vi.mocked(signOut);
const mockSetDoc = vi.mocked(setDoc);
const mockGetDoc = vi.mocked(getDoc);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("friendlyAuthError", () => {
  it("maps the account-exists code to the 'try logging in' sentence", () => {
    expect(friendlyAuthError({ code: "auth/email-already-in-use" })).toBe(
      "An account with this email already exists. Try logging in instead."
    );
  });

  it("collapses the three bad-credential codes to one message", () => {
    const expected = "The email or password you entered is incorrect.";
    expect(friendlyAuthError({ code: "auth/invalid-credential" })).toBe(expected);
    expect(friendlyAuthError({ code: "auth/wrong-password" })).toBe(expected);
    expect(friendlyAuthError({ code: "auth/user-not-found" })).toBe(expected);
  });

  it("maps the weak-password code", () => {
    expect(friendlyAuthError({ code: "auth/weak-password" })).toBe(
      "Your password is too weak. Use at least 6 characters."
    );
  });

  it("echoes an unknown code inside a generic sentence", () => {
    expect(friendlyAuthError({ code: "auth/some-new-code" })).toBe(
      "Sign-in failed (auth/some-new-code). Please try again."
    );
  });

  it("falls back to the server-contact message when there is no code", () => {
    expect(friendlyAuthError({})).toBe(
      "Something went wrong while contacting the server. Please try again."
    );
    expect(friendlyAuthError(undefined)).toBe(
      "Something went wrong while contacting the server. Please try again."
    );
  });
});

describe("signUpVolunteer", () => {
  it("creates the user doc with the volunteer role and signs back out on success", async () => {
    createUser.mockResolvedValue({ user: { uid: "vol-1" } } as never);

    const result = await signUpVolunteer("v@example.com", "pw123456", "Val Unteer", "555");

    expect(result).toEqual({ success: true });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      uid: "vol-1",
      role: "volunteer",
      name: "Val Unteer",
      impactScore: 0,
      skills: [],
      isAVRMember: false,
    });
    // Account creation auto-signs-in; the app wants the user logged out afterwards.
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("returns a friendly error and does not sign out when creation fails", async () => {
    createUser.mockRejectedValue({ code: "auth/email-already-in-use" });

    const result = await signUpVolunteer("v@example.com", "pw", "Val", "555");

    expect(result).toEqual({
      success: false,
      error: "An account with this email already exists. Try logging in instead.",
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

describe("signUpOrganization", () => {
  it("auto-verifies a tier1 org at creation", async () => {
    createUser.mockResolvedValue({ user: { uid: "org-1" } } as never);

    const result = await signUpOrganization(
      "o@example.com",
      "pw123456",
      "Orgy Org",
      "tier1",
      "555",
      "TAX-1"
    );

    expect(result).toEqual({ success: true });
    // First setDoc writes the full organizations/ profile.
    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      role: "organization",
      tier: "tier1",
      verified: true,
      verificationStatus: "verified",
    });
    // Second setDoc leaves the users/ "nametag" with the role + tier.
    expect(mockSetDoc.mock.calls[1][1]).toMatchObject({
      role: "organization",
      tier: "tier1",
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("leaves a tier2 org unverified at creation", async () => {
    createUser.mockResolvedValue({ user: { uid: "org-2" } } as never);

    await signUpOrganization("o@example.com", "pw123456", "NGO", "tier2", "555", "TAX-2");

    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      tier: "tier2",
      verified: false,
      verificationStatus: "unverified",
    });
  });

  it("also leaves a tier3 org unverified at creation", async () => {
    createUser.mockResolvedValue({ user: { uid: "org-3" } } as never);

    await signUpOrganization("o@example.com", "pw123456", "Crisis Co", "tier3", "555", "TAX-3");

    expect(mockSetDoc.mock.calls[0][1]).toMatchObject({
      tier: "tier3",
      verified: false,
      verificationStatus: "unverified",
    });
  });

  it("returns a friendly error when creation fails", async () => {
    createUser.mockRejectedValue({ code: "auth/weak-password" });

    const result = await signUpOrganization("o@example.com", "x", "NGO", "tier2", "555", "TAX");

    expect(result).toEqual({
      success: false,
      error: "Your password is too weak. Use at least 6 characters.",
    });
  });
});

describe("loginUser", () => {
  it("returns the role and tier from the user profile doc", async () => {
    signIn.mockResolvedValue({ user: { uid: "u1" } } as never);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "organization", tier: "tier2" }),
    } as never);

    expect(await loginUser("u@example.com", "pw")).toEqual({
      success: true,
      role: "organization",
      tier: "tier2",
    });
  });

  it("returns tier: null when the profile has no tier", async () => {
    signIn.mockResolvedValue({ user: { uid: "u2" } } as never);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "volunteer" }),
    } as never);

    expect(await loginUser("u@example.com", "pw")).toEqual({
      success: true,
      role: "volunteer",
      tier: null,
    });
  });

  it("fails when auth succeeds but no profile doc exists", async () => {
    signIn.mockResolvedValue({ user: { uid: "u3" } } as never);
    mockGetDoc.mockResolvedValue({ exists: () => false } as never);

    expect(await loginUser("u@example.com", "pw")).toEqual({
      success: false,
      error:
        "Your login worked, but we couldn't find your account profile. Please contact support.",
    });
  });

  it("maps a bad-credential auth failure to the friendly message", async () => {
    signIn.mockRejectedValue({ code: "auth/invalid-credential" });

    expect(await loginUser("u@example.com", "wrong")).toEqual({
      success: false,
      error: "The email or password you entered is incorrect.",
    });
  });
});
