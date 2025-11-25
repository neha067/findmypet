// src/components/ui/ColorPill.jsx
import React from "react";

export default function ColorPill({ label, active }) {
  return (
    <button
      className={
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-violet-600 bg-violet-50 text-violet-700"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
      }
    >
      {label}
    </button>
  );
}
