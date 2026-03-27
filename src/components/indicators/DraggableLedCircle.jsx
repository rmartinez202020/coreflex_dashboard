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

// ✅ Read tag value from backend row (DI + DO + legacy mappings)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    if (row[`in${n}`] !== undefined) return row[`in${n}`];
    if (row[`IN${n}`] !== undefined) return row[`IN${n}`];
  }

  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    if (row[`out${n}`] !== undefined) return row[`out${n}`];
    if (row[`OUT${n}`] !== undefined) return row[`OUT${n}`];
  }

  return undefined;
}

// ✅ Get row from shared telemetryMap (telemetryMap[model][deviceId] = row)
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

// ✅ Normalize backend online/offline status
function getTelemetryStatus(row) {
  if (!row || typeof row !== "object") return "offline";

  const raw =
    row?.status ??
    row?.deviceStatus ??
    row?.telemetryStatus ??
    row?.onlineStatus ??
    row?.connectionStatus ??
    row?.state ??
    row?.online ??
    "";

  if (typeof raw === "boolean") {
    return raw ? "online" : "offline";
  }

  if (typeof raw === "number") {
    return raw > 0 ? "online" : "offline";
  }

  const s = String(raw || "").trim().toLowerCase();

  if (
    s === "online" ||
    s === "true" ||
    s === "1" ||
    s === "up" ||
    s === "running" ||
    s === "connected"
  ) {
    return "online";
  }

  if (
    s === "offline" ||
    s === "false" ||
    s === "0" ||
    s === "down" ||
    s === "disconnected" ||
    s === "not_running" ||
    s === "not running"
  ) {
    return "offline";
  }

  return "offline";
}

export default function DraggableLedCircle({
  tank,
  isPlay = false,
  telemetryMap = null,
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
      offlineText: "Offline",
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const tag = tank.properties?.tag || tank.tag || {};
    const model = String(tag?.model || "").trim();
    const deviceId = String(tag?.deviceId || "").trim();
    const field = String(tag?.field || "").trim();

    const hasBinding = !!deviceId && !!field;

    const savedStatus =
      tank.status ?? tank.properties?.status ?? tank.properties?.value ?? "off";

    const savedIsOn =
      savedStatus === "on" ||
      savedStatus === true ||
      savedStatus === 1 ||
      savedStatus === "1";

    // =========================
    // ✅ Live telemetry status/value
    // ✅ IMPORTANT:
    // - if widget is bound and row is missing => treat as OFFLINE
    // - works in edit + play + launch/public
    // =========================
    const telemetryRow = hasBinding
      ? getTelemetryRow(telemetryMap, model, deviceId)
      : null;

    const normalizedStatus = hasBinding
      ? getTelemetryStatus(telemetryRow)
      : "unbound";

    const deviceIsOffline = hasBinding && normalizedStatus === "offline";
    const deviceIsOnline = hasBinding && normalizedStatus === "online";

    const backendTagValue =
      telemetryRow && field
        ? readTagFromRow(telemetryRow, field)
        : undefined;

    const liveBit = deviceIsOnline ? to01(backendTagValue) : null;

    const liveIsOn =
      hasBinding && deviceIsOnline && liveBit !== null ? liveBit === 1 : false;

    // ✅ Edit mode:
    // if bound and offline, show Offline too
    // if bound and online, show live value
    // if unbound, keep saved canvas value
    const isOn = hasBinding ? liveIsOn : savedIsOn;

    // =========================
    // VISUALS
    // =========================
    const shapeStyle =
      tank.properties?.shapeStyle ?? payload.properties.shapeStyle;

    const colorOn =
      tank.properties?.colorOn ?? payload.properties.colorOn;

    const colorOff =
      tank.properties?.colorOff ?? payload.properties.colorOff;

    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";
    const textOffline = tank.properties?.offlineText ?? "Offline";

    const diameter = Math.min(w, h - 22);
    const isCircle = shapeStyle !== "square";

    const title = hasBinding
      ? `LedCircle | ${
          deviceIsOffline ? "OFFLINE" : isOn ? "ON" : "OFF"
        } | ${model || "—"}:${deviceId}/${field}`
      : "Bind a device + DI/DO in settings";

    const displayText = deviceIsOffline
      ? textOffline
      : isOn
      ? textOn
      : textOff;

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
            opacity: hasBinding ? 1 : 0.7,
          }}
        />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: deviceIsOffline ? "#dc2626" : "#111827",
            lineHeight: "14px",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {displayText}
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