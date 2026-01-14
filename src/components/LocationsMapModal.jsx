import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

const CACHE_KEY = "coreflex_geocode_cache_v1";

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

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

async function geocodeNominatim(q) {
  // Nominatim usage: keep it gentle (no spam), cache results
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    q
  )}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim likes having a referrer; browser will set it
    },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
  };
}

export default function LocationsMapModal({ open, onClose, items }) {
  const [loading, setLoading] = useState(false);
  const [coordsById, setCoordsById] = useState({}); // { [id]: {lat,lng} }
  const [error, setError] = useState("");

  const markers = useMemo(() => {
    const m = [];
    for (const x of items || []) {
      const c = coordsById[x.id];
      if (c?.lat != null && c?.lng != null) {
        m.push({ id: x.id, lat: c.lat, lng: c.lng, item: x });
      }
    }
    return m;
  }, [items, coordsById]);

  const center = useMemo(() => {
    // If we have markers, center on first marker; else center US
    if (markers.length > 0) return [markers[0].lat, markers[0].lng];
    return [39.5, -98.35]; // USA center-ish
  }, [markers]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      setError("");
      setLoading(true);

      const cache = loadCache();
      const nextCoords = {};

      // Pre-fill from cache
      for (const x of items || []) {
        const addr = buildAddressString(x);
        const cached = cache[addr];
        if (cached?.lat != null && cached?.lng != null) {
          nextCoords[x.id] = cached;
        }
      }

      if (!cancelled) setCoordsById((prev) => ({ ...prev, ...nextCoords }));

      // Now geocode missing ones (sequential + small delay)
      const toGeocode = (items || []).filter((x) => {
        const addr = buildAddressString(x);
        const cached = cache[addr];
        return !(cached?.lat != null && cached?.lng != null);
      });

      for (const x of toGeocode) {
        if (cancelled) break;

        const addr = buildAddressString(x);

        try {
          const coords = await geocodeNominatim(addr);

          if (coords?.lat != null && coords?.lng != null) {
            cache[addr] = coords;
            saveCache(cache);

            if (!cancelled) {
              setCoordsById((prev) => ({
                ...prev,
                [x.id]: coords,
              }));
            }
          }
        } catch {
          // ignore per item
        }

        // gentle delay (avoid rate-limits)
        await new Promise((r) => setTimeout(r, 450));
      }

      if (!cancelled) {
        // If none resolved, show hint
        const count = Object.keys(loadCache()).length;
        if ((items || []).length > 0 && markers.length === 0 && count === 0) {
          setError("Could not geocode addresses. Try again in a moment.");
        }
        setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <div className="text-lg font-semibold text-gray-800">
              Customer Locations Map
            </div>
            <div className="text-xs text-gray-500">
              Pins are generated from your saved addresses.
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
        <div className="p-5">
          {error ? (
            <div className="text-sm text-red-600 mb-3">{error}</div>
          ) : null}

          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {markers.length}
              </span>{" "}
              pin(s) out of{" "}
              <span className="font-semibold text-gray-800">
                {(items || []).length}
              </span>{" "}
              location(s)
            </div>

            {loading ? (
              <div className="text-sm text-gray-600">Loading map pins…</div>
            ) : null}
          </div>

          <div className="w-full h-[520px] rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={center}
              zoom={markers.length > 0 ? 10 : 4}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

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
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
