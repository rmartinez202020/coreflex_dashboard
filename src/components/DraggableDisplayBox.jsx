// DraggableDisplayBox.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

// ✅ Models allowed (same idea as GraphicDisplay)
const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers (same style)
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

async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const directCandidates =
    base === "zhc1921"
      ? [
          `/zhc1921/device/${deviceId}`,
          `/zhc1921/devices/${deviceId}`,
          `/zhc1921/${deviceId}`,
          `/zhc1921/one/${deviceId}`,
        ]
      : [
          `/zhc1661/device/${deviceId}`,
          `/zhc1661/devices/${deviceId}`,
          `/zhc1661/${deviceId}`,
          `/zhc1661/one/${deviceId}`,
        ];

  for (const p of directCandidates) {
    try {
      const r = await apiGet(p, { signal });
      return r?.row ?? r?.device ?? r;
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

export default function DraggableDisplayBox({ tank }) {
  const props = tank.properties || {};

  // FORMAT like "000.00", "00", "0000", etc.
  const numberFormat = props.numberFormat || "00000";
  const label = props.label || "";
  const theme = props.theme || "gray"; // internal theme ID
  const scale = tank.scale || 1;

  // ✅ binding + math (saved from DisplaySettingModal)
  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = props.formula || "";

  // ✅ live raw + computed output
  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);

  // ✅ poll every 3s like graphic
  useEffect(() => {
    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setOutputValue(null);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

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
        // keep last value, do not hard fail UI
      }
    };

    tick();
    const id = window.setInterval(tick, 3000);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [bindModel, bindDeviceId, bindField, formula]);

  // Extract integer + decimal pattern
  const [intPart, decPart] = String(numberFormat).split(".");
  const totalInt = Math.max(1, (intPart || "0").length);
  const totalDec = decPart ? decPart.length : 0;

  // ✅ choose what to show:
  // - if formula produces a string => show as-is (no number formatting)
  // - if formula produces number => format with pattern
  const displayText = useMemo(() => {
    const v = outputValue;

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
  }, [outputValue, totalDec, totalInt]);

  // THEMES
  const themes = {
    green: { bg: "#d9ffe0", text: "#005500", border: "#00aa33" },
    red: { bg: "#ffe5e5", text: "#8b0000", border: "#cc0000" },
    blue: { bg: "#e0f0ff", text: "#003c77", border: "#0077cc" },
    gray: { bg: "#f3f4f6", text: "#111827", border: "#6b7280" },
    dark: { bg: "#1f2937", text: "#22d3ee", border: "#0ea5e9" },
  };

  const colors = themes[theme] || themes.gray;

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {/* LABEL ABOVE DISPLAY */}
      {label && (
        <div
          style={{
            marginBottom: 4,
            fontSize: `${16 * scale}px`,
            fontWeight: "600",
            color: "#374151",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      )}

      {/* DIGITAL DISPLAY */}
      <div
        style={{
          width: `${160 * scale}px`,
          height: `${65 * scale}px`,
          background: colors.bg,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: `${28 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: `3px solid ${colors.border}`,
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.35)",
          letterSpacing: "6px",
          padding: "0 8px",
          fontWeight: "700",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={
          typeof outputValue === "string"
            ? outputValue
            : Number.isFinite(Number(outputValue))
            ? String(outputValue)
            : ""
        }
      >
        {displayText}
      </div>
    </div>
  );
}
