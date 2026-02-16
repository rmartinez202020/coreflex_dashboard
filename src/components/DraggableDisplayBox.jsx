// src/components/DraggableDisplayBox.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

// ✅ Models allowed
const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers
// -------------------------
function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

function normalizeList(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

// ✅ IMPORTANT: avoid /devices (can be 403/405). Use user-safe list endpoints.
async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const listCandidates =
    base === "zhc1661"
      ? ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"]
      : ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"];

  for (const p of listCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeList(data);

      const hit =
        arr.find((r) => {
          const id =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";
          return String(id) === String(deviceId);
        }) || null;

      if (hit) return hit;
    } catch {
      // continue
    }
  }

  return null;
}

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
    },
  };

  return byId[styleId] || byId.classic;
}

export default function DraggableDisplayBox({ tank }) {
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
  const styleCfg = useMemo(() => getStyleConfig(displayStyle, theme), [displayStyle, theme]);

  // binding + math
  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = props.formula || "";
  const hasBinding = !!bindDeviceId && !!bindField;

  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);

  useEffect(() => {
    if (!hasBinding) {
      setLiveValue(null);
      setOutputValue(null);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, { signal: ctrl.signal });

        const raw = row ? readAiField(row, bindField) : null;

        const num =
          raw === null || raw === undefined || raw === ""
            ? null
            : typeof raw === "number"
            ? raw
            : Number(raw);

        const safeLive = Number.isFinite(num) ? num : null;
        const out = computeMathOutput(safeLive, formula);

        if (cancelled) return;
        setLiveValue(safeLive);
        setOutputValue(out);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
      }
    };

    tick();
    const id = window.setInterval(tick, 2000);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [hasBinding, bindModel, bindDeviceId, bindField, formula]);

  const [intPart, decPart] = String(numberFormat).split(".");
  const totalInt = Math.max(1, (intPart || "0").length);
  const totalDec = decPart ? decPart.length : 0;

  const displayText = useMemo(() => {
    const v = hasBinding ? outputValue : props.value ?? tank?.value ?? 0;

    if (v === null || v === undefined || v === "") return "--";
    if (typeof v === "string") return v;

    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);

    let formatted = totalDec > 0 ? Number(n).toFixed(totalDec) : String(Math.round(n));

    if (totalDec > 0) {
      let [i, d] = formatted.split(".");
      i = String(i).padStart(totalInt, "0");
      d = String(d || "").padEnd(totalDec, "0");
      formatted = `${i}.${d}`;
    } else {
      formatted = String(formatted).padStart(totalInt, "0");
    }

    return formatted;
  }, [hasBinding, outputValue, props.value, tank?.value, totalDec, totalInt]);

  // ✅ style like your screenshot: NOT BOLD for title/label, tighter spacing
  const titleFontW = 500; // no bold
  const labelFontW = 500; // no bold

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
          background: styleCfg.bg,
          color: styleCfg.text,
          fontFamily: "monospace",
          fontSize: `${28 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: styleCfg.radius,
          border: `${styleCfg.borderW}px solid ${styleCfg.border}`,
          boxShadow: styleCfg.shadow,
          letterSpacing: `${styleCfg.letterSpacing}px`,
          padding: "0 8px",
          fontWeight: String(styleCfg.fontWeight),
          pointerEvents: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          backdropFilter: displayStyle === "glassRounded" ? "blur(6px)" : undefined,
        }}
        title={
          typeof outputValue === "string"
            ? outputValue
            : Number.isFinite(Number(outputValue))
            ? `OUT=${String(outputValue)}  LIVE=${Number.isFinite(liveValue) ? liveValue : "--"}`
            : ""
        }
      >
        {displayText}
      </div>
    </div>
  );
}
