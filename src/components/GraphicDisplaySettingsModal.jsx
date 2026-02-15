import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

import GraphicDisplaySettingsPanel from "./GraphicDisplaySettingsPanel";
import GraphicDisplayMathPanel from "./GraphicDisplayMathPanel";
import GraphicDisplayBindingPanel from "./GraphicDisplayBindingPanel";

// ✅ Updated sampling options (ms)
const SAMPLE_OPTIONS = [1000, 3000, 6000, 30000, 60000, 300000, 600000];

// ✅ Graph style is FIXED to LINE (no UI)
const FIXED_GRAPH_STYLE = "line";

// ✅ Models allowed (labels WITHOUT ZHCxxxx)
const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers (for live VALUE polling)
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

async function loadDevicesForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;
  const candidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/devices", "/zhc1661/list", "/zhc1661"];

  let lastErr = null;

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      const out = arr
        .map((r) => {
          const deviceId =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";

          if (!deviceId) return null;

          return {
            deviceId: String(deviceId),
            status: String(r.status ?? r.online ?? "").toLowerCase(),
            lastSeen: r.lastSeen ?? r.last_seen ?? r.updatedAt ?? r.updated_at,
          };
        })
        .filter(Boolean);

      return out;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("No device endpoint matched");
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
    } catch (e) {
      // continue
    }
  }

  // fallback: just confirm it exists; caller can do list-raw fallback if needed
  const list = await loadDevicesForModel(modelKey, { signal });
  const found = list.find((d) => String(d.deviceId) === String(deviceId));
  if (!found) return null;

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

function formatSampleLabel(ms) {
  if (ms === 1000) return "1s";
  if (ms === 3000) return "3s";
  if (ms === 6000) return "6s";
  if (ms === 30000) return "30s";
  if (ms === 60000) return "1 min";
  if (ms === 300000) return "5 min";
  if (ms === 600000) return "10 min";
  if (ms % 60000 === 0) return `${ms / 60000} min`;
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${ms} ms`;
}

export default function GraphicDisplaySettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open) return null;

  // -------------------------
  // LEFT: chart settings
  // -------------------------
  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);
  const [sampleMs, setSampleMs] = useState(1000);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [yUnits, setYUnits] = useState("");

  // -------------------------
  // MIDDLE: math
  // -------------------------
  const [mathFormula, setMathFormula] = useState("");

  // -------------------------
  // RIGHT: tag binding (kept in parent for saving)
  // -------------------------
  const [bindModel, setBindModel] = useState("zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [bindField, setBindField] = useState("ai1");

  // -------------------------
  // ✅ LIVE VALUE for Math (poll in parent so Math always works)
  // -------------------------
  const [liveValue, setLiveValue] = useState(null);
  const [liveErr, setLiveErr] = useState("");

  // -------------------------
  // ✅ DRAG STATE
  // -------------------------
  const PANEL_W = 1180; // ✅ wider window
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [didInitPos, setDidInitPos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ center on open (only once per open)
  useEffect(() => {
    if (!open) return;
    setDidInitPos(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (didInitPos) return;

    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const width = Math.min(PANEL_W, Math.floor(w * 0.96));
    const estHeight = 640;

    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - estHeight) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

  // Load from tank when opening/editing
  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);

    const incomingSample = Number(tank.sampleMs ?? 1000);
    setSampleMs(SAMPLE_OPTIONS.includes(incomingSample) ? incomingSample : 1000);

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");

    setMathFormula(tank.mathFormula ?? "");

    setBindModel(tank.bindModel ?? "zhc1921");
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");
  }, [tank]);

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const yRangeValid = safeYMax > safeYMin;

  const canApply = useMemo(() => {
    return yRangeValid && !!bindDeviceId && !!bindField;
  }, [yRangeValid, bindDeviceId, bindField]);

  // -------------------------
  // ✅ LIVE VALUE POLL (for Math)
  // -------------------------
  useEffect(() => {
    if (!open) return;

    if (!bindModel || !bindDeviceId || !bindField) {
      setLiveValue(null);
      setLiveErr("");
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setLiveErr("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        let value = null;

        if (row) {
          value = readAiField(row, bindField);
        } else {
          // fallback: call list raw and find by id (some list endpoints include AI fields)
          const base = MODEL_META[bindModel]?.base || bindModel;

          const rawCandidates =
            base === "zhc1921"
              ? [
                  "/zhc1921/devices",
                  "/zhc1921/my-devices",
                  "/zhc1921/list",
                  "/zhc1921",
                ]
              : [
                  "/zhc1661/devices",
                  "/zhc1661/my-devices",
                  "/zhc1661/list",
                  "/zhc1661",
                ];

          let rawArr = [];
          for (const p of rawCandidates) {
            try {
              const data = await apiGet(p, { signal: ctrl.signal });
              rawArr = Array.isArray(data)
                ? data
                : Array.isArray(data?.devices)
                ? data.devices
                : Array.isArray(data?.rows)
                ? data.rows
                : [];
              if (rawArr.length) break;
            } catch (e) {
              // continue
            }
          }

          const rawRow =
            rawArr.find((r) => {
              const id =
                r.deviceId ??
                r.device_id ??
                r.id ??
                r.imei ??
                r.IMEI ??
                r.DEVICE_ID ??
                "";
              return String(id) === String(bindDeviceId);
            }) || null;

          if (rawRow) value = readAiField(rawRow, bindField);
        }

        if (cancelled) return;

        const num =
          value === null || value === undefined || value === ""
            ? null
            : typeof value === "number"
            ? value
            : Number(value);

        setLiveValue(Number.isFinite(num) ? num : value ?? null);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setLiveErr("Could not read live value (check API endpoint / fields).");
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 1000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [open, bindModel, bindDeviceId, bindField, sampleMs]);

  // ✅ DRAG handlers
  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const maxLeft = Math.max(margin, w - margin - 240); // ✅ keep some width visible
    const maxTop = Math.max(margin, h - margin - 120);

    setPos({
      left: Math.min(Math.max(margin, nextLeft), maxLeft),
      top: Math.min(Math.max(margin, nextTop), maxTop),
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;

    const t = e.target;
    if (t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")) {
      return;
    }

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", endDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      {/* MAIN PANEL */}
      <div
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W, // ✅ wider
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* HEADER BAR (DRAG HANDLE) */}
        <div
          onMouseDown={startDrag}
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg,#0b1b33,#0a1730)",
            color: "#fff",
            cursor: isDragging ? "grabbing" : "grab", // ✅ hand grab
            userSelect: "none",
          }}
          title="Drag to move"
        >
          <div>Graphic Display</div>
          <button
            data-no-drag="true"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY: 3 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.95fr 1fr",
            gap: 14,
            padding: 14,
            background: "#f8fafc",
          }}
        >
          {/* LEFT: Display Settings */}
          <GraphicDisplaySettingsPanel
            title={title}
            setTitle={setTitle}
            timeUnit={timeUnit}
            setTimeUnit={setTimeUnit}
            windowSize={windowSize}
            setWindowSize={setWindowSize}
            sampleMs={sampleMs}
            setSampleMs={setSampleMs}
            yMin={safeYMin}
            setYMin={setYMin}
            yMax={safeYMax}
            setYMax={setYMax}
            yUnits={yUnits}
            setYUnits={setYUnits}
          />

          {/* MIDDLE: Math */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <GraphicDisplayMathPanel
              value={liveValue}
              formula={mathFormula}
              setFormula={setMathFormula}
            />

            {liveErr && (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#991b1b",
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {liveErr}
              </div>
            )}
          </div>

          {/* RIGHT: Binding + Actions */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <GraphicDisplayBindingPanel
              bindModel={bindModel}
              setBindModel={setBindModel}
              bindDeviceId={bindDeviceId}
              setBindDeviceId={setBindDeviceId}
              bindField={bindField}
              setBindField={setBindField}
              sampleMs={sampleMs}
              formatSampleLabel={formatSampleLabel}
            />

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!canApply}
                onClick={() =>
                  onSave({
                    ...tank,
                    // chart settings
                    title,
                    timeUnit,
                    window: safeWindow,
                    sampleMs,
                    yMin: safeYMin,
                    yMax: safeYMax,
                    yUnits,
                    graphStyle: FIXED_GRAPH_STYLE,

                    // ✅ math
                    mathFormula,

                    // ✅ binding
                    bindModel,
                    bindDeviceId,
                    bindField,
                  })
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bfe6c8",
                  background: canApply
                    ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                    : "#e5e7eb",
                  color: "#0b3b18",
                  fontWeight: 900,
                  cursor: canApply ? "pointer" : "not-allowed",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
