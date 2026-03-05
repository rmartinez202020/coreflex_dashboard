// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  computeMathOutput,
  msPerUnit,
  fmtTimeWithDate,
} from "./graphicDisplay/utils";
import { getRowFromTelemetryMap, readAiField } from "./graphicDisplay/loader";
import usePingZoom from "./graphicDisplay/hooks/usePingZoom";
import useTrendSvg from "./graphicDisplay/hooks/useTrendSvg";
import useTrendLayout from "./graphicDisplay/hooks/useTrendLayout";
import GraphicDisplayExplorePortal from "./graphicDisplay/GraphicDisplayExplorePortal";
import GraphicDisplayPanel from "./graphicDisplay/GraphicDisplayPanel";

const DEFAULT_LINE_COLOR = "#0c5ac8";

function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
}

function normalizeOnlineStatusFromRow(row) {
  if (!row) return { online: null, label: "--" };
  const raw =
    row.status ??
    row.deviceStatus ??
    row.state ??
    row.online ??
    row.isOnline ??
    row.connected ??
    row.connection ??
    row.connectionStatus ??
    row.aws_status ??
    row.awsStatus ??
    row.clientStatus ??
    null;

  const s = String(raw ?? "").trim().toLowerCase();
  if (raw === true || raw === 1) return { online: true, label: "ONLINE" };
  if (raw === false || raw === 0) return { online: false, label: "OFFLINE" };

  if (
    ["online", "connected", "ok", "active", "up", "true", "yes", "1"].includes(s)
  )
    return { online: true, label: "ONLINE" };
  if (
    ["offline", "disconnected", "down", "inactive", "false", "no", "0"].includes(
      s
    )
  )
    return { online: false, label: "OFFLINE" };

  return { online: null, label: "--" };
}

// ✅ Detect Launch mode robustly (query, path, hash)
function detectLaunchMode() {
  if (typeof window === "undefined") return false;

  const href = String(window.location.href || "").toLowerCase();
  const path = String(window.location.pathname || "").toLowerCase();
  const hash = String(window.location.hash || "").toLowerCase();

  // common patterns:
  // - ?mode=launch
  // - ?launch=1 / true
  // - /launch route
  // - #/launch or contains "launch" in hash
  try {
    const url = new URL(window.location.href);
    const mode = String(url.searchParams.get("mode") || "").toLowerCase();
    const launch =
      url.searchParams.get("launch") === "1" ||
      url.searchParams.get("launch") === "true";
    if (mode === "launch" || launch) return true;
  } catch {
    // ignore
  }

  if (path.includes("launch")) return true;
  if (hash.includes("launch")) return true;

  // last resort: any hint in href (still safe)
  if (href.includes("mode=launch")) return true;
  if (href.includes("launch=1") || href.includes("launch=true")) return true;

  return false;
}

function exportPointsCsv({
  title = "Graphic Display",
  points = [],
  fmt = (t) => new Date(t).toISOString(),
  filePrefix = "graphic-display",
} = {}) {
  const safeTitle =
    String(title || "Graphic Display")
      .replace(/[^\w\- ]+/g, "")
      .trim() || "Graphic Display";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${filePrefix}-${safeTitle}-${stamp}.csv`;

  const header = "timestamp_iso,epoch_ms,y\n";
  const rows = (points || []).map((p) => {
    const t = Number(p?.t);
    const y = p?.y;
    const iso = Number.isFinite(t) ? fmt(t) : "";
    const yy = y === null || y === undefined ? "" : String(y);
    return `${iso},${Number.isFinite(t) ? t : ""},${yy}`;
  });

  const csv = header + rows.join("\n") + (rows.length ? "\n" : "");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function prunePointsByWindow(points, windowSize, timeUnit) {
  const arr = Array.isArray(points) ? points : [];
  const win = Number.isFinite(windowSize) ? Math.max(1, Number(windowSize)) : 60;
  const unitMs = msPerUnit(timeUnit || "seconds");
  const keepMs = win * unitMs;
  const bufferMs = Math.min(keepMs * 0.15, 30_000);
  const cutoff = Date.now() - (keepMs + bufferMs);

  const cleaned = arr
    .map((p) => ({
      t: Number(p?.t),
      y: p?.y,
      gap: !!p?.gap,
    }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t)
    .filter((p) => p.t >= cutoff);

  return cleaned;
}

/**
 * ✅ TOTALIZER HELPERS
 * totalizerUnit = RATE unit (ex: GPM, kW, kg/s)
 * We integrate rate over time to get TOTAL.
 */
const RATE_TO_TOTAL_UNIT = {
  GPM: "gal",
  GPH: "gal",
  BPD: "bbl",
  "BBL/h": "bbl",

  CFM: "ft³",
  SCFM: "ft³",
  ACFM: "ft³",

  LPM: "L",
  LPH: "L",
  "m³/h": "m³",
  "m³/min": "m³",

  "kg/h": "kg",
  "kg/min": "kg",
  "kg/s": "kg",

  "lb/h": "lb",
  "lb/min": "lb",
  "ton/h": "ton",

  kW: "kWh",
  W: "Wh",
  MW: "MWh",
  "BTU/h": "BTU",
  "MBTU/h": "MBTU",
};

function rateUnitToTimeBase(rateUnit) {
  const u = String(rateUnit || "").trim();

  // per minute
  if (
    ["GPM", "CFM", "SCFM", "ACFM", "LPM", "m³/min", "kg/min", "lb/min"].includes(
      u
    )
  )
    return "minute";

  // per hour
  if (
    [
      "GPH",
      "BBL/h",
      "LPH",
      "m³/h",
      "kg/h",
      "lb/h",
      "ton/h",
      "kW",
      "BTU/h",
      "MBTU/h",
    ].includes(u)
  )
    return "hour";

  // per second
  if (["kg/s", "W"].includes(u)) return "second";

  // per day
  if (["BPD"].includes(u)) return "day";

  return "";
}

function integrateRateToTotal(points, rateUnit) {
  const base = rateUnitToTimeBase(rateUnit);
  if (!base) return null;

  const arr = Array.isArray(points) ? points : [];
  const clean = arr
    .filter((p) => !p?.gap)
    .map((p) => ({ t: Number(p?.t), y: Number(p?.y) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y))
    .sort((a, b) => a.t - b.t);

  if (clean.length < 2) return 0;

  let total = 0;

  for (let i = 1; i < clean.length; i++) {
    const p1 = clean[i - 1];
    const p2 = clean[i];

    const dtMs = p2.t - p1.t;
    if (!Number.isFinite(dtMs) || dtMs <= 0) continue;

    let dtBase = 0;
    if (base === "minute") dtBase = dtMs / 60000;
    else if (base === "hour") dtBase = dtMs / 3600000;
    else if (base === "second") dtBase = dtMs / 1000;
    else if (base === "day") dtBase = dtMs / 86400000;

    if (!Number.isFinite(dtBase) || dtBase <= 0) continue;

    // trapezoidal integration
    const avgRate = (p1.y + p2.y) / 2;
    total += avgRate * dtBase;
  }

  return total;
}

export default function GraphicDisplay({
  tank,
  telemetryMap = null, // ✅ common poller map
  isPlay = false, // ✅ should be true in Play/Launch

  // ✅ OPTIONAL: if parent provides a saver, we will call it.
  // If not provided, we still update locally so the widget reflects the new config.
  onSaveSettings,

  // ✅ NEW: delegate opening the settings modal to AppModals (so Apply saves project)
  onOpenSettings: onOpenSettingsProp = null,
}) {
  // ✅ Treat Launch like Play (Run mode)
  const isRunMode = useMemo(() => {
    return !!isPlay || detectLaunchMode();
  }, [isPlay]);

  // ✅ Local override so Settings changes reflect immediately even if parent saves async
  const [localTank, setLocalTank] = useState(null);
  useEffect(() => {
    setLocalTank(null);
  }, [tank]);

  const T = localTank ?? tank;

  const title = T?.title ?? "Graphic Display";
  const timeUnit = T?.timeUnit ?? "seconds";
  const windowSize = Number(T?.window ?? 60);
  const sampleMs = Number(T?.sampleMs ?? 1000);
  const yMin = Number.isFinite(T?.yMin) ? T.yMin : 0;
  const yMax = Number.isFinite(T?.yMax) ? T.yMax : 100;

  // NOTE: yUnits is still used for Y axis labeling (legacy)
  const yUnits = T?.yUnits ?? "";

  const graphStyle = T?.graphStyle ?? "line";
  const bindModel = T?.bindModel ?? "zhc1921";
  const bindDeviceId = String(T?.bindDeviceId ?? "").trim();
  const bindField = String(T?.bindField ?? "ai1").trim();
  const mathFormula = T?.mathFormula ?? "";
  const lineColor = normalizeLineColor(T?.lineColor);

  // ✅ Single Units config saved from modal
  const tankSingleEnabled = T?.singleUnitsEnabled === true;
  const tankSingleUnit = String(
    T?.singleUnitsUnit ?? T?.singleUnit ?? ""
  ).trim();

  const [singleUnitsEnabled, setSingleUnitsEnabled] =
    useState(tankSingleEnabled);
  const [singleUnitsUnit, setSingleUnitsUnit] = useState(tankSingleUnit);

  // ✅ Totalizer config saved from modal
  const tankTotEnabled = T?.totalizerEnabled === true;
  const totalizerRateUnit = String(T?.totalizerUnit ?? "").trim();
  const totalizerTotalUnit = RATE_TO_TOTAL_UNIT[totalizerRateUnit] || "";

  // ✅ Runtime control for Enable/Disable from header buttons
  const [totEnabled, setTotEnabled] = useState(tankTotEnabled);
  const [totalizerResetAt, setTotalizerResetAt] = useState(0);

  // keep runtime in sync if tank changes (like loading a different widget)
  useEffect(() => {
    const nextSingleEnabled = T?.singleUnitsEnabled === true;
    const nextSingleUnit = String(
      T?.singleUnitsUnit ?? T?.singleUnit ?? ""
    ).trim();

    setSingleUnitsEnabled(nextSingleEnabled);
    setSingleUnitsUnit(nextSingleUnit);

    // If Single Units is enabled, Totalizer must be OFF (runtime)
    const nextTotEnabled = nextSingleEnabled ? false : tankTotEnabled;
    setTotEnabled(nextTotEnabled);

    setTotalizerResetAt(0);
  }, [
    tankTotEnabled,
    T?.singleUnitsEnabled,
    T?.singleUnitsUnit,
    T?.singleUnit,
    T?.id,
    T?.widgetId,
    T?.widget_id,
    bindDeviceId,
    bindField,
  ]);

  // Safety: if Single Units becomes enabled at runtime, force totalizer off.
  useEffect(() => {
    if (singleUnitsEnabled && totEnabled) setTotEnabled(false);
  }, [singleUnitsEnabled, totEnabled]);

  const DEBUG = useMemo(() => {
    if (T?.debug) return true;
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    if (url.searchParams.get("gddebug") === "1") return true;
    return false;
  }, [T]);

  const dbgKey = useMemo(() => {
    const widgetId = T?.id ?? T?.widgetId ?? T?.widget_id ?? T?.uuid ?? "";
    return widgetId
      ? `widget:${widgetId}`
      : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
  }, [T, bindModel, bindDeviceId, bindField]);

  function dbg(...args) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.log(`[GraphicDisplay] ${dbgKey}`, ...args);
  }
  function dbgWarn(...args) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.warn(`[GraphicDisplay] ${dbgKey}`, ...args);
  }
  function dbgErr(...args) {
    if (!DEBUG) return;
    // eslint-disable-next-line no-console
    console.error(`[GraphicDisplay] ${dbgKey}`, ...args);
  }

  const storageKey = useMemo(() => {
    const widgetId = T?.id ?? T?.widgetId ?? T?.widget_id ?? T?.uuid ?? "";
    const base = widgetId
      ? `widget:${widgetId}`
      : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
    return `coreflex:graphicDisplay:points:${base}`;
  }, [T, bindModel, bindDeviceId, bindField]);

  const yDivs = Number.isFinite(T?.yDivs) ? Math.max(2, T.yDivs) : 10;
  const xDivs = Number.isFinite(T?.xDivs) ? Math.max(2, T.xDivs) : 12;
  const yMinor = Number.isFinite(T?.yMinor) ? Math.max(1, T.yMinor) : 2;
  const xMinor = Number.isFinite(T?.xMinor) ? Math.max(1, T.xMinor) : 2;

  const { styleBadge, yTicks, gridBackground } = useTrendLayout({
    graphStyle,
    yMin,
    yMax,
    yDivs,
    xDivs,
    yMinor,
    xMinor,
  });

  const [liveValue, setLiveValue] = useState(null);
  const [mathOutput, setMathOutput] = useState(null);
  const [err, setErr] = useState("");
  const [deviceOnline, setDeviceOnline] = useState(null);
  const [points, setPoints] = useState([]);

  const [isPlaying, setIsPlaying] = useState(true);

  // ✅ Explore modal state
  const [exploreOpen, setExploreOpen] = useState(false);

  // 🔎 one-time: log binding
  useEffect(() => {
    dbg("MOUNT / bind", {
      isPlay,
      isRunMode,
      isPlaying,
      bindModel,
      bindDeviceId,
      bindField,
      sampleMs,
      windowSize,
      timeUnit,
      mathFormula,
      tankTotEnabled,
      totEnabled,
      totalizerRateUnit,
      totalizerTotalUnit,
      singleUnitsEnabled,
      singleUnitsUnit,
      telemetryMapType: telemetryMap ? typeof telemetryMap : "null",
      telemetryMapKeys:
        telemetryMap && typeof telemetryMap === "object"
          ? Object.keys(telemetryMap).slice(0, 10)
          : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bindDeviceId || !bindField) return;

    if (!isPlaying) {
      setPoints((prev) => {
        const t = Date.now();
        const last = prev.length ? prev[prev.length - 1] : null;
        if (last?.gap) return prev;
        dbg("PAUSE: inserting GAP point", { t });
        return [...prev, { t, y: null, gap: true }];
      });
    }
  }, [isPlaying, bindDeviceId, bindField]);

  const maxPoints = useMemo(() => {
    const win = Number.isFinite(windowSize) ? Math.max(2, windowSize) : 60;
    const smp = Number.isFinite(sampleMs) ? Math.max(250, sampleMs) : 1000;
    const units = msPerUnit(timeUnit);
    const totalMs = win * units;
    return Math.max(2, Math.round(totalMs / smp));
  }, [windowSize, sampleMs, timeUnit]);

  const maxPointsRef = useRef(maxPoints);
  useEffect(() => {
    maxPointsRef.current = maxPoints;
  }, [maxPoints]);

  // LOAD points on binding change
  useEffect(() => {
    if (!bindDeviceId || !bindField) {
      dbgWarn("LOAD: missing bindDeviceId or bindField -> clearing points");
      setPoints([]);
      setDeviceOnline(null);
      return;
    }

    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? safeJsonParse(raw) : null;

    const loaded = Array.isArray(parsed?.points)
      ? parsed.points
      : Array.isArray(parsed)
      ? parsed
      : [];
    const pruned = prunePointsByWindow(loaded, windowSize, timeUnit);

    dbg("LOAD: localStorage", {
      storageKey,
      rawSize: raw ? raw.length : 0,
      loadedCount: loaded.length,
      prunedCount: pruned.length,
    });

    setPoints(pruned);

    const lastNumeric = [...pruned]
      .reverse()
      .find((p) => Number.isFinite(Number(p?.y)));
    if (lastNumeric) setMathOutput(Number(lastNumeric.y));
  }, [storageKey, bindDeviceId, bindField, windowSize, timeUnit]);

  // SAVE points debounced
  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (!bindDeviceId || !bindField) return;

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      const pruned = prunePointsByWindow(points, windowSize, timeUnit);
      const limit = Math.max(50, Number(maxPointsRef.current || 200));
      const finalPoints =
        pruned.length > limit ? pruned.slice(pruned.length - limit) : pruned;

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            v: 1,
            savedAt: Date.now(),
            bind: { bindModel, bindDeviceId, bindField },
            points: finalPoints,
          })
        );
      } catch (e) {
        dbgWarn("SAVE: localStorage error (quota?)", e);
      }
    }, 350);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [
    points,
    storageKey,
    bindDeviceId,
    bindField,
    windowSize,
    timeUnit,
    bindModel,
  ]);

  const lastSampleAtRef = useRef(0);

  // ✅ MAIN POLL (telemetryMap sync)
  useEffect(() => {
    // ✅ IMPORTANT: Launch must behave like Play
    if (!isRunMode) return;
    if (!isPlaying) return;

    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      setDeviceOnline(null);
      return;
    }

    try {
      setErr("");

      const row = getRowFromTelemetryMap(telemetryMap, bindModel, bindDeviceId);

      const st = normalizeOnlineStatusFromRow(row);
      setDeviceOnline(st.online);

      const raw = row ? readAiField(row, bindField) : null;

      let safeLive = null;
      if (raw === null || raw === undefined || raw === "") {
        safeLive = null;
      } else if (typeof raw === "number") {
        safeLive = Number.isFinite(raw) ? raw : null;
      } else {
        const parsed = Number(String(raw).replace(",", ".").trim());
        safeLive = Number.isFinite(parsed) ? parsed : null;
      }

      const out = computeMathOutput(safeLive, mathFormula);

      setLiveValue(safeLive);
      setMathOutput(out);

      const now = Date.now();
      const smp = Math.max(250, Number(sampleMs) || 1000);
      const last = lastSampleAtRef.current || 0;

      if (now - last < smp) return;
      lastSampleAtRef.current = now;

      if (Number.isFinite(out)) {
        setPoints((prev) => {
          const next = [...prev, { t: now, y: out }];
          const pruned = prunePointsByWindow(next, windowSize, timeUnit);
          const limit = maxPointsRef.current || 2;
          if (pruned.length > limit) pruned.splice(0, pruned.length - limit);
          return pruned;
        });
      }
    } catch (e) {
      dbgErr("POLL ERROR:", e);
      setErr("Trend read failed (common poller map).");
      setDeviceOnline(false);
    }
  }, [
    isRunMode,
    isPlaying,
    telemetryMap,
    bindModel,
    bindDeviceId,
    bindField,
    sampleMs,
    mathFormula,
    windowSize,
    timeUnit,
  ]);

  const { plotRef, sel, hover, timeTicks, pointsForView, handlers } =
    usePingZoom({
      points,
      yMin: Number(yMin),
      yMax: Number(yMax),
      fmtTimeWithDate,
      hoverAnywhere: exploreOpen, // ✅ ONLY while Explore modal is open (Explore IN)
    });

  const { svg } = useTrendSvg({
    points,
    pointsForView,
    yMin,
    yMax,
    dbg,
    dbgWarn,
  });

  // ✅ Compute totalizer value over the CURRENT VISIBLE data (pointsForView)
  // ✅ If reset is used, integrate only points AFTER totalizerResetAt
  const totalizerValue = useMemo(() => {
    if (singleUnitsEnabled) return null;
    if (!totEnabled) return null;
    if (!totalizerRateUnit) return null;
    if (!totalizerTotalUnit) return null;

    const srcBase = (pointsForView?.length ? pointsForView : points) || [];
    const src = totalizerResetAt
      ? srcBase.filter((p) => Number(p?.t) >= Number(totalizerResetAt || 0))
      : srcBase;

    const total = integrateRateToTotal(src, totalizerRateUnit);
    return Number.isFinite(total) ? total : null;
  }, [
    singleUnitsEnabled,
    totEnabled,
    totalizerRateUnit,
    totalizerTotalUnit,
    pointsForView,
    points,
    totalizerResetAt,
  ]);

  const statusLabel = useMemo(() => {
    if (!bindDeviceId)
      return {
        text: "--",
        color: "#64748b",
        bg: "rgba(148,163,184,0.16)",
        border: "rgba(148,163,184,0.35)",
      };
    if (deviceOnline === true)
      return {
        text: "ONLINE",
        color: "#16a34a",
        bg: "rgba(187,247,208,0.55)",
        border: "rgba(22,163,74,0.25)",
      };
    if (deviceOnline === false)
      return {
        text: "OFFLINE",
        color: "#dc2626",
        bg: "rgba(254,202,202,0.55)",
        border: "rgba(220,38,38,0.25)",
      };
    return {
      text: "--",
      color: "#64748b",
      bg: "rgba(148,163,184,0.16)",
      border: "rgba(148,163,184,0.35)",
    };
  }, [deviceOnline, bindDeviceId]);

  // ✅ Totalizer header control handlers
  const onTotalizerEnable = () => {
    if (singleUnitsEnabled) return; // Single Units wins
    setTotEnabled(true);
    dbg("TOTALIZER: enabled from header");
  };

  const onTotalizerDisable = () => {
    setTotEnabled(false);
    dbg("TOTALIZER: disabled from header");
  };

  const onTotalizerReset = () => {
    if (singleUnitsEnabled) return; // Single Units wins
    const t = Date.now();
    setTotalizerResetAt(t);
    dbg("TOTALIZER: reset from header", { resetAt: t });
  };

  // ✅ Unit label used on the chart/UI
  const displayUnits = useMemo(() => {
    const su = String(singleUnitsUnit || "").trim();
    const yu = String(yUnits || "").trim();
    const rateU = String(totalizerRateUnit || "").trim();

    if (singleUnitsEnabled) return su || yu || "";
    if (totEnabled && rateU) return rateU;
    return yu || "";
  }, [
    singleUnitsEnabled,
    singleUnitsUnit,
    yUnits,
    totEnabled,
    totalizerRateUnit,
  ]);

  // ✅ Settings button handler (delegates to parent/AppModals)
  const onOpenSettings = () => {
    dbg("SETTINGS: open");
    if (typeof onOpenSettingsProp === "function") {
      onOpenSettingsProp();
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[GraphicDisplay] onOpenSettings was clicked, but no onOpenSettings prop was provided. Pass it from DraggableGraphicDisplay so AppModals opens the settings modal."
    );
  };

  // ✅ When modal applies: update local tank + call optional parent saver
  // NOTE: This still exists for compatibility if you reuse this component elsewhere,
  // but the main dashboard flow should save via AppModals.
  const handleSettingsSave = (nextTank) => {
    setLocalTank(nextTank);

    if (typeof onSaveSettings === "function") {
      onSaveSettings(nextTank);
      return;
    }
    if (typeof tank?.onSave === "function") {
      tank.onSave(nextTank);
      return;
    }
    if (typeof tank?.onUpdate === "function") {
      tank.onUpdate(nextTank);
      return;
    }

    // eslint-disable-next-line no-console
    console.warn(
      "[GraphicDisplay] Settings saved locally, but no parent onSaveSettings / tank.onSave handler was found."
    );
  };

  function buildPanel(isExploreMode) {
    return (
      <GraphicDisplayPanel
        // mode
        isExploreMode={isExploreMode}
        // ✅ IMPORTANT: pass run-mode to panel (launch behaves like play)
        isPlay={isRunMode}
        // header/meta
        title={title}
        lineColor={lineColor}
        styleBadge={styleBadge}
        statusLabel={statusLabel}
        bindDeviceId={bindDeviceId}
        // settings (✅ opens AppModals)
        onOpenSettings={onOpenSettings}
        // totalizer display (header)
        totalizerEnabled={singleUnitsEnabled ? false : totEnabled}
        totalizerRateUnit={totalizerRateUnit}
        totalizerTotalUnit={totalizerTotalUnit}
        totalizerValue={totalizerValue}
        // totalizer header controls
        onTotalizerEnable={onTotalizerEnable}
        onTotalizerDisable={onTotalizerDisable}
        onTotalizerReset={onTotalizerReset}
        // single units
        singleUnitsEnabled={singleUnitsEnabled}
        singleUnit={singleUnitsUnit}
        // controls
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onToggleExplore={() => {
          if (isExploreMode) setExploreOpen(false);
          else setExploreOpen(true);
        }}
        onExport={() =>
          exportPointsCsv({
            title,
            points: pointsForView?.length ? pointsForView : points,
            fmt: fmtTimeWithDate,
          })
        }
        // info row
        timeUnit={timeUnit}
        sampleMs={sampleMs}
        windowSize={windowSize}
        yMin={yMin}
        yMax={yMax}
        // units
        yUnits={displayUnits}
        // layout/plot
        gridBackground={gridBackground}
        yTicks={yTicks}
        plotRef={plotRef}
        handlers={handlers}
        sel={sel}
        hover={hover}
        timeTicks={timeTicks}
        fmtTime={fmtTimeWithDate}
        svg={svg}
        // output/errors
        mathOutput={mathOutput}
        err={err}
      />
    );
  }

  return (
    <>
      {/* ✅ Explore Portal */}
      <GraphicDisplayExplorePortal
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        title={title}
        modalContent={buildPanel(true)}
      >
        {buildPanel(false)}
      </GraphicDisplayExplorePortal>
    </>
  );
}