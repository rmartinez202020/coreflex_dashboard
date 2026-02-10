// src/components/homepagesections/DeviceManagerZhc1921Section.jsx
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
 * ✅ Normalize backend row keys -> UI keys (ZHC1921)
 * NOTE: DO fields can arrive as do1..do4 OR do_1..do_4 (backend variations)
 */
function normalizeZhc1921Row(r) {
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

    in1: pick("in1", "di1", "di_1") ?? 0,
    in2: pick("in2", "di2", "di_2") ?? 0,
    in3: pick("in3", "di3", "di_3") ?? 0,
    in4: pick("in4", "di4", "di_4") ?? 0,
    // ✅ NEW: DI5/DI6 (backend sends in5/in6)
    in5: pick("in5", "di5", "di_5") ?? 0,
    in6: pick("in6", "di6", "di_6") ?? 0,

    do1: pick("do1", "do_1") ?? 0,
    do2: pick("do2", "do_2") ?? 0,
    do3: pick("do3", "do_3") ?? 0,
    do4: pick("do4", "do_4") ?? 0,

    ai1: pick("ai1", "ai_1") ?? "",
    ai2: pick("ai2", "ai_2") ?? "",
    ai3: pick("ai3", "ai_3") ?? "",
    ai4: pick("ai4", "ai_4") ?? "",
  };
}

export default function DeviceManagerZhc1921Section({
  ownerEmail,
  onBack, // parent provides the "Back" handler
  mode = "inline",

  // ✅ optional: allow parent state to own rows (same pattern you already use)
  zhc1921Rows = [],
  setZhc1921Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // ✅ delete UI state (frontend-first)
  const [deletingId, setDeletingId] = React.useState("");

  // ✅ Ensure we always have a local rows state even if parent doesn't pass setters
  const [localRows, setLocalRows] = React.useState([]);
  const rows =
    Array.isArray(zhc1921Rows) && zhc1921Rows.length >= 0 ? zhc1921Rows : [];
  const effectiveRows = setZhc1921Rows ? rows : localRows;
  const setRows = setZhc1921Rows || setLocalRows;

  // ✅ live refresh settings (match Node-RED 3 sec)
  const POLL_MS = 3000;
  const isMountedRef = React.useRef(true);
  const firstLoadDoneRef = React.useRef(false);

  // ✅ Load devices (supports silent mode so UI doesn't flash "Loading..." every poll)
  const loadZhc1921 = React.useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setErr("");

      try {
        const token = getAuthToken();
        if (!token) {
          setRows([]);
          throw new Error("Missing auth token. Please logout and login again.");
        }

        const data = await apiFetch("/zhc1921/devices", { method: "GET" });
        const list = Array.isArray(data) ? data : [];

        if (!isMountedRef.current) return;
        setRows(list.map(normalizeZhc1921Row));
        firstLoadDoneRef.current = true;
      } catch (e) {
        // During polling, avoid spamming errors if something temporary happens
        if (!silent || !firstLoadDoneRef.current) {
          setErr(e.message || "Failed to load devices.");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [setRows]
  );

  async function addZhc1921Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");
    try {
      await apiFetch("/zhc1921/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");
      await loadZhc1921({ silent: false });
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ delete button handler
  async function deleteZhc1921Device(deviceId) {
    const id = String(deviceId || "").trim();
    if (!id) return;

    const ok = window.confirm(
      `Delete device ${id} from backend list?\n\nThis will remove the device row.`
    );
    if (!ok) return;

    setDeletingId(id);
    setErr("");

    try {
      await apiFetch(`/zhc1921/devices/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      await loadZhc1921({ silent: false });
    } catch (e) {
      setErr(e.message || "Failed to delete device.");
    } finally {
      setDeletingId("");
    }
  }

  function refreshZhc1921() {
    loadZhc1921({ silent: false });
  }

  // ✅ auto-load + LIVE polling
  React.useEffect(() => {
    isMountedRef.current = true;

    // First load (show loading)
    loadZhc1921({ silent: false });

    // Live polling (silent)
    const id = setInterval(() => {
      // don’t poll when tab hidden or while user is doing add/delete
      if (document.hidden) return;
      if (deletingId) return;

      // don’t poll while initial “loading” state to avoid overlap
      loadZhc1921({ silent: true });
    }, POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(id);
    };
  }, [loadZhc1921, deletingId]);

  const renderZhc1921Table = () => (
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

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-4
              </th>
              {/* ✅ NEW */}
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-5
              </th>
              {/* ✅ NEW */}
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DI-6
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[44px]">
                DO 4
              </th>

              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-1
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-2
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-3
              </th>
              <th className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[56px]">
                AI-4
              </th>

              <th className="text-center font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[86px]">
                Delete
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
              {/* ✅ NEW */}
              <th className="px-1 py-1 text-center text-slate-700 border-b border-slate-200">
                0/1
              </th>
              {/* ✅ NEW */}
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

              <th className="px-1.5 py-1 border-b border-slate-200" />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={20}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : !effectiveRows || effectiveRows.length === 0 ? (
              <tr>
                <td
                  colSpan={20}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No devices found.
                </td>
              </tr>
            ) : (
              effectiveRows.map((r, idx) => {
                const statusLower = String(r?.status || "").toLowerCase();
                const dotClass =
                  statusLower === "online" ? "bg-emerald-500" : "bg-slate-400";

                const isDeletingThis = deletingId === String(r?.deviceId || "");

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

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in1 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in2 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in3 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in4 ?? "")}
                    </td>
                    {/* ✅ NEW */}
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in5 ?? "")}
                    </td>
                    {/* ✅ NEW */}
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.in6 ?? "")}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do1 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do2 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do3 ?? "")}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center">
                      {String(r?.do4 ?? "")}
                    </td>

                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai1 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai2 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai3 ?? ""}
                    </td>
                    <td className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                      {r?.ai4 ?? ""}
                    </td>

                    <td className="px-1.5 py-1 border-b border-slate-100 text-center">
                      <button
                        onClick={() => deleteZhc1921Device(r?.deviceId)}
                        disabled={loading || !!deletingId}
                        className="inline-flex items-center justify-center rounded-md bg-red-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        title="Delete device row"
                      >
                        {isDeletingThis ? "Deleting..." : "Delete"}
                      </button>
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
              Device Manager — ZHC1921 (CF-2000)
            </div>
            <div className="text-xs text-slate-200">
              Add authorized devices and view live I/O status from backend.
            </div>
          </div>
        </div>

        <button
          onClick={refreshZhc1921}
          className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
          disabled={loading}
          title="Manual refresh (live auto-refresh also runs every 3 seconds)"
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
              placeholder="Enter DEVICE ID (example: 1921251024070670)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) addZhc1921Device();
              }}
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

          {!!ownerEmail && (
            <div className="mt-1 text-[11px] text-slate-400">
              Owner: {ownerEmail}
            </div>
          )}
        </div>

        {renderZhc1921Table()}
      </div>
    </div>
  );
}
