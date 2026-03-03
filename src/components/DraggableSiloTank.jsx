// src/components/DraggableSiloTank.jsx
import React, { useMemo } from "react";
import { SiloTank } from "./ProTankIconSilo";

// ✅ Convert AI field from telemetry row (ai1..ai4 etc)
function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "a"),
    f.replace("ai", "A"),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

// ✅ Get row from shared telemetryMap
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
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ensureAlphaHex(hex, alphaHex = "88") {
  const s = String(hex || "").trim();
  if (!s) return `#00ff00${alphaHex}`;
  if (s.startsWith("#") && (s.length === 9 || s.length === 5)) return s;
  if (s.startsWith("#") && s.length === 7) return `${s}${alphaHex}`;
  return s;
}

/**
 * DraggableSiloTank
 * ✅ Uses shared telemetryMap
 * ✅ Live updates ONLY in Play/Launch
 * ✅ EDIT mode hides liquid
 */
export default function DraggableSiloTank({
  tank,
  isPlay = false,
  telemetryMap = null,
}) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const name = String(props.name || "").trim();
  const unit = String(props.unit || "").trim();

  const maxCapacity =
    props.maxCapacity === "" ||
    props.maxCapacity === null ||
    props.maxCapacity === undefined
      ? 0
      : Number(props.maxCapacity);

  const materialColor = ensureAlphaHex(props.materialColor || "#00ff00", "88");

  const bindModel = String(props.bindModel || "zhc1921").trim();
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();

  const formula = String(
    props.formula ?? props.mathFormula ?? props.math ?? props.density ?? ""
  ).trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  const telemetryRow = useMemo(() => {
    if (!isPlay || !hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "").trim().toLowerCase();
  const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

  const liveValue = useMemo(() => {
    if (!isPlay || !hasBinding || !deviceIsOnline) return null;

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

  const numericOutput = useMemo(() => {
    const v = outputValue;
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }, [outputValue]);

  const levelPctLive = useMemo(() => {
    if (!Number.isFinite(Number(maxCapacity)) || Number(maxCapacity) <= 0)
      return 0;
    const frac = clamp01((numericOutput ?? 0) / Number(maxCapacity));
    return frac * 100;
  }, [numericOutput, maxCapacity]);

  const levelPct = isPlay ? levelPctLive : 0;

  const outputText = useMemo(() => {
    if (!hasBinding || !isPlay || !deviceIsOnline) return "--";
    const n = Number(outputValue);
    if (!Number.isFinite(n)) return "--";
    return String(Math.round(n));
  }, [hasBinding, isPlay, deviceIsOnline, outputValue]);

  const showPercent = isPlay;

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {name ? (
        <div
          style={{
            marginBottom: 4,
            fontSize: `${14 * scale}px`,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
      ) : null}

      <div style={{ display: "inline-block" }}>
        {/* ✅ SMALLER SIZE */}
        <div style={{ width: `${100 * scale}px`, height: `${170 * scale}px` }}>
          <SiloTank
            level={levelPct}
            fillColor={materialColor}
            alarm={false}
            showPercentText={showPercent}
            percentText={`${Math.round(levelPct)}%`}
            percentTextColor="#111827"
            showBottomText={true}
            bottomText={outputText}
            bottomUnit={unit}
            bottomTextColor="#111827"
          />
        </div>
      </div>
    </div>
  );
}