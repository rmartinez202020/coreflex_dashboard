import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const DF572_ROUTES = {
  list: "/radar-level/sensors",
  add: "/radar-level/sensors",
  remove: (imei) => `/radar-level/sensors/${encodeURIComponent(imei)}`,
};

function getAuthToken() {
  return String(getToken() || "").trim();
}

async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(
      data?.detail || data?.error || `Request failed (${res.status})`
    );
  }

  return data;
}

function formatDateTime(value) {
  if (!value) return "—";

  const t = Date.parse(String(value));
  if (Number.isNaN(t)) return String(value);

  const dt = new Date(t);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const yyyy = dt.getFullYear();

  let h = dt.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  const min = String(dt.getMinutes()).padStart(2, "0");

  return `${mm}/${dd}/${yyyy}-${h}:${min}${ampm}`;
}

function normalizeImei(value) {
  return String(value || "").trim().replace(/\D/g, "");
}

function isValidImei(value) {
  return /^\d{15}$/.test(normalizeImei(value));
}

function normalizeDf572Row(r) {
  const row = r || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = row?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  };

  return {
    rawImeiBytes: pick("raw_imei_bytes", "rawImeiBytes", "imei"),
    userId: pick("user_id", "userId"),
    userClaimedAt: pick("user_claimed_at", "userClaimedAt"),
    heightMm: pick("height_mm", "heightMm"),
    temperatureC: pick("temperature_c", "temperatureC"),
    batteryV: pick("battery_v", "batteryV"),
    sensorAddedAt: pick("sensor_added_at", "sensorAddedAt", "created_at"),
    receivedAt: pick("received_at", "receivedAt"),
  };
}

function ConfirmDeleteModal({ open, imei, busy, onCancel, onConfirm }) {
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
            <div className="text-base font-bold text-slate-900">
              Remove wireless level sensor
            </div>

            <div className="mt-2 text-sm text-slate-600">
              You are about to remove IMEI{" "}
              <span className="font-semibold text-slate-900">{imei}</span>.
            </div>

            <div className="mt-4 flex justify-end gap-2">
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeviceManagerDf572Section({
  ownerEmail,
  onBack,
  mode = "page",
}) {
  const [newImei, setNewImei] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDeleteImei, setPendingDeleteImei] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const POLL_MS = 3000;
  const isMountedRef = React.useRef(true);
  const loadingRef = React.useRef(false);
  const deletingRef = React.useRef(false);
  const confirmOpenRef = React.useRef(false);
  const lastJsonRef = React.useRef("");

  React.useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  React.useEffect(() => {
    deletingRef.current = deleting;
  }, [deleting]);

  React.useEffect(() => {
    confirmOpenRef.current = confirmOpen;
  }, [confirmOpen]);

  async function loadDf572({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setErr("");

    try {
      const token = getAuthToken();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const data = await apiFetch(DF572_ROUTES.list, { method: "GET" });
      if (!isMountedRef.current) return;

      const list = Array.isArray(data) ? data : [];
      const normalized = list.map(normalizeDf572Row);
      const json = JSON.stringify(normalized);

      if (silent && json === lastJsonRef.current) return;

      lastJsonRef.current = json;
      setRows(normalized);
    } catch (e) {
      if (!silent) setErr(e.message || "Failed to load DF572 sensors.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function addDf572Sensor() {
    const imei = normalizeImei(newImei);

    if (!imei) return setErr("Please enter the IMEI.");
    if (!isValidImei(imei)) return setErr("IMEI must be exactly 15 digits.");

    setLoading(true);
    setErr("");

    try {
      await apiFetch(DF572_ROUTES.add, {
        method: "POST",
        body: JSON.stringify({
          raw_imei_bytes: imei,
        }),
      });

      setNewImei("");
      await loadDf572({ silent: false });
    } catch (e) {
      setErr(e.message || "Failed to add DF572 sensor.");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(row) {
    const imei = normalizeImei(row?.rawImeiBytes);
    if (!imei) return;

    setPendingDeleteImei(imei);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const imei = normalizeImei(pendingDeleteImei);
    if (!imei) return;

    setConfirmOpen(false);
    setPendingDeleteImei("");
    setDeleting(true);
    setErr("");

    try {
      await apiFetch(DF572_ROUTES.remove(imei), {
        method: "DELETE",
      });

      await loadDf572({ silent: false });
    } catch (e) {
      setErr(e.message || "Remove failed.");
    } finally {
      setDeleting(false);
    }
  }

  React.useEffect(() => {
    isMountedRef.current = true;
    loadDf572({ silent: false });

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      if (loadingRef.current) return;
      if (deletingRef.current) return;
      if (confirmOpenRef.current) return;

      loadDf572({ silent: true });
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

  return (
    <>
      <ConfirmDeleteModal
        open={confirmOpen}
        imei={pendingDeleteImei}
        busy={deleting}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
          setPendingDeleteImei("");
        }}
        onConfirm={confirmDelete}
      />

      <div className={wrapperClass}>
        <div className="rounded-xl bg-slate-700 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewImei("");
                setErr("");
                onBack?.();
              }}
              className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
            >
              ← Back
            </button>

            <div>
              <div className="text-lg font-semibold">
                Device Manager — Wireless Level Sensor DF572
              </div>
              <div className="text-xs text-slate-200">
                Add radar level sensors by IMEI and view live telemetry from
                backend.
              </div>
            </div>
          </div>

          <button
            onClick={() => loadDf572({ silent: false })}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 w-full max-w-full">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900 mb-2">
              Add Wireless Level Sensor IMEI
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={newImei}
                onChange={(e) => setNewImei(normalizeImei(e.target.value))}
                placeholder="Enter IMEI, example: 863434084245379"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) addDf572Sensor();
                }}
              />

              <button
                onClick={addDf572Sensor}
                className="md:w-[160px] rounded-lg bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Adding..." : "+ Add Sensor"}
              </button>
            </div>

            {err && <div className="mt-2 text-xs text-red-600">{err}</div>}

            <div className="mt-2 text-xs text-slate-500">
              Owner only. This creates the DF572 sensor row in the backend
              table.
            </div>

            {!!ownerEmail && (
              <div className="mt-1 text-[11px] text-slate-400">
                Owner: {ownerEmail}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden w-full max-w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-auto text-[12px]">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="text-left font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[150px]">
                      IMEI
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[80px]">
                      User ID
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[135px]">
                      Claimed At
                    </th>
                    <th className="text-center font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[90px]">
                      Height
                    </th>
                    <th className="text-center font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[90px]">
                      Temp
                    </th>
                    <th className="text-center font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[90px]">
                      Battery
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[135px]">
                      Sensor Added
                    </th>
                    <th className="text-left font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[135px]">
                      Last Received
                    </th>
                    <th className="text-right font-bold text-slate-900 px-2 py-1 border-b border-blue-300 w-[100px]">
                      Action
                    </th>
                  </tr>

                  <tr className="bg-white text-[11px]">
                    <th className="px-2 py-1 border-b border-slate-200" />
                    <th className="px-2 py-1 border-b border-slate-200" />
                    <th className="px-2 py-1 border-b border-slate-200" />
                    <th className="px-2 py-1 text-center text-slate-700 border-b border-slate-200">
                      mm
                    </th>
                    <th className="px-2 py-1 text-center text-slate-700 border-b border-slate-200">
                      °C
                    </th>
                    <th className="px-2 py-1 text-center text-slate-700 border-b border-slate-200">
                      V
                    </th>
                    <th className="px-2 py-1 border-b border-slate-200" />
                    <th className="px-2 py-1 border-b border-slate-200" />
                    <th className="px-2 py-1 border-b border-slate-200" />
                  </tr>
                </thead>

                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No DF572 sensors found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr
                        key={(r.rawImeiBytes || "df572") + idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 truncate">
                          {r.rawImeiBytes || "—"}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 truncate">
                          {r.userId ?? "—"}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 truncate">
                          {formatDateTime(r.userClaimedAt)}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                          {r.heightMm ?? "—"}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                          {r.temperatureC ?? "—"}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 text-center truncate">
                          {r.batteryV ?? "—"}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 truncate">
                          {formatDateTime(r.sensorAddedAt)}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-slate-800 truncate">
                          {formatDateTime(r.receivedAt)}
                        </td>

                        <td className="px-2 py-1 border-b border-slate-100 text-right">
                          <button
                            onClick={() => requestDelete(r)}
                            disabled={loading || deleting}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
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
              Tip: DF572 live telemetry updates every 3 seconds.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}