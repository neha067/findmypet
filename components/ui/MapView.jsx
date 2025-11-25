// src/components/map/MapView.jsx
"use client";
import React from "react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Fix default marker icons (required in many bundlers)
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Example data: you can later fetch this from your backend / Firestore
const catData = [
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
];

const map_center = [12.9716, 77.5946];

export default function MapView({map_center,catData}) {
  return (
    <div className="h-[90%] w-full mt-2 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer
        center={map_center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {catData.map((cat) => (
          <Marker key={cat.id} position={cat.position}>
            <Popup className="">
              <div>
                  <Card className="w-full max-w-sm">
                    <CardHeader>
                      <CardTitle>{cat.name}</CardTitle>
                      <CardDescription>
                          {cat.status}. {cat.daysAgo} days ago
                      </CardDescription>
                      {/* <CardAction>
                        <Button variant="link">Sign Up</Button>
                      </CardAction> */}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <img src="/assets/test1.jpeg" height={200} width={400} alt="img" />
                        </div>
                      <div>
                        <form>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Label htmlFor="email">Color:</Label>
                              <Label>Orange</Label>
                            </div>
                            <div className="flex gap-2">
                              <Label htmlFor="email">Age:</Label>
                              <Label>0-1yr</Label>
                            </div>
                          </div>
                        </form>
                      </div>
                       </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                      {cat.status === 'Missing' ? <Button type="submit" className="w-full">
                        Report Found
                      </Button> :
                      <Button variant="outline" className="w-full">
                        Request Adoption
                      </Button>}
                    </CardFooter>
                  </Card>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
