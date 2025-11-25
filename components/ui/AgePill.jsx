// src/components/ui/AgePill.jsx
import React from "react";

export default function AgePill({ label, active }) {
  return (
    <button
      className={
        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors " +
        (active
          ? "border-violet-600 bg-violet-50 text-violet-700"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")
      }
    >
      <span>{label}</span>
    </button>
  );
}
