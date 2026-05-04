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

const fmt = (n) => (typeof n === "number" ? n.toFixed(6) : "");

function PinPickerMap({ value, onChange }) {
  const start = useMemo(() => {
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
    <div className="w-full h-[360px] rounded-lg overflow-hidden border border-gray-200">
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-gray-800">
              Pin on map
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Click on the map to drop a pin. You can also drag the pin to
              adjust.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="mt-3">
          <PinPickerMap value={temp} onChange={setTemp} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-700">
            {hasPin ? (
              <span>
                Selected:{" "}
                <span className="font-mono">
                  Lat {fmt(temp.lat)}, Lng {fmt(temp.lng)}
                </span>
              </span>
            ) : (
              <span className="text-gray-500">No pin selected yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTemp({ lat: null, lng: null })}
              className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={() => onConfirm(temp)}
              disabled={!hasPin}
              className={`px-3 py-1.5 text-sm rounded-md text-white ${
                !hasPin
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700"
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

export default function CustomersLocationsPage({
  subPageColor,
  setActiveSubPage,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState(null);
  const [showMap, setShowMap] = useState(false);
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
      pin: { lat: null, lng: null },
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
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
        if (mounted) {
          setMsg(
            "❌ Could not load customers/locations. (API not reachable or route missing)"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
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
      pin: {
        lat: typeof x.lat === "number" ? x.lat : null,
        lng: typeof x.lng === "number" ? x.lng : null,
      },
    });

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
          throw new Error(
            "Update endpoint not found (need PUT /customer-locations/{id} on backend)."
          );
        }
        throw new Error(text || `Save failed (${res.status})`);
      }

      const saved = await res.json();

      if (isEdit) {
        setItems((prev) =>
          prev.map((x) => (x.id === editingItemId ? saved : x))
        );
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
          throw new Error(
            "Delete endpoint not found (need DELETE /customer-locations/{id} on backend)."
          );
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
      <div className="w-full">
        {/* HEADER */}
        <div
          className={`w-full p-3 rounded-lg text-white ${
            subPageColor || "bg-teal-500"
          }`}
        >
          <button
            onClick={() => setActiveSubPage(null)}
            className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-2.5 py-1 rounded text-sm"
          >
            ← Back
          </button>

          <h2 className="text-xl font-bold mt-1">Customers / Locations</h2>
          <p className="text-xs opacity-90 mt-1">
            Add customers and real addresses (state/city dropdown).
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4 items-stretch">
          {/* FORM */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingItemId
                  ? "Edit Customer / Location"
                  : "Add Customer / Location"}
              </h3>

              {editingItemId ? (
                <button
                  onClick={cancelEdit}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            {msg ? <div className="mt-2 mb-2 text-xs">{msg}</div> : null}

            <div className="space-y-2.5 mt-2 text-sm">
              <div>
                <label className="block text-gray-700 text-xs mb-1">
                  Customer Name
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  placeholder="Walmart"
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customer_name: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs mb-1">
                  Site Name
                </label>
                <input
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  placeholder="DC Newark"
                  value={form.site_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, site_name: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="[&_label]:text-xs [&_label]:mb-1 [&_select]:py-1.5 [&_select]:px-2 [&_select]:text-sm [&_input]:py-1.5 [&_input]:px-2 [&_input]:text-sm">
                <AddressPicker
                  value={form.address}
                  onChange={(addr) =>
                    setForm((p) => ({ ...p, address: addr }))
                  }
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm min-h-[54px]"
                  placeholder="Gate code, contact, etc..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className={`px-4 py-2 text-sm text-white rounded-md transition ${
                    saving
                      ? "bg-teal-300 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : editingItemId
                    ? "Update"
                    : "Save Customer/Location"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPinPicker(true)}
                  disabled={saving}
                  className={`px-4 py-2 text-sm rounded-md transition border ${
                    saving
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : hasPin
                      ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
                  }`}
                  title="Drop a pin to set the exact location (lat/lng)"
                >
                  📍 {hasPin ? "Pin set" : "Pin"}
                </button>
              </div>

              {hasPin ? (
                <div className="text-xs text-gray-600">
                  Pinned:{" "}
                  <span className="font-mono">
                    Lat {fmt(form.pin.lat)}, Lng {fmt(form.pin.lng)}
                  </span>
                  <button
                    type="button"
                    className="ml-3 underline text-gray-600 hover:text-gray-900"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        pin: { lat: null, lng: null },
                      }))
                    }
                    disabled={saving}
                  >
                    clear
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Tip: Use <b>Pin</b> if the address doesn’t geocode correctly.
                </div>
              )}
            </div>
          </div>

          {/* LIST */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col h-full min-h-full">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Customers / Locations
              </h3>

              <div className="text-xs text-gray-500">
                {items.length}/{items.length}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto pr-1 mt-3">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-gray-600">No customers yet.</div>
              ) : (
                <div className="space-y-2">
                  {items.map((x) => (
                    <div
                      key={x.id}
                      className="border border-gray-200 rounded-lg p-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-gray-800 truncate">
                            {x.customer_name} — {x.site_name}
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {x.street}, {x.city}, {x.state} {x.zip},{" "}
                            {x.country}
                          </div>
                          {x.notes ? (
                            <div className="text-xs text-gray-500 mt-1">
                              {x.notes}
                            </div>
                          ) : null}

                          <div className="text-xs text-gray-500 mt-1">
                            {typeof x.lat === "number" &&
                            typeof x.lng === "number"
                              ? `📍 Pinned (${fmt(x.lat)}, ${fmt(x.lng)})`
                              : x.geocode_status
                              ? `⚠️ No coords (${x.geocode_status})`
                              : "⚠️ No coords"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => startEdit(x)}
                            className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => requestDelete(x.id)}
                            className="text-xs px-2.5 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700"
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

            <div className="pt-3">
              <button
                onClick={() => setShowMap(true)}
                disabled={items.length === 0}
                className={`w-full px-4 py-2 text-sm rounded-md text-white transition ${
                  items.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                See your locations on the map
              </button>

              <div className="text-xs text-gray-500 mt-1.5">
                This opens a map with one pin per saved location.
              </div>
            </div>
          </div>
        </div>

        {/* DELETE CONFIRM MODAL */}
        {deletingId != null ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
              <h4 className="text-lg font-semibold text-gray-800">
                Delete location?
              </h4>
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

        <PinPickerModal
          open={showPinPicker}
          onClose={() => setShowPinPicker(false)}
          value={form.pin}
          onConfirm={(pin) => {
            setForm((p) => ({ ...p, pin }));
            setShowPinPicker(false);
          }}
        />

        <LocationsMapModal
          open={showMap}
          onClose={() => setShowMap(false)}
          items={items}
        />
      </div>
    </div>
  );
}