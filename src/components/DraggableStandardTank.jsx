// src/components/DraggableStandardTank.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { StandardTank } from "./ProTankIconStandard";

// ✅ Models allowed
const MODEL_META = {
  zhc1921: { base: "zhc1921" }, // CF-2000
  zhc1661: { base: "zhc1661" }, // CF-1600
};

// -------------------------
// ✅ auth + no-cache fetch helpers (same idea as DisplayBox)
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

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatOutput(v, digits = 2) {
  if (v === null || v === undefined || v === "") return "--";
  if (typeof v === "string") return v;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toFixed(Math.max(0, Number(digits) || 0));
}

export default function DraggableStandardTank({ tank }) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  // ✅ saved from your modal
  const name = String(props.name || "").trim();
  const maxCapacity = toNumberOrNull(props.maxCapacity);
  const materialColor = String(props.materialColor || "#60a5fa88");

  // ✅ binding + math
  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();
  const formula = String(props.formula || props.math || "").trim(); // supports either key
  const digits = props.outputDigits ?? 2;

  const hasBinding = !!bindDeviceId && !!bindField;

  // ✅ optional alarm thresholds (if you decide to add later)
  const alarmEnabled = !!props.alarmEnabled;
  const alarmHigh = toNumberOrNull(props.alarmHigh);
  const alarmLow = toNumberOrNull(props.alarmLow);

  // ✅ live raw + computed output
  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);

  // ✅ Poll fixed every 2 seconds
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
        const safeLive = toNumberOrNull(raw);

        const out = computeMathOutput(safeLive, formula);

        if (cancelled) return;
        setLiveValue(safeLive);
        setOutputValue(out);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        // keep last value
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

  // ✅ numeric output for % fill
  const outNum = useMemo(() => {
    if (!hasBinding) return toNumberOrNull(props.value ?? tank?.value ?? 0);
    return toNumberOrNull(outputValue);
  }, [hasBinding, outputValue, props.value, tank?.value]);

  const percent = useMemo(() => {
    if (!maxCapacity || !Number.isFinite(maxCapacity) || maxCapacity <= 0) return 0;
    const v = Number(outNum || 0);
    const p = (v / maxCapacity) * 100;
    return Math.max(0, Math.min(100, p));
  }, [outNum, maxCapacity]);

  const alarm = useMemo(() => {
    if (!alarmEnabled) return false;
    const v = toNumberOrNull(outNum);
    if (v === null) return false;
    if (alarmHigh !== null && v >= alarmHigh) return true;
    if (alarmLow !== null && v <= alarmLow) return true;
    return false;
  }, [alarmEnabled, outNum, alarmHigh, alarmLow]);

  const outputText = useMemo(() => {
    // if CONCAT => string allowed
    if (hasBinding) return formatOutput(outputValue, digits);
    return formatOutput(props.value ?? tank?.value ?? 0, digits);
  }, [hasBinding, outputValue, digits, props.value, tank?.value]);

  // ✅ size (you can adjust if your dropped tank uses explicit w/h)
  const w = (tank?.w || tank?.width || 120) * scale;
  const h = (tank?.h || tank?.height || 160) * scale;

  return (
    <div
      style={{
        width: w,
        height: h + 34 * scale, // extra space for number below
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        pointerEvents: "none", // draggable handled by parent wrapper
      }}
    >
      {/* optional name above (keep subtle) */}
      {name ? (
        <div
          style={{
            marginBottom: 6 * scale,
            fontSize: 12 * scale,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.1,
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </div>
      ) : null}

      {/* tank with liquid fill + percent inside */}
      <div style={{ width: w, height: h }}>
        <StandardTank
          level={percent}
          fillColor={materialColor}
          alarm={alarm}
          showPercentText={true}
          percentText={`${Math.round(percent)}%`}
        />
      </div>

      {/* output number below */}
      <div
        style={{
          marginTop: 6 * scale,
          minWidth: 90 * scale,
          height: 26 * scale,
          padding: `0 ${10 * scale}px`,
          borderRadius: 10 * scale,
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 14 * scale,
          fontWeight: 700,
          color: "#0f172a",
          boxShadow: "0 2px 10px rgba(2,6,23,0.08)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={
          typeof outputValue === "string"
            ? outputValue
            : Number.isFinite(Number(outputValue))
            ? `OUT=${String(outputValue)}  LIVE=${Number.isFinite(liveValue) ? liveValue : "--"}`
            : ""
        }
      >
        {outputText}
      </div>
    </div>
  );
}
