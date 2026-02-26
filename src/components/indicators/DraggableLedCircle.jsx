// src/components/indicators/DraggableLedCircle.jsx
import React from "react";

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

// ✅ Read DI values from backend rows (supports legacy keys)
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

// ✅ Get row from shared telemetryMap (telemetryMap[model][deviceId] = row)
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  // Preferred: explicit model
  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];

  // Fallback: scan all models (for older widgets that didn't store tag.model)
  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

/**
 * DraggableLedCircle
 * ✅ Palette mode + Canvas mode
 * ✅ Live telemetry ONLY in Play/Launch (isPlay=true)
 * ✅ NO widget polling — uses shared telemetryMap from useDashboardTelemetryPoller
 *
 * Binding:
 * tank.properties.tag = { model, deviceId, field }
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,
  isPlay = false,

  // ✅ shared dashboard telemetry (one poller per dashboard)
  telemetryMap = null,

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
      // tag: { model, deviceId, field } ✅ set by settings modal
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? payload.w;
    const h = tank.h ?? payload.h;

    const tag = tank.properties?.tag || {};
    const model = String(tag?.model || "").trim(); // ✅ NEW (required going forward)
    const deviceId = String(tag?.deviceId || "").trim();
    const field = String(tag?.field || "").trim();

    // ✅ Saved (design-time) state
    const savedStatus = tank.status ?? tank.properties?.status ?? tank.properties?.value ?? "off";
    const savedIsOn =
      savedStatus === "on" || savedStatus === true || savedStatus === 1 || savedStatus === "1";

    // =========================
    // ✅ Live value (PLAY only) from shared telemetryMap
    // =========================
    const telemetryRow = isPlay ? getTelemetryRow(telemetryMap, model, deviceId) : null;

    const backendDeviceStatus = String(telemetryRow?.status || "").trim().toLowerCase();
    const deviceIsOnline = backendDeviceStatus ? backendDeviceStatus === "online" : true;

    const backendDiValue =
      telemetryRow && field ? readDiFromRow(telemetryRow, field) : undefined;

    const liveBit = deviceIsOnline ? to01(backendDiValue) : null;
    const hasLive = liveBit !== null;

    const liveIsOn = deviceId && field && deviceIsOnline && hasLive ? liveBit === 1 : false;

    // ✅ FINAL STATE CONTROL
    const isOn = isPlay ? liveIsOn : savedIsOn;

    // =========================
    // VISUALS
    // =========================
    const shapeStyle = tank.properties?.shapeStyle ?? payload.properties.shapeStyle;
    const colorOn = tank.properties?.colorOn ?? payload.properties.colorOn;
    const colorOff = tank.properties?.colorOff ?? payload.properties.colorOff;
    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";

    const diameter = Math.min(w, h - 22);
    const isCircle = shapeStyle !== "square";

    const title =
      deviceId && field
        ? `LedCircle | ${isOn ? "ON" : "OFF"} | ${model || "—"}:${deviceId}/${field} | status=${
            backendDeviceStatus || "—"
          } | v=${String(backendDiValue)}`
        : "Bind a device + DI in settings";

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
        title={title}
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