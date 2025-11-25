// src/components/ui/TextInput.jsx
import React from "react";

export default function TextInput({ label, type = "text", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <input
        type={type}
        className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        {...props}
      />
    </label>
  );
}
