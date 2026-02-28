// src/components/GraphicDisplaySettingsModal.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import GraphicDisplaySettingsPanel from "./GraphicDisplaySettingsPanel";
import GraphicDisplayMathPanel from "./GraphicDisplayMathPanel";
import GraphicDisplayBindingPanel from "./GraphicDisplayBindingPanel";

// ✅ REMOVE 1s option (1000ms)
const SAMPLE_OPTIONS = [3000, 6000, 30000, 60000, 300000, 600000];
const FIXED_GRAPH_STYLE = "line";

// ✅ Models allowed
const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

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

function normalizeArray(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

function readDeviceId(row) {
  return (
    row?.deviceId ??
    row?.device_id ??
    row?.id ??
    row?.imei ??
    row?.IMEI ??
    row?.DEVICE_ID ??
    ""
  );
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

// ✅ COMMON POLLER READER (same idea as loader.js)
function getRowFromTelemetryMap(telemetryMap, modelKey, deviceId) {
  if (!telemetryMap || !modelKey || !deviceId) return null;

  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  const direct = telemetryMap?.[mk]?.[id];
  if (direct) return direct;

  const base = MODEL_META?.[mk]?.base || mk;
  const byBase = telemetryMap?.[base]?.[id];
  if (byBase) return byBase;

  return null;
}

/**
 * ✅ NO-SPAM LIVE ROW LOADER
 * - Prefer telemetryMap (common poller)
 * - Otherwise ONLY call /{base}/my-devices
 */
async function loadLiveRowForDevice(
  modelKey,
  deviceId,
  { telemetryMap, signal } = {}
) {
  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  // 1) Common poller (best)
  const fromCommon = getRowFromTelemetryMap(telemetryMap, mk, id);
  if (fromCommon) return fromCommon;

  // 2) Fallback: /my-devices only (NO 404/403/405 endpoints)
  const base = MODEL_META[mk]?.base || mk;
  const data = await apiGet(`/${base}/my-devices`, { signal });
  const arr = normalizeArray(data);

  const found =
    arr.find((r) => String(readDeviceId(r) || "").trim() === id) || null;

  return found;
}

function formatSampleLabel(ms) {
  // ✅ 1s removed
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

// ✅ normalize to #RRGGBB-ish default
function normalizeHexColor(v, fallback = "#0c5ac8") {
  const s = String(v || "").trim();
  if (!s) return fallback;

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;

  return fallback;
}

// ✅ Center calc (used by layout effect so you never see it jump)
function calcCenteredPos(panelW, estH = 640) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - estH) / 2));

  return { left, top };
}

export default function GraphicDisplaySettingsModal({
  open,
  tank,
  onClose,
  onSave,
  telemetryMap = null, // ✅ NEW: pass common poller map here
}) {
  if (!open) return null;

  // -------------------------
  // LEFT: chart settings
  // -------------------------
  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);

  // ✅ default sample to 3s now
  const [sampleMs, setSampleMs] = useState(3000);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [yUnits, setYUnits] = useState("");

  const [lineColor, setLineColor] = useState("#0c5ac8");

  // -------------------------
  // MIDDLE: math
  // -------------------------
  const [mathFormula, setMathFormula] = useState("");

  // -------------------------
  // RIGHT: binding
  // -------------------------
  const [bindModel, setBindModel] = useState("zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [bindField, setBindField] = useState("ai1");

  // -------------------------
  // ✅ LIVE VALUE for Math
  // -------------------------
  const [liveValue, setLiveValue] = useState(null);
  const [liveErr, setLiveErr] = useState("");

  // -------------------------
  // ✅ DRAG STATE
  // -------------------------
  const PANEL_W = 1180;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  // ✅ IMPORTANT: start centered immediately (no visible jump)
  const [pos, setPos] = useState(() => {
    try {
      return calcCenteredPos(PANEL_W, 640);
    } catch {
      return { left: 12, top: 12 };
    }
  });

  const [isDragging, setIsDragging] = useState(false);

  // ✅ Ensure centering happens BEFORE paint every time you open (no flash at top-left)
  useLayoutEffect(() => {
    if (!open) return;
    setPos(calcCenteredPos(PANEL_W, 640));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Optional: keep centered if user resizes window (only when not dragging)
  useEffect(() => {
    if (!open) return;

    const onResize = () => {
      if (dragRef.current.dragging) return;
      setPos(calcCenteredPos(PANEL_W, 640));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);

    // ✅ if old saved value was 1s (1000), force to 3s (3000)
    const incomingSample = Number(tank.sampleMs ?? 3000);
    const normalizedSample =
      incomingSample === 1000 ? 3000 : incomingSample;

    setSampleMs(
      SAMPLE_OPTIONS.includes(normalizedSample) ? normalizedSample : 3000
    );

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");

    setLineColor(normalizeHexColor(tank.lineColor ?? "#0c5ac8"));
    setMathFormula(tank.mathFormula ?? "");

    setBindModel(tank.bindModel ?? "zhc1921");
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");
  }, [tank]);

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const safeLineColor = normalizeHexColor(lineColor);
  const yRangeValid = safeYMax > safeYMin;

  const canApply = useMemo(() => {
    return yRangeValid && !!bindDeviceId && !!bindField;
  }, [yRangeValid, bindDeviceId, bindField]);

  // -------------------------
  // ✅ LIVE VALUE POLL (NO-SPAM)
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
          telemetryMap,
          signal: ctrl.signal,
        });

        if (cancelled) return;

        const value = row ? readAiField(row, bindField) : null;

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
        setLiveErr(
          "Could not read live value (check /my-devices response & fields)."
        );
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 3000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [open, bindModel, bindDeviceId, bindField, sampleMs, telemetryMap]);

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

    const maxLeft = Math.max(margin, w - margin - 240);
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
    if (
      t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")
    )
      return;

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
      <div
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W,
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
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
            cursor: isDragging ? "grabbing" : "grab",
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.95fr 1fr",
            gap: 14,
            padding: 14,
            background: "#f8fafc",
          }}
        >
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
            lineColor={safeLineColor}
            setLineColor={setLineColor}
          />

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
              telemetryMap={telemetryMap}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
                    title,
                    timeUnit,
                    window: safeWindow,
                    sampleMs,
                    yMin: safeYMin,
                    yMax: safeYMax,
                    yUnits,
                    graphStyle: FIXED_GRAPH_STYLE,
                    lineColor: safeLineColor,
                    mathFormula,
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