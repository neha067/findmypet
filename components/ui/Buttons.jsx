// src/components/ui/Buttons.jsx
import React from "react";

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-colors " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function OutlinedButton({ children, className = "", ...props }) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
