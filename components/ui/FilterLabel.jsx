// src/components/ui/FilterLabel.jsx
import React from "react";

export default function FilterLabel({ children }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </span>
  );
}
