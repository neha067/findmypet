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
export default function FilterSideBar({catData,map_center,filterCatData,toggleHideSidebar,changeTabValue,curTab,filterState,setFilterState}) {
  // Use filterState from props if provided, otherwise use local state
  const missingCatCheck = filterState?.missingCatCheck ?? true
  const foundCatCheck = filterState?.foundCatCheck ?? true
  const colorFilter = filterState?.colorFilter ?? null
  const ageFilter = filterState?.ageFilter ?? null
  
  const setMissingCatCheck = (value) => {
    if (setFilterState) {
      setFilterState(prev => ({ ...prev, missingCatCheck: value }))
    }
  }
  const setFoundCatCheck = (value) => {
    if (setFilterState) {
      setFilterState(prev => ({ ...prev, foundCatCheck: value }))
    }
  }
  const setColorFilterValue = (value) => {
    if (setFilterState) {
      setFilterState(prev => ({ ...prev, colorFilter: value }))
    }
  }
  const setAgeFilterValue = (value) => {
    if (setFilterState) {
      setFilterState(prev => ({ ...prev, ageFilter: value }))
    }
  }
  
  const [tabValue, setTabValue] = useState(null)
  
  // Apply filters automatically whenever filter values change
  useEffect(() => {
    if (!catData || catData.length === 0) return;
    
    // Use a ref or flag to prevent infinite loops
    const items = Array.isArray(catData) ? catData : []

    const filtered = items.filter((item) => {
      const statusMatches = (missingCatCheck && item.status === "Missing") || (foundCatCheck && item.status === "Found")
      
      if (!missingCatCheck && !foundCatCheck) {
        return false;
      }
      
      if (!statusMatches) {
        return false;
      }

      if (colorFilter) {
        if (!item.color) {
          return false;
        }
        const itemColor = String(item.color).toLowerCase().trim();
        const filterColor = String(colorFilter).toLowerCase().trim();
        if (itemColor !== filterColor) {
          return false;
        }
      }

      if (ageFilter) {
        if (!item.age) {
          return false;
        }
        const itemAge = String(item.age).toLowerCase().trim();
        const filterAge = String(ageFilter).toLowerCase().trim();
        
        if (itemAge !== filterAge) {
          if (filterAge === "adult" && itemAge === "senior") {
            // Senior cats are included in adult filter
          } else {
            return false;
          }
        }
      }

      return true
    })

    if (typeof filterCatData === "function") {
      filterCatData(filtered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingCatCheck, foundCatCheck, colorFilter, ageFilter, catData?.length]);
  
  const handlefilter = (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Safely handle missing prop
    const items = Array.isArray(catData) ? catData : []

    if (items.length === 0) {
      console.warn("⚠️ No cat data available to filter!");
      return;
    }

    console.log("🔍 Applying filters:", {
      missingCatCheck,
      foundCatCheck,
      colorFilter,
      ageFilter,
      totalItems: items.length,
      sampleItem: items[0] ? { status: items[0].status, color: items[0].color, age: items[0].age } : null
    });

    const filtered = items.filter((item) => {
      // Status filter - must match at least one checked status
      // If both are unchecked, show nothing (or if both checked, show all)
      const statusMatches = (missingCatCheck && item.status === "Missing") || (foundCatCheck && item.status === "Found")
      
      // If neither checkbox is checked, show nothing
      if (!missingCatCheck && !foundCatCheck) {
        return false;
      }
      
      // If status doesn't match checked filters, exclude it
      if (!statusMatches) {
        return false;
      }

      // Color filter (if selected). If item has no color field, exclude it when filter is active.
      if (colorFilter) {
        if (!item.color) {
          return false; // Item has no color, exclude it when filtering by color
        }
        const itemColor = String(item.color).toLowerCase().trim();
        const filterColor = String(colorFilter).toLowerCase().trim();
        if (itemColor !== filterColor) {
          return false;
        }
      }

      // Age filter (if selected) - age is stored as string: "kitten", "young", "adult", "senior", "unknown"
      if (ageFilter) {
        if (!item.age) {
          return false; // Item has no age, exclude it when filtering by age
        }
        const itemAge = String(item.age).toLowerCase().trim();
        const filterAge = String(ageFilter).toLowerCase().trim();
        
        // Direct match for exact age values
        if (itemAge !== filterAge) {
          // Handle special case: "senior" should match "adult" filter
          if (filterAge === "adult" && itemAge === "senior") {
            // Senior cats are included in adult filter - keep it
          } else {
            return false;
          }
        }
      }

      return true
    })

    console.log("📊 Filtered results:", filtered.length, "out of", items.length);

    if (typeof filterCatData === "function") {
      filterCatData(filtered);
      console.log("✅ Filters applied: Showing", filtered.length, "of", items.length, "cats");
    } else {
      console.error("❌ filterCatData function not available!");
    }

    // Only auto-hide the full sidebar on touch/mobile devices.
    // Use matchMedia to detect coarse pointer / no hover as a heuristic,
    // fallback to checking for touch support.
    try {
      const isMobile =
        typeof window !== "undefined" &&
        ((window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) || ("ontouchstart" in window))

      if (isMobile && typeof toggleHideSidebar === "function") {
        toggleHideSidebar();
      }
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
    <aside className="w-full md:w-52 border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm relative">
      <div className="h-full overflow-y-auto px-2 py-3 space-y-3 pb-20">

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
          <ToggleGroup type="single" value={colorFilter} onValueChange={setColorFilterValue} className="flex flex-wrap gap-">
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
            <ToggleGroup type="single" value={ageFilter} onValueChange={setAgeFilterValue} className="flex flex-wrap gap-">
            <ToggleGroupItem value="kitten">Kitten (0–1 yr)</ToggleGroupItem>
            <ToggleGroupItem value="young">Young (1–3 yrs)</ToggleGroupItem>
            <ToggleGroupItem value="adult">Adult (3+ yrs)</ToggleGroupItem>
            <ToggleGroupItem value="senior">Senior (7+ yrs)</ToggleGroupItem>
          </ToggleGroup>
          </div>
        </div>
        <div className="flex gap-2 mt-6 sticky bottom-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 -mx-2 px-2 z-10">
          <button
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            onClick={(e) => {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              if (setFilterState) {
                setFilterState({
                  missingCatCheck: true,
                  foundCatCheck: true,
                  colorFilter: null,
                  ageFilter: null,
                });
              }
            }}
            type="button"
          >
            Clear Filters
          </button>
        </div>
        {/* <PrimaryButton className="w-full mt-4">Apply Filters</PrimaryButton> */}
      </div>
    </aside>
  );
}
