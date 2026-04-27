// src/components/controls/ToggleSwitchPropertiesModalInterlock.jsx
import React from "react";
import ToggleSwitchpropertiesmodalTelemetric, {
  to01,
} from "./ToggleSwitchpropertiesmodalTelemetric";

const MODEL_META = {
  zhc1921: { label: "CF-2000 (ZHC1921)", base: "zhc1921" },
};

const DI_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
];

function readDiFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field || "").trim().toLowerCase();
  const upper = f.toUpperCase();

  return (
    row?.[f] ??
    row?.[upper] ??
    row?.inputs?.[f] ??
    row?.inputs?.[upper] ??
    row?.digitalInputs?.[f] ??
    row?.digitalInputs?.[upper] ??
    row?.di?.[f] ??
    row?.di?.[upper] ??
    row?.tags?.[f] ??
    row?.tags?.[upper]
  );
}

function getInterlockState({ enabled, type, value01, online }) {
  if (!enabled) {
    return {
      label: "Disabled",
      blocking: false,
      color: "#64748b",
    };
  }

  if (!online || value01 === null || value01 === undefined) {
    return {
      label: "Offline / No data",
      blocking: false,
      color: "#dc2626",
    };
  }

  const t = String(type || "NO").toUpperCase();

  if (t === "NC") {
    return value01 === 0
      ? {
          label: "ACTIVE - Blocking",
          blocking: true,
          color: "#dc2626",
        }
      : {
          label: "SAFE",
          blocking: false,
          color: "#16a34a",
        };
  }

  return value01 === 1
    ? {
        label: "ACTIVE - Blocking",
        blocking: true,
        color: "#dc2626",
      }
    : {
        label: "SAFE",
        blocking: false,
        color: "#16a34a",
      };
}

export default function ToggleSwitchPropertiesModalInterlock({
  open = false,
  isLaunched = false,

  forcedModel = "zhc1921",
  devices = [],

  enabled = false,
  setEnabled,

  deviceId = "",
  setDeviceId,

  field = "di1",
  setField,

  type = "NO",
  setType,
}) {
  const safeModel = String(forcedModel || "zhc1921").trim().toLowerCase();
  const safeModelLabel = MODEL_META?.[safeModel]?.label || "CF-2000 (ZHC1921)";

  const safeDeviceId = String(deviceId || "").trim();
  const safeField = /^di[1-6]$/.test(String(field || "").toLowerCase())
    ? String(field || "").toLowerCase()
    : "di1";

  const safeType = String(type || "NO").toUpperCase() === "NC" ? "NC" : "NO";

  const { telemetryRow, backendDeviceStatus } =
    ToggleSwitchpropertiesmodalTelemetric({
      open,
      isLaunched,
      deviceId: safeDeviceId,
      pollMs: 3000,
    });

  const deviceOnline = backendDeviceStatus === "online";

  const rawValue = React.useMemo(() => {
    if (!telemetryRow || !safeField) return undefined;
    return readDiFromRow(telemetryRow, safeField);
  }, [telemetryRow, safeField]);

  const hasData = rawValue !== undefined && rawValue !== null;

  const value01 = React.useMemo(() => {
    if (!enabled || !deviceOnline || !hasData) return null;
    return to01(rawValue);
  }, [enabled, deviceOnline, hasData, rawValue]);

  const interlockState = React.useMemo(
    () =>
      getInterlockState({
        enabled,
        type: safeType,
        value01,
        online: deviceOnline,
      }),
    [enabled, safeType, value01, deviceOnline]
  );

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
        Active Interlock
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          padding: "9px 10px",
          borderRadius: 10,
          background: enabled ? "#fef2f2" : "#f8fafc",
          border: enabled ? "1px solid #fecaca" : "1px solid #e5e7eb",
        }}
      >
        <input
          type="checkbox"
          checked={Boolean(enabled)}
          onChange={(e) => setEnabled?.(e.target.checked)}
        />

        <div>
          <div style={{ fontSize: 13, fontWeight: 1000 }}>
            Enable Interlock
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            If this DI is active, this toggle cannot turn ON.
          </div>
        </div>
      </div>

      <Label>Model</Label>
      <select
        value={safeModel}
        disabled
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          background: "white",
          marginBottom: 8,
        }}
      >
        <option value={safeModel}>{safeModelLabel}</option>
      </select>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
        Endpoint: <b>/zhc1921/my-devices</b>
      </div>

      <Label>Device</Label>
      <select
        value={safeDeviceId}
        onChange={(e) => setDeviceId?.(String(e.target.value || ""))}
        disabled={!enabled}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          background: "white",
          opacity: enabled ? 1 : 0.6,
          cursor: enabled ? "pointer" : "not-allowed",
          marginBottom: 10,
        }}
      >
        <option value="">— Select device —</option>
        {Array.isArray(devices) &&
          devices.map((d) => {
            const id = String(d?.id || d?.deviceId || d?.device_id || "").trim();
            if (!id) return null;

            return (
              <option key={id} value={id}>
                {id}
              </option>
            );
          })}
      </select>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
        Selected: <b>{safeDeviceId || "—"}</b>{" "}
        {enabled && (
          <>
            ·{" "}
            <span
              style={{
                color: deviceOnline ? "#16a34a" : "#dc2626",
                fontWeight: 1000,
              }}
            >
              {deviceOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </>
        )}
      </div>

      <Label>Select Tag</Label>
      <select
        value={safeField}
        onChange={(e) =>
          setField?.(String(e.target.value || "di1").toLowerCase())
        }
        disabled={!enabled || !safeDeviceId}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          background: "white",
          opacity: enabled && safeDeviceId ? 1 : 0.6,
          cursor: enabled && safeDeviceId ? "pointer" : "not-allowed",
          marginBottom: 10,
        }}
      >
        {DI_OPTIONS.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>

      <Label>Interlock Contact Type</Label>
      <select
        value={safeType}
        onChange={(e) =>
          setType?.(
            String(e.target.value || "NO").toUpperCase() === "NC" ? "NC" : "NO"
          )
        }
        disabled={!enabled}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #cbd5e1",
          fontSize: 14,
          background: "white",
          opacity: enabled ? 1 : 0.6,
          cursor: enabled ? "pointer" : "not-allowed",
          marginBottom: 12,
        }}
      >
        <option value="NO">NO - Normally Open</option>
        <option value="NC">NC - Normally Closed</option>
      </select>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
          borderRadius: 12,
          padding: "12px 14px",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>
            Device Status
          </div>
          <div
            style={{
              marginTop: 6,
              color: !enabled
                ? "#64748b"
                : deviceOnline
                ? "#16a34a"
                : "#dc2626",
              fontWeight: 1000,
              fontSize: 13,
            }}
          >
            {!enabled ? "Disabled" : deviceOnline ? "Online" : "Offline"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>
            Selected Tag
          </div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 1000 }}>
            <span
              style={{
                color: enabled && value01 !== null ? interlockState.color : "#64748b",
              }}
            >
              ●
            </span>{" "}
            {safeField.toUpperCase()}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 1000,
              color: interlockState.color,
            }}
          >
            {enabled
              ? `${interlockState.label}${
                  value01 !== null ? ` / Value: ${value01}` : ""
                }`
              : "Interlock disabled"}
          </div>
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            fontSize: 12,
            color: "#64748b",
          }}
        >
          Bound Tag:{" "}
          <b>
            {safeModel}:{safeDeviceId || "—"}/{safeField || "—"}
          </b>
        </div>
      </div>
    </div>
  );
}