// src/components/homepagesections/DeviceManagerZhc1661Section.jsx
import React from "react";
import { API_URL } from "../../config/api";

// ✅ IMPORTANT: use per-tab auth token (sessionStorage-first)
import { getToken } from "../../utils/authToken";

// ✅ Single source of truth (matches authToken.js, per-tab)
function getAuthToken() {
  return String(getToken() || "").trim();
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

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
 */
function formatDateTime(value) {
  if (value === null || value === undefined) return "—";

  const raw = String(value).trim();
  if (!raw || raw === "—" || raw.toLowerCase() === "null") return "—";

  let dt = null;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return raw;
    dt = raw.length <= 10 ? new Date(n * 1000) : new Date(n);
  } else {
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) dt = new Date(t);
  }

  if (!dt || Number.isNaN(dt.getTime())) return raw;

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

/**
 * ✅ Normalize backend row keys -> UI keys (ZHC1661)
 */
function normalizeZhc1661Row(r) {
  const row = r || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  return {
    deviceId: pick("deviceId", "device_id", "deviceID"),
    addedAt: pick("addedAt", "authorized_at", "authorizedAt", "added_at"),
    ownedBy: pick(
      "ownedBy",
      "claimed_by_email",
      "claimedByEmail",
      "user_email",
      "email"
    ),
    status: pick("status") ?? "offline",
    lastSeen: pick("lastSeen", "last_seen", "lastSeenAt"),

    ai1: pick("ai1", "ai_1") ?? "",
    ai2: pick("ai2", "ai_2") ?? "",

    ao1: pick("ao1", "ao_1", "analog_out1", "out1") ?? "",
    ao2: pick("ao2", "ao_2", "analog_out2", "out2") ?? "",
  };
}

export default function DeviceManagerZhc1661Section({
  ownerEmail,
  onBack, // parent provides the "Back" handler
  mode = "inline",

  // ✅ optional: allow parent state to own rows
  zhc1661Rows = [],
  setZhc1661Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // ✅ local fallback if parent didn't pass setter
  const [localRows, setLocalRows] = React.useState([]);
  const rows = Array.isArray(zhc1661Rows) ? zhc1661Rows : [];
  const effectiveRows = setZhc1661Rows ? rows : localRows;
  const setRows = setZhc1661Rows || setLocalRows;

  async function loadZhc1661() {
    setLoading(true);
    setErr("");

    try {
      const token = getAuthToken();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const data = await apiFetch("/zhc1661/devices", { method: "GET" });
      const list = Array.isArray(data) ? data : [];
      setRows(list.map(normalizeZhc1661Row));
    } catch (e) {
      setErr(e.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }

  async function addZhc1661Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");
    try {
      await apiFetch("/zhc1661/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");
      await loadZhc1661();
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  function refreshZhc1661() {
    loadZhc1661();
  }

  // ✅ auto-load when mounted
  React.useEffect(() => {
    loadZhc1661();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderZhc1661Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto text-[12px]">
          <thead>
            <tr className="bg-blue-200">
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[145px]">
                DEVICE ID
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                Date
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[220px]">
                User
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[95px]">
                Status
              </th>
              <th className="text-left font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[110px]">
                last seen
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-2
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AO-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AO-2
              </th>
            </tr>

            <tr className="bg-white text-[11px]">
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 text-left text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-1.5 py-1 border-b border-slate-200" />

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
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : !effectiveRows || effectiveRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  No devices found.
                </td>
              </tr>
            ) : (
              effectiveRows.map((r, idx) => {
                const statusLower = String(r?.status || "").toLowerCase();
                const dotClass =
                  statusLower === "online" ? "bg-emerald-500" : "bg-slate-400";

                return (
                  <tr
                    key={(r?.deviceId || "row") + idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {r?.deviceId ?? ""}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.addedAt)}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="truncate" title={r?.ownedBy ?? ""}>
                        {r?.ownedBy ?? "—"}
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
                        />
                        <span className="capitalize">
                          {r?.status || "offline"}
                        </span>
                      </div>
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-slate-800 truncate">
                      {formatDateTime(r?.lastSeen)}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai2 ?? ""}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ao1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ao2 ?? ""}
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

  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  return (
    <div className={wrapperClass}>
      <div className="rounded-xl bg-slate-700 text-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewDeviceId("");
              setErr("");
              onBack?.();
            }}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          >
            ← Back
          </button>

          <div>
            <div className="text-lg font-semibold">
              Device Manager — ZHC1661 (CF-1600)
            </div>
            <div className="text-xs text-slate-200">
              Add authorized devices and view live AI/AO status from backend.
            </div>
          </div>
        </div>

        <button
          onClick={refreshZhc1661}
          className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-900 mb-2">
            Add Device ID (authorized backend device)
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={newDeviceId}
              onChange={(e) => setNewDeviceId(e.target.value)}
              placeholder="Enter DEVICE ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) addZhc1661Device();
              }}
            />

            <button
              onClick={addZhc1661Device}
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

          <div className="mt-2 text-xs text-slate-500">
            Note: backend endpoints expected:{" "}
            <span className="font-semibold">GET /zhc1661/devices</span> and{" "}
            <span className="font-semibold">POST /zhc1661/devices</span>
          </div>

          {!!ownerEmail && (
            <div className="mt-1 text-[11px] text-slate-400">
              Owner: {ownerEmail}
            </div>
          )}
        </div>

        {renderZhc1661Table()}
      </div>
    </div>
  );
}
