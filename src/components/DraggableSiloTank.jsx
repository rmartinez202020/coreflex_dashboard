// src/components/DraggableSiloTank.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { SiloTank } from "./ProTankIconSilo";

// ✅ Models allowed
const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
};

// -------------------------
// auth + no-cache fetch helpers (same idea as DisplayBox)
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

// ✅ IMPORTANT: avoid /devices. Use user-safe list endpoints.
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

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// ✅ Convert hex to rgba for transparency (SVG-safe)
function hexToRgba(hex, alpha = 0.55) {
  const s = String(hex || "").trim();
  if (!s) return `rgba(0,255,0,${alpha})`;

  // allow already rgba()/rgb()/named colors
  if (!s.startsWith("#")) return s;

  let h = s.slice(1);

  // #RGB
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");

  // #RRGGBB
  if (h.length !== 6) return `rgba(0,255,0,${alpha})`;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  if (![r, g, b].every((x) => Number.isFinite(x))) return `rgba(0,255,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function DraggableSiloTank({ tank }) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const name = String(props.name || "").trim();

  const maxCapacity =
    props.maxCapacity === "" || props.maxCapacity === null || props.maxCapacity === undefined
      ? 0
      : Number(props.maxCapacity);

  // ✅ transparent fill (SVG-safe)
  const materialColor = hexToRgba(props.materialColor || "#00ff00", 0.55);

  // ✅ binding: support BOTH new + legacy styles
  const bindModel = props.bindModel || props.tag?.model || "zhc1921";

  const bindDeviceId = String(
    props.bindDeviceId || props.tag?.deviceId || props.tag?.id || ""
  ).trim();

  const bindField = String(
    props.bindField || props.tag?.field || ""
  ).trim() || "ai1";

  // support old key names if any
  const formula = String(props.formula ?? props.mathFormula ?? props.math ?? props.density ?? "").trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);

  // ✅ poll every 2s
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

  // ✅ numeric output
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

  // ✅ use numeric output; if not numeric, fall back to live numeric (prevents 0 level)
  const levelSource = useMemo(() => {
    if (Number.isFinite(Number(numericOutput))) return Number(numericOutput);
    if (Number.isFinite(Number(liveValue))) return Number(liveValue);
    return 0;
  }, [numericOutput, liveValue]);

  // ✅ fraction 0..1 (most tank SVGs expect this)
  const levelFrac = useMemo(() => {
    if (!Number.isFinite(Number(maxCapacity)) || Number(maxCapacity) <= 0) return 0;
    return clamp01(levelSource / Number(maxCapacity));
  }, [levelSource, maxCapacity]);

  // ✅ percent for display only
  const levelPct = useMemo(() => Math.round(levelFrac * 100), [levelFrac]);

  const outputText = useMemo(() => {
    if (!hasBinding) return "--";
    if (typeof outputValue === "string") return outputValue || "--";
    if (!Number.isFinite(Number(outputValue))) return "--";
    return Number(outputValue).toFixed(2);
  }, [hasBinding, outputValue]);

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {name ? (
        <div
          style={{
            marginBottom: 6,
            fontSize: `${16 * scale}px`,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
      ) : null}

      {/* ✅ SILO with liquid + percent inside */}
      <div style={{ display: "inline-block" }}>
        <div style={{ width: `${140 * scale}px`, height: `${220 * scale}px` }}>
          <SiloTank
            level={levelFrac}              // ✅ 0..1
            levelPct={levelPct}            // ✅ harmless extra (if component supports)
            fillColor={materialColor}      // ✅ rgba transparency
            alarm={false}
            showPercentText={true}
            percentText={`${levelPct}%`}
            percentTextColor="#111827"
          />
        </div>
      </div>

      {/* ✅ OUTPUT NUMBER BELOW FIGURE */}
      <div
        style={{
          marginTop: 6,
          fontFamily: "monospace",
          fontSize: `${18 * scale}px`,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {outputText}
      </div>

      {!Number.isFinite(Number(maxCapacity)) || Number(maxCapacity) <= 0 ? (
        <div style={{ marginTop: 2, fontSize: `${11 * scale}px`, color: "#64748b" }}>
          Set Max Capacity to enable level %
        </div>
      ) : null}
    </div>
  );
}
