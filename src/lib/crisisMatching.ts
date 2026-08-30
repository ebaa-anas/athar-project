// Crisis dispatch matching logic, extracted verbatim from CrisisManagement.tsx
// so it can be unit-tested in isolation. This module decides which volunteers
// get paged when an organization declares an emergency, so its behaviour is
// load-bearing during a real incident.

// Single shared definition of "is this volunteer AVR-certified" — previously
// this exact OR-chain was copy-pasted in handleActivate and in the roster
// badge render. Keeping one helper means the dispatch logic and the badge
// shown on screen can never disagree with each other.
export function isAVRCertified(vData: any): boolean {
  return (
    vData?.isAVRMember === true ||
    vData?.isAVRMember === "true" ||
    vData?.avrCertified === true ||
    vData?.avrCertified === "true" ||
    vData?.isAVR === true ||
    vData?.isAVR === "true" ||
    vData?.crisisInfo?.avrCertified === true ||
    vData?.crisisInfo?.avrCertified === "true" ||
    (vData?.skills && vData.skills.includes("AVR"))
  );
}

// Counts how many of the crisis's required skills this volunteer has. Used
// both to filter (must match at least one, if skills were specified) and to
// rank (best-matched volunteers get notified first).
export function countSkillMatches(
  volunteerSkills: string[] | undefined,
  requiredSkills: string[]
): number {
  if (!requiredSkills.length) return 1; // no specific skills requested — everyone AVR-certified qualifies equally
  const vSkills = (volunteerSkills || []).map((s) => s.toLowerCase());
  return requiredSkills.filter((rs) => vSkills.includes(rs.toLowerCase())).length;
}

// The full dispatch pipeline from handleActivate: from every volunteer user
// doc, keep the AVR-certified ones that match at least one required skill,
// rank them best-match-first, and cap the list so a request for 10 people
// doesn't page hundreds. Returns the volunteer ids to notify, in order.
export function rankVolunteersForCrisis(
  volunteers: { id: string; data: any }[],
  requiredSkills: string[],
  volunteersNeeded: number
): string[] {
  const ranked = volunteers
    .map((v) => ({
      id: v.id,
      matchCount: countSkillMatches(v.data?.skills, requiredSkills),
      avr: isAVRCertified(v.data),
    }))
    .filter((v) => v.avr && v.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const dispatchCap = Math.max(Number(volunteersNeeded) * 3, 15);
  return ranked.slice(0, dispatchCap).map((v) => v.id);
}
