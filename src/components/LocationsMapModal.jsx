import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons in Vite/React builds
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ------------------------------------------------------------
// ✅ Backend-first map modal:
// - NO browser geocoding (no Nominatim, no localStorage cache)
// - Uses items[].lat/items[].lng from DB
// - Fits bounds to all markers automatically
// - Safe guards if items is not an array (fixes ".map is not a function")
// ------------------------------------------------------------

function buildAddressString(x) {
  const parts = [
    x.street,
    x.city,
    x.state,
    x.zip,
    x.country || "United States",
  ].filter(Boolean);
  return parts.join(", ");
}

function toNumberOrNull(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}

function FitBounds({ bounds, padding = [24, 24] }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(bounds, { padding });
    } catch {
      // ignore
    }
  }, [bounds, map, padding]);
  return null;
}

export default function LocationsMapModal({ open, onClose, items }) {
  const [loading, setLoading] = useState(false);

  // ✅ Prevent the ".map is not a function" crash:
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // ✅ Markers come directly from DB coords:
  const markers = useMemo(() => {
    const m = [];
    for (const x of safeItems) {
      const lat = toNumberOrNull(x.lat);
      const lng = toNumberOrNull(x.lng);
      if (lat != null && lng != null) {
        m.push({ id: x.id, lat, lng, item: x });
      }
    }
    return m;
  }, [safeItems]);

  const missingCount = useMemo(() => {
    if (!safeItems.length) return 0;
    return safeItems.reduce((acc, x) => {
      const lat = toNumberOrNull(x.lat);
      const lng = toNumberOrNull(x.lng);
      return acc + (lat == null || lng == null ? 1 : 0);
    }, 0);
  }, [safeItems]);

  // Default center if no markers
  const fallbackCenter = [39.5, -98.35]; // USA-ish center

  // Bounds for fitting all points
  const bounds = useMemo(() => {
    if (!markers.length) return null;
    const latLngs = markers.map((m) => [m.lat, m.lng]);
    return L.latLngBounds(latLngs);
  }, [markers]);

  // When opening: show quick "loading" for UX consistency
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40 p-4"
      onMouseDown={(e) => {
        // click outside to close (optional). If you don't want this, remove this block.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* ✅ BIGGER + TALLER MODAL */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="text-lg font-semibold text-gray-800">
              Customer Locations Map
            </div>
            <div className="text-xs text-gray-500">
              Pins come from saved coordinates (lat/lng) in your database.
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {markers.length}
              </span>{" "}
              pin(s) out of{" "}
              <span className="font-semibold text-gray-800">
                {safeItems.length}
              </span>{" "}
              location(s)
            </div>

            <div className="flex items-center gap-2">
              {missingCount > 0 ? (
                <div className="text-xs px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200">
                  {missingCount} location(s) missing coordinates yet (they will
                  appear once backend geocoding runs)
                </div>
              ) : null}

              {loading ? (
                <div className="text-sm text-gray-600">Loading map…</div>
              ) : null}
            </div>
          </div>

          {/* ✅ Map fills remaining modal height */}
          <div className="flex-1 w-full rounded-lg overflow-hidden border border-gray-200 min-h-0">
            <MapContainer
              center={markers.length ? [markers[0].lat, markers[0].lng] : fallbackCenter}
              zoom={markers.length ? 10 : 4}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* ✅ Fit map to all markers */}
              {bounds ? <FitBounds bounds={bounds} /> : null}

              {markers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {m.item.customer_name} — {m.item.site_name}
                      </div>
                      <div className="mt-1 text-gray-700">
                        {buildAddressString(m.item)}
                      </div>
                      {m.item.notes ? (
                        <div className="mt-2 text-xs text-gray-500">
                          {m.item.notes}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-gray-500">
                        Lat: {m.lat.toFixed(6)} • Lng: {m.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Friendly empty state */}
              {safeItems.length > 0 && markers.length === 0 ? (
                <div className="leaflet-bottom leaflet-left">
                  <div className="m-3 p-2 rounded-md bg-white/90 border border-gray-200 text-xs text-gray-700 shadow">
                    No pins yet. This usually means the locations don&apos;t have
                    lat/lng saved in the DB yet. Once you create new locations
                    (or run backend geocoding for existing ones), pins will
                    appear here.
                  </div>
                </div>
              ) : null}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
