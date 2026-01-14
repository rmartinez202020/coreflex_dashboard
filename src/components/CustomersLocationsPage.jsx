import React, { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import AddressPicker from "./AddressPicker";

export default function CustomersLocationsPage({ subPageColor, setActiveSubPage }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
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
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchItems = async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/customer-locations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchItems();
        if (mounted) setItems(data);
      } catch (e) {
        console.error(e);
        if (mounted) setMsg("❌ Could not load customers/locations.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setMsg("");

      const token = getToken();
      if (!token) {
        setMsg("❌ Not logged in.");
        return;
      }

      // Basic validation (forces “real” clicking)
      if (!form.customer_name.trim()) return setMsg("❌ Customer name is required.");
      if (!form.site_name.trim()) return setMsg("❌ Site name is required.");
      if (!form.address.state) return setMsg("❌ Select a state.");
      if (!form.address.city) return setMsg("❌ Select a city.");
      if (!form.address.street.trim()) return setMsg("❌ Street address is required.");
      if (!form.address.zip.trim()) return setMsg("❌ ZIP is required.");

      const payload = {
        customer_name: form.customer_name.trim(),
        site_name: form.site_name.trim(),
        street: form.address.street.trim(),
        city: form.address.city,
        state: form.address.state,
        zip: form.address.zip.trim(),
        country: form.address.country || "United States",
        notes: form.notes?.trim() || null,
        lat: null,
        lng: null,
      };

      const res = await fetch(`${API_URL}/customer-locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      const created = await res.json();
      setItems((prev) => [created, ...prev]);

      setForm({
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
      });

      setMsg("✅ Saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      console.error(e);
      setMsg("❌ Save failed. Check console/network.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* HEADER */}
      <div
        className={`w-full p-4 rounded-lg text-white ${
          subPageColor || "bg-teal-500"
        }`}
      >
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
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            Add Customer / Location
          </h3>

          {msg ? <div className="mb-3 text-sm">{msg}</div> : null}

          <div className="space-y-4">
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

            <button
              onClick={save}
              disabled={saving}
              className={`px-6 py-3 text-white rounded-lg transition ${
                saving ? "bg-teal-300 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {saving ? "Saving..." : "Save Customer/Location"}
            </button>
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            Your Customers / Locations
          </h3>

          {loading ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600">No customers yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((x) => (
                <div key={x.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-semibold text-gray-800">
                    {x.customer_name} — {x.site_name}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {x.street}, {x.city}, {x.state} {x.zip}, {x.country}
                  </div>
                  {x.notes ? (
                    <div className="text-xs text-gray-500 mt-1">{x.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
