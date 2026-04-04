import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// --- 1. VOLUNTEER SIGN UP ---
export const signUpVolunteer = async (email: string, pass: string, fullName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
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

// --- 2. ORGANIZATION SIGN UP ---
export const signUpOrganization = async (email: string, pass: string, orgName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // A. Create the full organization profile in the "organizations" database
    await setDoc(doc(db, "organizations", user.uid), {
      uid: user.uid,
      name: orgName,
      email: email,
      role: "organization", 
      createdAt: new Date().toISOString(),
      bio: "",
      location: "",
      website: "",
      verified: false 
    });

    // B. Leave a tiny "nametag" in users so the login system knows their role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: orgName,
      email: email,
      role: "organization"
    });

    console.log("Organization created securely in 'organizations' collection!");
    return true;
  } catch (error) {
    console.error("Signup Error:", error);
    alert("Sign Up Failed: " + (error as any).message);
    return false;
  }
};

// --- 3. ADMIN SIGN UP (NEW!) ---
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

// --- 4. LOGIN (CHECKS ROLE FROM THE NAMETAG) ---
export const loginUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return { success: true, role: userData.role }; 
    } else {
      return { success: false, error: "Database record not found." };
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, error: error.message };
  }
};

// --- 5. UPDATE VOLUNTEER PROFILE ---
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

// --- 6. UPDATE ORGANIZATION PROFILE ---
export const updateOrganizationProfile = async (uid: string, updatedData: any) => {
  try {
    // FIXED: Now properly updates the "organizations" collection!
    const orgRef = doc(db, "organizations", uid);
    await updateDoc(orgRef, updatedData);
    console.log("Organization profile updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating organization profile:", error);
    alert("Could not update profile.");
    return false;
  }
};

// --- 7. VERIFICATION REQUEST ---
export const submitVerificationRequest = async (orgId: string, formData: any) => {
  try {
    await addDoc(collection(db, "verificationRequests"), {
      orgId,
      ...formData,
      status: "pending",
      submittedAt: serverTimestamp(),
    });
    
    // FIXED: Update the status in the correct organization document
    await updateDoc(doc(db, "organizations", orgId), { verificationStatus: "pending" });
    await updateDoc(doc(db, "users", orgId), { verificationStatus: "pending" }); // Keep nametag synced
    
    return true;
  } catch (error) {
    console.error("Verification submission failed:", error);
    return false;
  }
};


// Make sure auth and db are imported at the top of your file!

export const loginWithGoogle = async (expectedRole: 'volunteer' | 'organization') => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if this user already exists in our Firestore database
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // First time logging in! Let's create their profile.
      const newProfile: any = {
        name: user.displayName || 'New User',
        email: user.email,
        photoUrl: user.photoURL || '',
        role: expectedRole,
        createdAt: new Date(),
      };

      // Add default states based on role
      if (expectedRole === 'volunteer') {
        newProfile.status = 'active';
        newProfile.totalHours = 0;
        newProfile.rating = 5.0;
        newProfile.skills = [];
      } else if (expectedRole === 'organization') {
        newProfile.verified = false;
        newProfile.verificationStatus = 'unverified';
      }

      await setDoc(userDocRef, newProfile);
      return { success: true, role: expectedRole };
      
    } else {
      // User already exists! Ensure they aren't logging into the wrong portal
      const actualRole = userDoc.data().role;
      if (actualRole !== expectedRole) {
        await auth.signOut(); // Kick them out
        return { success: false, error: `Account exists, but is registered as a ${actualRole}.` };
      }
      return { success: true, role: actualRole };
    }
  } catch (error: any) {
    console.error("Google Login Error:", error);
    return { success: false, error: error.message };
  }
};