import { describe, it, expect } from "vitest";
import {
  isAVRCertified,
  countSkillMatches,
  rankVolunteersForCrisis,
} from "./crisisMatching";

describe("isAVRCertified", () => {
  it("accepts the boolean and the string 'true' form of every AVR flag", () => {
    expect(isAVRCertified({ isAVRMember: true })).toBe(true);
    expect(isAVRCertified({ isAVRMember: "true" })).toBe(true);
    expect(isAVRCertified({ avrCertified: true })).toBe(true);
    expect(isAVRCertified({ isAVR: "true" })).toBe(true);
    expect(isAVRCertified({ crisisInfo: { avrCertified: true } })).toBe(true);
  });

  it("treats a volunteer whose skills list contains 'AVR' as certified", () => {
    expect(isAVRCertified({ skills: ["First Aid", "AVR"] })).toBe(true);
  });

  it("rejects a volunteer with skills but no AVR marker", () => {
    expect(isAVRCertified({ skills: ["First Aid", "Logistics"] })).toBe(false);
  });

  it("rejects empty, missing, and explicitly-false profiles", () => {
    // The helper is copied verbatim from the component: for a profile with no
    // skills array the OR-chain ends on `undefined && ...`, so it returns a
    // falsy value rather than a strict `false`. Callers only ever test it for
    // truthiness, so that is the contract worth pinning here.
    expect(isAVRCertified({})).toBeFalsy();
    expect(isAVRCertified(undefined)).toBeFalsy();
    expect(isAVRCertified({ isAVRMember: false })).toBeFalsy();
    expect(isAVRCertified({ skills: ["First Aid"] })).toBe(false);
  });
});

describe("countSkillMatches", () => {
  it("returns 1 for every volunteer when no skills were requested", () => {
    expect(countSkillMatches(["Cooking"], [])).toBe(1);
    expect(countSkillMatches(undefined, [])).toBe(1);
  });

  it("counts the overlap case-insensitively", () => {
    expect(countSkillMatches(["first aid", "DRIVING"], ["First Aid", "Driving"])).toBe(2);
    expect(countSkillMatches(["First Aid", "Cooking"], ["First Aid", "Driving"])).toBe(1);
  });

  it("returns 0 when the volunteer matches none of the required skills", () => {
    expect(countSkillMatches(["Cooking"], ["First Aid"])).toBe(0);
  });

  it("treats an undefined skills list as no skills", () => {
    expect(countSkillMatches(undefined, ["First Aid"])).toBe(0);
  });
});

describe("rankVolunteersForCrisis", () => {
  const avr = { isAVRMember: true };

  it("excludes non-AVR volunteers even when their skills match", () => {
    const result = rankVolunteersForCrisis(
      [
        { id: "civ", data: { skills: ["First Aid"] } },
        { id: "avr", data: { ...avr, skills: ["First Aid"] } },
      ],
      ["First Aid"],
      1
    );
    expect(result).toEqual(["avr"]);
  });

  it("excludes AVR volunteers who match no required skill", () => {
    const result = rankVolunteersForCrisis(
      [
        { id: "a", data: { ...avr, skills: ["Cooking"] } },
        { id: "b", data: { ...avr, skills: ["First Aid"] } },
      ],
      ["First Aid"],
      1
    );
    expect(result).toEqual(["b"]);
  });

  it("includes every AVR volunteer when no skills are required", () => {
    const result = rankVolunteersForCrisis(
      [
        { id: "a", data: { ...avr } },
        { id: "b", data: { ...avr } },
      ],
      [],
      1
    );
    expect(result.sort()).toEqual(["a", "b"]);
  });

  it("orders the list best-match-first", () => {
    const result = rankVolunteersForCrisis(
      [
        { id: "one", data: { ...avr, skills: ["First Aid"] } },
        { id: "three", data: { ...avr, skills: ["First Aid", "Driving", "Logistics"] } },
        { id: "two", data: { ...avr, skills: ["First Aid", "Driving"] } },
      ],
      ["First Aid", "Driving", "Logistics"],
      10
    );
    expect(result).toEqual(["three", "two", "one"]);
  });

  it("caps the dispatch list at max(volunteersNeeded * 3, 15)", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      id: `v${i}`,
      data: { ...avr, skills: ["First Aid"] },
    }));
    // needed * 3 < 15 -> floor of 15
    expect(rankVolunteersForCrisis(many, ["First Aid"], 1)).toHaveLength(15);
    // needed * 3 > 15 -> needed * 3
    expect(rankVolunteersForCrisis(many, ["First Aid"], 10)).toHaveLength(30);
  });

  it("returns an empty list for an empty roster", () => {
    expect(rankVolunteersForCrisis([], ["First Aid"], 5)).toEqual([]);
  });
});
