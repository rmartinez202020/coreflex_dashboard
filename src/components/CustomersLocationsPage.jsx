import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import AddressPicker from "./AddressPicker";
import LocationsMapModal from "./LocationsMapModal";

// Leaflet (map picker)
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (important for Vite/React builds)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Small helper to format coords nicely
const fmt = (n) => (typeof n === "number" ? n.toFixed(6) : "");

function PinPickerMap({ value, onChange }) {
  // value: { lat: number|null, lng: number|null }
  const start = useMemo(() => {
    // Default center (NJ-ish) if no pin yet
    if (value?.lat != null && value?.lng != null) return [value.lat, value.lng];
    return [40.275, -74.55];
  }, [value?.lat, value?.lng]);

  function ClickToSetMarker() {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  return (
    <div className="w-full h-[480px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={start}
        zoom={value?.lat != null ? 14 : 6}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToSetMarker />
        {value?.lat != null && value?.lng != null ? (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onChange({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}

function PinPickerModal({ open, onClose, value, onConfirm }) {
  const [temp, setTemp] = useState(value || { lat: null, lng: null });

  useEffect(() => {
    if (open) setTemp(value || { lat: null, lng: null });
  }, [open, value]);

  if (!open) return null;

  const hasPin = temp?.lat != null && temp?.lng != null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Pin on map</h4>
            <p className="text-xs text-gray-500 mt-1">
              Click on the map to drop a pin. You can also drag the pin to adjust.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <PinPickerMap value={temp} onChange={setTemp} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            {hasPin ? (
              <span>
                Selected: <span className="font-mono">Lat {fmt(temp.lat)}, Lng {fmt(temp.lng)}</span>
              </span>
            ) : (
              <span className="text-gray-500">No pin selected yet.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTemp({ lat: null, lng: null })}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={() => onConfirm(temp)}
              disabled={!hasPin}
              className={`px-4 py-2 rounded-md text-white ${
                !hasPin ? "bg-gray-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              Use this pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomersLocationsPage({ subPageColor, setActiveSubPage }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // If editingItemId != null => edit mode
  const [editingItemId, setEditingItemId] = useState(null);

  // Map modal (view pins)
  const [showMap, setShowMap] = useState(false);

  // Pin picker modal (set pin for current form)
  const [showPinPicker, setShowPinPicker] = useState(false);

  const emptyForm = useMemo(
    () => ({
      customer_name: "",
      site_name: "",
      notes: "",
      address: {
        country: "United States",
        state: "",
        city: "",
        street: "",
        zip: "",
      },
      // ✅ NEW: optional manual pin coords
      pin: { lat: null, lng: null },
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Delete UX
  const [deletingId, setDeletingId] = useState(null);

  const fetchItems = async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/customer-locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `Failed to fetch (${res.status})`);
    }
    return res.json();
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const data = await fetchItems();
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (mounted) setMsg("❌ Could not load customers/locations. (API not reachable or route missing)");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const startEdit = (x) => {
    setMsg("");
    setEditingItemId(x.id);
    setForm({
      customer_name: x.customer_name || "",
      site_name: x.site_name || "",
      notes: x.notes || "",
      address: {
        country: x.country || "United States",
        state: x.state || "",
        city: x.city || "",
        street: x.street || "",
        zip: x.zip || "",
      },
      // ✅ Load existing coordinates (if any)
      pin: {
        lat: typeof x.lat === "number" ? x.lat : null,
        lng: typeof x.lng === "number" ? x.lng : null,
      },
    });

    // scroll user to the top form area
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setForm(emptyForm);
    setMsg("");
  };

  const validate = () => {
    if (!form.customer_name.trim()) return "❌ Customer name is required.";
    if (!form.site_name.trim()) return "❌ Site name is required.";
    if (!form.address.state) return "❌ Select a state.";
    if (!form.address.city) return "❌ Select a city.";
    if (!form.address.street.trim()) return "❌ Street address is required.";
    if (!form.address.zip.trim()) return "❌ ZIP is required.";
    return null;
  };

  const buildPayload = () => ({
    customer_name: form.customer_name.trim(),
    site_name: form.site_name.trim(),
    street: form.address.street.trim(),
    city: form.address.city,
    state: form.address.state,
    zip: form.address.zip.trim(),
    country: form.address.country || "United States",
    notes: form.notes?.trim() || null,

    // ✅ NEW: send manual pin if chosen
    lat: form.pin?.lat ?? null,
    lng: form.pin?.lng ?? null,
  });

  const save = async () => {
    try {
      setSaving(true);
      setMsg("");

      const token = getToken();
      if (!token) {
        setMsg("❌ Not logged in.");
        return;
      }

      const validationError = validate();
      if (validationError) {
        setMsg(validationError);
        return;
      }

      const payload = buildPayload();

      // CREATE vs UPDATE
      const isEdit = editingItemId != null;
      const url = isEdit
        ? `${API_URL}/customer-locations/${editingItemId}`
        : `${API_URL}/customer-locations`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 404 && isEdit) {
          throw new Error("Update endpoint not found (need PUT /customer-locations/{id} on backend).");
        }
        throw new Error(text || `Save failed (${res.status})`);
      }

      const saved = await res.json();

      if (isEdit) {
        setItems((prev) => prev.map((x) => (x.id === editingItemId ? saved : x)));
        setMsg("✅ Updated!");
      } else {
        setItems((prev) => [saved, ...prev]);
        setMsg("✅ Saved!");
      }

      setTimeout(() => setMsg(""), 2000);
      setEditingItemId(null);
      setForm(emptyForm);
    } catch (e) {
      console.error(e);
      setMsg(`❌ Save failed: ${e.message || "Check console/network."}`);
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (id) => setDeletingId(id);

  const doDelete = async () => {
    const id = deletingId;
    if (!id) return;

    try {
      setMsg("");
      const token = getToken();
      if (!token) {
        setMsg("❌ Not logged in.");
        return;
      }

      const res = await fetch(`${API_URL}/customer-locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        if (res.status === 404) {
          throw new Error("Delete endpoint not found (need DELETE /customer-locations/{id} on backend).");
        }
        throw new Error(text || `Delete failed (${res.status})`);
      }

      setItems((prev) => prev.filter((x) => x.id !== id));

      if (editingItemId === id) cancelEdit();

      setMsg("✅ Deleted!");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      console.error(e);
      setMsg(`❌ Delete failed: ${e.message || "Check console/network."}`);
    } finally {
      setDeletingId(null);
    }
  };

  const hasPin = form.pin?.lat != null && form.pin?.lng != null;

  return (
    <div className="w-full h-full">
      {/* HEADER */}
      <div className={`w-full p-4 rounded-lg text-white ${subPageColor || "bg-teal-500"}`}>
        <button
          onClick={() => setActiveSubPage(null)}
          className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-3 py-1 rounded"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold mt-2">Customers / Locations</h2>
        <p className="text-sm opacity-90 mt-1">
          Add customers and real addresses (state/city dropdown).
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORM */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-gray-800">
              {editingItemId ? "Edit Customer / Location" : "Add Customer / Location"}
            </h3>

            {editingItemId ? (
              <button
                onClick={cancelEdit}
                className="text-sm px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          {msg ? <div className="mt-3 mb-3 text-sm">{msg}</div> : null}

          <div className="space-y-4 mt-3">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Customer Name</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Walmart"
                value={form.customer_name}
                onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-1">Site Name</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="DC Newark"
                value={form.site_name}
                onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
                disabled={saving}
              />
            </div>

            <AddressPicker
              value={form.address}
              onChange={(addr) => setForm((p) => ({ ...p, address: addr }))}
            />

            <div>
              <label className="block text-gray-700 text-sm mb-1">Notes (optional)</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Gate code, contact, etc..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                disabled={saving}
              />
            </div>

            {/* ✅ BUTTON ROW: Save + Pin on Map (yellow area) */}
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className={`px-6 py-3 text-white rounded-lg transition ${
                  saving ? "bg-teal-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {saving ? "Saving..." : editingItemId ? "Update Customer/Location" : "Save Customer/Location"}
              </button>

              <button
                type="button"
                onClick={() => setShowPinPicker(true)}
                disabled={saving}
                className={`px-6 py-3 rounded-lg transition border ${
                  saving
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : hasPin
                    ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                }`}
                title="Drop a pin to set the exact location (lat/lng)"
              >
                📍 {hasPin ? "Pin set" : "Pin on Map"}
              </button>
            </div>

            {/* Show coords when pinned */}
            {hasPin ? (
              <div className="text-xs text-gray-600">
                Pinned: <span className="font-mono">Lat {fmt(form.pin.lat)}, Lng {fmt(form.pin.lng)}</span>
                <button
                  type="button"
                  className="ml-3 underline text-gray-600 hover:text-gray-900"
                  onClick={() => setForm((p) => ({ ...p, pin: { lat: null, lng: null } }))}
                  disabled={saving}
                >
                  clear
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Tip: Use <b>Pin on Map</b> if the address doesn’t geocode correctly.
              </div>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Your Customers / Locations
            </h3>

            <div className="text-xs text-gray-500">
              {items.length}/{items.length}
            </div>
          </div>

          {/* Scrollable list area */}
          <div className="flex-1 min-h-0 overflow-auto pr-1">
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-gray-600">No customers yet.</div>
            ) : (
              <div className="space-y-3">
                {items.map((x) => (
                  <div key={x.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {x.customer_name} — {x.site_name}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {x.street}, {x.city}, {x.state} {x.zip}, {x.country}
                        </div>
                        {x.notes ? (
                          <div className="text-xs text-gray-500 mt-1">{x.notes}</div>
                        ) : null}

                        {/* Small indicator if pinned or missing coords */}
                        <div className="text-xs text-gray-500 mt-1">
                          {typeof x.lat === "number" && typeof x.lng === "number"
                            ? `📍 Pinned (${fmt(x.lat)}, ${fmt(x.lng)})`
                            : x.geocode_status
                            ? `⚠️ No coords (${x.geocode_status})`
                            : "⚠️ No coords"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => startEdit(x)}
                          className="text-sm px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => requestDelete(x.id)}
                          className="text-sm px-3 py-2 rounded-md bg-red-100 hover:bg-red-200 text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom button (view map) */}
          <div className="pt-4">
            <button
              onClick={() => setShowMap(true)}
              disabled={items.length === 0}
              className={`w-full px-5 py-3 rounded-lg text-white transition ${
                items.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              See your locations on the map
            </button>

            <div className="text-xs text-gray-500 mt-2">
              This opens a map with one pin per saved location.
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deletingId != null ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h4 className="text-lg font-semibold text-gray-800">Delete location?</h4>
            <p className="text-sm text-gray-600 mt-2">
              This will permanently remove this customer/location.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PIN PICKER MODAL */}
      <PinPickerModal
        open={showPinPicker}
        onClose={() => setShowPinPicker(false)}
        value={form.pin}
        onConfirm={(pin) => {
          setForm((p) => ({ ...p, pin }));
          setShowPinPicker(false);
        }}
      />

      {/* MAP MODAL (VIEW) */}
      <LocationsMapModal
        open={showMap}
        onClose={() => setShowMap(false)}
        items={items}
      />
    </div>
  );
}
