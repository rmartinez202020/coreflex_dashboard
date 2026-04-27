// src/components/homepagesections/RegisterDevicesCf1600Section.jsx
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
                    The device will be removed from your Registered Devices list
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

const CF1600_IO_COLS = [
  { key: "ai1", label: "AI-1" },
  { key: "ai2", label: "AI-2" },
  { key: "ao1", label: "AO-1" },
  { key: "ao2", label: "AO-2" },
];

export default function RegisterDevicesCf1600Section({
  onBack,
  devicesUsed = 0,
  deviceLimit = "—",
  deviceLimitReached = false,
  refreshRegisteredDeviceCount,
}) {
  const [deviceId, setDeviceId] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  async function loadMyDevices() {
    setLoading(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        setRows([]);
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(`${API_URL}/zhc1661/my-devices`, {
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
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function claimDevice() {
    if (deviceLimitReached) {
      return setErr(
        `Device limit reached. You are using ${devicesUsed} / ${deviceLimit} devices.`
      );
    }

    const id = String(deviceId || "").trim();
    if (!id) return setErr("Please enter a DEVICE ID.");
    if (!/^\d+$/.test(id)) {
      return setErr("DEVICE ID must be numeric (digits only).");
    }

    setLoading(true);
    setErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(`${API_URL}/zhc1661/claim`, {
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
      if (!token) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(
        `${API_URL}/zhc1661/unclaim/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Remove failed (${res.status})`);
      }

      await loadMyDevices();

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
    loadMyDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDisabled = loading || deleting || deviceLimitReached;

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
                Register Devices — Model CF-1600
              </div>
              <div className="text-xs text-sky-100">
                Device usage: {devicesUsed} / {deviceLimit}
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
          {deviceLimitReached ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              Device limit reached. Remove a device or upgrade your plan before
              registering another device.
            </div>
          ) : null}

          <div className="mb-4">
            <div className="text-sm font-semibold mb-2">Add / Claim Device ID</div>

            <div className="flex gap-3">
              <input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder={
                  deviceLimitReached ? "Device limit reached" : "Enter DEVICE ID"
                }
                disabled={addDisabled}
                className="flex-1 rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                onClick={claimDevice}
                disabled={addDisabled}
                className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <th className="px-[6px] py-[3px] w-[140px] text-left font-bold text-slate-900">
                      DEVICE ID
                    </th>
                    <th className="px-[6px] py-[3px] w-[150px] text-left font-bold text-slate-900">
                      Date
                    </th>
                    <th className="px-[6px] py-[3px] w-[110px] text-left font-bold text-slate-900">
                      Status
                    </th>
                    <th className="px-[6px] py-[3px] w-[150px] text-left font-bold text-slate-900 border-r border-blue-300">
                      last seen
                    </th>

                    {CF1600_IO_COLS.map((c) => (
                      <th
                        key={c.key}
                        className="px-[6px] py-[3px] w-[90px] text-center font-bold text-slate-900"
                      >
                        {c.label}
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
                      <td
                        colSpan={5 + CF1600_IO_COLS.length}
                        className="text-center py-6 text-slate-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td
                        colSpan={5 + CF1600_IO_COLS.length}
                        className="text-center py-6 text-slate-500"
                      >
                        No devices found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => {
                      const statusLower = String(r?.status || "").toLowerCase();
                      const dotClass =
                        statusLower === "online"
                          ? "bg-emerald-500"
                          : "bg-slate-400";

                      return (
                        <tr
                          key={`${r?.deviceId || "row"}-${i}`}
                          className={i % 2 ? "bg-slate-50" : "bg-white"}
                        >
                          <td className="px-[6px] py-[3px] truncate text-slate-800">
                            {r?.deviceId ?? ""}
                          </td>

                          <td
                            className="px-[6px] py-[3px] truncate text-slate-800"
                            title={r?.addedAt || ""}
                          >
                            {formatDateMMDDYYYY_hmma(r?.addedAt)}
                          </td>

                          <td className="px-[6px] py-[3px] text-slate-800">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
                              />
                              <span className="capitalize">
                                {r?.status || "offline"}
                              </span>
                            </div>
                          </td>

                          <td
                            className="px-[6px] py-[3px] truncate text-slate-800 border-r border-slate-200"
                            title={r?.lastSeen || ""}
                          >
                            {formatDateMMDDYYYY_hmma(r?.lastSeen)}
                          </td>

                          {CF1600_IO_COLS.map((c) => (
                            <td
                              key={c.key}
                              className="px-[6px] py-[3px] text-center text-slate-800 truncate"
                            >
                              {String(r?.[c.key] ?? "")}
                            </td>
                          ))}

                          <td className="px-[6px] py-[3px] text-right">
                            <button
                              onClick={() => requestDelete(r)}
                              disabled={loading || deleting}
                              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
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
              Tip: You can scroll horizontally inside this table.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}