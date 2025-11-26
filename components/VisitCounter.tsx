"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Eye } from "lucide-react";

export default function VisitCounter({ pageId = "homepage" }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const incrementVisit = async () => {
      if (!db) {
        console.error("Firestore is not initialized");
        return;
      }
      try {
        const ref = doc(db, "visits", pageId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          await updateDoc(ref, { count: increment(1) });
          setCount(snap.data().count + 1);
        } else {
          await setDoc(ref, { count: 1 });
          setCount(1);
        }
      } catch (error) {
        console.error("Error updating visit count:", error);
      }
    };

    incrementVisit();
  }, [pageId]);

  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
      <Eye size={18} />
      <span>{count !== null ? count : "..."}</span>
    </div>
  );
}
