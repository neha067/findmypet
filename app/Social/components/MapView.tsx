"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLngTuple } from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Crosshair, Maximize2, Minimize2, MapPin } from "lucide-react";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

const map_center: LatLngTuple = [12.9716, 77.5946];

interface MapViewProps {
  map_center: [number, number];
  updateMapCenter : any
}

// Component to handle marker dragging
function DraggableMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        setPosition([pos.lat, pos.lng]);
      }
    },
  };

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
      ref={markerRef}
      icon={
        new L.Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })
      }
    >
      <Popup>
        <div className="text-sm">
          <strong>Location Pin</strong>
          <br />
          Drag to adjust position
          <br />
          {/* Lat: {position[0].toFixed(6)}
          <br />
          Lng: {position[1].toFixed(6)} */}
        </div>
      </Popup>
    </Marker>
  );
}

// Component to handle map clicks
function MapClickHandler({ 
  onMapClick 
}: { 
  onMapClick: (pos: [number, number]) => void 
}) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function MapView({ map_center,updateMapCenter }: MapViewProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  // helper to update marker position and notify parent form
  const setMarkerAndUpdate = (coords: [number, number] | null) => {
    setMarkerPosition(coords);
    if (coords && typeof updateMapCenter === "function") {
      updateMapCenter(coords);
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep fullscreen state in sync
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!map || !searchQuery.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );

      const data = await res.json();

        if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const coords: [number, number] = [lat, lon];
        setMarkerAndUpdate(coords);
        map.flyTo(coords, 15);
        setShowSuggestions(false);
      } else {
        alert("No results found for that location.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
      alert("Error searching location. Try again.");
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (!map) return;
  const lat = parseFloat(suggestion.lat);
  const lon = parseFloat(suggestion.lon);
  const coords: [number, number] = [lat, lon];
  setMarkerAndUpdate(coords);
  setSearchQuery(suggestion.display_name);
  setShowSuggestions(false);
  map.flyTo(coords, 15);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLocateMe = () => {
    if (!map) return;
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
  const { latitude, longitude } = pos.coords;
  const coords: [number, number] = [latitude, longitude];
  setMarkerAndUpdate(coords);
  map.flyTo(coords, 15);
      },
      (err) => {
        console.error(err);
        alert("Unable to get your location.");
      }
    );
  };

  const handleMapClick = (pos: [number, number]) => {
    setMarkerAndUpdate(pos);
  };

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
  const handleMapRef = (m: L.Map | null) => {
    mapRef.current = m;
    setMap(m);
  };

  return (
    <div ref={mapWrapperRef} className="relative h-[400px] w-full">
      {/* Top overlay controls */}
      <div className="pointer-events-none p-3 w-[70%] absolute inset-x-0 top-4 z-[1000] flex justify-center">
        <div className="pointer-events-auto relative flex w-full max-w-xl flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-md backdrop-blur dark:bg-slate-900/90">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search location (area, city, landmark...)"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {/* <Button type="button" size="sm" onClick={handleSearch}>
              Go
            </Button> */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleLocateMe}
              title="Get my location"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl bg-white/95 shadow-lg backdrop-blur dark:bg-slate-900/95">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="cursor-pointer border-b border-slate-200 px-4 py-3 text-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {suggestion.display_name.split(",")[0]}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {suggestion.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info banner */}
      {/* {markerPosition && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2">
          <div className="pointer-events-auto rounded-lg bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
            <MapPin className="mr-2 inline h-4 w-4" />
          </div>
        </div>
      )} */}

      {/* Map */}
      <MapContainer
        center={map_center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={handleMapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map click handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Single draggable marker */}
        <DraggableMarker 
          position={markerPosition} 
          setPosition={(pos) => setMarkerAndUpdate(pos)}
        />
      </MapContainer>
    </div>
  );
}