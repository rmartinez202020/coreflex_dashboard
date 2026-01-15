import React, { useMemo } from "react";
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

// ✅ Fit map to all markers whenever markers change
function FitBounds({ markers }) {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;

    if (!markers || markers.length === 0) return;

    const bounds = L.latLngBounds(
      markers.map((m) => [m.lat, m.lng])
    );

    // Add padding so pins aren't touching the edges
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, markers]);

  return null;
}

export default function LocationsMapModal({ open, onClose, items }) {
  const safeItems = Array.isArray(items) ? items : [];

  // ✅ Markers come straight from DB coords now
  const markers = useMemo(() => {
    return safeItems
      .filter(
        (x) =>
          x?.lat != null &&
          x?.lng != null &&
          !Number.isNaN(Number(x.lat)) &&
          !Number.isNaN(Number(x.lng))
      )
      .map((x) => ({
        id: x.id,
        lat: Number(x.lat),
        lng: Number(x.lng),
        item: x,
      }));
  }, [safeItems]);

  const total = safeItems.length;
  const pinned = markers.length;
  const missing = Math.max(0, total - pinned);

  const fallbackCenter = useMemo(() => {
    // If we have at least 1 marker, center on first; else USA
    if (markers.length > 0) return [markers[0].lat, markers[0].lng];
    return [39.5, -98.35]; // USA center-ish
  }, [markers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40 p-4">
      {/* ✅ BIGGER + TALLER MODAL */}
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] h-[92vh] overflow-hidden flex flex-col">
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
          {/* Stats row */}
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-800">{pinned}</span>{" "}
              pin(s) out of{" "}
              <span className="font-semibold text-gray-800">{total}</span>{" "}
              location(s)
            </div>

            {missing > 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
                {missing} location(s) missing coordinates yet. (They will appear
                once backend geocoding runs.)
              </div>
            ) : (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md">
                All locations have pins ✅
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 w-full rounded-lg overflow-hidden border border-gray-200 min-h-0">
            <MapContainer
              center={fallbackCenter}
              zoom={markers.length > 0 ? 8 : 4}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* ✅ Auto fit to markers */}
              <FitBounds markers={markers} />

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
                      <div className="mt-2 text-[11px] text-gray-400">
                        lat: {m.lat}, lng: {m.lng}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Helpful empty state */}
              {markers.length === 0 ? (
                <></>
              ) : null}
            </MapContainer>
          </div>

          {markers.length === 0 ? (
            <div className="mt-3 text-sm text-gray-600">
              No pins yet. This usually means the locations don’t have lat/lng
              saved in the DB yet. Once you create new locations (or run backend
              geocoding for existing ones), pins will appear here.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
