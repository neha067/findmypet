// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import Header from "@/components/ui/Header.jsx";
import FilterSideBar from "@/components/ui/FilterSideBar.jsx";
// import MapView from "@/components/ui/MapView.jsx";
import dynamic from "next/dynamic";
import { PrimaryButton } from "@/components/ui/Buttons.jsx";
import Popupinfo from "./Popupinfo.jsx";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import  AppSidebar  from "@/components/app-sidebar"
import { Button } from "@/components/ui/button.tsx";
import Tabs from "./TabsNav.jsx"
import SideBar from "./Sidebar.jsx"
const MapView = dynamic(() => import("../../../components/ui/MapView.jsx"), {
  ssr: false,
});
import { PanelRight } from 'lucide-react';
import Social from "@/app/Social/page.tsx";

export default function HomePage({}) {
  const [showsidebar, setShowsidebar] = useState(false)
  const [catData, setCatData] = useState([
  {
    id: 1,
    name: "Whiskers",
    status: "Missing",
    daysAgo: 2,
    position: [12.9716, 77.5946], // Bangalore
  },
  {
    id: 2,
    name: "Mochi",
    status: "Found",
    daysAgo: 1,
    position: [12.975, 77.61],
  },
  {
    id: 3,
    name: "Luna",
    status: "Missing",
    daysAgo: 5,
    position: [12.965, 77.59],
  },
]
)
  const [filteredData, setFilteredData] = useState([])
  const [map_center, setMapCenter] = useState([12.9716, 77.5946])
  const [tabValue, setTabValue] = useState('home')

  const filterCatData = (data) => {
    setFilteredData(data)
  }
  const toggleHideSidebar = () => {
    setShowsidebar(false)
  }
  const changeTabValue = (item) => {
    setTabValue(item)
  }

  useEffect(() => {
    setFilteredData(catData)
  },[])

  useEffect(() => {
    console.log('filtered',filteredData);
    console.log('catd',catData);
  },[filteredData,catData])

  useEffect(() => {
    console.log('tabval in parent',tabValue);
    setShowsidebar(false)
  },[tabValue])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header/>
          {/* <SidebarProvider> */}
      {/* <AppSidebar /> */}

      <main className="flex flex-1 gap-0 md:gap-4 px-0 md:px-4 py-4">
        {/* Keep FilterSideBar mounted to preserve its internal state; toggle visibility via CSS */}
          <div className={`${showsidebar ? "block" : "hidden"} group-hover:block`}>
          <FilterSideBar
            catData={catData}
            // filteredData={filteredData}
            map_center={map_center}
            filterCatData={filterCatData}
            toggleHideSidebar={toggleHideSidebar}
            changeTabValue={changeTabValue}
            curTab={tabValue}
          />
        </div>
        <div className={`group ${showsidebar  ? "hidden" : "block"}`}>
          <SideBar
            // catData={catData}
            // // filteredData={filteredData}
            // map_center={map_center}
            // filterCatData={filterCatData}
            // toggleHideSidebar={toggleHideSidebar}
          />
        </div>
        {/* <div>
          <SidebarTrigger />
        </div> */}

        <section className="flex-1 px-4 md:px-0">
          <div className="h-[calc(100vh-6rem-2rem)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex gap-1">
                  {/* <PanelRight className="cursor-pointer" onClick={() => setShowsidebar(!showsidebar)}/> */}
                {/* <Button onClick={() => setShowsidebar(!showsidebar)}>
                  {showsidebar ? 'Hide filters' : 
                  'show filters'}</Button> */}
                  {/* <Tabs 
                  map_center={map_center}
                  filteredData={filteredData}
                  /> */}
                  </div>
                {/* <h1 className="text-xl font-semibold text-slate-900">
                  Map of nearby reports
                </h1>
                <p className="text-sm text-slate-600">
                  Tap a marker to see details about a missing or found cat.
                </p> */}
              </div>
              {/* <PrimaryButton className="hidden sm:inline-flex">
                + Report Missing
              </PrimaryButton> */}
              {/* <Popupinfo /> */}
            </div>
              {(tabValue === 'map' ? 
            <div className="flex-1 gap-2">
              <div className="flex gap-2">
               <PanelRight className="cursor-pointer" onClick={() => setShowsidebar(!showsidebar)}/>
             Map Explorer
             </div>
              <div className="mt-2">
                <h1 className="text-xl font-semibold text-slate-900">
                  Map of nearby reports
                </h1>
                <p className="text-sm text-slate-600">
                  Tap a marker to see details about a missing or found cat.
                </p>
              </div>
              <MapView 
              map_center={map_center}
              catData={filteredData}
              />
            </div> :
            <div className="flex gap-2">
               <PanelRight className="cursor-pointer" onClick={() => setShowsidebar(!showsidebar)}/>
              <Social />
            </div>)}
          </div>
        </section>
      </main>
       {/* </SidebarProvider> */}
    </div>
  );
}
