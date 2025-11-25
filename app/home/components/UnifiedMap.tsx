import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix default icon issue (markers not showing in many bundlers)
// TS types for leaflet don't include the internal `_getIconUrl` property.
// Cast the prototype to `any` so TypeScript is happy but runtime behavior stays the same.
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const UnifiedMap =  () => {
  // Center somewhere (lat, lng) – example: Delhi
  // Provide an explicit tuple type so react-leaflet's LatLngTuple is satisfied.
  const center: [number, number] = [28.6139, 77.209];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl h-[70vh] rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-800">
        <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <h1 className="text-slate-100 font-semibold text-lg">
            Leaflet Map in React + Tailwind
          </h1>
          <span className="text-xs text-slate-400">
            Center: {center[0].toFixed(2)}, {center[1].toFixed(2)}
          </span>
        </div>

        {/* Map area */}
        <div className="w-full h-full">
          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={center}>
              <Popup>
                You are looking at <b>Delhi</b> (example marker).
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default UnifiedMap;
