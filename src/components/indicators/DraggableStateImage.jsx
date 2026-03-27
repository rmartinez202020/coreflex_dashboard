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

// ✅ Normalize tag names like DO-1 / do_1 / DO1 -> do1
function normalizeTagField(field) {
  const raw = String(field || "").trim();
  if (!raw) return "";

  const s = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (/^di\d+$/.test(s)) return s;
  if (/^do\d+$/.test(s)) return s;
  if (/^ai\d+$/.test(s)) return s;
  if (/^ao\d+$/.test(s)) return s;

  return s;
}

// ✅ Pretty label for debug/title only
function prettyTagField(field) {
  const f = normalizeTagField(field);
  if (!f) return "—";

  return f
    .toUpperCase()
    .replace(/^AI(\d+)$/, "AI-$1")
    .replace(/^AO(\d+)$/, "AO-$1")
    .replace(/^DI(\d+)$/, "DI-$1")
    .replace(/^DO(\d+)$/, "DO-$1");
}

// ✅ Read tag from backend row (robust)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  const normalized = normalizeTagField(field);
  if (!normalized) return undefined;

  const candidates = [
    normalized,
    normalized.toUpperCase(),
    normalized.replace(/(\D+)(\d+)/, "$1_$2"),
    normalized.replace(/(\D+)(\d+)/, "$1-$2"),
  ];

  for (const key of candidates) {
    if (row[key] !== undefined) return row[key];
  }

  // di1..diN -> in1..inN
  if (/^di\d+$/.test(normalized)) {
    const n = normalized.replace("di", "");
    const alt = `in${n}`;
    const altCandidates = [
      alt,
      alt.toUpperCase(),
      `in_${n}`,
      `IN_${n}`,
      `in-${n}`,
      `IN-${n}`,
    ];
    for (const key of altCandidates) {
      if (row[key] !== undefined) return row[key];
    }
  }

  // do1..doN -> out1..outN
  if (/^do\d+$/.test(normalized)) {
    const n = normalized.replace("do", "");
    const alt = `out${n}`;
    const altCandidates = [
      alt,
      alt.toUpperCase(),
      `out_${n}`,
      `OUT_${n}`,
      `out-${n}`,
      `OUT-${n}`,
    ];
    for (const key of altCandidates) {
      if (row[key] !== undefined) return row[key];
    }
  }

  // ai1..aiN -> a1..aN / analog1
  if (/^ai\d+$/.test(normalized)) {
    const n = normalized.replace("ai", "");
    const altCandidates = [
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
    ];
    for (const key of altCandidates) {
      if (row[key] !== undefined) return row[key];
    }
  }

  // ao1..aoN
  if (/^ao\d+$/.test(normalized)) {
    const n = normalized.replace("ao", "");
    const altCandidates = [
      `ao_${n}`,
      `AO_${n}`,
      `ao-${n}`,
      `AO-${n}`,
    ];
    for (const key of altCandidates) {
      if (row[key] !== undefined) return row[key];
    }
  }

  return undefined;
}

// ✅ Get row from shared telemetryMap (telemetryMap[model][deviceId] = row)
// + fallback scan (for older saved widgets or edge cases)
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim().toLowerCase();
  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

// ✅ Normalize backend status
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

  if (typeof raw === "boolean") return raw ? "online" : "offline";
  if (typeof raw === "number") return raw > 0 ? "online" : "offline";

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
 * - ✅ Edit mode NEVER shows Offline
 * - ✅ Runtime (play / launch / public) CAN show Offline
 * - ✅ Offline label now sits BELOW the image box
 * - ✅ Fixed DO-1 / DI-1 / AI-2 normalization
 */
export default function DraggableStateImage({
  // Canvas mode
  tank,
  telemetryMap = null,
  sensorsData,
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
    isOn: false,
    offImage: "",
    onImage: "",
    imageFit: "contain",
    tag: { model: "zhc1921", deviceId: "", field: "" },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ images (prefer properties)
    const offImage =
      tank.properties?.offImage ?? tank.offImage ?? payload.offImage;
    const onImage = tank.properties?.onImage ?? tank.onImage ?? payload.onImage;

    const imageFit =
      tank.properties?.imageFit ?? tank.imageFit ?? payload.imageFit;

    // ✅ tag binding (model/device/field)
    const tag = tank?.properties?.tag || tank?.tag || {};
    const tagModel = String(tag?.model || "").trim().toLowerCase();
    const tagDeviceId = String(tag?.deviceId || "").trim();
    const tagField = String(tag?.field || "").trim();
    const normalizedTagField = normalizeTagField(tagField);

    // ✅ saved state fallback
    const savedIsOn = tank?.properties?.isOn ?? tank?.isOn ?? payload.isOn;

    // ✅ IMPORTANT:
    // Edit mode = never show Offline
    // Runtime = allow Offline
    const isRuntime = !!isPlay;

    // =========================
    // ✅ LIVE READ (NO FETCH)
    // - edit mode: do not use offline state
    // - runtime: use telemetryMap and allow offline
    // =========================
    const telemetryRow =
      tagDeviceId && isRuntime
        ? getTelemetryRow(telemetryMap, tagModel, tagDeviceId)
        : null;

    const normalizedStatus =
      tagDeviceId && isRuntime ? getTelemetryStatus(telemetryRow) : "unbound";

    const deviceIsOnline =
      tagDeviceId && isRuntime && normalizedStatus === "online";

    const deviceIsOffline =
      tagDeviceId && isRuntime && normalizedStatus === "offline";

    const rawValueFromTelemetry =
      telemetryRow && normalizedTagField
        ? readTagFromRow(telemetryRow, normalizedTagField)
        : undefined;

    // ✅ optional fallback: sensorsData (runtime only)
    const rawValue =
      rawValueFromTelemetry !== undefined
        ? rawValueFromTelemetry
        : isRuntime
        ? sensorsData?.values?.[tagDeviceId]?.[normalizedTagField] ??
          sensorsData?.values?.[tagDeviceId]?.[tagField]
        : undefined;

    const v01 = deviceIsOnline ? to01(rawValue) : null;

    // ✅ binding is valid even if model is missing
    const tagReady = !!(tagDeviceId && normalizedTagField);

    // ✅ Runtime:
    // - only trust live value when online + real value exists
    // ✅ Edit:
    // - freeze to saved state, never show Offline
    const hasLiveState = !!(tagReady && isRuntime && deviceIsOnline && v01 !== null);
    const isOn = hasLiveState ? v01 === 1 : !!savedIsOn;

    const imgSrc = isOn ? onImage : offImage;
    const showPlaceholder = !imgSrc;

    const title = `StateImage | ${
      isRuntime
        ? deviceIsOffline
          ? "OFFLINE"
          : isOn
          ? "ON"
          : "OFF"
        : isOn
        ? "ON"
        : "OFF"
    } | ${tagModel || "—"}:${tagDeviceId || "—"}/${prettyTagField(
      normalizedTagField
    )} | row=${telemetryRow ? "YES" : "NO"} | status=${
      isRuntime ? normalizedStatus || "—" : "edit"
    } | v=${String(rawValue)}`;

    if (showPlaceholder) {
      return (
        <div
          style={{
            width: w,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "none",
            overflow: "visible",
            pointerEvents: "none",
          }}
          title={title}
        >
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
              overflow: "hidden",
            }}
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
              <div style={{ fontWeight: 1000, letterSpacing: 1 }}>
                STATE IMAGE
              </div>
              <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>
                {isOn ? "ON" : "OFF"}
              </div>
              <div style={{ fontSize: 11, marginTop: 8, opacity: 0.75 }}>
                Double-click to setup
              </div>
            </div>
          </div>

          {/* ✅ Runtime only: show Offline label BELOW the blue square */}
          {isRuntime && deviceIsOffline && (
            <div
              style={{
                marginTop: 6,
                color: "#dc2626",
                fontWeight: 800,
                fontSize: 13,
                lineHeight: 1,
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(255,255,255,0.75)",
              }}
            >
              Offline
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          width: w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          userSelect: "none",
          overflow: "visible",
          pointerEvents: "none",
        }}
        title={title}
      >
        <div
          style={{
            width: w,
            height: h,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
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

        {/* ✅ Runtime only: show Offline label BELOW the blue square */}
        {isRuntime && deviceIsOffline && (
          <div
            style={{
              marginTop: 6,
              color: "#dc2626",
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1,
              textAlign: "center",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px rgba(255,255,255,0.75)",
            }}
          >
            Offline
          </div>
        )}
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