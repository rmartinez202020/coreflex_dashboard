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

// ✅ Convert Scale / MOXA field from telemetry row
function readScaleField(row, field = "weight") {
  if (!row) return null;

  const allowed = new Set([
    "weight",
    "weight_2",
    "weight_3",
    "weight_4",
    "weight_5",
  ]);

  const f = String(field || "weight").trim();

  if (!allowed.has(f)) return null;

  const value = row?.[f];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(n) ? n : null;
}

// ✅ Get row from shared telemetryMap
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();

  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  if (m && telemetryMap?.[m]?.[id]) {
    return telemetryMap[m][id];
  }

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) {
      return telemetryMap[mk][id];
    }
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

      if (ch === '"' && inner[i - 1] !== "\\") {
        inQ = !inQ;
      }

      if (ch === "," && !inQ) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }

    if (cur.trim()) {
      parts.push(cur.trim());
    }

    return parts
      .map((p) => {
        if (!p) return "";

        if (p === "VALUE" || p === "value") {
          return VALUE ?? "";
        }

        if (p.startsWith('"') && p.endsWith('"')) {
          return p.slice(1, -1);
        }

        try {
          const expr = p.replace(/\bVALUE\b/gi, "VALUE");

          const fn = new Function(
            "VALUE",
            `return (${expr});`
          );

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

    const fn = new Function(
      "VALUE",
      `return (${expr});`
    );

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

  if (!s) {
    return `#00ff00${alphaHex}`;
  }

  if (
    s.startsWith("#") &&
    (s.length === 9 || s.length === 5)
  ) {
    return s;
  }

  if (s.startsWith("#") && s.length === 7) {
    return `${s}${alphaHex}`;
  }

  return s;
}

// ======================================
// SCALE / MOXA HISTORY HELPERS
// ======================================

function formatHistoryWeight(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "--";
  }

  const n =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(n)) {
    return "--";
  }

  // Keep decimals if the scale actually has them.
  if (Number.isInteger(n)) {
    return String(n);
  }

  return String(
    Math.round(n * 100) / 100
  );
}

function formatHistoryTimestamp(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
}

/**
 * DraggableSiloTank
 *
 * ✅ Uses shared telemetryMap
 * ✅ Live updates ONLY in Play/Launch
 * ✅ EDIT mode hides liquid
 *
 * SCALE / MOXA:
 * ✅ Activated ONLY when modal saved bindModel = "weight_scale"
 * ✅ Current "weight" controls Silo level
 * ✅ Historical table appears ONLY for Scale / MOXA
 * ✅ Shows ~6h / ~12h / ~18h / ~24h snapshots
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

  const materialColor = ensureAlphaHex(
    props.materialColor || "#00ff00",
    "88"
  );

  const bindModel = String(
    props.bindModel || "zhc1921"
  ).trim();

  const bindDeviceId = String(
    props.bindDeviceId || ""
  ).trim();

  const bindField = String(
    props.bindField ||
      (bindModel === "weight_scale" ? "weight" : "ai1")
  ).trim();

  // ======================================
  // SCALE / MOXA MODE
  // ======================================

  const isWeightScale =
    bindModel === "weight_scale";

  const formula = String(
    props.formula ??
      props.mathFormula ??
      props.math ??
      props.density ??
      ""
  ).trim();

  /**
   * Normal device:
   *   requires device + field
   *
   * Scale/MOXA:
   *   current weight is fixed to "weight",
   *   so the device binding is the important part.
   */
  const hasBinding = isWeightScale
    ? !!bindDeviceId
    : !!bindDeviceId && !!bindField;

  // ======================================
  // TELEMETRY ROW
  // ======================================

  const telemetryRow = useMemo(() => {
    if (!isPlay || !hasBinding) {
      return null;
    }

    return getTelemetryRow(
      telemetryMap,
      bindModel,
      bindDeviceId
    );
  }, [
    isPlay,
    hasBinding,
    telemetryMap,
    bindModel,
    bindDeviceId,
  ]);

  // ======================================
  // DEVICE STATUS
  // ======================================

  const backendStatus = String(
    telemetryRow?.status || ""
  )
    .trim()
    .toLowerCase();

  const deviceIsOffline =
    isPlay &&
    hasBinding &&
    backendStatus === "offline";

  const deviceIsOnline = backendStatus
    ? backendStatus === "online"
    : true;

  // ======================================
  // CURRENT LIVE VALUE
  // ======================================

  const liveValue = useMemo(() => {
    if (
      !isPlay ||
      !hasBinding ||
      !deviceIsOnline
    ) {
      return null;
    }

    let raw = null;

    if (isWeightScale) {
      /**
       * IMPORTANT:
       *
       * Scale/MOXA ALWAYS uses current "weight"
       * for the live Silo level.
       *
       * weight_2 through weight_5 are historical
       * values and never control the current level.
       */
      raw = readScaleField(
        telemetryRow,
        "weight"
      );
    } else {
      raw = telemetryRow
        ? readAiField(
            telemetryRow,
            bindField
          )
        : null;
    }

    const num =
      raw === null ||
      raw === undefined ||
      raw === ""
        ? null
        : typeof raw === "number"
        ? raw
        : Number(raw);

    return Number.isFinite(num)
      ? num
      : null;
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    telemetryRow,
    bindField,
    isWeightScale,
  ]);

  // ======================================
  // MATH FORMULA
  // ======================================

  const outputValue = useMemo(() => {
    if (!isPlay) {
      return null;
    }

    return computeMathOutput(
      liveValue,
      formula
    );
  }, [
    isPlay,
    liveValue,
    formula,
  ]);

  const numericOutput = useMemo(() => {
    const v = outputValue;

    if (
      v === null ||
      v === undefined ||
      v === ""
    ) {
      return null;
    }

    const n =
      typeof v === "number"
        ? v
        : Number(v);

    return Number.isFinite(n)
      ? n
      : null;
  }, [outputValue]);

  // ======================================
  // SILO LEVEL
  // ======================================

  const levelPctLive = useMemo(() => {
    if (
      !Number.isFinite(Number(maxCapacity)) ||
      Number(maxCapacity) <= 0
    ) {
      return 0;
    }

    const frac = clamp01(
      (numericOutput ?? 0) /
        Number(maxCapacity)
    );

    return frac * 100;
  }, [
    numericOutput,
    maxCapacity,
  ]);

  const levelPct = isPlay
    ? levelPctLive
    : 0;

  // ======================================
  // CURRENT VALUE TEXT
  // ======================================

  const outputText = useMemo(() => {
    if (
      !hasBinding ||
      !isPlay ||
      !deviceIsOnline
    ) {
      return "--";
    }

    const n = Number(outputValue);

    if (!Number.isFinite(n)) {
      return "--";
    }

    return String(
      Math.round(n)
    );
  }, [
    hasBinding,
    isPlay,
    deviceIsOnline,
    outputValue,
  ]);

  /**
   * For Scale/MOXA, do not show "0%" before
   * the first telemetry row actually arrives.
   */
  const showPercent =
    isPlay &&
    !deviceIsOffline &&
    (!isWeightScale ||
      numericOutput !== null);

  // ======================================
  // SCALE / MOXA HISTORY
  // ======================================

  const scaleHistory = useMemo(() => {
    if (
      !isPlay ||
      !isWeightScale ||
      !telemetryRow
    ) {
      return [];
    }

    return [
      {
        label: "~6h",
        weight: telemetryRow?.weight_2,
        timestamp:
          telemetryRow?.received_at_2,
      },
      {
        label: "~12h",
        weight: telemetryRow?.weight_3,
        timestamp:
          telemetryRow?.received_at_3,
      },
      {
        label: "~18h",
        weight: telemetryRow?.weight_4,
        timestamp:
          telemetryRow?.received_at_4,
      },
      {
        label: "~24h",
        weight: telemetryRow?.weight_5,
        timestamp:
          telemetryRow?.received_at_5,
      },
    ];
  }, [
    isPlay,
    isWeightScale,
    telemetryRow,
  ]);

  // ======================================
  // RENDER
  // ======================================

  return (
    <div
      style={{
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
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

      <div
        style={{
          display: "inline-block",
          position: "relative",
        }}
      >
        {/* SILO */}
        <div
          style={{
            width: `${100 * scale}px`,
            height: `${170 * scale}px`,
          }}
        >
          <SiloTank
            level={levelPct}
            fillColor={materialColor}
            alarm={false}
            showPercentText={showPercent}
            percentText={`${Math.round(
              levelPct
            )}%`}
            percentTextColor="#111827"
            showBottomText={true}
            bottomText={outputText}
            bottomUnit={unit}
            bottomTextColor="#111827"
          />
        </div>

        {/* OFFLINE */}
        {deviceIsOffline && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${58 * scale}px`,
              transform:
                "translate(-50%, -50%)",
              width: `${42 * scale}px`,
              maxWidth: `${42 * scale}px`,
              color: "#dc2626",
              fontWeight: 500,
              fontSize: `${8.5 * scale}px`,
              lineHeight: 1.05,
              letterSpacing: "0px",
              textAlign: "center",
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap:
                "break-word",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            Offline
          </div>
        )}
      </div>

      {/* ==================================
          SCALE / MOXA HISTORY TABLE

          IMPORTANT:
          This appears ONLY when the modal
          selected Scale / MOXA.

          The extra top margin is intentional.
          SiloTank renders the current weight
          below the silo body, so the history
          table needs enough clearance to avoid
          overlapping that current-value box.
         ================================== */}

      {isPlay && isWeightScale ? (
        <div
          style={{
            marginTop: `${28 * scale}px`,

            width: `${210 * scale}px`,
            maxWidth: `${210 * scale}px`,
            marginLeft: "auto",
            marginRight: "auto",
            border:
              "1px solid #d1d5db",
            borderRadius: `${5 * scale}px`,
            overflow: "hidden",
            background: "#ffffff",
            color: "#111827",
            fontSize: `${9 * scale}px`,
            lineHeight: 1.2,
          }}
        >
          {/* TABLE HEADER */}
          <div
            style={{
              display: "grid",

              // Period / Weight / Time
              gridTemplateColumns:
                "58px 58px 1fr",

              alignItems: "center",
              minHeight: `${22 * scale}px`,
              background: "#f3f4f6",
              borderBottom:
                "1px solid #d1d5db",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                padding: `${4 * scale}px`,
                textAlign: "center",
              }}
            >
              Period
            </div>

            <div
              style={{
                padding: `${4 * scale}px`,
                textAlign: "center",
                borderLeft:
                  "1px solid #d1d5db",
              }}
            >
              Weight
            </div>

            <div
              style={{
                padding: `${4 * scale}px`,
                textAlign: "center",
                borderLeft:
                  "1px solid #d1d5db",
              }}
            >
              Time
            </div>
          </div>

          {/* TABLE ROWS */}
          {scaleHistory.map(
            (item, index) => (
              <div
                key={item.label}
                style={{
                  display: "grid",

                  // IMPORTANT:
                  // Must match the header exactly.
                  gridTemplateColumns:
                    "58px 58px 1fr",

                  alignItems: "center",
                  minHeight: `${23 * scale}px`,
                  borderBottom:
                    index <
                    scaleHistory.length - 1
                      ? "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <div
                  style={{
                    padding: `${4 * scale}px`,
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    padding: `${4 * scale}px`,
                    textAlign: "center",
                    borderLeft:
                      "1px solid #e5e7eb",
                  }}
                >
                  {formatHistoryWeight(
                    item.weight
                  )}
                  {unit
                    ? ` ${unit}`
                    : ""}
                </div>

                <div
                  style={{
                    padding: `${4 * scale}px`,
                    textAlign: "center",
                    borderLeft:
                      "1px solid #e5e7eb",
                    whiteSpace: "normal",
                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {formatHistoryTimestamp(
                    item.timestamp
                  )}
                </div>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}