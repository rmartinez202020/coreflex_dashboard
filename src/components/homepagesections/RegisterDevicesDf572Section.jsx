import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

function normalizeImei(value) {
  return String(value || "").trim().replace(/\D/g, "");
}

function isValidImei(value) {
  return /^\d{15}$/.test(normalizeImei(value));
}

function normalizeDf572Row(row) {
  const r = row || {};
  return {
    imei: r.raw_imei_bytes || r.rawImeiBytes || r.imei || "",
    claimedAt: r.user_claimed_at || r.userClaimedAt || r.claimed_at || "",
    heightMm: r.height_mm ?? r.heightMm ?? "",
    temperatureC: r.temperature_c ?? r.temperatureC ?? "",
    batteryV: r.battery_v ?? r.batteryV ?? "",
    receivedAt: r.received_at || r.receivedAt || "",
    sensorAddedAt: r.sensor_added_at || r.sensorAddedAt || "",
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
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700 border border-red-100">
                ⚠️
              </div>

              <div className="flex-1">
                <div className="text-base font-bold text-slate-900">
                  Remove sensor from my account
                </div>

                <div className="mt-1 text-sm text-slate-600">
                  You are about to remove IMEI{" "}
                  <span className="font-semibold text-slate-900">{imei}</span>{" "}
                  from your account.
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    This will unclaim the sensor.
                  </div>
                  <div className="mt-1">
                    The sensor will be removed from your Registered Devices list
                    and can be claimed again later.
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

export default function RegisterDevicesDf572Section({
  onBack,
  devicesUsed = 0,
  deviceLimit = "—",
  deviceLimitReached = false,
  refreshRegisteredDeviceCount,
}) {
  const [imei, setImei] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDeleteImei, setPendingDeleteImei] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const POLL_MS = 3000;
  const isMountedRef = React.useRef(true);
  const firstLoadDoneRef = React.useRef(false);

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

  async function loadMySensors({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(`${API_URL}/radar-level/my-sensors`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Failed to load sensors (${res.status})`);
      }

      const data = await res.json();
      if (!isMountedRef.current) return;

      const list = Array.isArray(data) ? data.map(normalizeDf572Row) : [];
      const json = JSON.stringify(list);

      if (silent && json === lastJsonRef.current) {
        firstLoadDoneRef.current = true;
        return;
      }

      lastJsonRef.current = json;
      setRows(list);
      firstLoadDoneRef.current = true;
    } catch (e) {
      if (!silent || !firstLoadDoneRef.current) {
        setErr(e.message || "Failed to load sensors");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function claimSensor() {
    if (deviceLimitReached) {
      return setErr(
        `Device limit reached. You are using ${devicesUsed} / ${deviceLimit} devices.`
      );
    }

    const cleanImei = normalizeImei(imei);

    if (!cleanImei) return setErr("Please enter the IMEI.");
    if (!isValidImei(cleanImei)) {
      return setErr("IMEI must be exactly 15 digits.");
    }

    setLoading(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(`${API_URL}/radar-level/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ raw_imei_bytes: cleanImei }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Claim failed (${res.status})`);
      }

      setImei("");
      await loadMySensors({ silent: false });

      if (typeof refreshRegisteredDeviceCount === "function") {
        await refreshRegisteredDeviceCount();
      }
    } catch (e) {
      setErr(e.message || "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(row) {
    const cleanImei = normalizeImei(row?.imei);
    if (!cleanImei) return;

    setPendingDeleteImei(cleanImei);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const cleanImei = normalizeImei(pendingDeleteImei);
    if (!cleanImei) return;

    setConfirmOpen(false);
    setPendingDeleteImei("");
    setDeleting(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(
        `${API_URL}/radar-level/unclaim/${encodeURIComponent(cleanImei)}`,
        {
          method: "DELETE",
          headers: { ...getAuthHeaders() },
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Remove failed (${res.status})`);
      }

      await loadMySensors({ silent: false });

      if (typeof refreshRegisteredDeviceCount === "function") {
        await refreshRegisteredDeviceCount();
      }
    } catch (e) {
      setErr(e.message || "Remove failed");
    } finally {
      setDeleting(false);
    }
  }

  React.useEffect(() => {
    isMountedRef.current = true;

    loadMySensors({ silent: false });

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      if (loadingRef.current) return;
      if (deletingRef.current) return;
      if (confirmOpenRef.current) return;

      loadMySensors({ silent: true });
    }, POLL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDisabled = loading || deleting || deviceLimitReached;

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
                Register Devices — Wireless Radar Level Sensor CF-R100
              </div>
              <div className="text-xs text-sky-100">
                Device usage: {devicesUsed} / {deviceLimit}
              </div>
            </div>
          </div>

          <button
            onClick={() => loadMySensors({ silent: false })}
            className="rounded-lg bg-sky-700 hover:bg-sky-600 px-3 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="p-4">
          {deviceLimitReached ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Device limit reached. Remove a device or upgrade your plan before
              registering another device.
            </div>
          ) : null}

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">
              Add / Claim Sensor IMEI
            </div>

            <div className="flex gap-3">
              <input
                value={imei}
                onChange={(e) => setImei(normalizeImei(e.target.value))}
                placeholder={
                  deviceLimitReached
                    ? "Device limit reached"
                    : "Enter IMEI, example: 863434084245379"
                }
                disabled={addDisabled}
                className="flex-1 rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !addDisabled) claimSensor();
                }}
              />

              <button
                onClick={claimSensor}
                disabled={addDisabled}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Sensor
              </button>
            </div>

            {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
          </div>

          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-[12px]">
                <thead>
                  <tr className="bg-blue-200">
                    <th className="px-[6px] py-[3px] w-[145px] text-left font-bold text-slate-900">
                      IMEI
                    </th>

                    <th className="px-[6px] py-[3px] w-[135px] text-left font-bold text-slate-900">
                      Claimed Date
                    </th>

                    <th className="px-[6px] py-[3px] w-[90px] text-center font-bold text-slate-900">
                      Height
                    </th>

                    <th className="px-[6px] py-[3px] w-[90px] text-center font-bold text-slate-900">
                      Temp
                    </th>

                    <th className="px-[6px] py-[3px] w-[90px] text-center font-bold text-slate-900">
                      Battery
                    </th>

                    <th className="px-[6px] py-[3px] w-[135px] text-left font-bold text-slate-900">
                      Last Received
                    </th>

                    <th className="px-[6px] py-[3px] w-[135px] text-left font-bold text-slate-900">
                      Sensor Added
                    </th>

                    <th className="px-[6px] py-[3px] w-[112px] text-right font-bold text-slate-900">
                      Action
                    </th>
                  </tr>

                  <tr className="bg-white text-[11px]">
                    <th className="px-[6px] py-[3px]" />
                    <th className="px-[6px] py-[3px]" />
                    <th className="px-[6px] py-[3px] text-center text-slate-700">
                      mm
                    </th>
                    <th className="px-[6px] py-[3px] text-center text-slate-700">
                      °C
                    </th>
                    <th className="px-[6px] py-[3px] text-center text-slate-700">
                      V
                    </th>
                    <th className="px-[6px] py-[3px]" />
                    <th className="px-[6px] py-[3px]" />
                    <th className="px-[6px] py-[3px]" />
                  </tr>
                </thead>

                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-6 text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-6 text-slate-500"
                      >
                        No registered CF-R100 sensors yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr
                        key={`${r?.imei || "row"}-${i}`}
                        className={i % 2 ? "bg-slate-50" : "bg-white"}
                      >
                        <td className="px-[6px] py-[3px] truncate text-slate-800">
                          {r.imei || "—"}
                        </td>

                        <td
                          className="px-[6px] py-[3px] truncate text-slate-800"
                          title={r.claimedAt || ""}
                        >
                          {formatDateMMDDYYYY_hmma(r.claimedAt)}
                        </td>

                        <td className="px-[6px] py-[3px] text-center text-slate-800">
                          {r.heightMm ?? "—"}
                        </td>

                        <td className="px-[6px] py-[3px] text-center text-slate-800">
                          {r.temperatureC ?? "—"}
                        </td>

                        <td className="px-[6px] py-[3px] text-center text-slate-800">
                          {r.batteryV ?? "—"}
                        </td>

                        <td
                          className="px-[6px] py-[3px] truncate text-slate-800"
                          title={r.receivedAt || ""}
                        >
                          {formatDateMMDDYYYY_hmma(r.receivedAt)}
                        </td>

                        <td
                          className="px-[6px] py-[3px] truncate text-slate-800"
                          title={r.sensorAddedAt || ""}
                        >
                          {formatDateMMDDYYYY_hmma(r.sensorAddedAt)}
                        </td>

                        <td className="px-[6px] py-[3px] text-right">
                          <button
                            onClick={() => requestDelete(r)}
                            disabled={loading || deleting}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            title="Remove sensor from my account"
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
              Tip: CF-R100 telemetry updates every 3 seconds.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}