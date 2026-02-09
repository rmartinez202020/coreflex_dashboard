// src/components/homepagesections/DeviceManagerTp4000Section.jsx
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

// ✅ TP-4000 columns (match your sheet)
const TP4000_TE_COLUMNS = [
  { key: "te101", label: "TE-101" },
  { key: "te102", label: "TE-102" },
  { key: "te103", label: "TE-103" },
  { key: "te104", label: "TE-104" },
  { key: "te105", label: "TE-105" },
  { key: "te106", label: "TE-106" },
  { key: "te107", label: "TE-107" },
  { key: "te108", label: "TE-108" },
];

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
 * ✅ Professional confirm modal (white background)
 */
function ConfirmDeleteModal({ open, deviceId, busy, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={busy ? undefined : onCancel}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-100">
                ⚠️
              </div>

              <div className="flex-1">
                <div className="text-base font-bold text-slate-900">
                  Remove device from my account
                </div>

                <div className="mt-1 text-sm text-slate-600">
                  You are about to remove device{" "}
                  <span className="font-semibold text-slate-900">
                    {deviceId}
                  </span>{" "}
                  from your account.
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    This will unclaim the device.
                  </div>
                  <div className="mt-1">
                    The device will be removed from your list and can be claimed
                    again later. Any configuration linked to this device under
                    your account may stop working.
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={onCancel}
                    disabled={busy}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={onConfirm}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {busy ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ Normalize backend row keys -> UI keys (TP-4000)
 */
function normalizeTp4000Row(r) {
  const row = r || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  // support te101 OR te_101 OR TE101, etc.
  const pickTE = (n) =>
    pick(
      `te${n}`,
      `te_${n}`,
      `TE${n}`,
      `TE_${n}`,
      `te${String(n).padStart(3, "0")}`,
      `te_${String(n).padStart(3, "0")}`,
      `TE${String(n).padStart(3, "0")}`,
      `TE_${String(n).padStart(3, "0")}`
    );

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

    te101: pickTE(101) ?? "",
    te102: pickTE(102) ?? "",
    te103: pickTE(103) ?? "",
    te104: pickTE(104) ?? "",
    te105: pickTE(105) ?? "",
    te106: pickTE(106) ?? "",
    te107: pickTE(107) ?? "",
    te108: pickTE(108) ?? "",
  };
}

export default function DeviceManagerTp4000Section({
  ownerEmail,
  onBack,
  mode = "inline",

  // optional controlled mode like ZHC1661 component
  tp4000Rows = [],
  setTp4000Rows,
}) {
  const [newDeviceId, setNewDeviceId] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // ✅ confirm modal state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const [localRows, setLocalRows] = React.useState([]);
  const rows = Array.isArray(tp4000Rows) ? tp4000Rows : [];
  const effectiveRows = setTp4000Rows ? rows : localRows;
  const setRows = setTp4000Rows || setLocalRows;

  // ✅ LIVE polling controls (same pattern as CF-2000 / ZHC1661)
  const POLL_MS = 3000;
  const isMountedRef = React.useRef(true);
  const firstLoadDoneRef = React.useRef(false);

  const loadingRef = React.useRef(false);
  const deletingRef = React.useRef(false);
  const confirmOpenRef = React.useRef(false);

  React.useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  React.useEffect(() => {
    deletingRef.current = deleting;
  }, [deleting]);

  React.useEffect(() => {
    confirmOpenRef.current = confirmOpen;
  }, [confirmOpen]);

  const lastJsonRef = React.useRef("");

  async function loadTp4000({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setErr("");

    try {
      const token = getAuthToken();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      // ✅ Backend must provide: GET /tp4000/devices
      const data = await apiFetch("/tp4000/devices", { method: "GET" });
      if (!isMountedRef.current) return;

      const list = Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeTp4000Row);

      const json = JSON.stringify(normalized);

      // ✅ if nothing changed, don't touch state (prevents flicker)
      if (silent && json === lastJsonRef.current) {
        firstLoadDoneRef.current = true;
        return;
      }

      lastJsonRef.current = json;
      setRows(normalized);
      firstLoadDoneRef.current = true;
    } catch (e) {
      if (!silent || !firstLoadDoneRef.current) {
        setErr(e.message || "Failed to load devices.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function addTp4000Device() {
    const id = String(newDeviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id))
      return setErr("DEVICE ID must be numeric (digits only).");

    setLoading(true);
    setErr("");

    try {
      // ✅ Backend must provide: POST /tp4000/devices
      await apiFetch("/tp4000/devices", {
        method: "POST",
        body: JSON.stringify({ device_id: id }),
      });

      setNewDeviceId("");
      await loadTp4000({ silent: false });
    } catch (e) {
      setErr(e.message || "Failed to add device.");
    } finally {
      setLoading(false);
    }
  }

  function refreshTp4000() {
    loadTp4000({ silent: false });
  }

  // ✅ open confirm modal
  function requestDelete(row) {
    const id = String(row?.deviceId || "").trim();
    if (!id) return;
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  // ✅ confirm remove (UNCLAIM)
  async function confirmDelete() {
    const id = String(pendingDeleteId || "").trim();
    if (!id) return;

    // ✅ close immediately
    setConfirmOpen(false);
    setPendingDeleteId("");

    setDeleting(true);
    setErr("");

    try {
      // preferred endpoint (match CF pattern)
      await apiFetch(`/tp4000/unclaim/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      await loadTp4000({ silent: false });
    } catch (e) {
      // fallback endpoint (optional)
      try {
        await apiFetch(`/tp4000/devices/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        await loadTp4000({ silent: false });
      } catch (e2) {
        setErr(e2.message || e.message || "Remove failed");
      }
    } finally {
      setDeleting(false);
    }
  }

  // ✅ mount + polling RUNS ONCE (prevents interval re-create)
  React.useEffect(() => {
    isMountedRef.current = true;

    // first load
    loadTp4000({ silent: false });

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      if (loadingRef.current) return;
      if (deletingRef.current) return;
      if (confirmOpenRef.current) return;

      loadTp4000({ silent: true });
    }, POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperClass =
    mode === "page"
      ? "mt-4 w-full max-w-full"
      : "mt-10 border-t border-gray-200 pt-6 w-full max-w-full";

  const renderTp4000Table = () => (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
      <div className="w-full overflow-x-auto">
        <table className="w-full table-auto text-[12px]">
          <thead>
            {/* ✅ Row 1 (BLUE TITLES) */}
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

              {TP4000_TE_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="text-center font-bold text-slate-900 px-1 py-1 border-b border-blue-300 w-[70px]"
                >
                  {c.label}
                </th>
              ))}

              {/* ✅ Action column */}
              <th className="text-right font-bold text-slate-900 px-1.5 py-1 border-b border-blue-300 w-[112px]">
                Action
              </th>
            </tr>

            {/* ✅ Row 2 (SUBTITLES) */}
            <tr className="bg-white text-[11px]">
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 border-b border-slate-200" />
              <th className="px-1.5 py-1 text-left text-slate-700 border-b border-slate-200">
                online/offline
              </th>
              <th className="px-1.5 py-1 border-b border-slate-200" />

              {TP4000_TE_COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="px-1 py-1 text-center text-slate-700 border-b border-slate-200"
                >
                  value
                </th>
              ))}

              <th className="px-1.5 py-1 border-b border-slate-200" />
            </tr>
          </thead>

          <tbody>
            {loading && effectiveRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + TP4000_TE_COLUMNS.length}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : !effectiveRows || effectiveRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + TP4000_TE_COLUMNS.length}
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

                    {TP4000_TE_COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className="px-1 py-1 border-b border-slate-100 text-slate-800 text-center truncate"
                      >
                        {r?.[c.key] ?? ""}
                      </td>
                    ))}

                    {/* ✅ Remove button */}
                    <td className="px-1.5 py-1 border-b border-slate-100 text-right">
                      <button
                        onClick={() => requestDelete(r)}
                        disabled={loading || deleting}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                        title="Remove device from my account"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-3 py-2 text-[11px] text-slate-500">
        Tip: You can scroll horizontally inside this table. Live updates run
        every 3 seconds.
      </div>
    </div>
  );

  return (
    <>
      <ConfirmDeleteModal
        open={confirmOpen}
        deviceId={pendingDeleteId}
        busy={deleting}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setPendingDeleteId("");
        }}
        onConfirm={confirmDelete}
      />

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
                Device Manager — TP-4000
              </div>
              <div className="text-xs text-slate-200">
                Add authorized devices and view live TE values from backend.
              </div>
            </div>
          </div>

          <button
            onClick={refreshTp4000}
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
                  if (e.key === "Enter" && !loading) addTp4000Device();
                }}
              />

              <button
                onClick={addTp4000Device}
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
              <span className="font-semibold">GET /tp4000/devices</span> and{" "}
              <span className="font-semibold">POST /tp4000/devices</span>
            </div>

            {!!ownerEmail && (
              <div className="mt-1 text-[11px] text-slate-400">
                Owner: {ownerEmail}
              </div>
            )}
          </div>

          {renderTp4000Table()}
        </div>
      </div>
    </>
  );
}
