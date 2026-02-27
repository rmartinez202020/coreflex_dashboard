// src/components/indicators/DraggableStateImage.jsx
import React from "react";

// ✅ Convert anything to 0/1 (same as modal)
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

// ✅ Read tag from backend row (same logic as modal)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // di1..di6 -> in1..in6
  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `IN${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  // do1..do4 -> out1..out4
  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    const alt = `out${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `OUT${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

// ✅ Get row from shared telemetryMap (telemetryMap[model][deviceId] = row)
// + fallback scan (for older saved widgets or edge cases)
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

/**
 * DraggableStateImage
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar)
 * 2) Canvas mode (Dashboard)
 *
 * ✅ State behavior:
 * - Default is OFF (shows OFF image)
 * - When tag becomes ON, shows ON image
 *
 * ✅ UPDATED:
 * - ✅ NO internal polling
 * - ✅ Uses shared telemetryMap from useDashboardTelemetryPoller (common poller)
 * - Live state changes ONLY in Play/Launch (isPlay=true)
 */
export default function DraggableStateImage({
  // Canvas mode
  tank,
  telemetryMap = null, // ✅ NEW: common poller data
  sensorsData, // optional fallback (USED ONLY IN PLAY)
  isPlay = false,

  // Palette mode
  label = "State Image",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "stateImage",
    w: 160,
    h: 160,

    // default state
    isOn: false,

    // images saved in properties
    offImage: "",
    onImage: "",
    imageFit: "contain", // contain|cover

    // tag binding includes model too
    tag: { model: "zhc1921", deviceId: "", field: "" },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ images (prefer properties)
    const offImage = tank.properties?.offImage ?? tank.offImage ?? payload.offImage;
    const onImage = tank.properties?.onImage ?? tank.onImage ?? payload.onImage;

    const imageFit = tank.properties?.imageFit ?? tank.imageFit ?? payload.imageFit;

    // ✅ tag binding (model/device/field)
    const tag = tank?.properties?.tag || tank?.tag || {};
    const tagModel = String(tag?.model || "").trim();
    const tagDeviceId = String(tag?.deviceId || "").trim();
    const tagField = String(tag?.field || "").trim();

    // ✅ EDIT MODE SHOULD NOT CHANGE:
    const savedIsOn = tank?.properties?.isOn ?? tank?.isOn ?? payload.isOn;

    // =========================
    // ✅ LIVE READ (NO FETCH) — from telemetryMap
    // =========================
    const telemetryRow = isPlay ? getTelemetryRow(telemetryMap, tagModel, tagDeviceId) : null;

    const backendStatus = String(telemetryRow?.status || "").trim().toLowerCase();
    const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

    const rawValueFromTelemetry =
      telemetryRow && tagField ? readTagFromRow(telemetryRow, tagField) : undefined;

    // ✅ optional fallback: sensorsData (ONLY IN PLAY)
    const rawValue =
      rawValueFromTelemetry !== undefined
        ? rawValueFromTelemetry
        : isPlay
        ? sensorsData?.values?.[tagDeviceId]?.[tagField]
        : undefined;

    const v01 = isPlay && deviceIsOnline ? to01(rawValue) : null;

    const tagReady = !!(tagModel && tagDeviceId && tagField);
    const liveIsOn = !!(tagReady && isPlay && deviceIsOnline && v01 === 1);

    // ✅ Final: freeze in edit, live in play
    const isOn = isPlay ? liveIsOn : !!savedIsOn;

    const imgSrc = isOn ? onImage : offImage;
    const showPlaceholder = !imgSrc;

    const title = `StateImage | ${isOn ? "ON" : "OFF"} | ${tagModel || "—"}:${tagDeviceId || "—"}/${
      tagField || "—"
    } | row=${telemetryRow ? "YES" : "NO"} | status=${backendStatus || "—"} | v=${String(rawValue)}`;

    if (showPlaceholder) {
      return (
        <div
          style={{
            width: w,
            height: h,
            borderRadius: 12,
            border: "1px dashed rgba(148,163,184,0.65)",
            background: "rgba(2,6,23,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            overflow: "hidden",
            pointerEvents: "none",
          }}
          title={title}
        >
          <div style={{ textAlign: "center", color: "#64748b", padding: 10 }}>
            <div
              style={{
                width: Math.max(18, Math.round(Math.min(w, h) * 0.12)),
                height: Math.max(18, Math.round(Math.min(w, h) * 0.12)),
                borderRadius: 999,
                background: "rgba(148,163,184,0.35)",
                margin: "0 auto 10px auto",
                boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 1 }}>STATE IMAGE</div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>{isOn ? "ON" : "OFF"}</div>
            <div style={{ fontSize: 11, marginTop: 8, opacity: 0.75 }}>Double-click to setup</div>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          width: w,
          height: h,
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          overflow: "hidden",
          pointerEvents: "none",
        }}
        title={title}
      >
        <img
          src={imgSrc}
          alt={isOn ? "ON" : "OFF"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: imageFit,
            display: "block",
          }}
          draggable={false}
        />
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
        e.dataTransfer.setData("shape", "stateImage");
        e.dataTransfer.setData("text/plain", "stateImage");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag State Image"
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
          borderRadius: 4,
          background: "rgba(148,163,184,0.35)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 10px rgba(148,163,184,0.25)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}