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

// ✅ Read tag value from backend row (DI + DO + legacy mappings)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  // direct
  if (row[field] !== undefined) return row[field];

  // upper-case key
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
 * tank.properties.tag = { model, deviceId, field }   // field can be di1..di6 or do1..do4
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
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const tag = tank.properties?.tag || tank.tag || {};
    const model = String(tag?.model || "").trim();
    const deviceId = String(tag?.deviceId || "").trim();
    const field = String(tag?.field || "").trim(); // di1..di6 OR do1..do4

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

    const backendTagValue =
      telemetryRow && field ? readTagFromRow(telemetryRow, field) : undefined;

    const liveBit = deviceIsOnline ? to01(backendTagValue) : null;

    const liveIsOn =
      !!deviceId && !!field && deviceIsOnline && liveBit !== null ? liveBit === 1 : false;

    // ✅ FINAL STATE CONTROL
    const isOn = isPlay ? liveIsOn : savedIsOn;

    // =========================
    // ✅ DEBUG (console)
    // - Only logs in Play/Launch
    // - Logs when important values change
    // =========================
    const debugKey = `${tank?.id || ""}|${model}|${deviceId}|${field}|${isPlay ? "P" : "D"}`;
    const dbgPrevRef = React.useRef({ key: "", row: null, raw: undefined, bit: undefined, on: undefined });

    React.useEffect(() => {
      if (!isPlay) return;

      const hasMap = !!telemetryMap;
      const modelKeys = telemetryMap ? Object.keys(telemetryMap) : [];
      const hasRow = !!telemetryRow;

      const prev = dbgPrevRef.current;
      const changed =
        prev.key !== debugKey ||
        prev.row !== telemetryRow ||
        prev.raw !== backendTagValue ||
        prev.bit !== liveBit ||
        prev.on !== isOn;

      if (!changed) return;

      dbgPrevRef.current = {
        key: debugKey,
        row: telemetryRow,
        raw: backendTagValue,
        bit: liveBit,
        on: isOn,
      };

      // keep it readable in console
      console.groupCollapsed(
        `%c[LED DEBUG]%c ${deviceId || "no-device"} ${field || "no-tag"} → ${isOn ? "ON" : "OFF"}`,
        "color:#22c55e;font-weight:900;",
        "color:#111827;"
      );

      console.log("tank.id:", tank?.id);
      console.log("isPlay:", isPlay);
      console.log("binding:", { model, deviceId, field });

      console.log("telemetryMap present:", hasMap);
      console.log("telemetryMap model keys:", modelKeys);

      // show which model bucket we attempted
      if (model) {
        console.log(`telemetryMap[${model}] exists:`, !!telemetryMap?.[model]);
        console.log(`telemetryMap[${model}][${deviceId}] exists:`, !!telemetryMap?.[model]?.[deviceId]);
      }

      console.log("telemetryRow found:", hasRow);
      if (hasRow) {
        console.log("telemetryRow.status:", telemetryRow?.status);
        console.log("backendDeviceStatus:", backendDeviceStatus);
        console.log("deviceIsOnline:", deviceIsOnline);

        console.log("field:", field);
        console.log("backendTagValue (raw):", backendTagValue);
        console.log("liveBit (0/1/null):", liveBit);
      } else {
        console.warn("No telemetryRow. Likely key mismatch (model/deviceId) or telemetryMap not passed.");
      }

      console.log("FINAL isOn:", isOn);
      console.groupEnd();
    }, [
      debugKey,
      isPlay,
      telemetryMap,
      telemetryRow,
      backendDeviceStatus,
      deviceIsOnline,
      backendTagValue,
      liveBit,
      isOn,
      model,
      deviceId,
      field,
      tank?.id,
    ]);

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
        ? `LedCircle | ${isOn ? "ON" : "OFF"} | ${model || "—"}:${deviceId}/${field} | row=${
            telemetryRow ? "YES" : "NO"
          } | status=${backendDeviceStatus || "—"} | raw=${String(
            backendTagValue
          )} | bit=${String(liveBit)}`
        : "Bind a device + DI/DO in settings";

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