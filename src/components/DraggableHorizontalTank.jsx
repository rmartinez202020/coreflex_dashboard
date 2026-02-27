// src/components/DraggableHorizontalTank.jsx
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HorizontalTank } from "./ProTankIconHorizontal";
import HorizontalTankPropertiesModal from "./HorizontalTankPropertiesModal";

// ✅ Read AI field from telemetry row (keeps your flexible variants)
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

// ✅ small math evaluator: supports VALUE and CONCAT("a", VALUE, "b")
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

function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.min(b, Math.max(a, x));
}

function ensureAlpha(color) {
  const c = String(color || "").trim();
  if (!c) return "#60a5fa88";
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return `${c}88`;
  return c;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatOutputNoTrailingZeros(v, digits = 2) {
  if (v === null || v === undefined || v === "") return "--";
  if (typeof v === "string") return String(v);

  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);

  const d = Math.max(0, Number(digits) || 0);
  let s = n.toFixed(d);
  if (d > 0) s = s.replace(/\.?0+$/, "");
  return s;
}

/**
 * DraggableHorizontalTank
 * ✅ NOW uses shared telemetryMap (NO fetch, NO interval)
 * ✅ Live updates ONLY in Play/Launch (isPlay=true)
 *
 * ✅ Edit mode:
 * - No liquid (level=0)
 * - output badge shows "--"
 */
export default function DraggableHorizontalTank({
  tank,
  onUpdate,
  onChange,

  // ✅ NEW
  isPlay = false,
  telemetryMap = null,
}) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const [openProps, setOpenProps] = useState(false);

  // Saved from modal
  const title = String(props.name || props.title || "").trim();
  const unit = String(props.unit || "").trim();

  const maxCapacityRaw = props.maxCapacity;
  const maxCapacity =
    maxCapacityRaw === "" || maxCapacityRaw === null || maxCapacityRaw === undefined
      ? 0
      : Number(maxCapacityRaw);

  const materialColor = ensureAlpha(props.materialColor || "#00ff00");

  const bindModel = String(props.bindModel || "zhc1921").trim();
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = String(props.density || "").trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  // ✅ Live row from shared poller (PLAY only)
  const telemetryRow = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "").trim().toLowerCase();
  const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

  // ✅ Live analog only in play
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

  const numericOut = useMemo(() => toNumberOrNull(outputValue), [outputValue]);

  const levelPercentLive = useMemo(() => {
    const used = numericOut ?? liveValue ?? 0;

    if (Number.isFinite(maxCapacity) && maxCapacity > 0) {
      return clamp((Number(used) / maxCapacity) * 100, 0, 100);
    }

    // if no maxCapacity, treat input as 0..100
    return clamp(Number(used), 0, 100);
  }, [numericOut, liveValue, maxCapacity]);

  // ✅ EDIT MODE: NO LIQUID
  const levelPercent = isPlay ? levelPercentLive : 0;

  const percentText = `${Math.round(levelPercent)}%`;
  const showPercentText = isPlay; // ✅ hide % in edit mode for a "blank" tank

  const bottomValueText = useMemo(() => {
    if (!hasBinding) return "--";
    if (!isPlay) return "--";
    if (!deviceIsOnline) return "--";

    if (typeof outputValue === "string") return String(outputValue || "").trim() || "--";
    return formatOutputNoTrailingZeros(outputValue, 2);
  }, [hasBinding, isPlay, deviceIsOnline, outputValue]);

  // ✅ sizing
  const w = (tank?.w || tank?.width || 220) * scale;
  const h = (tank?.h || tank?.height || 120) * scale;

  const modalNode =
    openProps && typeof document !== "undefined"
      ? createPortal(
          <HorizontalTankPropertiesModal
            open={openProps}
            tank={tank}
            onClose={() => setOpenProps(false)}
            onSave={(updatedTank) => {
              if (typeof onUpdate === "function") onUpdate(updatedTank);
              if (typeof onChange === "function") onChange(updatedTank);
              setOpenProps(false);
            }}
          />,
          document.body
        )
      : null;

  return (
    <>
      <div
        style={{
          width: w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pointerEvents: "none",
          userSelect: "none",
          position: "relative",
        }}
        title={isPlay ? "" : "Double-click to edit"}
      >
        {/* ✅ invisible hit-layer ONLY for double click (EDIT MODE ONLY) */}
        {!isPlay && (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setOpenProps(true);
            }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "auto",
              background: "transparent",
              cursor: "inherit",
            }}
          />
        )}

        {/* title */}
        {title ? (
          <div
            style={{
              marginBottom: 1 * scale,
              fontSize: 15 * scale,
              fontWeight: 500,
              color: "#111827",
              lineHeight: 1,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {title}
          </div>
        ) : null}

        {/* Tank icon */}
        <div
          style={{
            width: w,
            height: h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ width: "100%", height: "100%" }}>
            <HorizontalTank
              level={levelPercent}
              fillColor={materialColor}
              alarm={false}
              showPercentText={showPercentText}
              percentText={percentText}
              percentTextColor="#111827"
              showBottomText={false} // keep badge outside
              pointerEvents="none"
            />
          </div>
        </div>

        {/* output badge (tight) */}
        <div
          style={{
            marginTop: 0,
            transform: `translateY(${-10 * scale}px)`,
            padding: `${5 * scale}px ${12 * scale}px`,
            borderRadius: 8,
            background: "#eef2f7",
            border: "1px solid rgba(17,24,39,0.25)",
            fontFamily: "monospace",
            lineHeight: 1,
            color: "#111827",
            userSelect: "none",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
            pointerEvents: "none",
            opacity: isPlay ? 1 : 0.9,
          }}
        >
          <span style={{ fontSize: 16 * scale, fontWeight: 900, letterSpacing: 0.3 }}>
            {String(bottomValueText || "").trim() || "--"}
          </span>

          {unit ? (
            <span style={{ fontSize: 13 * scale, fontWeight: 800, opacity: 0.95 }}>
              {unit}
            </span>
          ) : null}
        </div>
      </div>

      {modalNode}
    </>
  );
}