import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const signUpVolunteer = async (email: string, pass: string, fullName: string, phone: string) => {
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
    return true;
  } catch (error) {
    console.error("Error signing up:", error);
    alert("Sign Up Failed: " + (error as any).message);
    return false;
  }
};

export const signUpOrganization = async (email: string, pass: string, orgName: string, orgTier: string, phone: string, taxId: string) => {
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
    return true;
  } catch (error) {
    console.error("Signup Error:", error);
    alert("Sign Up Failed: " + (error as any).message);
    return false;
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
      return { success: false, error: "Database record not found." };
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: error.message };
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
    return { success: false, error: error.message };
  }
};