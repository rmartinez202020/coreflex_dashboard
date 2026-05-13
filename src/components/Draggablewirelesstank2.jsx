// src/components/Draggablewirelesstank2.jsx
import React, { useMemo } from "react";
import Sidebarleftwirelesstank2 from "./Sidebarleftwirelesstank2";

// Same strict AI reader as your other draggable tanks
function readAiField(row, bindField) {
  if (!row || !bindField) return null;

  const f = String(bindField || "").trim().toLowerCase();
  if (!/^ai[1-8]$/.test(f)) return null;

  const n = f.replace("ai", "");
  const candidates = [
    f,
    f.toUpperCase(),
    `ai_${n}`,
    `AI_${n}`,
    `ai-${n}`,
    `AI-${n}`,
  ];

  for (const k of candidates) {
    const v = row?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }

  return null;
}

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

function computeMathOutput(liveValue, formula) {
  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = liveValue;

  const upper = f.toUpperCase();
  if (upper.startsWith("CONCAT(") && f.endsWith(")")) {
    const inner = f.slice(7, -1);
    const parts = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && inner[i - 1] !== "\\") inQ = !inQ;

      if (ch === "," && !inQ) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }

    if (cur.trim()) parts.push(cur.trim());

    return parts
      .map((p) => {
        if (!p) return "";
        if (p === "VALUE" || p === "value") return VALUE ?? "";
        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);

        try {
          const expr = p.replace(/\bVALUE\b/gi, "VALUE");
          // eslint-disable-next-line no-new-func
          const fn = new Function("VALUE", `return (${expr});`);
          const r = fn(VALUE);
          return r ?? "";
        } catch {
          return "";
        }
      })
      .join("");
  }

  try {
    const expr = f.replace(/\bVALUE\b/gi, "VALUE");
    // eslint-disable-next-line no-new-func
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

export default function Draggablewirelesstank2({
  tank,
  isPlay = false,
  telemetryMap = null,
}) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const unit = String(props.unit || "").trim();

  const strokeColor = String(
    props.strokeColor || props.lineColor || "#111827"
  ).trim();

  const bindModel = String(props.bindModel || "zhc1921").trim();
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();

  const formula = String(
    props.formula ?? props.mathFormula ?? props.math ?? props.mathExpr ?? ""
  ).trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  const telemetryRow = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "")
    .trim()
    .toLowerCase();

  const deviceIsOffline = isPlay && hasBinding && backendStatus === "offline";

  const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

  const liveValue = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    if (!deviceIsOnline) return null;

    const raw = telemetryRow ? readAiField(telemetryRow, bindField) : null;

    const num =
      raw === null || raw === undefined || raw === ""
        ? null
        : typeof raw === "number"
        ? raw
        : Number(raw);

    return Number.isFinite(num) ? num : null;
  }, [isPlay, hasBinding, deviceIsOnline, telemetryRow, bindField]);

  const outputValue = useMemo(() => {
    if (!isPlay) return null;
    return computeMathOutput(liveValue, formula);
  }, [isPlay, liveValue, formula]);

  const outputText = useMemo(() => {
    if (!hasBinding) return "--";
    if (!isPlay) return "--";
    if (!deviceIsOnline) return "--";

    if (typeof outputValue === "string") return outputValue || "--";

    const n = Number(outputValue);

    if (!Number.isFinite(n)) return "--";

    return String(Math.round(n));
  }, [hasBinding, isPlay, deviceIsOnline, outputValue]);

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", position: "relative" }}>
        <Sidebarleftwirelesstank2
          size={180 * scale}
          strokeColor={strokeColor}
        />

        {deviceIsOffline && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${78 * scale}px`,
              transform: "translate(-50%, -50%)",
              width: `${70 * scale}px`,
              color: "#dc2626",
              fontWeight: 600,
              fontSize: `${11 * scale}px`,
              lineHeight: 1.05,
              letterSpacing: "0px",
              textAlign: "center",
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            Offline
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 4,
          fontFamily: "monospace",
          fontSize: `${15 * scale}px`,
          fontWeight: 700,
          color: strokeColor,
          display: isPlay && hasBinding ? "block" : "none",
          userSelect: "none",
        }}
      >
        {outputText}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}