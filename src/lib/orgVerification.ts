// Organization verification / tier logic, extracted verbatim from
// OrganizationProfile.tsx so it can be unit-tested without rendering the
// component. These functions decide whether an org may post opportunities,
// which audit documents it must supply, and whether its verification
// submission is complete.
import { FileCheck, Landmark, ShieldAlert, Shield, Fingerprint } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type OrgTier = "tier1" | "tier2" | "tier3" | (string & {});

export type RequiredDoc = {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

export type OrgProfileData = {
  name?: string;
  description?: string;
  mission?: string;
  registrationId?: string;
  address?: string;
  phone?: string;
  causes?: string;
  website?: string;
  boardMembers?: string;
  safeguardingPolicy?: string;
  [key: string]: unknown;
};

// Tier2/3 orgs have additional required fields beyond the base profile.
export function getProfileErrors(profileData: OrgProfileData, tier: OrgTier): string[] {
  const errs: string[] = [];
  if (!profileData.name || profileData.name.trim().length < 3) errs.push("Legal Entity Name");
  if (!profileData.description || profileData.description.trim().length < 50)
    errs.push("About Entity (min. 50 characters required)");
  if (!profileData.mission || profileData.mission.trim().length < 20)
    errs.push("Mission Statement (min. 20 characters required)");
  if (!profileData.address || profileData.address.trim().length < 10)
    errs.push("Complete Physical HQ Address");
  if (!profileData.phone || profileData.phone.trim().length < 8)
    errs.push("Valid Contact Phone Number");
  if (!profileData.causes || profileData.causes.trim().length === 0)
    errs.push("At least one Core Cause selected");

  if (profileData.website && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(profileData.website)) {
    errs.push("Website must be a valid URL (e.g., https://www...)");
  }

  // Tier 1 (student clubs / youth forums) have no tax number, board, or formal
  // safeguarding policy — those are only required to verify a Tier 2/3 entity.
  if (tier !== "tier1") {
    if (!profileData.registrationId || profileData.registrationId.trim().length < 5)
      errs.push("Valid Registration / Tax ID");
    if (!profileData.boardMembers || profileData.boardMembers.trim().length < 15)
      errs.push("Board of Directors Roster (Required for Tier 2/3)");
    if (!profileData.safeguardingPolicy || profileData.safeguardingPolicy.trim().length < 30)
      errs.push("Safeguarding Policy (min. 30 characters required)");
  }

  return errs;
}

export function getRequiredDocs(tier: OrgTier): RequiredDoc[] {
  if (tier === "tier2") {
    return [
      { id: "incorporation", title: "Certificate of Incorporation", desc: "Proof of Legal NGO Status", icon: FileCheck },
      { id: "financial", title: "Latest Financial Audit", desc: "Fiduciary Transparency", icon: Landmark },
      { id: "signatoryId", title: "Signatory Official ID", desc: "Passport or National ID", icon: Fingerprint },
    ];
  }
  return [
    { id: "incorporation", title: "Certificate of Incorporation", desc: "Proof of Legal Status", icon: FileCheck },
    { id: "financial", title: "Latest Financial Audit (Form 990)", desc: "Fiduciary Transparency", icon: Landmark },
    { id: "safeguarding", title: "Data Protection Policy", desc: "GDPR & Minor Protection", icon: ShieldAlert },
    { id: "insurance", title: "Comprehensive Liability Insurance", desc: "Volunteer Civil Liability", icon: Shield },
    { id: "signatoryId", title: "Signatory Government ID", desc: "Passport or National ID", icon: Fingerprint },
  ];
}

export function areAllDocsUploaded(
  requiredDocs: { id: string }[],
  auditFiles: Record<string, string | null>
): boolean {
  return requiredDocs.every((doc) => auditFiles[doc.id]);
}

// currentTier / isVerified / vStatus derivation from the user profile doc.
export function deriveOrgVerification(user: any) {
  const currentTier: OrgTier = user?.tier || "tier1";
  const isVerified =
    user?.verified || user?.verificationStatus === "verified" || currentTier === "tier1";
  const vStatus: string = user?.verificationStatus || "unverified";
  return { currentTier, isVerified, vStatus };
}
