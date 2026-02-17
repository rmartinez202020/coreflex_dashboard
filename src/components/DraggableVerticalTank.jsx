// src/components/DraggableVerticalTank.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { VerticalTank } from "./ProTankIconVertical";
import VerticalTankSettingsModal from "./VerticalTankSettingsModal"; // ✅ NEW

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

function clamp(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.min(b, Math.max(a, x));
}

function ensureAlpha(color) {
  const c = String(color || "").trim();
  if (!c) return "#60a5fa88";
  // if user gives #RRGGBB, add 88 alpha
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return `${c}88`;
  return c;
}

export default function DraggableVerticalTank({ tank, onChange }) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  // ✅ modal open state
  const [openModal, setOpenModal] = useState(false);

  // Saved from modal
  const title = String(props.name || props.title || "").trim();
  const maxCapacityRaw = props.maxCapacity;
  const maxCapacity =
    maxCapacityRaw === "" || maxCapacityRaw === null || maxCapacityRaw === undefined
      ? 0
      : Number(maxCapacityRaw);

  const materialColor = ensureAlpha(props.materialColor || "#00ff00");

  // Binding + math
  const bindModel = props.bindModel || "zhc1921";
  const bindDeviceId = String(props.bindDeviceId || "").trim();
  const bindField = String(props.bindField || "ai1").trim();

  // IMPORTANT: you’re using "density" as the Math field in the modal
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

        // output can be string (CONCAT) or number
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

  // Numeric output used for % + numeric label
  const numericOut = useMemo(() => {
    if (outputValue === null || outputValue === undefined || outputValue === "") return null;
    if (typeof outputValue === "string") {
      const n = Number(outputValue);
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(outputValue);
    return Number.isFinite(n) ? n : null;
  }, [outputValue]);

  // Level % logic
  const levelPercent = useMemo(() => {
    if (!Number.isFinite(numericOut)) return 0;

    // if capacity set => output is amount (0..capacity)
    if (Number.isFinite(maxCapacity) && maxCapacity > 0) {
      return clamp((numericOut / maxCapacity) * 100, 0, 100);
    }

    // else assume output already is % (0..100)
    return clamp(numericOut, 0, 100);
  }, [numericOut, maxCapacity]);

  // Text inside tank: show percent
  const percentText = `${Math.round(levelPercent)}%`;

  // Bottom number under tank (output)
  const bottomValueText = useMemo(() => {
    if (outputValue === null || outputValue === undefined || outputValue === "") return "--";
    if (typeof outputValue === "string") return outputValue;
    const n = Number(outputValue);
    if (!Number.isFinite(n)) return String(outputValue);
    return n.toFixed(2);
  }, [outputValue]);

  return (
    <>
      {/* ✅ DOUBLE CLICK target wrapper */}
      <div
        onDoubleClick={(e) => {
          e.stopPropagation();
          setOpenModal(true);
        }}
        style={{
          display: "inline-block",
          cursor: "pointer",
          pointerEvents: "auto", // ✅ allow double click
          userSelect: "none",
        }}
        title="Double click to edit"
      >
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          {title ? (
            <div
              style={{
                marginBottom: 6,
                fontSize: `${14 * scale}px`,
                fontWeight: 600,
                color: "#0f172a",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
          ) : null}

          <div
            style={{
              width: `${120 * scale}px`,
              height: `${160 * scale}px`,
              margin: "0 auto",
            }}
          >
            <VerticalTank
              level={levelPercent}
              fillColor={materialColor}
              alarm={false}
              showPercentText={true}
              percentText={percentText}
            />
          </div>

          {/* OUTPUT NUMBER BELOW FIGURE */}
          <div
            style={{
              marginTop: 6,
              fontFamily: "monospace",
              fontSize: `${14 * scale}px`,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {bottomValueText}
          </div>
        </div>
      </div>

      {/* ✅ MODAL */}
      <VerticalTankSettingsModal
        open={openModal}
        tank={tank}
        onClose={() => setOpenModal(false)}
        onSave={(nextTank) => {
          // prefer onChange (common pattern), fallback to mutating parent via onSave on modal if you pass it
          if (typeof onChange === "function") onChange(nextTank);
          setOpenModal(false);
        }}
      />
    </>
  );
}
