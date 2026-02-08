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
        throw new Error(j?.detail || `Failed to load devices`);
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
      return setErr("DEVICE ID must be numeric.");

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
        throw new Error(j?.detail || `Claim failed`);
      }

      setDeviceId("");
      await loadMyDevices();
    } catch (e) {
      setErr(e.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (activeModel === "cf2000") loadMyDevices();
  }, [activeModel]);

  if (activeModel !== "cf2000") return null;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-sky-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModel(null)}
            className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-1.5 text-sm"
          >
            ← Back
          </button>
          <div>
            <div className="text-base font-semibold">
              Register Devices — Model CF-2000
            </div>
            <div className="text-xs text-sky-100">
              Enter a DEVICE ID to claim it.
            </div>
          </div>
        </div>

        <button
          onClick={loadMyDevices}
          className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-1.5 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold mb-1">Add / Claim Device ID</div>
          <div className="flex gap-2">
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Enter DEVICE ID"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              onClick={claimDevice}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm"
            >
              + Add Device
            </button>
          </div>
          {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-[12px]">
              <thead>
                <tr className="bg-blue-200">
                  <th className="px-1 py-[3px] w-[95px] text-left">
                    DEVICE ID
                  </th>
                  <th className="px-1 py-[3px] w-[95px] text-left">
                    Date
                  </th>
                  <th className="px-1 py-[3px] w-[70px] text-left">
                    Status
                  </th>
                  <th className="px-1 py-[3px] w-[85px] text-left border-r border-blue-300">
                    Last Seen
                  </th>

                  {[
                    "DI-1","DI-2","DI-3","DI-4",
                    "DO-1","DO-2","DO-3","DO-4",
                    "AI-1","AI-2","AI-3","AI-4",
                  ].map(k => (
                    <th key={k} className="px-1 py-[3px] w-[44px] text-center">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {!rows.length ? (
                  <tr>
                    <td colSpan={16} className="text-center py-6 text-slate-500">
                      No registered devices yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                      <td className="px-1 py-[3px] truncate">{r.deviceId}</td>
                      <td className="px-1 py-[3px] truncate">{r.addedAt}</td>
                      <td className="px-1 py-[3px] capitalize">{r.status}</td>
                      <td className="px-1 py-[3px] truncate border-r border-slate-200">
                        {r.lastSeen || "—"}
                      </td>

                      {[r.in1,r.in2,r.in3,r.in4,r.do1,r.do2,r.do3,r.do4,r.ai1,r.ai2,r.ai3,r.ai4]
                        .map((v, j) => (
                          <td key={j} className="text-center px-1 py-[3px]">
                            {String(v ?? "")}
                          </td>
                        ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
