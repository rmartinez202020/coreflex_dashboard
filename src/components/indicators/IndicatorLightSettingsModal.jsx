// src/components/indicators/IndicatorLightSettingsModal.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ FIXED TAG LIST (NO MORE BUTTONS)
const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

// ✅ Read tag value from backend row
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;
  return row[field] ?? row[field.toUpperCase()] ?? undefined;
}

export default function IndicatorLightSettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  // 🚨 NEVER early-return before hooks
  const [deviceId, setDeviceId] = React.useState("");
  const [field, setField] = React.useState("");

  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  const [telemetryRow, setTelemetryRow] = React.useState(null);

  // =========================
  // ✅ REHYDRATE FROM SAVED PROPERTIES
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    setDeviceId(String(tank?.properties?.tag?.deviceId || ""));
    setField(String(tank?.properties?.tag?.field || ""));
  }, [open, tank?.id]);

  // =========================
  // ✅ LOAD DEVICES
  // =========================
  React.useEffect(() => {
    if (!open) return;

    async function loadDevices() {
      try {
        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      } catch (e) {
        setDevices([]);
        setDevicesErr("Failed to load devices");
      }
    }

    loadDevices();
  }, [open]);

  // =========================
  // ✅ POLL TELEMETRY
  // =========================
  React.useEffect(() => {
    if (!open || !deviceId) return;

    let alive = true;

    async function poll() {
      try {
        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: getAuthHeaders(),
        });
        const list = await res.json();
        if (!alive) return;

        const row = list.find(
          (r) => String(r.deviceId) === String(deviceId)
        );
        setTelemetryRow(row || null);
      } catch {
        setTelemetryRow(null);
      }
    }

    poll();
    const t = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [open, deviceId]);

  const tagValue = React.useMemo(
    () => readTagFromRow(telemetryRow, field),
    [telemetryRow, field]
  );

  const apply = () => {
    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        tag: {
          deviceId,
          field, // ✅ SINGLE SOURCE OF TRUTH
        },
      },
    });
    onClose?.();
  };

  if (!open || !tank) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[760px] rounded-xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex justify-between">
            <b>Indicator Light</b>
            <button onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* LEFT */}
            <div>
              <div className="text-sm font-bold mb-2">
                Tag that drives the LED (ON / OFF)
              </div>

              {devicesErr && (
                <div className="text-xs text-red-600 mb-2">{devicesErr}</div>
              )}

              <div className="mb-3">
                <label className="text-xs font-semibold">Device</label>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select device</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold">Select Tag</label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Select DI / DO</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-600">
                Selected Tag:{" "}
                <b>{field ? field.toUpperCase() : "—"}</b>
              </div>
            </div>

            {/* RIGHT */}
            <div className="border rounded p-3 bg-slate-50">
              <div className="text-sm font-bold mb-2">Live Status</div>

              <div className="text-sm">
                Device:{" "}
                <b>{telemetryRow?.status || "offline"}</b>
              </div>

              <div className="text-sm mt-2">
                Tag Value:{" "}
                <b>
                  {field && telemetryRow
                    ? String(tagValue ?? "—")
                    : "—"}
                </b>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={apply}
              disabled={!deviceId || !field}
              className="px-4 py-2 rounded text-sm bg-green-600 text-white disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
