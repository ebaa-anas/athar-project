// Content-reporting logic, kept out of the components so the reason→severity
// mapping and the report payload shape can be unit-tested. The Firestore write
// (and the serverTimestamp() `reportDate`) stays in ReportContentModal.

export const REPORT_REASONS = [
  "Inappropriate or offensive content",
  "Harassment or unsafe behaviour",
  "Misleading or false information",
  "Spam or bot activity",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportSeverity = "high" | "medium" | "low";

// Volunteers pick a reason, never a severity — the admin queue colours/sorts by
// this, so it's derived here from how serious the reason is.
export function severityForReason(reason: string): ReportSeverity {
  switch (reason) {
    case "Inappropriate or offensive content":
    case "Harassment or unsafe behaviour":
      return "high";
    case "Spam or bot activity":
      return "low";
    default:
      // "Misleading or false information", "Other", anything unrecognised
      return "medium";
  }
}

export type ReportTarget = {
  targetType: "opportunity" | "organization";
  targetId: string;
  title: string;
  organization: string;
  contentPreview?: string;
};

export type Reporter = { uid: string; name: string };

export type ReportPayload = {
  type: "Opportunity Post" | "Organization Profile";
  title: string;
  organization: string;
  contentPreview: string;
  targetType: "opportunity" | "organization";
  targetId: string;
  reason: string;
  detail: string;
  severity: ReportSeverity;
  reportedBy: string;
  reportedById: string;
  status: "pending";
};

const PREVIEW_MAX = 280;

export function buildReportPayload(
  target: ReportTarget,
  reporter: Reporter,
  reason: string,
  detail?: string
): ReportPayload {
  return {
    type: target.targetType === "opportunity" ? "Opportunity Post" : "Organization Profile",
    title: target.title || "Untitled",
    organization: target.organization || "Unknown",
    contentPreview: (target.contentPreview || "").slice(0, PREVIEW_MAX),
    targetType: target.targetType,
    targetId: target.targetId,
    reason,
    detail: (detail || "").trim(),
    severity: severityForReason(reason),
    reportedBy: reporter.name?.trim() || "A volunteer",
    reportedById: reporter.uid,
    status: "pending",
  };
}
