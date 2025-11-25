// src/components/ui/CheckboxPill.jsx
import React from "react";

export default function CheckboxPill({ label, checked = false, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
      <span
        className={
          "inline-flex h-4 w-4 items-center justify-center rounded border " +
          (checked
            ? "border-violet-600 bg-violet-600 text-white"
            : "border-slate-400 bg-white")
        }
      >
        {checked && (
          <svg
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M5 10.5L8.5 14L15 6" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" className="hidden" checked={checked} {...props} />
      <span>{label}</span>
    </label>
  );
}
