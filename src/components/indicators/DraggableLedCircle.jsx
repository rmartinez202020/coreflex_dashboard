import React from "react";
import { API_URL } from "../../config/api";

// ✅ per-tab token
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Convert anything to 0/1
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

// ✅ Read DI values from backend rows (supports multiple legacy keys)
function readDiFromRow(row, diKey) {
  if (!row) return undefined;

  if (row[diKey] !== undefined) return row[diKey];

  const map = { di1: "in1", di2: "in2", di3: "in3", di4: "in4", di5: "in5", di6: "in6" };
  const alt = map[diKey];
  if (alt && row[alt] !== undefined) return row[alt];

  const map2 = { di1: "DI1", di2: "DI2", di3: "DI3", di4: "DI4", di5: "DI5", di6: "DI6" };
  const alt2 = map2[diKey];
  if (alt2 && row[alt2] !== undefined) return row[alt2];

  return undefined;
}

/**
 * DraggableLedCircle
 * ✅ Palette mode (Sidebar) + Canvas mode
 * ✅ Reads tag binding from tank.properties.tag.deviceId + field
 * ✅ Uses backend polling (/zhc1921/my-devices) every 3 seconds
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,

  // Palette mode
  label = "Led Circle",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "ledCircle",
    w: 70,
    h: 90,
    status: "off",
    properties: {
      shapeStyle: "circle",
      colorOn: "#22c55e",
      colorOff: "#9ca3af",
      offText: "OFF",
      onText: "ON",
      // tag: { deviceId, field } ✅ set by settings modal
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? payload.w;
    const h = tank.h ?? payload.h;

    const deviceId = String(tank.properties?.tag?.deviceId || "").trim();
    const field = String(tank.properties?.tag?.field || "").trim();

    const [telemetryRow, setTelemetryRow] = React.useState(null);
    const [telemetryErr, setTelemetryErr] = React.useState("");
    const telemetryRef = React.useRef({ loading: false });

    const fetchTelemetryRow = React.useCallback(async () => {
      const id = String(deviceId || "").trim();
      if (!id) {
        setTelemetryRow(null);
        setTelemetryErr("");
        return;
      }
      if (telemetryRef.current.loading) return;

      telemetryRef.current.loading = true;
      setTelemetryErr("");

      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: { ...getAuthHeaders() },
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.detail || `Failed to load device telemetry (${res.status})`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const row =
          list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;

        setTelemetryRow(row);
      } catch (e) {
        setTelemetryRow(null);
        setTelemetryErr(e.message || "Failed to load device telemetry.");
      } finally {
        telemetryRef.current.loading = false;
      }
    }, [deviceId]);

    React.useEffect(() => {
      fetchTelemetryRow();

      const POLL_MS = 3000;
      const t = setInterval(() => {
        if (document.hidden) return;
        fetchTelemetryRow();
      }, POLL_MS);

      return () => clearInterval(t);
    }, [fetchTelemetryRow]);

    // ✅ If deviceId changes, reset row
    React.useEffect(() => {
      setTelemetryRow(null);
      setTelemetryErr("");
    }, [deviceId]);

    const backendDeviceStatus = React.useMemo(() => {
      const s = String(telemetryRow?.status || "").trim().toLowerCase();
      if (!deviceId) return "";
      if (!s) return "";
      return s; // "online"/"offline"
    }, [telemetryRow, deviceId]);

    const deviceIsOnline = backendDeviceStatus === "online";

    const backendDiValue = React.useMemo(() => {
      if (!telemetryRow || !field) return undefined;
      return readDiFromRow(telemetryRow, field);
    }, [telemetryRow, field]);

    const liveBit = React.useMemo(() => to01(backendDiValue), [backendDiValue]);
    const hasLive = liveBit !== null;

    // ✅ fallback to legacy status if no live data / no tag selected
    const legacyStatus =
      tank.status ?? tank.properties?.status ?? tank.properties?.value ?? "off";

    const legacyOn =
      legacyStatus === "on" || legacyStatus === true || legacyStatus === 1 || legacyStatus === "1";

    const isOn = deviceId && field && deviceIsOnline && hasLive ? liveBit === 1 : legacyOn;

    const shapeStyle = tank.properties?.shapeStyle ?? payload.properties.shapeStyle;
    const colorOn = tank.properties?.colorOn ?? payload.properties.colorOn;
    const colorOff = tank.properties?.colorOff ?? payload.properties.colorOff;
    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";

    const diameter = Math.min(w, h - 22);
    const isCircle = shapeStyle !== "square";

    return (
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          userSelect: "none",
        }}
        title={
          telemetryErr
            ? telemetryErr
            : deviceId && field
            ? `${deviceId} • ${field} • ${deviceIsOnline ? "online" : "offline"}`
            : "Bind a device + DI in settings"
        }
      >
        <div
          style={{
            width: diameter,
            height: diameter,
            borderRadius: isCircle ? "50%" : 6,
            background: isOn ? colorOn : colorOff,
            border: "2px solid rgba(0,0,0,0.65)",
            boxShadow: isOn
              ? "0 0 12px rgba(34,197,94,0.65)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
            transition: "background 120ms ease, box-shadow 120ms ease",
            opacity: deviceId && field ? 1 : 0.7,
          }}
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#111827",
            lineHeight: "14px",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {isOn ? textOn : textOff}
        </div>
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("shape", "ledCircle");
        e.dataTransfer.setData("text/plain", "ledCircle");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag LED"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: payload.properties.colorOn,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 8px rgba(34,197,94,0.5)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
