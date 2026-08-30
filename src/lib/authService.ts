import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Turn a raw Firebase Auth error into a clear, specific sentence for the UI.
// Firebase's own messages look like "Firebase: Error (auth/invalid-credential)."
// which is not something we want to put in front of a user.
export const friendlyAuthError = (error: any): string => {
  const code: string = error?.code ?? "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password you entered is incorrect.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/weak-password":
      return "Your password is too weak. Use at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled for this project. Please contact support.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled before it finished.";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    default:
      // Still specific enough for a bug report, without the "Firebase: Error (...)" wrapper.
      return code
        ? `Sign-in failed (${code}). Please try again.`
        : "Something went wrong while contacting the server. Please try again.";
  }
};

type AuthResult = { success: boolean; error?: string };

export const signUpVolunteer = async (email: string, pass: string, fullName: string, phone: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      phone: phone,
      role: "volunteer",
      createdAt: new Date().toISOString(),
      impactScore: 0,
      skills: [],
      isAVRMember: false
    });

    console.log("Success! Volunteer created with ID:", user.uid);

    // createUserWithEmailAndPassword signs the new user in automatically. The
    // app's flow is "sign up, then log in separately", so sign back out here to
    // keep the UI and Firebase in agreement (both logged out).
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error: friendlyAuthError(error) };
  }
};

export const signUpOrganization = async (email: string, pass: string, orgName: string, orgTier: string, phone: string, taxId: string): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    let initialStatus = "unverified";
    let isVerified = false;

    if (orgTier === "tier1") {
      initialStatus = "verified"; // Tier 1 (Student Clubs) bypass audit, get immediate verified access
      isVerified = true;
    } else if (orgTier === "tier2" || orgTier === "tier3") {
      initialStatus = "unverified"; // Tiers 2 & 3 start as unverified until they complete profile & upload docs
      isVerified = false;
    }

    // A. Create the full organization profile in the "organizations" database
    await setDoc(doc(db, "organizations", user.uid), {
      uid: user.uid,
      name: orgName,
      email: email,
      role: "organization", 
      tier: orgTier, 
      phone: phone,
      registrationId: taxId,
      createdAt: new Date().toISOString(),
      bio: "",
      location: "",
      website: "",
      verified: isVerified,
      verificationStatus: initialStatus
    });

    // B. Leave a tiny "nametag" in users so the login system knows their role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: orgName,
      email: email,
      role: "organization",
      tier: orgTier 
    });

    console.log(`Organization created securely as ${orgTier} with status: ${initialStatus}!`);

    // See note in signUpVolunteer: undo the automatic sign-in from account
    // creation so the user explicitly logs in afterwards.
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Signup Error:", error);
    return { success: false, error: friendlyAuthError(error) };
  }
};

export const loginUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return { success: true, role: userData.role, tier: userData.tier || null };
    } else {
      return { success: false, error: "Your login worked, but we couldn't find your account profile. Please contact support." };
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: friendlyAuthError(error) };
  }
};

export const updateVolunteerProfile = async (uid: string, updatedData: any) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updatedData);
    console.log("Profile updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Could not update profile.");
    return false;
  }
};

export const updateOrganizationProfile = async (uid: string, updatedData: any) => {
  try {
    const orgRef = doc(db, "organizations", uid);
    await updateDoc(orgRef, updatedData);
    
    // Also mirror critical status changes back to the basic user document
    const userRef = doc(db, "users", uid);
    const userUpdates: any = {};
    if (updatedData.verificationStatus) userUpdates.verificationStatus = updatedData.verificationStatus;
    if (updatedData.verified !== undefined) userUpdates.verified = updatedData.verified;
    
    if (Object.keys(userUpdates).length > 0) {
       await updateDoc(userRef, userUpdates);
    }
    
    console.log("Organization profile updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating organization profile:", error);
    alert("Could not update profile.");
    return false;
  }
};

export const submitVerificationRequest = async (orgId: string, formData: any) => {
  try {
    await addDoc(collection(db, "verificationRequests"), {
      orgId,
      ...formData,
      status: "pending",
      submittedAt: serverTimestamp(),
    });
    
    // Once submitted, their status officially transitions from 'unverified' to 'pending'
    await updateDoc(doc(db, "organizations", orgId), { verificationStatus: "pending" });
    await updateDoc(doc(db, "users", orgId), { verificationStatus: "pending" }); 
    
    return true;
  } catch (error) {
    console.error("Verification submission failed:", error);
    return false;
  }
};

export const loginWithGoogle = async (expectedRole: 'volunteer' | 'organization') => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const newProfile: any = {
        uid: user.uid,
        name: user.displayName || 'New User',
        email: user.email,
        photoUrl: user.photoURL || '',
        role: expectedRole,
        createdAt: new Date().toISOString(),
      };

      if (expectedRole === 'volunteer') {
        newProfile.status = 'active';
        newProfile.impactScore = 0;
        newProfile.skills = [];
        await setDoc(userDocRef, newProfile);
      } else if (expectedRole === 'organization') {
        newProfile.tier = 'unassigned'; 
        newProfile.verified = false;
        newProfile.verificationStatus = 'setup_required'; // Explicit state forcing them to pick a tier/complete setup
        
        await setDoc(userDocRef, newProfile);
        await setDoc(doc(db, "organizations", user.uid), newProfile);
      }

      return { success: true, role: expectedRole };
      
    } else {
      const actualRole = userDoc.data().role;
      if (actualRole !== expectedRole) {
        // Google auth already succeeded at this point, so sign out again since the account's
        // actual role doesn't match the role the user selected on this page
        await auth.signOut();
        return { success: false, error: `Account exists, but is registered as a ${actualRole}.` };
      }
      return { success: true, role: actualRole };
    }
  } catch (error: any) {
    console.error("Google Login Error:", error);
    return { success: false, error: friendlyAuthError(error) };
  }
};