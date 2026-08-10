import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "athar-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8081,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("users/{uid}", () => {
  it("lets a volunteer create their own doc with role 'volunteer'", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(
      setDoc(doc(alice, "users/alice"), {
        uid: "alice",
        role: "volunteer",
        name: "Alice",
      })
    );
  });

  it("blocks a user from creating their own doc with role 'admin'", async () => {
    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(
      setDoc(doc(mallory, "users/mallory"), {
        uid: "mallory",
        role: "admin",
        name: "Mallory",
      })
    );
  });

  it("blocks a volunteer from promoting themselves to admin via update", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/mallory"), {
        uid: "mallory",
        role: "volunteer",
        name: "Mallory",
      });
    });

    const mallory = testEnv.authenticatedContext("mallory").firestore();
    await assertFails(
      updateDoc(doc(mallory, "users/mallory"), { role: "admin" })
    );
  });

  it("lets a volunteer update a non-restricted field on their own doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        uid: "alice",
        role: "volunteer",
        name: "Alice",
      });
    });

    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(
      updateDoc(doc(alice, "users/alice"), { name: "Alice Smith" })
    );
  });

  it("lets an admin change another user's role field", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "admins/root"), {
        uid: "root",
        role: "admin",
      });
      await setDoc(doc(context.firestore(), "users/alice"), {
        uid: "alice",
        role: "volunteer",
        name: "Alice",
      });
    });

    const root = testEnv.authenticatedContext("root").firestore();
    await assertSucceeds(
      updateDoc(doc(root, "users/alice"), { role: "organization" })
    );
  });
});

describe("admins/{uid}", () => {
  it("blocks any client write, even from an existing admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "admins/root"), {
        uid: "root",
        role: "admin",
      });
    });

    const root = testEnv.authenticatedContext("root").firestore();
    await assertFails(
      setDoc(doc(root, "admins/newAdmin"), { uid: "newAdmin", role: "admin" })
    );
  });

  it("blocks reads from non-admins", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "admins/root"), {
        uid: "root",
        role: "admin",
      });
    });

    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, "admins/root")));
  });
});

describe("organizations/{uid}", () => {
  it("lets a tier1 org self-verify at creation", async () => {
    const club = testEnv.authenticatedContext("club1").firestore();
    await assertSucceeds(
      setDoc(doc(club, "organizations/club1"), {
        uid: "club1",
        tier: "tier1",
        verified: true,
        verificationStatus: "verified",
      })
    );
  });

  it("blocks a tier2 org from self-verifying at creation", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      setDoc(doc(org, "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: true,
        verificationStatus: "verified",
      })
    );
  });

  it("lets a tier2 org create itself unverified", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      setDoc(doc(org, "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      })
    );
  });

  it("blocks an org from setting verified:true on itself via update", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      updateDoc(doc(org, "organizations/org1"), { verified: true })
    );
  });

  it("lets an org move its own verificationStatus from unverified to pending", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      updateDoc(doc(org, "organizations/org1"), {
        verificationStatus: "pending",
      })
    );
  });

  it("blocks an org from jumping straight from unverified to verified", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      updateDoc(doc(org, "organizations/org1"), {
        verificationStatus: "verified",
      })
    );
  });

  it("blocks a tier2 org from self-creating with verified:false but verificationStatus:'verified'", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      setDoc(doc(org, "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "verified",
      })
    );
  });

  it("lets an admin verify an organization", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "admins/root"), {
        uid: "root",
        role: "admin",
      });
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "pending",
      });
    });

    const root = testEnv.authenticatedContext("root").firestore();
    await assertSucceeds(
      updateDoc(doc(root, "organizations/org1"), {
        verified: true,
        verificationStatus: "verified",
      })
    );
  });
});

describe("verificationRequests/{id}", () => {
  it("lets an org create its own verification request", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      setDoc(doc(org, "verificationRequests/req1"), {
        orgId: "org1",
        status: "pending",
      })
    );
  });

  it("blocks an org from creating a request on behalf of another org", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      setDoc(doc(org, "verificationRequests/req1"), {
        orgId: "someOtherOrg",
        status: "pending",
      })
    );
  });

  it("blocks an org from approving its own request", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "verificationRequests/req1"), {
        orgId: "org1",
        status: "pending",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      updateDoc(doc(org, "verificationRequests/req1"), { status: "verified" })
    );
  });

  it("lets an admin approve a request", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "admins/root"), {
        uid: "root",
        role: "admin",
      });
      await setDoc(doc(context.firestore(), "verificationRequests/req1"), {
        orgId: "org1",
        status: "pending",
      });
    });

    const root = testEnv.authenticatedContext("root").firestore();
    await assertSucceeds(
      updateDoc(doc(root, "verificationRequests/req1"), {
        status: "verified",
      })
    );
  });
});

describe("users/{uid} — verification self-transition and org award writes", () => {
  it("lets a volunteer submit verification (no prior status -> pending)", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/alice"), {
        uid: "alice",
        role: "volunteer",
        name: "Alice",
      });
    });

    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(
      updateDoc(doc(alice, "users/alice"), { verificationStatus: "pending" })
    );
  });

  it("lets an org move its own users-mirror verificationStatus from unverified to pending", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/org1"), {
        uid: "org1",
        role: "organization",
        verificationStatus: "unverified",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      updateDoc(doc(org, "users/org1"), { verificationStatus: "pending" })
    );
  });

  it("lets an organization increment totalHours/completedProjects/impactScore on a volunteer's doc", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      });
      await setDoc(doc(context.firestore(), "users/alice"), {
        uid: "alice",
        role: "volunteer",
        totalHours: 0,
        completedProjects: 0,
        impactScore: 0,
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      updateDoc(doc(org, "users/alice"), {
        totalHours: increment(4),
        completedProjects: increment(1),
        impactScore: increment(50),
      })
    );
  });

  it("blocks an organization from sneaking a role change through the award-fields path", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "organizations/org1"), {
        uid: "org1",
        tier: "tier2",
        verified: false,
        verificationStatus: "unverified",
      });
      await setDoc(doc(context.firestore(), "users/alice"), {
        uid: "alice",
        role: "volunteer",
      });
    });

    const org = testEnv.authenticatedContext("org1").firestore();
    await assertFails(
      updateDoc(doc(org, "users/alice"), {
        role: "admin",
        totalHours: increment(4),
      })
    );
  });
});

describe("out-of-scope collections (preserve current app behavior)", () => {
  it("lets an authenticated user read/write a collection outside this plan's scope", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(
      setDoc(doc(alice, "opportunities/opp1"), { title: "Beach Cleanup" })
    );
  });

  it("still blocks unauthenticated access to those collections", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anon, "opportunities/opp1"), { title: "Beach Cleanup" })
    );
  });

  it("lets an authenticated user read/write the organizations team subcollection", async () => {
    const org = testEnv.authenticatedContext("org1").firestore();
    await assertSucceeds(
      setDoc(doc(org, "organizations/org1/team/member1"), { name: "Bob" })
    );
  });

  it("still denies access to a genuinely undefined collection", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(alice, "totallyUndefinedCollection/x"), { a: 1 })
    );
  });
});
