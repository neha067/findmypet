"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";

// Fix default marker icons (required in many bundlers)
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

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
}

interface MapViewProps {
  map_center: [number, number];
  catData: CatData[];
}

export default function MapView({ map_center, catData }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("🗺️ MapView received catData:", catData.length, "cats");
    console.log("Sample cats:", catData.slice(0, 2).map(c => ({ id: c.id, name: c.name, status: c.status })));
  }, [catData]);

  if (typeof window === "undefined" || !mounted) {
    return (
      <div className="h-[90%] w-full mt-2 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-[90%] w-full mt-2 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
      <MapContainer
        center={map_center}
        zoom={catData.length > 0 ? 13 : 10}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {catData.map((cat) => (
          <Marker 
            key={cat.id} 
            position={cat.position}
            icon={
              new L.Icon({
                iconUrl: cat.status === "Missing" 
                  ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                  : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })
            }
          >
            <Popup className="map-popup" maxWidth={300}>
              <Card className="w-full max-w-sm border-0 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cat.name || "Unknown Cat"}</CardTitle>
                  <CardDescription>
                    {cat.status} {cat.daysAgo !== undefined ? `• ${cat.daysAgo} days ago` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-3">
                    {cat.imageUrl && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={cat.imageUrl}
                          alt={cat.name || "Cat"}
                          fill
                          className="object-cover"
                          sizes="300px"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {cat.color && (
                        <div className="flex flex-col">
                          <Label className="text-xs text-gray-500">Color</Label>
                          <span className="font-medium capitalize">{cat.color}</span>
                        </div>
                      )}
                      {cat.age && (
                        <div className="flex flex-col">
                          <Label className="text-xs text-gray-500">Age</Label>
                          <span className="font-medium capitalize">{cat.age}</span>
                        </div>
                      )}
                      {cat.gender && (
                        <div className="flex flex-col">
                          <Label className="text-xs text-gray-500">Gender</Label>
                          <span className="font-medium capitalize">{cat.gender}</span>
                        </div>
                      )}
                      {cat.location && (
                        <div className="flex flex-col col-span-2">
                          <Label className="text-xs text-gray-500">Location</Label>
                          <span className="font-medium">{cat.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  {cat.status === 'Missing' ? (
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                      View Details
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full">
                      Contact Finder
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </Popup>
          </Marker>
        ))}
        
        {catData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 z-[1000]">
            <div className="text-center p-4">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                No cats reported yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Report a missing or found cat to see it on the map
              </p>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
