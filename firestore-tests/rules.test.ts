import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
