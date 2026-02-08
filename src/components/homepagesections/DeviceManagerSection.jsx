import React from "react";
import { API_URL } from "../../config/api";

// ✅ Model buttons (inside Home)
const DEVICE_MODELS = [
  { key: "zhc1921", label: "Model ZHC1921 (CF-2000)" },
  { key: "zhc1661", label: "Model ZHC1661 (CF-1600)" },
  { key: "tp4000", label: "Model TP-4000" },
];

function modelMeta(modelKey) {
  if (modelKey === "zhc1921") {
    return {
      title: "Device Manager — ZHC1921 (CF-2000)",
      desc: "Add authorized devices and view live I/O status from backend.",
    };
  }
  if (modelKey === "zhc1661") {
    return {
      title: "Device Manager — ZHC1661 (CF-1600)",
      desc: "Backend table for ZHC1661 devices (next).",
    };
  }
  if (modelKey === "tp4000") {
    return {
      title: "Device Manager — TP-4000",
      desc: "Backend table for TP-4000 devices (next).",
    };
  }
  return { title: "Device Manager", desc: "" };
}

// ✅ get token from whichever key you use
function getAuthToken() {
  const keys = [
    "coreflex_access_token",
    "coreflex_token",
    "access_token",
    "token",
    "jwt",
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg = data?.detail || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/**
 * ✅ Format to: 01/01/2025-8:15AM
 * - supports ISO strings, normal date strings, unix timestamps (sec/ms)
 * - returns "—" when empty
 * - if parse fails, returns original value (safe)
 */
function formatDateTime(value) {
  if (value === null || value === undefined) return "—";

  const raw = String(value).trim();
  if (!raw || raw === "—" || raw.toLowerCase() === "null") return "—";

  let dt = null;

  // numeric timestamps
  if (/^\d+$/.test(raw)) {
    // seconds vs ms
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;

    // if it's 10 digits -> seconds
    if (raw.length <= 10) dt = new Date(n * 1000);
    else dt = new Date(n);
  } else {
    // try normal date parse
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) dt = new Date(t);
  }

  if (!dt || Number.isNaN(dt.getTime())) {
    return raw; // keep original if backend gives weird format
  }

  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = String(dt.getFullYear());

  let hours = dt.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const mins = String(dt.getMinutes()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}-${hours}:${mins}${ampm}`;
}

export default function DeviceManagerSection({
  ownerEmail,
  activeModel,
  setActiveModel,

  // ✅ render mode
  mode = "inline",

  // rows
  zhc1921Rows = [],
  setZhc1921Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const meta = modelMeta(activeModel);

  function onBack() {
    setNewDeviceId("");
    setErr("");
    setActiveModel(null);
  }

  async function loadZhc1921() {
    setLoading(true);
    setErr("");
    try {
      const rows = await apiFetch("/zhc1921/devices", { method: "GET" });
      setZhc1921Rows?.(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Load from backend when model opens
  React.useEffect(() => {
    if (activeModel === "zhc1921") {
      loadZhc1921();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModel]);

  async function addZhc1921Device() {
    const id = String(newDeviceId || "").trim();

    if (!id) {
      setErr("Please enter a DEVICE ID.");
      return;
    }
    if (!/^\d+$/.test(id)) {
      setErr("DEVICE ID must be numeric (digits only).");
      return;
    }

    setLoading(true);
    setErr("");
    try {
      // ✅ Backend insert
      await apiFetch("/zhc1921/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");

      // ✅ Reload table from backend (source of truth)
      await loadZhc1921();
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  function refreshZhc1921() {
    loadZhc1921();
  }

  // ✅ Compact spreadsheet-like table
  const renderZhc1921Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed text-[12px]">
          <thead>
            {/* ✅ Row 1 (BLUE TITLES) */}
            <tr className="bg-blue-200">
              <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[160px]">
                DEVICE ID
              </th>
              <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[140px]">
                Date
              </th>
              <th className="text-left font-bold text-slate-900 px-2 py-1.5 border-b border-blue-300 w-[95px]">
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

            {/* ✅ Row 2 (SUBTITLES) */}
            <tr className="bg-white text-[11px]">
              <th className="px-2 py-1 border-b border-slate-200" />
              <th className="px-2 py-1 border-b border-slate-200" />
              <th className="px-2 py-1 border-b border-slate-200" />
              <th className="px-2 py-1 text-left text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-2 py-1 border-b border-slate-200" />

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>

              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
              </th>
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                value
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
            ) : !zhc1921Rows || zhc1921Rows.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-3 py-6 text-center text-slate-500">
                  No devices found.
                </td>
              </tr>
            ) : (
              zhc1921Rows.map((r, idx) => {
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
                      {formatDateTime(r?.addedAt)}
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
                      {formatDateTime(r?.lastSeen)}
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
    </div>
  );

  // wrapper spacing depends on mode
  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  // =========================
  // VIEW A: Selector (cards)
  // =========================
  if (!activeModel) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Device Manager (Owner Only)
          </h2>
          <span className="text-xs text-gray-500">Owner: {ownerEmail}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEVICE_MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveModel(m.key)}
              className="w-full rounded-xl px-5 py-4 text-left transition shadow-sm border bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
            >
              <div className="text-lg font-semibold">{m.label}</div>
              <div className="text-sm text-slate-600">
                Manage authorized devices and view live I/O status.
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================
  // VIEW B: Full section
  // =========================
  return (
    <div className={wrapperClass}>
      <div className="rounded-xl bg-slate-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            ← Back
          </button>
          <div>
            <div className="text-lg font-semibold">{meta.title}</div>
            <div className="text-xs text-slate-200">{meta.desc}</div>
          </div>
        </div>

        {activeModel === "zhc1921" && (
          <button
            onClick={refreshZhc1921}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
        {activeModel === "zhc1921" && (
          <>
            <div className="mb-4">
              <div className="text-sm font-semibold text-slate-900 mb-2">
                Add Device ID (authorized backend device)
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="Enter DEVICE ID (example: 1921251024070670)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button
                  onClick={addZhc1921Device}
                  className="md:w-[160px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                  disabled={loading}
                >
                  + Add Device
                </button>
              </div>

              {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

              <div className="mt-2 text-xs text-slate-500">
                Owner only. This will create a new row in the backend table.
              </div>
            </div>

            {renderZhc1921Table()}
          </>
        )}

        {activeModel === "zhc1661" && (
          <div className="text-sm text-slate-700">
            Next: build the ZHC1661 backend table + add device input.
          </div>
        )}

        {activeModel === "tp4000" && (
          <div className="text-sm text-slate-700">
            Next: build the TP-4000 backend table + add device input.
          </div>
        )}
      </div>
    </div>
  );
}
