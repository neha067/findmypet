"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (uid: string) => {
    if (!db) return;
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUsername(userDoc.data().username);
      } else {
        setUsername(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Firebase auth is initialized
    if (!auth) {
      console.error("Firebase auth is not initialized. Check Firebase configuration.");
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUsername(null);
      }

      setLoading(false);
      if (currentUser && typeof window !== "undefined") {
        try {
          localStorage.setItem("user", JSON.stringify({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          }));
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      } else if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("user");
        } catch (error) {
          console.error("Error removing from localStorage:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, username, loading, refreshUser: () => user && fetchUserData(user.uid) };
}

