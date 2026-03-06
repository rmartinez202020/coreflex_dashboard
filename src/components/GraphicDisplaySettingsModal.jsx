// src/components/GraphicDisplaySettingsModal.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import GraphicDisplaySettingsPanel from "./GraphicDisplaySettingsPanel";
import GraphicDisplayMathPanel from "./GraphicDisplayMathPanel";
import GraphicDisplayBindingPanel from "./GraphicDisplayBindingPanel";

// ✅ Totalizer UI section (now includes Single Units too)
import GraphicDisplayTotalizerSection from "./controls/graphicDisplay/GraphicDisplayTotalizerSection";

// ✅ IMPORTANT: use SAME loader as the runtime GraphicDisplay (single source of truth)
import {
  getRowFromTelemetryMap,
  readAiField,
} from "./controls/graphicDisplay/loader";

// ✅ REMOVE 1s option (1000ms)
const SAMPLE_OPTIONS = [3000, 6000, 30000, 60000, 300000, 600000];
const FIXED_GRAPH_STYLE = "line";

// ✅ Models allowed (UI labels + bases)
const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// ✅ DEBUG SWITCH
const DEBUG_APPLY = true;

function dbgWarn(...args) {
  if (DEBUG_APPLY) console.warn(...args);
}
function dbgErr(...args) {
  if (DEBUG_APPLY) console.error(...args);
}

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

// ✅ POST helper (for Apply -> backend upsert)
async function apiPost(path, body) {
  const token = String(getToken() || "").trim();
  if (!token) throw new Error("Missing auth token. Please login again.");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body || {}),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(j?.detail || `POST ${path} failed (${res.status})`);
  }
  return j;
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

// ✅ Ensure bindModel is always canonical keys used by backend + common poller
function normalizeModelKey(m) {
  const s = String(m || "").trim().toLowerCase();
  if (s === "cf-2000" || s === "cf2000") return "zhc1921";
  if (s === "cf-1600" || s === "cf1600") return "zhc1661";
  // allow already-canonical
  if (s === "zhc1921" || s === "zhc1661") return s;
  return s;
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
  const mk = normalizeModelKey(modelKey);
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  // 1) Common poller (uses shared loader)
  const fromCommon = getRowFromTelemetryMap(telemetryMap, mk, id);
  if (fromCommon) return fromCommon;

  // 2) Fallback: /my-devices only
  const base = MODEL_META[mk]?.base || mk;
  const data = await apiGet(`/${base}/my-devices`, { signal });
  const arr = normalizeArray(data);

  const found =
    arr.find((r) => String(readDeviceId(r) || "").trim() === id) || null;
  return found;
}

function formatSampleLabel(ms) {
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

function normalizeHexColor(v, fallback = "#0c5ac8") {
  const s = String(v || "").trim();
  if (!s) return fallback;

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;

  return fallback;
}

// ✅ Center calc
function calcCenteredPos(panelW, estH = 660) {
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
  telemetryMap = null,
}) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!open) return;
    dbgErr("🧪 [GraphicDisplaySettingsModal] OPENED", {
      widgetId: tank?.id,
      shape: tank?.shape,
      hasOnSave: typeof onSave === "function",
    });
  }, [open, tank, onSave]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // LEFT: chart settings
  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);
  const [sampleMs, setSampleMs] = useState(3000);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);

  // Units now under totalizer (keep for backward compatibility)
  const [yUnits, setYUnits] = useState("");

  const [lineColor, setLineColor] = useState("#0c5ac8");

  // ✅ TOTALIZER
  const [totalizerEnabled, setTotalizerEnabled] = useState(false);
  const [totalizerUnit, setTotalizerUnit] = useState("");

  // ✅ SINGLE UNITS (NEW)
  const [singleUnitsEnabled, setSingleUnitsEnabled] = useState(false);
  const [singleUnit, setSingleUnit] = useState("");

  // MIDDLE: math
  const [mathFormula, setMathFormula] = useState("");

  // RIGHT: binding
  const [bindModel, setBindModel] = useState("zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [bindField, setBindField] = useState("ai1");

  // Live value for math
  const [liveValue, setLiveValue] = useState(null);
  const [liveErr, setLiveErr] = useState("");

  // ✅ DRAG STATE
  const PANEL_W = 1600;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => {
    try {
      return calcCenteredPos(PANEL_W, 700);
    } catch {
      return { left: 12, top: 12 };
    }
  });

  const [isDragging, setIsDragging] = useState(false);

  // ✅ prevent double-click spam and show disabled Apply while saving
  const [isApplying, setIsApplying] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setPos(calcCenteredPos(PANEL_W, 700));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onResize = () => {
      if (dragRef.current.dragging) return;
      setPos(calcCenteredPos(PANEL_W, 700));
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

    const incomingSample = Number(tank.sampleMs ?? 3000);
    const normalizedSample = incomingSample === 1000 ? 3000 : incomingSample;

    setSampleMs(
      SAMPLE_OPTIONS.includes(normalizedSample) ? normalizedSample : 3000
    );

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);

    const tEnabled = tank.totalizerEnabled === true;
    const tUnit = String(tank.totalizerUnit ?? tank.yUnits ?? "").trim();
    setTotalizerEnabled(tEnabled);
    setTotalizerUnit(tUnit);

    const sEnabled = tank.singleUnitsEnabled === true;
    const sUnit = String(tank.singleUnit ?? tank.singleUnitsUnit ?? "").trim();
    setSingleUnitsEnabled(sEnabled);
    setSingleUnit(sUnit);

    setYUnits(tUnit);

    setLineColor(normalizeHexColor(tank.lineColor ?? "#0c5ac8"));
    setMathFormula(tank.mathFormula ?? "");

    // ✅ normalize model key so the modal + apply always use canonical values
    setBindModel(normalizeModelKey(tank.bindModel ?? "zhc1921"));
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");
  }, [tank]);

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const safeLineColor = normalizeHexColor(lineColor);
  const yRangeValid = safeYMax > safeYMin;

  const canApply = useMemo(() => {
    return yRangeValid && !!bindDeviceId && !!bindField && !isApplying;
  }, [yRangeValid, bindDeviceId, bindField, isApplying]);

  // ✅ LIVE VALUE POLL
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
    if (e?.stopPropagation) e.stopPropagation();

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const actualW = Math.min(PANEL_W, Math.floor(w * 0.96));
    const estH = 700;

    const maxLeft = Math.max(margin, w - margin - actualW);
    const maxTop = Math.max(margin, h - margin - estH);

    setPos({
      left: Math.min(Math.max(margin, nextLeft), maxLeft),
      top: Math.min(Math.max(margin, nextTop), maxTop),
    });
  };

  const endDrag = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    dragRef.current.dragging = false;
    setIsDragging(false);
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;

    e.stopPropagation();

    const t = e.target;
    if (
      t?.closest?.(
        "button, input, select, textarea, a, [data-no-drag='true']"
      )
    )
      return;

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    window.addEventListener("mousemove", onDragMove, { passive: false });
    window.addEventListener("mouseup", endDrag, { passive: false });
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;
  if (!portalTarget) return null;

  const persistBinding = async () => {
    const wid = String(tank?.id || "").trim();
    if (!wid) throw new Error("Missing widget id (tank.id)");

    // ✅ include properties.* dashboardId too (Launch injects here sometimes)
    const dash =
      String(
        tank?.dashboard_id ||
          tank?.dashboardId ||
          tank?.properties?.dashboardId ||
          tank?.properties?.dashboard_id ||
          "main"
      ).trim() || "main";

    const normModel = normalizeModelKey(bindModel);

    dbgWarn("🌐 [GraphicDisplaySettingsModal] persistBinding START", {
      wid,
      dash,
      bindModel: normModel,
      bindDeviceId,
      bindField,
    });

    const res = await apiPost("/graphic-display-bindings/upsert", {
      dashboard_id: dash,
      widget_id: wid,

      bind_model: String(normModel || "zhc1921").toLowerCase(),
      bind_device_id: String(bindDeviceId || "").trim(),
      bind_field: String(bindField || "ai1").trim(),

      title: String(title || "Graphic Display").trim(),
      time_unit: String(timeUnit || "seconds").trim(),
      window_size: Number(safeWindow) || 60,
      sample_ms: Number(sampleMs) || 3000,
      y_min: Number.isFinite(safeYMin) ? safeYMin : 0,
      y_max: Number.isFinite(safeYMax) ? safeYMax : 100,
      line_color: String(safeLineColor || "#0c5ac8").trim(),
      graph_style: "line",

      math_formula: String(mathFormula || ""),

      totalizer_enabled: !!totalizerEnabled,
      totalizer_unit: String(totalizerUnit || "").trim(),

      single_units_enabled: !!singleUnitsEnabled,
      single_unit: String(singleUnit || "").trim(),

      retention_days: 35,
      is_enabled: true,
    });

    dbgWarn("🌐 [GraphicDisplaySettingsModal] persistBinding OK", res);
    return res;
  };

  const handleApply = async (e) => {
    try {
      e?.stopPropagation?.();
      e?.preventDefault?.();

      dbgErr("🧪 [GraphicDisplaySettingsModal] APPLY CLICKED", {
        canApply,
        yRangeValid,
        bindDeviceId,
        bindField,
        isApplying,
      });

      if (!yRangeValid || !bindDeviceId || !bindField) return;
      if (isApplying) return;

      setIsApplying(true);

      const normModel = normalizeModelKey(bindModel);

      // ✅ 1) persist backend row
      await persistBinding();

      // ✅ 2) update widget in UI/state (AppModals will save the project)
      const nextTank = {
        ...tank,
        title,
        timeUnit,
        window: safeWindow,
        sampleMs,
        yMin: safeYMin,
        yMax: safeYMax,

        yUnits: totalizerUnit,

        graphStyle: FIXED_GRAPH_STYLE,
        lineColor: safeLineColor,
        mathFormula,
        bindModel: normModel,
        bindDeviceId,
        bindField,

        totalizerEnabled: !!totalizerEnabled,
        totalizerUnit: String(totalizerUnit || "").trim(),

        singleUnitsEnabled: !!singleUnitsEnabled,
        singleUnit: String(singleUnit || "").trim(),
      };

      dbgWarn("✅ [GraphicDisplaySettingsModal] calling onSave(nextTank)", {
        id: nextTank?.id,
        shape: nextTank?.shape,
      });

      onSave?.(nextTank);
    } catch (err) {
      console.error("❌ Apply failed:", err);
      alert(err?.message || "Apply failed");
    } finally {
      setIsApplying(false);
    }
  };

  const modal = (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
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
            type="button"
            data-no-drag="true"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
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
            gridTemplateColumns: "0.95fr 1.15fr 0.95fr 1fr",
            gap: 14,
            padding: 14,
            background: "#f8fafc",
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <GraphicDisplayTotalizerSection
              enabled={totalizerEnabled}
              onToggleEnabled={(v) => {
                const next = !!v;
                if (next) setSingleUnitsEnabled(false);
                setTotalizerEnabled(next);
              }}
              totalizerUnit={totalizerUnit}
              onChangeUnit={(u) => {
                const unit = String(u ?? "");
                setTotalizerUnit(unit);
                setYUnits(unit);
              }}
              singleEnabled={singleUnitsEnabled}
              onToggleSingleEnabled={(v) => {
                const next = !!v;
                if (next) setTotalizerEnabled(false);
                setSingleUnitsEnabled(next);
              }}
              singleUnit={singleUnit}
              onChangeSingleUnit={(u) => {
                setSingleUnit(String(u ?? ""));
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
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
              setYUnits={(u) => {
                const unit = String(u ?? "");
                setYUnits(unit);
                setTotalizerUnit(unit);
              }}
              lineColor={safeLineColor}
              setLineColor={setLineColor}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              alignContent: "start",
              minWidth: 0,
            }}
          >
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

          <div
            style={{
              display: "grid",
              gap: 12,
              alignContent: "start",
              minWidth: 0,
            }}
          >
            <GraphicDisplayBindingPanel
              bindModel={bindModel}
              setBindModel={(v) => setBindModel(normalizeModelKey(v))}
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
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
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
                type="button"
                disabled={!canApply}
                onClick={handleApply}
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
                  opacity: isApplying ? 0.85 : 1,
                }}
                title="Apply (persists binding + updates widget; AppModals saves dashboard)"
              >
                {isApplying ? "Saving..." : "Apply"}
              </button>
            </div>

            {DEBUG_APPLY && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#991b1b",
                  textAlign: "right",
                }}
              >
                DEBUG_APPLY ON
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, portalTarget);
}