"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
import PetIcon from "@/components/PetIcon";
import { Search, Crosshair, Maximize2, Minimize2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";


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

interface PetData {
  id: string;
  petType?: "cat" | "dog" | "other";
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
  catData: PetData[];
  updateMapCenter: (coords: [number, number]) => void;
  selectedPetId?: string | null;
}

// Component to handle map view updates
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, 15);
    }
  }, [center, map]);

  return null;
}

export default function MapViewUI({ map_center, catData, updateMapCenter, selectedPetId }: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  // const [map, setMap] = useState<L.Map | null>(null);
  // const mapRef = useRef<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === "Enter") {
  //     handleSearch();
  //   }
  // };
  const setMarkerAndUpdate = (coords: [number, number] | null) => {
    setMarkerPosition(coords);
    if (coords && typeof updateMapCenter === "function") {
      updateMapCenter(coords);
    }
  };
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const handleLocateMe = () => {
    // if (!map) return;
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords: [number, number] = [latitude, longitude];
        setMarkerAndUpdate(coords);
        // MapController will handle the flyTo based on the updated map_center
      },
      (err) => {
        console.error(err);
        alert("Unable to get your location.");
      }
    );
  };
  // Keep fullscreen state in sync
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // const handleMapClick = (pos: [number, number]) => {
  //   setMarkerAndUpdate(pos);
  // };

  const handleToggleFullscreen = () => {
    const el = mapWrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => {
        console.error("Error attempting fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  // Callback ref to capture the underlying Leaflet map instance
  // const handleMapRef = (m: L.Map | null) => {
  //   mapRef.current = m;
  //   setMap(m);
  // };


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("🗺️ MapView received petData:", catData.length, "pets", catData);
    console.log("Sample pets:", catData.slice(0, 2).map(c => ({ id: c.id, name: c.name, petType: c.petType, status: c.status })));
  }, [catData]);

  // Handle programmatic popup opening
  useEffect(() => {
    if (selectedPetId && markerRefs.current[selectedPetId]) {
      const marker = markerRefs.current[selectedPetId];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 500); // Small delay to ensure map is ready
      }
    }
  }, [selectedPetId, catData]);

  if (typeof window === "undefined" || !mounted) {
    return (
      <div className="h-[90%] w-full mt-2 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  return (
    <div ref={mapWrapperRef} className="relative h-[80%] w-full mt-2 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full shadow-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleLocateMe}
          title="Get my location"
        >
          <Crosshair className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full shadow-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
          onClick={handleToggleFullscreen}
          title="Toggle fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          ) : (
            <Maximize2 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          )}
        </Button>
      </div>

      <MapContainer
        center={map_center}
        zoom={catData.length > 0 ? 13 : 10}
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={true}
      >
        <MapController center={map_center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerPosition && (
          <Marker
            position={markerPosition}
            icon={
              new L.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              })
            }
          >
            <Popup>
              <div className="text-center">
                <p className="font-medium">Your Location</p>
                <p className="text-xs text-gray-500">Approximate position</p>
              </div>
            </Popup>
          </Marker>
        )}

        {catData.map((cat) => (
          <Marker
            key={cat.id}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[cat.id] = ref;
              }
            }}
            position={cat.position}
            icon={
              new L.DivIcon({
                className: 'custom-marker',
                html: (() => {
                  const normalizedStatus = String(cat.status || "").toLowerCase().trim();
                  let borderColor = '#3b82f6'; // blue (adoption)
                  if (normalizedStatus === 'missing') borderColor = '#ef4444'; // red
                  else if (normalizedStatus === 'found') borderColor = '#22c55e'; // green

                  const imgHtml = cat.imageUrl && cat.imageUrl.trim()
                    ? `<img src="${cat.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                    : `<div style="width: 100%; height: 100%; background-color: ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">?</div>`;

                  return `<div style="
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 3px solid ${borderColor};
                    background: white;
                    overflow: hidden;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                  ">${imgHtml}</div>`;
                })(),
                iconSize: [60, 60],
                iconAnchor: [30, 30],
                popupAnchor: [0, -30],
              })
            }
          >
            <Popup className="map-popup" maxWidth={300}>
              <Card className="w-full max-w-sm border-0 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cat.name || `Unknown ${cat.petType === "dog" ? "Dog" : cat.petType === "other" ? "Pet" : "Cat"}`}</CardTitle>
                  <CardDescription>
                    {cat.petType && <span className="capitalize">{cat.petType} • </span>}
                    {cat.status} {cat.daysAgo !== undefined ? `• ${cat.daysAgo} days ago` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-3">
                    {/* Show icon if no image, otherwise show image */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {cat.imageUrl && cat.imageUrl.trim() ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={cat.imageUrl}
                            alt={cat.name || (cat.petType === "dog" ? "Dog" : cat.petType === "other" ? "Pet" : "Cat")}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                      ) : (
                        <PetIcon petType={cat.petType} size={120} />
                      )}
                    </div>
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
                  {(() => {
                    const normalizedStatus = String(cat.status || "").toLowerCase().trim();
                    if (normalizedStatus === "missing") {
                      return (
                        <Button
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                          onClick={() => router.push(`/home?id=${cat.id}`)}
                        >
                          View Details
                        </Button>
                      );
                    } else if (normalizedStatus === "adoption") {
                      return (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => router.push(`/home?id=${cat.id}`)}
                        >
                          Contact for Adoption
                        </Button>
                      );
                    } else {
                      // found
                      return (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/home?id=${cat.id}`)}
                        >
                          Contact Finder
                        </Button>
                      );
                    }
                  })()}
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
                Report a missing or found pet to see it on the map
              </p>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
