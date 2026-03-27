// src/components/DraggableDisplayBox.jsx
import React, { useMemo } from "react";

// ==============================
// ✅ DISPLAY STYLE THEMES (4 styles)
// Saved as props.displayStyle by DisplaySettingModal
// ==============================
function getStyleConfig(displayStyle, legacyTheme) {
  const styleId = String(displayStyle || "classic").trim() || "classic";

  // legacy theme colors (used as fallback for classic)
  const legacyThemes = {
    green: { bg: "#d9ffe0", text: "#005500", border: "#00aa33" },
    red: { bg: "#ffe5e5", text: "#8b0000", border: "#cc0000" },
    blue: { bg: "#e0f0ff", text: "#003c77", border: "#0077cc" },
    gray: { bg: "#f3f4f6", text: "#111827", border: "#6b7280" },
    dark: { bg: "#1f2937", text: "#22d3ee", border: "#0ea5e9" },
  };

  const legacy = legacyThemes[legacyTheme] || legacyThemes.gray;

  const byId = {
    // ✅ Original look (classic)
    classic: {
      bg: legacy.bg,
      text: legacy.text,
      border: legacy.border,
      radius: 8,
      borderW: 3,
      letterSpacing: 6,
      fontWeight: 700,
      shadow: "inset 0 0 8px rgba(0,0,0,0.35)",
      labelColor: "#374151",
      offlineBg: "#f3f4f6",
      offlineText: "#9ca3af",
      offlineBorder: "#cbd5e1",
    },

    // ✅ Minimal
    minimal: {
      bg: "#ffffff",
      text: "#0f172a",
      border: "#cbd5e1",
      radius: 10,
      borderW: 2,
      letterSpacing: 4,
      fontWeight: 700,
      shadow: "none",
      labelColor: "#334155",
      offlineBg: "#f8fafc",
      offlineText: "#94a3b8",
      offlineBorder: "#cbd5e1",
    },

    // ✅ Dark digital
    darkDigital: {
      bg: "#0b1220",
      text: "#22c55e",
      border: "#1d4ed8",
      radius: 10,
      borderW: 2,
      letterSpacing: 6,
      fontWeight: 900,
      shadow: "inset 0 0 12px rgba(0,0,0,0.55)",
      labelColor: "#e2e8f0",
      offlineBg: "#0f172a",
      offlineText: "#94a3b8",
      offlineBorder: "#334155",
    },

    // ✅ Glass rounded
    glassRounded: {
      bg: "rgba(255,255,255,0.65)",
      text: "#0f172a",
      border: "rgba(59,130,246,0.55)",
      radius: 16,
      borderW: 2,
      letterSpacing: 4,
      fontWeight: 800,
      shadow:
        "0 8px 18px rgba(2, 6, 23, 0.18), inset 0 0 10px rgba(255,255,255,0.35)",
      labelColor: "#334155",
      offlineBg: "rgba(248,250,252,0.92)",
      offlineText: "#94a3b8",
      offlineBorder: "rgba(148,163,184,0.55)",
    },
  };

  return byId[styleId] || byId.classic;
}

function normalizeField(field) {
  return String(field || "").trim().toLowerCase();
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  if (!deviceId) return null;

  const m = String(model || "").trim().toLowerCase();
  const id = String(deviceId || "").trim();
  if (!id) return null;

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];
  if (telemetryMap?.[id]) return telemetryMap[id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

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
    row?.is_online ??
    "";

  const s = String(raw || "").trim().toLowerCase();

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

  if (s === "online" || s === "true" || s === "1" || s === "up") {
    return "online";
  }

  return s || "offline";
}

function getTelemetryValue(row, field) {
  if (!row || !field) return null;

  const f = normalizeField(field);
  if (!f) return null;

  const direct = [
    f,
    f.toLowerCase(),
    f.toUpperCase(),
    f.replace(/(\D+)(\d+)/, "$1_$2"),
    f.replace(/(\D+)(\d+)/, "$1-$2"),
  ];

  for (const key of direct) {
    if (row[key] !== undefined) return row[key];
  }

  if (/^ai\d+$/.test(f)) {
    const n = f.replace("ai", "");
    const extra = [
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^di\d+$/.test(f)) {
    const n = f.replace("di", "");
    const extra = [
      `in${n}`,
      `IN${n}`,
      `in_${n}`,
      `IN_${n}`,
      `in-${n}`,
      `IN-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^do\d+$/.test(f)) {
    const n = f.replace("do", "");
    const extra = [
      `out${n}`,
      `OUT${n}`,
      `out_${n}`,
      `OUT_${n}`,
      `out-${n}`,
      `OUT-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^ao\d+$/.test(f)) {
    const n = f.replace("ao", "");
    const extra = [`ao_${n}`, `AO_${n}`, `ao-${n}`, `AO-${n}`];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  return null;
}

// ✅ small math evaluator: supports VALUE and CONCAT("a", VALUE, "b")
function computeMathOutput(liveValue, formula) {
  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = liveValue;

  // CONCAT support
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

  // Numeric expression
  try {
    const expr = f.replace(/\bVALUE\b/gi, "VALUE");
    // eslint-disable-next-line no-new-func
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

export default function DraggableDisplayBox({
  tank,
  telemetryMap = null,
  isPlay = false,
}) {
  const props = tank?.properties || {};

  // ✅ title at top
  const title = String(props.title ?? props.displayTitle ?? "").trim();

  // format
  const numberFormat = props.numberFormat || "00000";
  const label = props.label || "";
  const theme = props.theme || "gray";
  const scale = tank?.scale || 1;

  // style
  const displayStyle = props.displayStyle || "classic";
  const styleCfg = useMemo(
    () => getStyleConfig(displayStyle, theme),
    [displayStyle, theme]
  );

  // binding + math
  const bindModel = String(props.bindModel || "zhc1921")
    .trim()
    .toLowerCase();
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = props.formula || "";
  const hasBinding = !!bindDeviceId && !!bindField;

  // ✅ ONLY USE telemetryMap now
  const row = useMemo(
    () => getTelemetryRow(telemetryMap, bindModel, bindDeviceId),
    [telemetryMap, bindModel, bindDeviceId]
  );

  const backendStatus = useMemo(() => getTelemetryStatus(row), [row]);

  // ✅ if there is a binding and widget is in play/launch context, honor offline
  // Also works in normal view because the user wants consistent status behavior.
  const isOffline = hasBinding && backendStatus === "offline";

  const rawValue = useMemo(
    () => getTelemetryValue(row, bindField),
    [row, bindField]
  );

  const safeLive = useMemo(() => {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return null;
    }

    if (typeof rawValue === "number") {
      return Number.isFinite(rawValue) ? rawValue : null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }, [rawValue]);

  const outputValue = useMemo(
    () => computeMathOutput(safeLive, formula),
    [safeLive, formula]
  );

  const [intPart, decPart] = String(numberFormat).split(".");
  const totalInt = Math.max(1, (intPart || "0").length);
  const totalDec = decPart ? decPart.length : 0;

  const displayText = useMemo(() => {
    if (isOffline) return "--";

    const v = hasBinding ? outputValue : props.value ?? tank?.value ?? 0;

    if (v === null || v === undefined || v === "") return "--";
    if (typeof v === "string") return v;

    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);

    let formatted =
      totalDec > 0 ? Number(n).toFixed(totalDec) : String(Math.round(n));

    if (totalDec > 0) {
      let [i, d] = formatted.split(".");
      i = String(i).padStart(totalInt, "0");
      d = String(d || "").padEnd(totalDec, "0");
      formatted = `${i}.${d}`;
    } else {
      formatted = String(formatted).padStart(totalInt, "0");
    }

    return formatted;
  }, [
    isOffline,
    hasBinding,
    outputValue,
    props.value,
    tank?.value,
    totalDec,
    totalInt,
  ]);

  // ✅ style like your screenshot: NOT BOLD for title/label, tighter spacing
  const titleFontW = 500;
  const labelFontW = 500;

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {title ? (
        <div
          style={{
            marginBottom: 2,
            fontSize: `${18 * scale}px`,
            fontWeight: titleFontW,
            color: styleCfg.labelColor,
            pointerEvents: "none",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
      ) : null}

      {label ? (
        <div
          style={{
            marginBottom: 4,
            fontSize: `${14 * scale}px`,
            fontWeight: labelFontW,
            color: styleCfg.labelColor,
            pointerEvents: "none",
            lineHeight: 1.05,
          }}
        >
          {label}
        </div>
      ) : null}

      <div
        style={{
          width: `${160 * scale}px`,
          height: `${65 * scale}px`,
          background: isOffline ? styleCfg.offlineBg : styleCfg.bg,
          color: isOffline ? styleCfg.offlineText : styleCfg.text,
          fontFamily: "monospace",
          fontSize: `${28 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: styleCfg.radius,
          border: `${styleCfg.borderW}px solid ${
            isOffline ? styleCfg.offlineBorder : styleCfg.border
          }`,
          boxShadow: styleCfg.shadow,
          letterSpacing: `${styleCfg.letterSpacing}px`,
          padding: "0 8px",
          fontWeight: String(styleCfg.fontWeight),
          pointerEvents: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter:
            displayStyle === "glassRounded" ? "blur(6px)" : undefined,
          opacity: isOffline ? 0.92 : 1,
        }}
        title={
          isOffline
            ? "Offline"
            : typeof outputValue === "string"
            ? outputValue
            : Number.isFinite(Number(outputValue))
            ? `OUT=${String(outputValue)}  LIVE=${
                Number.isFinite(safeLive) ? safeLive : "--"
              }`
            : ""
        }
      >
        {displayText}
      </div>

      {isOffline && (
        <div
          style={{
            marginTop: 6,
            fontSize: `${18 * scale}px`,
            fontWeight: 400,
            color: "#dc2626",
            lineHeight: 1.05,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          Offline
        </div>
      )}
    </div>
  );
}