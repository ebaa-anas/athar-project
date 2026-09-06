import { describe, it, expect } from "vitest";
import {
  REPORT_REASONS,
  severityForReason,
  buildReportPayload,
} from "./reportContent";

describe("severityForReason", () => {
  it("treats offensive content and harassment as high severity", () => {
    expect(severityForReason("Inappropriate or offensive content")).toBe("high");
    expect(severityForReason("Harassment or unsafe behaviour")).toBe("high");
  });

  it("treats spam as low severity", () => {
    expect(severityForReason("Spam or bot activity")).toBe("low");
  });

  it("treats misleading information and 'Other' as medium severity", () => {
    expect(severityForReason("Misleading or false information")).toBe("medium");
    expect(severityForReason("Other")).toBe("medium");
  });

  it("falls back to medium for an unrecognised reason", () => {
    expect(severityForReason("something we never listed")).toBe("medium");
  });

  it("has a severity for every reason it offers", () => {
    for (const reason of REPORT_REASONS) {
      expect(["high", "medium", "low"]).toContain(severityForReason(reason));
    }
  });
});

const oppTarget = {
  targetType: "opportunity" as const,
  targetId: "opp-1",
  title: "Beach cleanup crew",
  organization: "Green Shores",
  contentPreview: "Join us Saturday morning to clear the north beach.",
};

const reporter = { uid: "vol-9", name: "Alaa Matar" };

describe("buildReportPayload", () => {
  it("builds a pending 'Opportunity Post' report with the derived severity", () => {
    const p = buildReportPayload(oppTarget, reporter, "Spam or bot activity", "posted 20 times");
    expect(p).toMatchObject({
      type: "Opportunity Post",
      title: "Beach cleanup crew",
      organization: "Green Shores",
      targetType: "opportunity",
      targetId: "opp-1",
      reason: "Spam or bot activity",
      detail: "posted 20 times",
      severity: "low",
      reportedBy: "Alaa Matar",
      reportedById: "vol-9",
      status: "pending",
    });
  });

  it("marks an organization target as an 'Organization Profile' report", () => {
    const p = buildReportPayload(
      { targetType: "organization", targetId: "org-3", title: "Anatolia Youth", organization: "Anatolia Youth" },
      reporter,
      "Misleading or false information"
    );
    expect(p.type).toBe("Organization Profile");
    expect(p.targetType).toBe("organization");
    expect(p.severity).toBe("medium");
  });

  it("truncates contentPreview to 280 characters", () => {
    const p = buildReportPayload({ ...oppTarget, contentPreview: "x".repeat(500) }, reporter, "Other");
    expect(p.contentPreview).toHaveLength(280);
  });

  it("trims the detail and tolerates it being omitted", () => {
    expect(buildReportPayload(oppTarget, reporter, "Other", "   spacey   ").detail).toBe("spacey");
    expect(buildReportPayload(oppTarget, reporter, "Other").detail).toBe("");
  });

  it("falls back to a generic reporter name when none is given", () => {
    const p = buildReportPayload(oppTarget, { uid: "vol-1", name: "" }, "Other");
    expect(p.reportedBy).toBe("A volunteer");
  });
});
