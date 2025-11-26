"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Firebase auth is initialized
    if (!auth) {
      console.error("Firebase auth is not initialized. Check Firebase configuration.");
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
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

  return { user, loading };
}

