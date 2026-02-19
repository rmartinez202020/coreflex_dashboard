// src/components/DraggableHorizontalTank.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { HorizontalTank } from "./ProTankIconHorizontal";
import HorizontalTankPropertiesModal from "./HorizontalTankPropertiesModal";

// ✅ Models allowed
const MODEL_META = {
  zhc1921: { base: "zhc1921" }, // CF-2000
  zhc1661: { base: "zhc1661" }, // CF-1600
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

export default function DraggableHorizontalTank({ tank, onUpdate, onChange }) {
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

  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = String(props.density || "").trim();

  const hasBinding = !!bindDeviceId && !!bindField;

  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);

  // ✅ Poll every 2s
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
        if (document.hidden) return;

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

  const numericOut = useMemo(() => toNumberOrNull(outputValue), [outputValue]);

  const levelPercent = useMemo(() => {
    const used = numericOut ?? liveValue ?? 0;

    if (Number.isFinite(maxCapacity) && maxCapacity > 0) {
      return clamp((Number(used) / maxCapacity) * 100, 0, 100);
    }

    return clamp(Number(used), 0, 100);
  }, [numericOut, liveValue, maxCapacity]);

  const percentText = `${Math.round(levelPercent)}%`;

  const bottomValueText = useMemo(() => {
    if (!hasBinding) return "--";
    if (typeof outputValue === "string") return String(outputValue || "").trim() || "--";
    return formatOutputNoTrailingZeros(outputValue, 2);
  }, [hasBinding, outputValue]);

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
          // ✅ Let content define height (no forced extra empty space)
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pointerEvents: "none",
          userSelect: "none",
          position: "relative",
        }}
        title="Double-click to edit"
      >
        {/* ✅ invisible hit-layer ONLY for double click */}
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

        {/* ✅ title bigger */}
      {title ? (
  <div
    style={{
      marginBottom: 1 * scale,      // ✅ closer to tank
      fontSize: 15 * scale,         // ✅ slightly bigger
      fontWeight: 500,              // ✅ not bold
      color: "#111827",
      lineHeight: 1,
      textAlign: "center",
      pointerEvents: "none",
    }}
  >
    {title}
  </div>
) : null}


        {/* Tank icon (ONLY the SVG / percent) */}
        <div
          style={{
            width: w,
            height: h, // ✅ keep tank size stable
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
              showPercentText={true}
              percentText={percentText}
              percentTextColor="#111827"
              // ✅ IMPORTANT: bottom label OFF here
              showBottomText={false}
              pointerEvents="none"
            />
          </div>
        </div>

        {/* ✅ Output badge rendered OUTSIDE so it can sit VERY close */}
        <div
          style={{
            marginTop: 0 * scale, 
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
