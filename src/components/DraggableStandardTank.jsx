// src/components/DraggableStandardTank.jsx
import React, { useMemo } from "react";
import { StandardTank } from "./ProTankIconStandard";

// ✅ SAME strict AI reader as your Telemetric hook (no "analog"/"a" guessing)
function readAiField(row, bindField) {
  if (!row || !bindField) return null;

  const f = String(bindField || "").trim().toLowerCase(); // ai1..ai8
  if (!/^ai[1-8]$/.test(f)) return null;

  const n = f.replace("ai", "");
  const candidates = [f, f.toUpperCase(), `ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];

  for (const k of candidates) {
    const v = row?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

// ✅ Get row from shared telemetryMap (telemetryMap[model][deviceId] = row)
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  // Preferred: explicit model bucket
  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];

  // Fallback: scan all models (for older widgets or mismatched model storage)
  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

// ✅ same evaluator as silo
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

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function ensureAlphaHex(hex, alphaHex = "88") {
  const s = String(hex || "").trim();
  if (!s) return `#60a5fa${alphaHex}`;
  if (s.startsWith("#") && (s.length === 9 || s.length === 5)) return s;
  if (s.startsWith("#") && s.length === 7) return `${s}${alphaHex}`;
  return s;
}

/**
 * DraggableStandardTank
 * ✅ NOW uses shared telemetryMap (NO fetch, NO interval)
 * ✅ Live updates ONLY in Play/Launch (isPlay=true)
 *
 * ✅ NEW RULE:
 * - In EDIT mode -> HIDE LIQUID (force level=0)
 */
export default function DraggableStandardTank({ tank, isPlay = false, telemetryMap = null }) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const name = String(props.name || "").trim();

  // ✅ unit saved by StandardTankPropertiesModal
  const unit = String(props.unit || "").trim();

  const maxCapacity =
    props.maxCapacity === "" || props.maxCapacity === null || props.maxCapacity === undefined
      ? 0
      : Number(props.maxCapacity);

  const materialColor = ensureAlphaHex(props.materialColor || "#60a5fa", "88");

  const bindModel = String(props.bindModel || "zhc1921").trim();
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();

  const formula = String(
    props.formula ?? props.mathFormula ?? props.math ?? props.mathExpr ?? ""
  ).trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  // ✅ Live row from common poller (PLAY only)
  const telemetryRow = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "").trim().toLowerCase();
  const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

  const liveValue = useMemo(() => {
    if (!isPlay) return null; // ✅ no live in edit mode
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

  const numericOutput = useMemo(() => {
    const v = outputValue;
    if (v === null || v === undefined || v === "") return null;

    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }

    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }, [outputValue]);

  // ✅ if math returns string (CONCAT), level uses liveValue
  const levelPctLive = useMemo(() => {
    if (!Number.isFinite(Number(maxCapacity)) || Number(maxCapacity) <= 0) return 0;
    const used = numericOutput ?? liveValue ?? 0;
    const frac = clamp01(Number(used) / Number(maxCapacity));
    return frac * 100;
  }, [numericOutput, liveValue, maxCapacity]);

  // ✅ EDIT MODE: NO LIQUID
  const levelPct = isPlay ? levelPctLive : 0;

  // ✅ remove .00 (always) like silo
  const outputText = useMemo(() => {
    if (!hasBinding) return "--";
    if (!isPlay) return "--"; // ✅ freeze in edit mode
    if (!deviceIsOnline) return "--";

    if (typeof outputValue === "string") return outputValue || "--";

    const n = Number(outputValue);
    if (!Number.isFinite(n)) return "--";
    return String(Math.round(n));
  }, [hasBinding, isPlay, deviceIsOnline, outputValue]);

  // ✅ EDIT MODE: hide percent so it looks truly empty
  const showPercent = isPlay;

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {name ? (
        <div
          style={{
            marginBottom: 4,
            fontSize: `${16 * scale}px`,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
      ) : null}

      {/* ✅ STANDARD TANK */}
      <div style={{ display: "inline-block" }}>
        <div style={{ width: `${140 * scale}px`, height: `${220 * scale}px` }}>
          <StandardTank
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

      {/* hidden (kept) */}
      <div
        style={{
          marginTop: 2,
          fontFamily: "monospace",
          fontSize: `${18 * scale}px`,
          fontWeight: 700,
          color: "#111827",
          display: "none",
        }}
      >
        {outputText}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}