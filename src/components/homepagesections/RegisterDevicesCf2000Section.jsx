// src/components/homepagesections/RegisterDevicesCf2000Section.jsx
import React from "react";
import { API_URL } from "../../config/api";

// ✅ ✅ IMPORTANT: use per-tab auth token (sessionStorage-first)
import { getToken } from "../../utils/authToken";

// Auth headers (single source of truth)
function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Date formatter: 01/01/2025-8:15AM
function formatDateMMDDYYYY_hmma(ts) {
  if (!ts) return "—";

  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);

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

// ✅ Professional confirm modal (white background)
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
                  <span className="font-semibold text-slate-900">{deviceId}</span>{" "}
                  from your account.
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    This will unclaim the device.
                  </div>
                  <div className="mt-1">
                    The device will be removed from your Registered Devices list
                    and can be claimed again later. Any configuration linked to
                    this device under your account may stop working.
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

export default function RegisterDevicesCf2000Section({ onBack }) {
  const [deviceId, setDeviceId] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  // ✅ modal state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  // ✅ LIVE polling controls
  const POLL_MS = 3000;
  const isMountedRef = React.useRef(true);
  const firstLoadDoneRef = React.useRef(false);

  // ✅ REFS to prevent effect re-creating intervals (prevents blinking)
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

  // ✅ avoid unnecessary re-render if same data
  const lastJsonRef = React.useRef("");

  async function loadMyDevices({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

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
      if (!isMountedRef.current) return;

      const list = Array.isArray(data) ? data : [];
      const json = JSON.stringify(list);

      // ✅ if nothing changed, don't touch state (prevents button flicker)
      if (silent && json === lastJsonRef.current) {
        firstLoadDoneRef.current = true;
        return;
      }

      lastJsonRef.current = json;
      setRows(list);
      firstLoadDoneRef.current = true;
    } catch (e) {
      if (!silent || !firstLoadDoneRef.current) {
        setErr(e.message || "Failed to load devices");
      }
    } finally {
      if (!silent) setLoading(false);
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
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

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
      await loadMyDevices({ silent: false });
    } catch (e) {
      setErr(e.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(row) {
    const id = String(row?.deviceId || "").trim();
    if (!id) return;
    setPendingDeleteId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const id = String(pendingDeleteId || "").trim();
    if (!id) return;

    setConfirmOpen(false);
    setPendingDeleteId("");

    setDeleting(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/zhc1921/unclaim/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Remove failed (${res.status})`);
      }

      await loadMyDevices({ silent: false });
    } catch (e) {
      setErr(e.message || "Remove failed");
    } finally {
      setDeleting(false);
    }
  }

  // ✅ mount + polling RUNS ONCE (no dependencies)
  React.useEffect(() => {
    isMountedRef.current = true;

    // first load
    loadMyDevices({ silent: false });

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      if (loadingRef.current) return;
      if (deletingRef.current) return;
      if (confirmOpenRef.current) return;

      loadMyDevices({ silent: true });
    }, POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div className="text-lg font-semibold">
                Register Devices — Model CF-2000
              </div>
              <div className="text-xs text-sky-100">
                Enter a DEVICE ID. We verify it exists and assign it to your account.
              </div>
            </div>
          </div>

          <button
            onClick={() => loadMyDevices({ silent: false })}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) claimDevice();
                }}
              />
              <button
                onClick={claimDevice}
                disabled={loading}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50"
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
                    <th className="px-[6px] py-[3px] w-[110px] text-left font-bold text-slate-900">
                      DEVICE ID
                    </th>
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
                      "DI-1","DI-2","DI-3","DI-4",
                      "DO-1","DO-2","DO-3","DO-4",
                      "AI-1","AI-2","AI-3","AI-4",
                    ].map((k) => (
                      <th
                        key={k}
                        className="px-[4px] py-[3px] w-[34px] text-center font-bold text-slate-900"
                      >
                        {k}
                      </th>
                    ))}

                    <th className="px-[6px] py-[3px] w-[112px] text-right font-bold text-slate-900">
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

                        <td className="px-[6px] py-[3px] truncate text-slate-800" title={r.addedAt || ""}>
                          {formatDateMMDDYYYY_hmma(r.addedAt)}
                        </td>

                        <td className="px-[6px] py-[3px] capitalize text-slate-800">
                          {r.status}
                        </td>

                        <td className="px-[6px] py-[3px] truncate text-slate-800 border-r border-slate-200" title={r.lastSeen || ""}>
                          {formatDateMMDDYYYY_hmma(r.lastSeen)}
                        </td>

                        {[
                          r.in1,r.in2,r.in3,r.in4,
                          r.do1,r.do2,r.do3,r.do4,
                          r.ai1,r.ai2,r.ai3,r.ai4,
                        ].map((v, j) => (
                          <td key={j} className="text-center px-[4px] py-[3px] text-slate-800">
                            {String(v ?? "")}
                          </td>
                        ))}

                        <td className="px-[6px] py-[3px] text-right">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-3 py-2 text-[11px] text-slate-500">
              Tip: You can scroll horizontally inside this table. Live updates run every 3 seconds.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
