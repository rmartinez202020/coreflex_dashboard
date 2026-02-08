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

  React.useEffect(() => {
    if (activeModel === "cf2000") loadMyDevices();
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
            <div className="text-sm font-semibold mb-2">
              Add / Claim Device ID
            </div>

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
              <table className="w-full table-fixed text-[12px]">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="px-2 py-1.5 w-[160px]">DEVICE ID</th>
                    <th className="px-2 py-1.5 w-[140px]">Date</th>
                    <th className="px-2 py-1.5 w-[110px]">Status</th>
                    <th className="px-2 py-1.5 w-[140px]">Last Seen</th>
                    {["DI-1","DI-2","DI-3","DI-4","DO-1","DO-2","DO-3","DO-4","AI-1","AI-2","AI-3","AI-4"].map(k=>(
                      <th key={k} className="px-1 py-1.5 w-[58px] text-center">{k}</th>
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
                        <td className="px-2 py-1.5 truncate">{r.deviceId}</td>
                        <td className="px-2 py-1.5 truncate">{r.addedAt}</td>
                        <td className="px-2 py-1.5 capitalize">{r.status}</td>
                        <td className="px-2 py-1.5 truncate">{r.lastSeen}</td>
                        {[r.in1,r.in2,r.in3,r.in4,r.do1,r.do2,r.do3,r.do4,r.ai1,r.ai2,r.ai3,r.ai4].map((v,j)=>(
                          <td key={j} className="text-center px-1 py-1.5">{String(v ?? "")}</td>
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

  return null;
}
