import { describe, it, expect } from "vitest";
import {
  getProfileErrors,
  getRequiredDocs,
  areAllDocsUploaded,
  deriveOrgVerification,
  type OrgProfileData,
} from "./orgVerification";

// A profile that clears every base (tier1) requirement.
const validBase: OrgProfileData = {
  name: "Helping Hands",
  description: "A".repeat(50),
  mission: "B".repeat(20),
  registrationId: "REG-12345",
  address: "1 Long Street, Town",
  phone: "12345678",
  causes: "Education",
  website: "https://helpinghands.org",
};

describe("getProfileErrors", () => {
  it("returns no errors for a complete tier1 profile", () => {
    expect(getProfileErrors(validBase, "tier1")).toEqual([]);
  });

  it("flags a missing or too-short legal name", () => {
    expect(getProfileErrors({ ...validBase, name: "AB" }, "tier1")).toContain(
      "Legal Entity Name"
    );
  });

  it("flags a description under 50 characters", () => {
    expect(getProfileErrors({ ...validBase, description: "too short" }, "tier1")).toContain(
      "About Entity (min. 50 characters required)"
    );
  });

  it("does not require board roster or safeguarding policy for tier1", () => {
    const errs = getProfileErrors(validBase, "tier1");
    expect(errs).not.toContain("Board of Directors Roster (Required for Tier 2/3)");
    expect(errs).not.toContain("Safeguarding Policy (min. 30 characters required)");
  });

  it("requires board roster and safeguarding policy for tier2", () => {
    const errs = getProfileErrors(validBase, "tier2");
    expect(errs).toContain("Board of Directors Roster (Required for Tier 2/3)");
    expect(errs).toContain("Safeguarding Policy (min. 30 characters required)");
  });

  it("does not require a registration / tax ID for tier1", () => {
    const { registrationId, ...noRegId } = validBase;
    void registrationId;
    expect(getProfileErrors(noRegId, "tier1")).toEqual([]);
  });

  it("still requires a registration / tax ID for tier2", () => {
    const { registrationId, ...noRegId } = validBase;
    void registrationId;
    const errs = getProfileErrors(
      { ...noRegId, boardMembers: "Chair, Treasurer, Secretary", safeguardingPolicy: "C".repeat(30) },
      "tier2"
    );
    expect(errs).toContain("Valid Registration / Tax ID");
  });

  it("clears the tier2 extras once board and safeguarding are long enough", () => {
    const tier2Ready: OrgProfileData = {
      ...validBase,
      boardMembers: "Chair, Treasurer, Secretary",
      safeguardingPolicy: "C".repeat(30),
    };
    expect(getProfileErrors(tier2Ready, "tier2")).toEqual([]);
  });

  it("rejects a malformed website but accepts a well-formed https URL", () => {
    expect(getProfileErrors({ ...validBase, website: "helpinghands.org" }, "tier1")).toContain(
      "Website must be a valid URL (e.g., https://www...)"
    );
    expect(getProfileErrors({ ...validBase, website: "https://x.org" }, "tier1")).toEqual([]);
  });

  it("flags an empty causes string", () => {
    expect(getProfileErrors({ ...validBase, causes: "" }, "tier1")).toContain(
      "At least one Core Cause selected"
    );
  });
});

describe("getRequiredDocs", () => {
  it("asks tier2 for the three-document set", () => {
    const docs = getRequiredDocs("tier2");
    expect(docs.map((d) => d.id)).toEqual(["incorporation", "financial", "signatoryId"]);
  });

  it("asks tier3 for the full five-document set", () => {
    expect(getRequiredDocs("tier3")).toHaveLength(5);
  });

  it("falls back to the five-document set for tier1 and unknown tiers", () => {
    expect(getRequiredDocs("tier1")).toHaveLength(5);
    expect(getRequiredDocs("something-else")).toHaveLength(5);
  });
});

describe("areAllDocsUploaded", () => {
  const tier2Docs = getRequiredDocs("tier2");

  it("is true only when every required doc has a file", () => {
    expect(
      areAllDocsUploaded(tier2Docs, {
        incorporation: "a.pdf",
        financial: "b.pdf",
        signatoryId: "c.pdf",
      })
    ).toBe(true);
  });

  it("is false when a required doc is null or absent", () => {
    expect(
      areAllDocsUploaded(tier2Docs, {
        incorporation: "a.pdf",
        financial: null,
        signatoryId: "c.pdf",
      })
    ).toBe(false);
    expect(areAllDocsUploaded(tier2Docs, { incorporation: "a.pdf" })).toBe(false);
  });

  it("only checks the docs for the given tier", () => {
    // tier3-only docs missing, but the tier2 set is satisfied
    expect(
      areAllDocsUploaded(tier2Docs, {
        incorporation: "a.pdf",
        financial: "b.pdf",
        signatoryId: "c.pdf",
        insurance: null,
        safeguarding: null,
      })
    ).toBe(true);
  });
});

describe("deriveOrgVerification", () => {
  it("auto-verifies every tier1 org", () => {
    expect(deriveOrgVerification({ tier: "tier1" }).isVerified).toBe(true);
  });

  it("leaves a fresh tier2 org unverified", () => {
    const d = deriveOrgVerification({
      tier: "tier2",
      verified: false,
      verificationStatus: "unverified",
    });
    expect(d).toEqual({ currentTier: "tier2", isVerified: false, vStatus: "unverified" });
  });

  it("verifies a tier2 org once its status flips to 'verified'", () => {
    expect(deriveOrgVerification({ tier: "tier2", verificationStatus: "verified" }).isVerified).toBe(
      true
    );
  });

  it("honours the boolean verified flag for a tier3 org", () => {
    expect(deriveOrgVerification({ tier: "tier3", verified: true }).isVerified).toBe(true);
  });

  it("defaults a missing user to tier1 / verified / unverified", () => {
    expect(deriveOrgVerification(undefined)).toEqual({
      currentTier: "tier1",
      isVerified: true,
      vStatus: "unverified",
    });
  });
});
