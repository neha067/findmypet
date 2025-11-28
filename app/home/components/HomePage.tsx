"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/ui/Header.jsx";
import FilterSideBar from "@/components/ui/FilterSideBar.jsx";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import SideBar from "./Sidebar.jsx";
import { PanelRight } from 'lucide-react';
import Social from "@/app/Social/page";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const MapView = dynamic(() => import("../../../components/ui/MapView"), {
  ssr: false,
});

interface CatData {
  id: string;
  name?: string;
  status: string;
  daysAgo?: number;
  position: [number, number];
  color?: string;
  gender?: string;
  age?: string;
  location?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export default function HomePage() {
  const [showsidebar, setShowsidebar] = useState(false);
  const [catData, setCatData] = useState<CatData[]>([]);
  const [filteredData, setFilteredData] = useState<CatData[]>([]);
  const [map_center, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [tabValue, setTabValue] = useState('home');
  const [loading, setLoading] = useState(true);
  const [activeFilterState, setActiveFilterState] = useState(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  // Filter state - lifted to parent to share with Social component
  const [filterState, setFilterState] = useState({
    missingCatCheck: true,
    foundCatCheck: true,
    colorFilter: null as string | null,
    ageFilter: null as string | null,
  });

  // Fetch cats from Firestore in real-time
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Firebase is initialized
    if (!db) {
      console.error("Firestore is not initialized. Check Firebase configuration.");
      setLoading(false);
      return;
    }

    try {
      const catsRef = collection(db, "cats");
      const q = query(catsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const cats: CatData[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              const position: [number, number] = data.position || 
                (data.latitude && data.longitude 
                  ? [data.latitude, data.longitude] 
                  : [12.9716, 77.5946]);

              return {
                id: doc.id,
                name: data.name || "Unknown",
                status: data.status || "Unknown",
                daysAgo: data.daysAgo || 0,
                position: position,
                color: data.color,
                gender: data.gender,
                age: data.age,
                location: data.location,
                imageUrl: data.imageUrl,
                latitude: data.latitude || position[0],
                longitude: data.longitude || position[1],
              };
            });

            setCatData(cats);
            // Always update filteredData when new data arrives
            // The FilterSideBar will handle reapplying filters if needed
            setFilteredData(cats);
            setLoading(false);

            // Update map center based on cat positions if available
            if (cats.length > 0) {
              const avgLat = cats.reduce((sum, cat) => sum + cat.position[0], 0) / cats.length;
              const avgLng = cats.reduce((sum, cat) => sum + cat.position[1], 0) / cats.length;
              setMapCenter([avgLat, avgLng]);
            }
          } catch (error) {
            console.error("Error processing cats data:", error);
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error fetching cats:", error);
          setLoading(false);
          // Set empty data on error
          setCatData([]);
          setFilteredData([]);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up cats listener:", error);
      setLoading(false);
    }
  }, []);

  const filterCatData = (data: CatData[]) => {
    console.log("📊 filterCatData called:", {
      filteredCount: data.length,
      totalCount: catData.length,
      filteredIds: data.map(d => d.id).sort(),
      totalIds: catData.map(d => d.id).sort()
    });
    setFilteredData(data);
    // Mark that filters are active if filtering results in different data
    const isDifferent = data.length !== catData.length || 
      JSON.stringify(data.map(d => d.id).sort()) !== JSON.stringify(catData.map(d => d.id).sort());
    setHasActiveFilters(isDifferent);
    console.log("🎯 Filters active:", isDifferent, "| Showing", data.length, "of", catData.length, "cats");
  };

  const toggleHideSidebar = () => {
    setShowsidebar(false);
  };

  const changeTabValue = (item: string) => {
    setTabValue(item);
  };

  useEffect(() => {
    setShowsidebar(false);
  }, [tabValue]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <main className="flex h-full flex-1 gap-0 md:gap-4 px-0 md:px-4 py-4">
        {/* Filter Sidebar */}
        <div className={`${showsidebar ? "block" : "hidden"} md:block`}>
          <FilterSideBar
            catData={catData}
            map_center={map_center}
            filterCatData={filterCatData}
            toggleHideSidebar={toggleHideSidebar}
            changeTabValue={changeTabValue}
            curTab={tabValue}
            filterState={filterState}
            setFilterState={setFilterState}
          />
        </div>
        
        {/* Collapsed Sidebar */}
        <div className={`group ${showsidebar ? "hidden" : "block"} md:hidden`}>
          <SideBar 
            catData={catData}
            map_center={map_center}
            filterCatData={filterCatData}
            toggleHideSidebar={toggleHideSidebar}
          />
        </div>

        <section className="flex-1 px-4 md:px-0">
          <div className="h-[calc(100vh-6rem-2rem)] flex flex-col gap-2">
            {tabValue === 'map' ? (
              <div className="flex-1 gap-2">
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowsidebar(!showsidebar)}
                    className="md:hidden"
                  >
                    <PanelRight className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      Map Explorer
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tap a marker to see details about a missing or found cat.
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 dark:text-slate-400">Loading map data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {hasActiveFilters && (
                      <div className="mb-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 rounded-lg text-sm">
                        <span className="text-violet-800 dark:text-violet-200">
                          🔍 Showing {filteredData.length} of {catData.length} cats
                        </span>
                      </div>
                    )}
                    <MapView map_center={map_center} catData={filteredData} />
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4 md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowsidebar(!showsidebar)}
                  >
                    <PanelRight className="w-5 h-5" />
                  </Button>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Social Feed
                  </h1>
                </div>
                <Social filterState={filterState} catData={catData} />
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
