import React from "react";
import { API_URL } from "../../config/api";

// If you already have a token helper, you can swap this.
// This works with your current pattern: Authorization: Bearer <token>
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

  // CF-2000 states
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
    if (!/^\d+$/.test(id)) return setErr("DEVICE ID must be numeric (digits only).");

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

  // When user enters CF-2000 view, load devices
  React.useEffect(() => {
    if (activeModel === "cf2000") loadMyDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel]);

  // =========================
  // VIEW A: MODEL BUTTONS
  // =========================
  if (!activeModel) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-slate-900">Register Devices</div>
            <div className="text-sm text-slate-600">
              Select your device model to register/claim a device.
            </div>
          </div>

          <button
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            ✕ Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  // VIEW B: CF-2000 (ZHC1921)
  // =========================
  if (activeModel === "cf2000") {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveModel(null);
                setErr("");
              }}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
            >
              ← Back
            </button>
            <div>
              <div className="text-lg font-semibold">Register Devices — Model CF-2000</div>
              <div className="text-xs text-slate-200">
                Enter a DEVICE ID. We verify it exists and assign it to your account.
              </div>
            </div>
          </div>

          <button
            onClick={loadMyDevices}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Add / Claim Device ID
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Enter DEVICE ID (example: 1921251024070670)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />

              <button
                onClick={claimDevice}
                disabled={loading}
                className="md:w-[180px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                + Add Device
              </button>
            </div>

            {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed text-[12px]">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[160px]">
                      DEVICE ID
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[140px]">
                      Date
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[180px]">
                      User
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[110px]">
                      Status
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[140px]">
                      last seen
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DI-1
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DI-2
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DI-3
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DI-4
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DO 1
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DO 2
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DO 3
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[58px]">
                      DO 4
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[70px]">
                      AI-1
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[70px]">
                      AI-2
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[70px]">
                      AI-3
                    </th>
                    <th className="text-center font-bold text-slate-900 px-1 py-1.5 border-b border-blue-300 w-[70px]">
                      AI-4
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={17} className="px-3 py-6 text-center text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : !rows || rows.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="px-3 py-6 text-center text-slate-500">
                        No registered devices yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => {
                      const statusLower = String(r?.status || "").toLowerCase();
                      const dotClass =
                        statusLower === "online" ? "bg-emerald-500" : "bg-slate-400";

                      return (
                        <tr
                          key={(r?.deviceId || "row") + idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 truncate">
                            {r?.deviceId ?? ""}
                          </td>

                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 truncate">
                            {r?.addedAt ?? "—"}
                          </td>

                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 truncate">
                            {r?.ownedBy ?? "—"}
                          </td>

                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
                              <span className="capitalize">{r?.status || "offline"}</span>
                            </div>
                          </td>

                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 truncate">
                            {r?.lastSeen ?? "—"}
                          </td>

                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.in1 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.in2 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.in3 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.in4 ?? "")}
                          </td>

                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.do1 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.do2 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.do3 ?? "")}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center">
                            {String(r?.do4 ?? "")}
                          </td>

                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center truncate">
                            {r?.ai1 ?? ""}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center truncate">
                            {r?.ai2 ?? ""}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center truncate">
                            {r?.ai3 ?? ""}
                          </td>
                          <td className="px-1 py-1.5 border-b border-slate-100 text-slate-800 text-center truncate">
                            {r?.ai4 ?? ""}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 py-2 text-xs text-slate-500">
              Tip: If needed, scroll horizontally inside this table only.
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
      <div className="bg-slate-800 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModel(null)}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
          >
            ← Back
          </button>
          <div>
            <div className="text-lg font-semibold">Register Devices — {modelLabel}</div>
            <div className="text-xs text-slate-200">Coming next.</div>
          </div>
        </div>
      </div>

      <div className="p-4 text-sm text-slate-700">
        Next: we’ll add backend + claim flow for this model.
      </div>
    </div>
  );
}
