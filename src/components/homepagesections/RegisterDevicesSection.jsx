import React from "react";
import { API_URL } from "../../config/api";

// Auth headers
function getAuthHeaders() {
  const token =
    localStorage.getItem("coreflex_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Date formatter: 01/01/2025-8:15AM
function formatDateMMDDYYYY_hmma(ts) {
  if (!ts) return "—";

  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts); // if backend sends a non-ISO string

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  const min = String(d.getMinutes()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}-${h}:${min}${ampm}`;
}

const MODELS = [
  { key: "cf2000", label: "Model CF-2000", desc: "ZHC1921 devices" },
  { key: "cf1600", label: "Model CF-1600", desc: "ZHC1661 devices (next)" },
  { key: "tp400", label: "Model TP-400", desc: "TP-4000 devices (next)" },
];

export default function RegisterDevicesSection({ onBack }) {
  const [activeModel, setActiveModel] = React.useState(null);

  const [deviceId, setDeviceId] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function loadMyDevices() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Failed to load devices (${res.status})`);
      }

      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  async function claimDevice() {
    const id = String(deviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_URL}/zhc1921/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ device_id: id }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Claim failed (${res.status})`);
      }

      setDeviceId("");
      await loadMyDevices();
    } catch (e) {
      setErr(e.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  // ✅ delete device (UI + confirm). Backend endpoint may differ; adjust if needed.
  async function deleteDevice(row) {
    const id = String(row?.deviceId || "").trim();
    if (!id) return;

    const ok = window.confirm(
      `Delete device ${id}?\n\nThis action cannot be undone. All dashboards, tags, and configuration related to this device will be permanently removed.`
    );
    if (!ok) return;

    setLoading(true);
    setErr("");
    try {
      // IMPORTANT: update endpoint if your backend uses a different route
      const res = await fetch(
        `${API_URL}/zhc1921/devices/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Delete failed (${res.status})`);
      }

      await loadMyDevices();
    } catch (e) {
      setErr(e.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (activeModel === "cf2000") loadMyDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel]);

  // =========================
  // VIEW A: MODEL SELECTION
  // =========================
  if (!activeModel) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-sky-800 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
            >
              ← Back
            </button>
            <div>
              <div className="text-lg font-semibold">Register Devices</div>
              <div className="text-xs text-sky-100">
                Select your device model to register/claim a device.
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className="w-full rounded-xl px-5 py-4 text-left transition shadow-sm border bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            >
              <div className="text-lg font-semibold">{m.label}</div>
              <div className="text-sm text-slate-600">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================
  // VIEW B: CF-2000
  // =========================
  if (activeModel === "cf2000") {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-sky-800 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModel(null)}
              className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
            >
              ← Back
            </button>
            <div>
              <div className="text-lg font-semibold">
                Register Devices — Model CF-2000
              </div>
              <div className="text-xs text-sky-100">
                Enter a DEVICE ID. We verify it exists and assign it to your
                account.
              </div>
            </div>
          </div>

          <button
            onClick={loadMyDevices}
            className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Add / Claim Device ID</div>

            <div className="flex gap-3">
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter DEVICE ID"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button
                onClick={claimDevice}
                disabled={loading}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
              >
                + Add Device
              </button>
            </div>

            {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              {/* ✅ tighter overall table: narrower widths + tighter padding + tighter numeric columns */}
              <table className="w-full table-fixed text-[12px]">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="px-[6px] py-[3px] w-[110px] text-left font-bold text-slate-900">
                      DEVICE ID
                    </th>

                    {/* Date/LastSeen: keep compact but readable */}
                    <th className="px-[6px] py-[3px] w-[135px] text-left font-bold text-slate-900">
                      Date
                    </th>

                    <th className="px-[6px] py-[3px] w-[72px] text-left font-bold text-slate-900">
                      Status
                    </th>

                    <th className="px-[6px] py-[3px] w-[135px] text-left font-bold text-slate-900 border-r border-blue-300">
                      Last Seen
                    </th>

                    {[
                      "DI-1",
                      "DI-2",
                      "DI-3",
                      "DI-4",
                      "DO-1",
                      "DO-2",
                      "DO-3",
                      "DO-4",
                      "AI-1",
                      "AI-2",
                      "AI-3",
                      "AI-4",
                    ].map((k) => (
                      <th
                        key={k}
                        className="px-[4px] py-[3px] w-[34px] text-center font-bold text-slate-900"
                      >
                        {k}
                      </th>
                    ))}

                    {/* ✅ Delete column */}
                    <th className="px-[6px] py-[3px] w-[92px] text-right font-bold text-slate-900">
                      {/* blank header is ok, but keeping label helps */}
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="text-center py-6 text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td colSpan={17} className="text-center py-6 text-slate-500">
                        No registered devices yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={i} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                        <td className="px-[6px] py-[3px] truncate text-slate-800">
                          {r.deviceId}
                        </td>

                        <td
                          className="px-[6px] py-[3px] truncate text-slate-800"
                          title={r.addedAt || ""}
                        >
                          {formatDateMMDDYYYY_hmma(r.addedAt)}
                        </td>

                        <td className="px-[6px] py-[3px] capitalize text-slate-800">
                          {r.status}
                        </td>

                        <td
                          className="px-[6px] py-[3px] truncate text-slate-800 border-r border-slate-200"
                          title={r.lastSeen || ""}
                        >
                          {formatDateMMDDYYYY_hmma(r.lastSeen)}
                        </td>

                        {[
                          r.in1,
                          r.in2,
                          r.in3,
                          r.in4,
                          r.do1,
                          r.do2,
                          r.do3,
                          r.do4,
                          r.ai1,
                          r.ai2,
                          r.ai3,
                          r.ai4,
                        ].map((v, j) => (
                          <td
                            key={j}
                            className="text-center px-[4px] py-[3px] text-slate-800"
                          >
                            {String(v ?? "")}
                          </td>
                        ))}

                        {/* ✅ Delete button styled like Admin Dashboard delete */}
                        <td className="px-[6px] py-[3px] text-right">
                          <button
                            onClick={() => deleteDevice(r)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            title="Delete device"
                          >
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Optional small footer tip */}
            <div className="px-3 py-2 text-[11px] text-slate-500">
              Tip: You can scroll horizontally inside this table.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // VIEW B: placeholders
  // =========================
  const modelLabel = MODELS.find((m) => m.key === activeModel)?.label || "Model";
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-sky-800 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModel(null)}
            className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
          >
            ← Back
          </button>
          <div>
            <div className="text-lg font-semibold">
              Register Devices — {modelLabel}
            </div>
            <div className="text-xs text-sky-100">Coming next.</div>
          </div>
        </div>
      </div>

      <div className="p-4 text-sm text-slate-700">
        Next: we’ll add backend + claim flow for this model.
      </div>
    </div>
  );
}
