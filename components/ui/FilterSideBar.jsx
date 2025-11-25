// src/components/layout/FilterSidebar.jsx
import React from "react";
import { PrimaryButton } from "../ui/Buttons.jsx";
import FilterLabel from "../ui/FilterLabel.jsx";
import CheckboxPill from "../ui/CheckboxPill.jsx";
import ColorPill from "../ui/ColorPill.jsx";
import AgePill from "../ui/AgePill.jsx";
import { useEffect, useState } from "react"
import { BookmarkIcon, HeartIcon, StarIcon } from "lucide-react"
import { Button } from "@/components/ui/button.tsx";
import { ClipboardPlus,Funnel } from 'lucide-react';
import { FlagTriangleRight } from 'lucide-react';
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
import { House } from 'lucide-react';
import { MapPinned } from 'lucide-react';
export default function FilterSideBar({catData,map_center,filterCatData,toggleHideSidebar,changeTabValue,curTab}) {
  const [missingCatCheck, setMissingCatCheck] = useState(true)
  const [foundCatCheck, setFoundCatCheck] = useState(true)
  const [colorFilter, setColorFilter] = useState(null)
  const [ageFilter, setAgeFilter] = useState(null)
  const [tabValue, setTabValue] = useState(null)
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

    // Only auto-hide the full sidebar on touch/mobile devices.
    // Use matchMedia to detect coarse pointer / no hover as a heuristic,
    // fallback to checking for touch support.
    try {
      const isMobile =
        typeof window !== "undefined" &&
        ((window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || ("ontouchstart" in window))

      if (isMobile && typeof toggleHideSidebar === "function") toggleHideSidebar()
    } catch (e) {
      // If any detection fails, don't hide the sidebar by default.
      console.warn("device detection failed, not auto-hiding sidebar", e)
    }

  }
  useEffect(() => {
    console.log('tabval in chd',typeof(tabValue));
    if(tabValue === null)return
    if(tabValue !== 'filter' && tabValue !== curTab)
    changeTabValue(tabValue)
  },[tabValue])
  return (
    <aside className="w-full md:w-52 border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm">
      <div className="h-full overflow-y-auto px-2 py-3 space-y-3">

        <div className="w-full flex items-start flex-col gap-2">
           <ToggleGroup className="w-full flex items-start flex-col gap-1" type="single" value={tabValue} onValueChange={setTabValue}>
            <ToggleGroupItem disabled={'home' === curTab} className="w-full justify-start px-2 py-2 text-left" value="home">
              <span className="w-full inline-flex items-center gap-2"><House className="w-4 h-4"/> Home</span>
            </ToggleGroupItem>
            <ToggleGroupItem disabled={'map' === curTab} className="w-full justify-start px-2 py-2 text-left" value="map">
              <span className="w-full inline-flex items-center gap-2"><MapPinned className="w-4 h-4"/> Map Explorer</span>
            </ToggleGroupItem>
            <ToggleGroupItem disabled={true} className="w-full justify-start px-2 py-2 text-left" value="filter">
              <span className="w-full inline-flex items-center gap-2"><Funnel className="w-4 h-4"/> Apply Filters</span>
            </ToggleGroupItem>
          </ToggleGroup>
        
           
           {/* <Button className="w-full"><ClipboardPlus /> Report Found</Button> */}
        </div>

        <div className="flex flex-col gap-3">
          {/* <div className="flex gap-2">
            <Funnel w-2 h-2/>
            <FilterLabel>Apply Filters</FilterLabel>
          </div> */}
           {/* <ToggleGroup className="w-full flex items-start flex-col gap-3" type="single" value={colorFilter} onValueChange={setColorFilter}>
            <ToggleGroupItem className="w-full justify-start px-2 py-2 text-left" value="Home">
              <span className="w-full inline-flex items-center gap-2"><Funnel className="w-4 h-4"/> Apply Filters</span>
            </ToggleGroupItem>
          </ToggleGroup> */}

          <FilterLabel>Status</FilterLabel>
          <div className="flex gap-1">
            <Checkbox checked={missingCatCheck} onCheckedChange={() => setMissingCatCheck(!missingCatCheck)}/>
            <Label htmlFor="toggle">Missing Cats</Label>
          </div>
          <div className="flex gap-1">
            <Checkbox checked={foundCatCheck} onCheckedChange={() => setFoundCatCheck(!foundCatCheck)}/>
            <Label htmlFor="toggle">Found Cats</Label>
          </div>
        </div>

        <div className="space-y-2">
          <FilterLabel>Color</FilterLabel>
          {/* <div className="mt-2 flex flex-wrap gap-2">
            <ColorPill label="Black" active />
            <ColorPill label="White" />
            <ColorPill label="Mixed" />
            <ColorPill label="Brown" />
            <ColorPill label="Orange" />
          </div> */}
          <ToggleGroup type="single" value={colorFilter} onValueChange={setColorFilter} className="flex flex-wrap gap-">
            <ToggleGroupItem value="black">Black</ToggleGroupItem>
            <ToggleGroupItem value="white">White</ToggleGroupItem>
            <ToggleGroupItem value="mixed">Mixed</ToggleGroupItem>
            <ToggleGroupItem value="orange">Orange</ToggleGroupItem>
            <ToggleGroupItem value="brown">Brown</ToggleGroupItem>
            <ToggleGroupItem value="others">Others</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <FilterLabel>Age</FilterLabel>
          <div className="mt-2 space-y-2">
            <ToggleGroup type="single" value={ageFilter} onValueChange={setAgeFilter} className="flex flex-wrap gap-">
            <ToggleGroupItem value="kitten">Kitten (0–1 yr)</ToggleGroupItem>
            <ToggleGroupItem value="young">Young (1–3 yrs)</ToggleGroupItem>
            <ToggleGroupItem value="adult">Adult (3+ yrs)</ToggleGroupItem>
          </ToggleGroup>
          </div>
        </div>
        <Button className="w-full" onClick={handlefilter}>Apply Filters</Button>
        {/* <PrimaryButton className="w-full mt-4">Apply Filters</PrimaryButton> */}
      </div>
    </aside>
  );
}
