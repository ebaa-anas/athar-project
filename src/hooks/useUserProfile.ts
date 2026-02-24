import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useUserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    // Listen for login/logout
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        
        // 1. Look at the "nametag" in the users collection to find their true role
        const nametagRef = doc(db, "users", currentUser.uid);
        const nametagSnap = await getDoc(nametagRef);
        
        let targetCollection = "users"; // Default for volunteers

        if (nametagSnap.exists()) {
          const role = nametagSnap.data().role;
          if (role === "organization") {
            targetCollection = "organizations";
          } else if (role === "admin") {
            targetCollection = "admins";
          }
        }

        // 2. Set up a REAL-TIME listener on the correct collection!
        const fullProfileRef = doc(db, targetCollection, currentUser.uid);
        
        unsubscribeSnapshot = onSnapshot(fullProfileRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ uid: currentUser.uid, ...docSnap.data() });
          } else {
            setUser(null);
          }
          setLoading(false);
        });

      } else {
        // User logged out
        setUser(null);
        setLoading(false);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    // Cleanup listeners when component unmounts
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return { user, loading };
}