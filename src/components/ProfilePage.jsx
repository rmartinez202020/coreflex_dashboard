import React, { useEffect, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function ProfilePage({ subPageColor, setActiveSubPage }) {
  const [form, setForm] = useState({
    full_name: "",
    role_position: "",
    email: "",
    company: "",
    company_address: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // =========================
  // Load profile on mount
  // =========================
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const token = getToken();
        if (!token) {
          setMsg("❌ Not logged in.");
          return;
        }

        const res = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`GET /profile failed (${res.status}): ${text}`);
        }

        const data = await res.json();

        if (!mounted) return;

        setForm({
          full_name: data?.full_name ?? "",
          role_position: data?.role_position ?? "",
          email: data?.email ?? "",
          company: data?.company ?? "",
          company_address: data?.company_address ?? "",
        });
      } catch (err) {
        console.error(err);
        if (mounted) setMsg("❌ Could not load profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // Save profile
  // =========================
  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg("");

      const token = getToken();
      if (!token) {
        setMsg("❌ Not logged in.");
        return;
      }

      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name || null,
          role_position: form.role_position || null,
          email: form.email || null,
          company: form.company || null,
          company_address: form.company_address || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PUT /profile failed (${res.status}): ${text}`);
      }

      const saved = await res.json();

      // re-sync form with server response
      setForm({
        full_name: saved?.full_name ?? "",
        role_position: saved?.role_position ?? "",
        email: saved?.email ?? "",
        company: saved?.company ?? "",
        company_address: saved?.company_address ?? "",
      });

      setMsg("✅ Saved!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setMsg("❌ Save failed. Check console/network.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* PROFILE HEADER */}
      <div
        className={`w-full p-4 rounded-lg text-white ${
          subPageColor || "bg-blue-600"
        }`}
      >
        <button
          onClick={() => {
            setActiveSubPage(null);
          }}
          className="bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-3 py-1 rounded"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold mt-2">Profile</h2>
      </div>

      {/* PROFILE CONTENT */}
      <div className="mt-4 bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Profile Information
        </h3>

        <p className="text-gray-600 text-sm mb-4">
          Here you can edit your CoreFlex user information.
        </p>

        {/* Status */}
        {loading ? (
          <div className="mb-4 text-sm text-gray-600">Loading profile...</div>
        ) : null}

        {msg ? (
          <div className="mb-4 text-sm">{msg}</div>
        ) : null}

        <div className="space-y-4">
          {/* FULL NAME */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Full Name
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="John Doe"
              value={form.full_name}
              onChange={setField("full_name")}
              disabled={loading || saving}
            />
          </div>

          {/* ROLE / POSITION */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Role / Position
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Engineer, Integrator, Technician..."
              value={form.role_position}
              onChange={setField("role_position")}
              disabled={loading || saving}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Email
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="email@example.com"
              value={form.email}
              onChange={setField("email")}
              disabled={loading || saving}
            />
          </div>

          {/* COMPANY */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Company
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Company"
              value={form.company}
              onChange={setField("company")}
              disabled={loading || saving}
            />
          </div>

          {/* COMPANY ADDRESS */}
          <div>
            <label className="block text-gray-700 text-sm mb-1">
              Company Address
            </label>
            <input
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="123 Industrial Ave, OH....."
              value={form.company_address}
              onChange={setField("company_address")}
              disabled={loading || saving}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || saving}
          className={`mt-6 px-6 py-3 text-white rounded-lg transition ${
            loading || saving
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
