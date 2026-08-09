# Firestore Security Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firestore Security Rules that stop client-side privilege escalation (self-granted `role`/`verified`/`verificationStatus`/`tier`), while preserving the app's legitimate write paths (admin verifying an org, org submitting a verification request), verified by an automated rules test suite. Also remove the dead, dangerous `signUpAdmin()` public path.

**Architecture:** A single `firestore.rules` file with an `isAdmin()` helper (checks for a doc at `admins/{request.auth.uid}`) gating admin-only write branches on `users`, `organizations`, and `verificationRequests`. Verified against the local Firebase Firestore Emulator using `@firebase/rules-unit-testing` + Vitest — no deployed Firebase project or billing plan required to run these tests.

**Tech Stack:** `firebase-tools` (CLI + emulator), `@firebase/rules-unit-testing`, `vitest`.

## Global Constraints

- No Cloud Functions, no Firebase Blaze plan — everything here runs on the free Spark plan / local emulator.
- Preserve existing business behavior: tier-1 organizations still auto-verify at signup (see design doc, "Note on tier-1 auto-verify") — rules must allow this, not remove it.
- `admins/*` documents are never writable by any client, including an already-authenticated admin — admin accounts are a manual, out-of-band operation after this plan (see Task 3).
- Spec: `docs/superpowers/specs/2026-08-09-secure-ai-keys-and-firestore-rules-design.md` (Firestore Security Rules and `signUpAdmin()` removal sections).

---

### Task 1: Emulator test harness + `users`/`admins` collection rules

**Files:**
- Create: `firebase.json`
- Create: `firestore.rules`
- Create: `firestore-tests/rules.test.ts`
- Modify: `package.json` (add `test:rules` script)

**Interfaces:**
- Produces: `firestore.rules` with an `isAdmin()` helper function, reused unchanged by Task 2.
- Produces: `firestore-tests/rules.test.ts` with a shared `testEnv: RulesTestEnvironment` set up in `beforeAll`/`afterAll`/`beforeEach` — Task 2 appends more `describe()` blocks to this same file using the same `testEnv`.
- Produces: `npm run test:rules` — the command used to verify every task in this plan.

- [ ] **Step 1: Install dependencies**

```bash
npm install --save-dev firebase-tools @firebase/rules-unit-testing vitest
```

Note: running the Firestore emulator requires a local Java runtime (JDK 11+). If `npx firebase emulators:start` later fails with a Java-related error, install a JDK (e.g. Temurin) and re-run.

- [ ] **Step 2: Create `firebase.json`**

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    }
  }
}
```

- [ ] **Step 3: Create a deny-by-default `firestore.rules`**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 4: Add the `test:rules` script**

Edit `package.json`, in `"scripts"`:

```json
    "test:rules": "firebase emulators:exec --project athar-rules-test --only firestore \"vitest run firestore-tests\""
```

Pointing `vitest run` directly at the `firestore-tests` folder (rather than adding a shared `vitest.config.ts`) keeps this plan's test setup independent of the AI-proxy plan's `api/*.test.ts` files — no shared config file for the two to conflict over.

- [ ] **Step 5: Write the failing tests for `users/{uid}` and `admins/{uid}`**

Create `firestore-tests/rules.test.ts`:

```typescript
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
      port: 8080,
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
```

- [ ] **Step 6: Run the tests to confirm the expected failures**

Run: `npm run test:rules`
Expected: the two `assertSucceeds` cases ("lets a volunteer create...", "lets a volunteer update a non-restricted field...", "lets an admin change another user's role field") FAIL, because the current `firestore.rules` denies everything. The `assertFails` cases trivially pass against deny-all — that's expected and not meaningful yet.

- [ ] **Step 7: Implement the real `users`/`admins` rules**

Replace the contents of `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /users/{uid} {
      allow read: if request.auth != null;

      allow create: if request.auth != null
        && request.auth.uid == uid
        && request.resource.data.role in ['volunteer', 'organization'];

      allow update: if request.auth != null
        && (
          (
            request.auth.uid == uid
            && request.resource.data.role == resource.data.role
            && request.resource.data.get('verified', null) == resource.data.get('verified', null)
            && request.resource.data.get('verificationStatus', null) == resource.data.get('verificationStatus', null)
            && request.resource.data.get('tier', null) == resource.data.get('tier', null)
          )
          || isAdmin()
        );

      allow delete: if false;
    }

    match /admins/{uid} {
      allow read: if isAdmin();
      allow write: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 8: Run the tests to confirm they pass**

Run: `npm run test:rules`
Expected: PASS (all cases in `users/{uid}` and `admins/{uid}` describe blocks).

- [ ] **Step 9: Commit**

```bash
git add firebase.json firestore.rules firestore-tests/rules.test.ts package.json package-lock.json
git commit -m "Add Firestore rules emulator harness and users/admins rules"
```

---

### Task 2: `organizations`/`verificationRequests` collection rules

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore-tests/rules.test.ts`

**Interfaces:**
- Consumes: `isAdmin()` helper and `testEnv` from Task 1 — reused as-is, not redefined.
- Produces: complete `firestore.rules` covering every collection named in the design doc's rules table.

- [ ] **Step 1: Add failing tests for `organizations/{uid}`**

Append to `firestore-tests/rules.test.ts` (after the `admins/{uid}` describe block):

```typescript
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
```

- [ ] **Step 2: Run the tests to confirm the new cases fail**

Run: `npm run test:rules`
Expected: FAIL on the new `organizations/{uid}` and `verificationRequests/{id}` cases that expect `assertSucceeds` (creation, tier1 auto-verify, unverified→pending, admin verify, admin approve, org creates own request) — everything is still denied by the Task 1 catch-all. The `assertFails` cases pass trivially, as before.

- [ ] **Step 3: Implement the `organizations`/`verificationRequests` rules**

Replace the contents of `firestore.rules` (adds two new `match` blocks between `admins/{uid}` and the catch-all; `users/{uid}`, `admins/{uid}`, and `isAdmin()` are unchanged from Task 1):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /users/{uid} {
      allow read: if request.auth != null;

      allow create: if request.auth != null
        && request.auth.uid == uid
        && request.resource.data.role in ['volunteer', 'organization'];

      allow update: if request.auth != null
        && (
          (
            request.auth.uid == uid
            && request.resource.data.role == resource.data.role
            && request.resource.data.get('verified', null) == resource.data.get('verified', null)
            && request.resource.data.get('verificationStatus', null) == resource.data.get('verificationStatus', null)
            && request.resource.data.get('tier', null) == resource.data.get('tier', null)
          )
          || isAdmin()
        );

      allow delete: if false;
    }

    match /admins/{uid} {
      allow read: if isAdmin();
      allow write: if false;
    }

    match /organizations/{uid} {
      allow read: if request.auth != null;

      allow create: if request.auth != null
        && request.auth.uid == uid
        && (
          request.resource.data.get('verified', false) == false
          || request.resource.data.tier == 'tier1'
        );

      allow update: if request.auth != null
        && (
          (
            request.auth.uid == uid
            && request.resource.data.get('verified', null) == resource.data.get('verified', null)
            && request.resource.data.get('tier', null) == resource.data.get('tier', null)
            && (
              request.resource.data.get('verificationStatus', null) == resource.data.get('verificationStatus', null)
              || (
                resource.data.get('verificationStatus', null) == 'unverified'
                && request.resource.data.verificationStatus == 'pending'
              )
            )
          )
          || isAdmin()
        );

      allow delete: if false;
    }

    match /verificationRequests/{id} {
      allow read: if isAdmin()
        || (request.auth != null && request.auth.uid == resource.data.orgId);

      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.orgId;

      allow update: if isAdmin();
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 4: Run the full suite to confirm everything passes**

Run: `npm run test:rules`
Expected: PASS (all describe blocks: `users/{uid}`, `admins/{uid}`, `organizations/{uid}`, `verificationRequests/{id}`).

- [ ] **Step 5: Commit**

```bash
git add firestore.rules firestore-tests/rules.test.ts
git commit -m "Add organizations/verificationRequests Firestore rules"
```

---

### Task 3: Remove `signUpAdmin()` and document manual admin creation

**Files:**
- Modify: `src/lib/authService.ts:87-118`
- Create: `docs/admin-setup.md`

**Interfaces:**
- Consumes: nothing from Tasks 1-2 (independent of the rules work, but relies on the `admins/*` write-blocked rule from Task 1 being in place so the documented manual process is the only way to create an admin).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Confirm `signUpAdmin` has no callers**

Run: `grep -rn "signUpAdmin" src`
Expected: only the declaration line in `src/lib/authService.ts` — no import/usage elsewhere. (Already confirmed during design; re-check here in case something changed.)

- [ ] **Step 2: Remove the function**

In `src/lib/authService.ts`, delete this block (lines 86-118, the blank line before the section plus the whole function):

```typescript

// --- 3. ADMIN SIGN UP ---
export const signUpAdmin = async (email: string, pass: string, adminName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // A. Create the admin profile in the "admins" database
    await setDoc(doc(db, "admins", user.uid), {
      uid: user.uid,
      name: adminName,
      email: email,
      role: "admin", 
      createdAt: new Date().toISOString(),
    });

    // B. Leave a tiny "nametag" in users so the login system knows their role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: adminName,
      email: email,
      role: "admin"
    });

    console.log("Admin created securely in 'admins' collection!");
    return true;
  } catch (error) {
    console.error("Admin Signup Error:", error);
    alert("Sign Up Failed: " + (error as any).message);
    return false;
  }
};
```

- [ ] **Step 3: Write the manual admin-setup doc**

Create `docs/admin-setup.md`:

```markdown
# Creating an admin account

Admin accounts are not created through the app — `admins/*` Firestore
documents cannot be written by any client (see `firestore.rules`), and
there is no admin sign-up form. To create one:

1. **Create the Auth user.** Firebase Console → Authentication → Users →
   Add user. Set an email and password.
2. **Create the `admins/{uid}` doc.** Firebase Console → Firestore →
   `admins` collection → Add document, with the document ID set to the
   Auth user's UID (copy it from the Authentication tab). Fields:
   - `uid` (string): the same UID
   - `name` (string): admin's display name
   - `email` (string): same email as the Auth user
   - `role` (string): `"admin"`
   - `createdAt` (timestamp): now
3. **Create the matching `users/{uid}` doc** (same UID), so login can
   route the account correctly:
   - `uid` (string): the UID
   - `name` (string): admin's display name
   - `email` (string): same email
   - `role` (string): `"admin"`

The admin can now log in through the normal login form — `loginUser()`
reads `role` from `users/{uid}` to route to the admin dashboard.
```

- [ ] **Step 4: Verify the app still builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors referencing `signUpAdmin`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/authService.ts docs/admin-setup.md
git commit -m "Remove public signUpAdmin() path; document manual admin creation"
```

---

## After this plan

`firestore.rules` exists locally and is verified against the emulator, but it is **not deployed** yet — deploying requires linking this repo to your actual Firebase project (`npx firebase login`, `npx firebase use --add`, then `npx firebase deploy --only firestore:rules`), which needs your project ID and your Firebase login, so that step is left for you to run rather than scripted here.
