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

// ✅ add alpha if user selected solid hex like "#00ff00"
function ensureAlphaHex(hex, alphaHex = "88") {
  const s = String(hex || "").trim();
  if (!s) return `#00ff00${alphaHex}`;
  if (s.startsWith("#") && (s.length === 9 || s.length === 5)) return s; // already has alpha
  if (s.startsWith("#") && s.length === 7) return `${s}${alphaHex}`;
  return s;
}

export default function DraggableSiloTank({ tank }) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  // ✅ user settings from modal
  const name = String(props.name || "").trim();

  const maxCapacity =
    props.maxCapacity === "" || props.maxCapacity === null || props.maxCapacity === undefined
      ? 0
      : Number(props.maxCapacity);

  const materialColor = ensureAlphaHex(props.materialColor || "#00ff00", "88");

  // ✅ binding + math
  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();

  // ✅ math formula stored in density (your modal saves it there)
  const formula = String(props.density ?? props.formula ?? props.mathFormula ?? props.math ?? "").trim();

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

        // ✅ if formula empty => output = live (handled by computeMathOutput)
        const out = computeMathOutput(safeLive, formula);

        if (cancelled) return;
        setLiveValue(safeLive);
        setOutputValue(out);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        // keep last values
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

  // ✅ output numeric
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

  // ✅ compute level from capacity (0..100 based on 0..maxCapacity)
  const levelPct = useMemo(() => {
    const cap = Number(maxCapacity);
    if (!Number.isFinite(cap) || cap <= 0) return 0;
    const frac = clamp01((numericOutput ?? 0) / cap);
    return frac * 100;
  }, [numericOutput, maxCapacity]);

  // ✅ text below
  const outputText = useMemo(() => {
    if (!hasBinding) return "--";
    if (typeof outputValue === "string") return outputValue || "--";
    if (!Number.isFinite(Number(outputValue))) return "--";
    return Number(outputValue).toFixed(2);
  }, [hasBinding, outputValue]);

  // ✅ IMPORTANT: make component taller so the bottom output is NOT clipped
  const bodyW = 140 * scale;
  const bodyH = 220 * scale;
  const extraBottom = 34 * scale;

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

      <div
        style={{
          width: `${bodyW}px`,
          height: `${bodyH + extraBottom}px`,
          position: "relative",
          display: "inline-block",
        }}
      >
        <div style={{ width: `${bodyW}px`, height: `${bodyH}px` }}>
          <SiloTank
            level={levelPct}
            fillColor={materialColor}
            alarm={false}
            showPercentText={true}
            percentText={`${Math.round(levelPct)}%`}
            percentTextColor="#111827"
          />
        </div>

        {/* ✅ OUTPUT NUMBER (always visible) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            fontFamily: "monospace",
            fontSize: `${18 * scale}px`,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1,
          }}
        >
          {outputText}
        </div>
      </div>

      {!Number.isFinite(Number(maxCapacity)) || Number(maxCapacity) <= 0 ? (
        <div style={{ marginTop: 2, fontSize: `${11 * scale}px`, color: "#64748b" }}>
          Set Max Capacity to enable level %
        </div>
      ) : null}
    </div>
  );
}
