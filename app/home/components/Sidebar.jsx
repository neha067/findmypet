// src/components/layout/FilterSidebar.jsx
import React from "react";

import { useEffect, useState } from "react"
import { BookmarkIcon, HeartIcon, StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button.tsx";
import { ClipboardPlus,MapPinned,House } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Bold, Italic, Underline } from "lucide-react"
import { Funnel } from 'lucide-react';
export default function SideBar({catData,map_center,filterCatData,toggleHideSidebar}) {
  const [missingCatCheck, setMissingCatCheck] = useState(true)
  const [foundCatCheck, setFoundCatCheck] = useState(true)
  const [colorFilter, setColorFilter] = useState(null)
  const [ageFilter, setAgeFilter] = useState(null)
  const handlefilter = () => {
    // Safely handle missing prop
    const items = Array.isArray(catData) ? catData : []

    const filtered = items.filter((item) => {
      // Status filter
      const statusMatches = (missingCatCheck && item.status === "Missing") || (foundCatCheck && item.status === "Found")

      if (!statusMatches) return false

      // Color filter (if selected). If item has no color field, keep it.
      if (colorFilter && item.color && item.color.toLowerCase() !== String(colorFilter).toLowerCase()) return false

      // Age filter (if selected). We expect item.ageYears or item.age to be a number; if not present, keep it.
      if (ageFilter && (typeof item.ageYears === "number" || typeof item.age === "number")) {
        const years = item.ageYears ?? item.age
        if (ageFilter === "kitten" && !(years >= 0 && years <= 1)) return false
        if (ageFilter === "young" && !(years > 1 && years <= 3)) return false
        if (ageFilter === "adult" && !(years > 3)) return false
      }

      return true
    })

    if (typeof filterCatData === "function") filterCatData(filtered)

    toggleHideSidebar()
  }
  return (
    <aside className="w-full md:w-10 border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm">
      <div className="h-full flex flex-col gap-9 overflow-y-auto p-1">
        {/* <ClipboardPlus size={16} /> */}
        <House size={16} />
        <MapPinned size={16} />
        <Funnel size={16} />
        
        {/* <PrimaryButton className="w-full mt-4">Apply Filters</PrimaryButton> */}
      </div>
    </aside>
  );
}
