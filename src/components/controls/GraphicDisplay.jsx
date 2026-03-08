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
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

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
    ["online", "connected", "ok", "active", "up", "true", "yes", "1"].includes(
      s
    )
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

  if (href.includes("mode=launch")) return true;
  if (href.includes("launch=1") || href.includes("launch=true")) return true;

  return false;
}

function exportPointsCsv({
  title = "Graphic Display",
  points = [],
  fmt = (t) => new Date(t).toISOString(),
  filePrefix = "graphic-display",
  totalizerEnabled = false,
  totalizerRateUnit = "",
} = {}) {
  const safeTitle =
    String(title || "Graphic Display")
      .replace(/[^\w\- ]+/g, "")
      .trim() || "Graphic Display";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${filePrefix}-${safeTitle}-${stamp}.csv`;

  const header = "timestamp_iso,epoch_ms,,totalizer,Value\n";

  const base = rateUnitToTimeBase(totalizerRateUnit);

  let runningTotal = 0;
  let prev = null;

  const rows = (points || []).map((p) => {
    const t = Number(p?.t);
    const y = Number(p?.y);
    const gap = !!p?.gap;

    if (
      totalizerEnabled &&
      base &&
      prev &&
      !prev.gap &&
      !gap &&
      Number.isFinite(prev.t) &&
      Number.isFinite(prev.y) &&
      Number.isFinite(t) &&
      Number.isFinite(y) &&
      t > prev.t
    ) {
      const dtMs = t - prev.t;

      let dtBase = 0;
      if (base === "minute") dtBase = dtMs / 60000;
      else if (base === "hour") dtBase = dtMs / 3600000;
      else if (base === "second") dtBase = dtMs / 1000;
      else if (base === "day") dtBase = dtMs / 86400000;

      if (Number.isFinite(dtBase) && dtBase > 0) {
        const avgRate = (prev.y + y) / 2;
        runningTotal += avgRate * dtBase;
      }
    }

    const iso = Number.isFinite(t) ? fmt(t) : "";
    const epoch = Number.isFinite(t) ? t : "";
    const yy = Number.isFinite(y) ? y : "";
    const totalizerText =
      totalizerEnabled && Number.isFinite(runningTotal)
        ? runningTotal.toFixed(6)
        : "";

    if (!gap && Number.isFinite(t) && Number.isFinite(y)) {
      prev = { t, y, gap: false };
    } else if (gap) {
      prev = null;
    }

    return `${iso},${epoch},${totalizerText},${yy}`;
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

function parseHistorianTs(value) {
  if (value === null || value === undefined) return NaN;

  // already epoch
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const s = String(value || "").trim();
  if (!s) return NaN;

  // ISO or browser-parsable format
  const direct = Date.parse(s);
  if (Number.isFinite(direct)) return direct;

  // MM/DD/YYYY HH:MM:SS AM/PM
  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );
  if (m) {
    let month = Number(m[1]);
    let day = Number(m[2]);
    const year = Number(m[3]);
    let hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = Number(m[6] || 0);
    const ampm = String(m[7] || "").toUpperCase();

    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const dt = new Date(year, month - 1, day, hour, minute, second, 0).getTime();
    return Number.isFinite(dt) ? dt : NaN;
  }

  return NaN;
}

function normalizeHistorianPoints(rows) {
  const src = Array.isArray(rows) ? rows : [];

  return src
    .map((row) => {
      const t = parseHistorianTs(
        row?.ts ??
          row?.timestamp ??
          row?.time ??
          row?.t ??
          row?.created_at ??
          null
      );

      const preferredValue =
        row?.mathOutput ??
        row?.value ??
        row?.y ??
        row?.output ??
        row?.raw ??
        null;

      const y = Number(preferredValue);

      return {
        t,
        y: Number.isFinite(y) ? y : null,
        gap: !!row?.gap,
      };
    })
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
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

  if (
    ["GPM", "CFM", "SCFM", "ACFM", "LPM", "m³/min", "kg/min", "lb/min"].includes(
      u
    )
  )
    return "minute";

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

  if (["kg/s", "W"].includes(u)) return "second";
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

    const avgRate = (p1.y + p2.y) / 2;
    total += avgRate * dtBase;
  }

  return total;
}

export default function GraphicDisplay({
  tank,
  telemetryMap = null,
  isPlay = false,
  onSaveSettings,
  onOpenSettings: onOpenSettingsProp = null,
  dashboardId = null,
}) {
  const isRunMode = useMemo(() => {
    return !!isPlay || detectLaunchMode();
  }, [isPlay]);

  const [localTank, setLocalTank] = useState(null);
  useEffect(() => {
    setLocalTank(null);
  }, [tank]);

  const T = localTank ?? tank;

  const title = T?.title ?? "Graphic Display";
  const timeUnit = T?.timeUnit ?? "seconds";
  const windowSize = Number(T?.window ?? 60);

  // ✅ Convert modal window + unit into milliseconds
const windowMs = useMemo(() => {
  const unitMs = msPerUnit(timeUnit);

  if (!Number.isFinite(unitMs)) return 0;

  return unitMs * windowSize;
}, [timeUnit, windowSize]);

  // ✅ FIX: default to 3000ms to match modal/common poller
  const sampleMs = Number(T?.sampleMs ?? 3000);

  const yMin = Number.isFinite(T?.yMin) ? T.yMin : 0;
  const yMax = Number.isFinite(T?.yMax) ? T.yMax : 100;

  const yUnits = T?.yUnits ?? "";

  const graphStyle = T?.graphStyle ?? "line";
  const bindModel = T?.bindModel ?? "zhc1921";
  const bindDeviceId = String(T?.bindDeviceId ?? "").trim();
  const bindField = String(T?.bindField ?? "ai1").trim();
  const mathFormula = T?.mathFormula ?? "";
  const lineColor = normalizeLineColor(T?.lineColor);

  const resolvedDashboardId = useMemo(() => {
    return (
      String(
        dashboardId ||
          T?.dashboard_id ||
          T?.dashboardId ||
          T?.properties?.dashboardId ||
          T?.properties?.dashboard_id ||
          "main"
      ).trim() || "main"
    );
  }, [dashboardId, T]);

  const widgetId = useMemo(() => {
    return String(T?.id ?? T?.widgetId ?? T?.widget_id ?? "").trim();
  }, [T]);

  const tankSingleEnabled = T?.singleUnitsEnabled === true;
  const tankSingleUnit = String(
    T?.singleUnitsUnit ?? T?.singleUnit ?? ""
  ).trim();

  const [singleUnitsEnabled, setSingleUnitsEnabled] =
    useState(tankSingleEnabled);
  const [singleUnitsUnit, setSingleUnitsUnit] = useState(tankSingleUnit);

  const tankTotEnabled = T?.totalizerEnabled === true;
  const totalizerRateUnit = String(T?.totalizerUnit ?? "").trim();
  const totalizerTotalUnit = RATE_TO_TOTAL_UNIT[totalizerRateUnit] || "";

  const [totEnabled, setTotEnabled] = useState(tankTotEnabled);
const [totalizerResetAt, setTotalizerResetAt] = useState(0);
const [runningTotalizer, setRunningTotalizer] = useState(0);
const totalizerAccumRef = useRef(0);
const totalizerLastPointRef = useRef(null);


  useEffect(() => {
    const nextSingleEnabled = T?.singleUnitsEnabled === true;
    const nextSingleUnit = String(
      T?.singleUnitsUnit ?? T?.singleUnit ?? ""
    ).trim();

    setSingleUnitsEnabled(nextSingleEnabled);
    setSingleUnitsUnit(nextSingleUnit);

    const nextTotEnabled = nextSingleEnabled ? false : tankTotEnabled;
    setTotEnabled(nextTotEnabled);

    setTotalizerResetAt(0);
    setRunningTotalizer(0);
    totalizerAccumRef.current = 0;
    totalizerLastPointRef.current = null;
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
    const widgetIdLocal = T?.id ?? T?.widgetId ?? T?.widget_id ?? T?.uuid ?? "";
    return widgetIdLocal
      ? `widget:${widgetIdLocal}`
      : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
  }, [T, bindModel, bindDeviceId, bindField]);

  function dbg(...args) {
    if (!DEBUG) return;
    console.log(`[GraphicDisplay] ${dbgKey}`, ...args);
  }
  function dbgWarn(...args) {
    if (!DEBUG) return;
    console.warn(`[GraphicDisplay] ${dbgKey}`, ...args);
  }
  function dbgErr(...args) {
    if (!DEBUG) return;
    console.error(`[GraphicDisplay] ${dbgKey}`, ...args);
  }

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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreStart, setExploreStart] = useState("");
  const [exploreEnd, setExploreEnd] = useState("");


  useEffect(() => {
    dbg("MOUNT / bind", {
      isPlay,
      isRunMode,
      isPlaying,
      bindModel,
      bindDeviceId,
      bindField,
      widgetId,
      resolvedDashboardId,
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

  // ✅ load full historian from backend once per widget/dashboard
useEffect(() => {
  let cancelled = false;

  async function loadHistory() {
    console.log("[GraphicDisplay] loadHistory ENTER", {
      widgetId,
      resolvedDashboardId,
      tankId: T?.id,
      widgetIdAlt1: T?.widgetId,
      widgetIdAlt2: T?.widget_id,
      bindDeviceId,
      bindField,
      isRunMode,
      hasTelemetryMap: !!telemetryMap,
    });

    if (!widgetId) {
      console.warn("[GraphicDisplay] loadHistory SKIP: no widgetId", {
        widgetId,
        resolvedDashboardId,
        tank: T,
      });
      setPoints([]);
      setHistoryLoaded(true);
      return;
    }

    const token = String(getToken() || "").trim();
    if (!token) {
      console.warn("[GraphicDisplay] loadHistory SKIP: no auth token", {
        widgetId,
        resolvedDashboardId,
      });
      setHistoryLoaded(true);
      return;
    }

    setHistoryLoading(true);
    setHistoryLoaded(false);

    try {
      const url = new URL(`${API_URL}/graphic-display-bindings/history`);
      url.searchParams.set("dashboard_id", resolvedDashboardId);
      url.searchParams.set("widget_id", widgetId);

      console.log("[GraphicDisplay] HISTORY REQUEST START", {
        widgetId,
        resolvedDashboardId,
        url: url.toString(),
      });

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[GraphicDisplay] HISTORY RESPONSE RAW", {
        widgetId,
        resolvedDashboardId,
        status: res.status,
        ok: res.ok,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[GraphicDisplay] HISTORY RESPONSE ERROR TEXT", {
          widgetId,
          resolvedDashboardId,
          status: res.status,
          text,
        });
        throw new Error(`History request failed (${res.status}): ${text}`);
      }

 const data = await res.json();
const normalized = normalizeHistorianPoints(data?.points || []);

if (cancelled) return;

// ✅ show only the visible timeframe configured in the modal
const now = Date.now();
let clipped = normalized;

if (windowMs > 0) {
  const minT = now - windowMs;
  clipped = normalized.filter((p) => {
    const t = Number(p?.t);
    return Number.isFinite(t) && t >= minT;
  });
}

console.log("[GraphicDisplay] HISTORY LOADED OK", {
  widgetId,
  resolvedDashboardId,
  files: Array.isArray(data?.files) ? data.files.length : 0,
  backendCount: data?.count,
  normalizedCount: normalized.length,
  clippedCount: clipped.length,
  windowMs,
  data,
});

setPoints(clipped);

if (
  !singleUnitsEnabled &&
  tankTotEnabled &&
  totalizerRateUnit &&
  totalizerTotalUnit
) {
  const seededTotal = integrateRateToTotal(clipped, totalizerRateUnit);
  const safeSeed = Number.isFinite(seededTotal) ? seededTotal : 0;

  setRunningTotalizer(safeSeed);
  totalizerAccumRef.current = safeSeed;

  const lastHistPoint = [...clipped]
    .reverse()
    .find((p) => !p?.gap && Number.isFinite(Number(p?.t)) && Number.isFinite(Number(p?.y)));

  totalizerLastPointRef.current = lastHistPoint
    ? { t: Number(lastHistPoint.t), y: Number(lastHistPoint.y) }
    : null;
} else {
  setRunningTotalizer(0);
  totalizerAccumRef.current = 0;
  totalizerLastPointRef.current = null;
}

const lastNumeric = [...clipped]
  .reverse()
  .find((p) => Number.isFinite(Number(p?.y)));

      if (lastNumeric) setMathOutput(Number(lastNumeric.y));
      else setMathOutput(null);

      setErr("");
    } catch (e) {
      if (cancelled) return;
      console.error("[GraphicDisplay] HISTORY LOAD ERROR", {
        widgetId,
        resolvedDashboardId,
        error: e,
      });
      setErr("Failed to load saved history.");
      setPoints([]);
    } finally {
      if (!cancelled) {
        setHistoryLoading(false);
        setHistoryLoaded(true);
        console.log("[GraphicDisplay] HISTORY REQUEST END", {
          widgetId,
          resolvedDashboardId,
        });
      }
    }
  }

  loadHistory();

  return () => {
    cancelled = true;
    console.log("[GraphicDisplay] loadHistory CANCELLED", {
      widgetId,
      resolvedDashboardId,
    });
  };
}, [widgetId, resolvedDashboardId, windowMs]);

  // ✅ if user pauses, insert a gap marker
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

  const lastSampleAtRef = useRef(0);

  // ✅ MAIN LIVE APPEND (common poller)
  useEffect(() => {
    if (!isRunMode) return;
    if (!isPlaying) return;
    if (!historyLoaded) return;

    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      setDeviceOnline(null);
      return;
    }

    try {
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

      // ✅ FIX: normalize VALUE placeholder so runtime matches modal preview
      const trimmedFormula = String(mathFormula || "").trim();
      const normalizedFormula = trimmedFormula.replace(/\bvalue\b/gi, "VALUE");

      // ✅ FIX: when formula is empty, use raw live value directly
      const out = normalizedFormula
        ? computeMathOutput(safeLive, normalizedFormula)
        : safeLive;

      dbg("LIVE", {
        bindModel,
        bindDeviceId,
        bindField,
        rowFound: !!row,
        rowKeys:
          row && typeof row === "object" ? Object.keys(row).slice(0, 20) : null,
        raw,
        safeLive,
        mathFormula: trimmedFormula,
        normalizedFormula,
        out,
        deviceOnline: st.online,
      });

      setLiveValue(safeLive);
      setMathOutput(Number.isFinite(out) ? out : null);

      const now = Date.now();
      const smp = Math.max(250, Number(sampleMs) || 3000);
      const last = lastSampleAtRef.current || 0;

      if (now - last < smp) return;
      lastSampleAtRef.current = now;

     if (Number.isFinite(out)) {
      if (
  !singleUnitsEnabled &&
  totEnabled &&
  totalizerRateUnit &&
  totalizerTotalUnit
) {
  const prevPoint = totalizerLastPointRef.current;
  const currPoint = { t: now, y: Number(out) };

  if (
    prevPoint &&
    Number.isFinite(prevPoint.t) &&
    Number.isFinite(prevPoint.y) &&
    Number.isFinite(currPoint.t) &&
    Number.isFinite(currPoint.y) &&
    currPoint.t > prevPoint.t
  ) {
    const base = rateUnitToTimeBase(totalizerRateUnit);
    const dtMs = currPoint.t - prevPoint.t;

    let dtBase = 0;
    if (base === "minute") dtBase = dtMs / 60000;
    else if (base === "hour") dtBase = dtMs / 3600000;
    else if (base === "second") dtBase = dtMs / 1000;
    else if (base === "day") dtBase = dtMs / 86400000;

    const avgRate = (prevPoint.y + currPoint.y) / 2;

    // ✅ pause totalizer when flow is zero or negative
    if (Number.isFinite(dtBase) && dtBase > 0 && Number.isFinite(avgRate) && avgRate > 0) {
      totalizerAccumRef.current += avgRate * dtBase;
      setRunningTotalizer(totalizerAccumRef.current);
    }
  }

  totalizerLastPointRef.current = currPoint;
}
  setPoints((prev) => {
    const lastPoint = prev.length ? prev[prev.length - 1] : null;

    // avoid appending the exact same millisecond/value pair twice
    if (
      lastPoint &&
      !lastPoint.gap &&
      Number(lastPoint.t) === now &&
      Number(lastPoint.y) === Number(out)
    ) {
      return prev;
    }

    const next = [...prev, { t: now, y: out }];

    // ✅ keep only the visible timeframe configured in the modal
    if (windowMs > 0) {
      const minT = now - windowMs;

      return next.filter((p) => {
        const t = Number(p?.t);

        // keep gap markers, and keep numeric points only inside the window
        if (p?.gap) return true;
        return Number.isFinite(t) && t >= minT;
      });
    }

    return next;
  });
} else {

        dbgWarn("LIVE: no numeric output to append", {
          raw,
          safeLive,
          mathFormula: trimmedFormula,
          normalizedFormula,
          out,
        });
      }

      if (err === "Failed to load saved history.") {
        setErr("");
      }
    } catch (e) {
      dbgErr("LIVE ERROR:", e);
      setErr("Trend read failed (common poller map).");
      setDeviceOnline(false);
    }
  }, [
    isRunMode,
    isPlaying,
    historyLoaded,
    telemetryMap,
    bindModel,
    bindDeviceId,
    bindField,
    sampleMs,
    mathFormula,
    err,
    windowMs,
  ]);

  const exploreFilteredPoints = useMemo(() => {
  if (!exploreOpen) return points;

  const startMs = exploreStart ? new Date(exploreStart).getTime() : null;
  const endMs = exploreEnd ? new Date(exploreEnd).getTime() : null;

  return (points || []).filter((p) => {
    const t = Number(p?.t);

    if (!Number.isFinite(t)) return false;
    if (startMs !== null && Number.isFinite(startMs) && t < startMs) return false;
    if (endMs !== null && Number.isFinite(endMs) && t > endMs) return false;

    return true;
  });
}, [points, exploreOpen, exploreStart, exploreEnd]);

const activePoints = exploreOpen ? exploreFilteredPoints : points;

const exploreStartMs =
  exploreOpen && exploreStart ? new Date(exploreStart).getTime() : null;

const exploreEndMs =
  exploreOpen && exploreEnd ? new Date(exploreEnd).getTime() : null;

const { plotRef, sel, hover, timeTicks, pointsForView, handlers } =
  usePingZoom({
    points: activePoints,
    yMin: Number(yMin),
    yMax: Number(yMax),
    fmtTimeWithDate,
    hoverAnywhere: exploreOpen,
    isExploreMode: exploreOpen,
    exploreStartMs,
    exploreEndMs,
  });

const { svg } = useTrendSvg({
  points: activePoints,
  pointsForView,
  yMin,
  yMax,
  dbg,
  dbgWarn,
});

 const totalizerValue = useMemo(() => {
  if (singleUnitsEnabled) return null;
  if (!totEnabled) return null;
  if (!totalizerRateUnit) return null;
  if (!totalizerTotalUnit) return null;

  return Number.isFinite(runningTotalizer) ? runningTotalizer : 0;
}, [
  singleUnitsEnabled,
  totEnabled,
  totalizerRateUnit,
  totalizerTotalUnit,
  runningTotalizer,
]);

const hoverTotalizerValue = useMemo(() => {
  if (singleUnitsEnabled) return null;
  if (!totEnabled) return null;
  if (!totalizerRateUnit) return null;
  if (!totalizerTotalUnit) return null;
  if (!hover || !Number.isFinite(Number(hover.t))) return null;

  const cutoffT = Number(hover.t);

  const srcBase = (pointsForView?.length ? pointsForView : activePoints) || [];

  const srcFiltered = srcBase.filter((p) => {
    const t = Number(p?.t);
    return Number.isFinite(t) && t <= cutoffT;
  });

  const src = totalizerResetAt
    ? srcFiltered.filter((p) => Number(p?.t) >= Number(totalizerResetAt || 0))
    : srcFiltered;

  const total = integrateRateToTotal(src, totalizerRateUnit);
  return Number.isFinite(total) ? total : null;
}, [
  singleUnitsEnabled,
  totEnabled,
  totalizerRateUnit,
  totalizerTotalUnit,
  hover,
  pointsForView,
  activePoints,
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

  const onTotalizerEnable = () => {
    if (singleUnitsEnabled) return;
    setTotEnabled(true);
    dbg("TOTALIZER: enabled from header");
  };

  const onTotalizerDisable = () => {
    setTotEnabled(false);
    dbg("TOTALIZER: disabled from header");
  };

 const onTotalizerReset = () => {
  if (singleUnitsEnabled) return;

  const t = Date.now();
  setTotalizerResetAt(t);

  setRunningTotalizer(0);
  totalizerAccumRef.current = 0;
  totalizerLastPointRef.current = null;

  dbg("TOTALIZER: reset from header", { resetAt: t });
};

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

  const onOpenSettings = () => {
    dbg("SETTINGS: open");
    if (typeof onOpenSettingsProp === "function") {
      onOpenSettingsProp();
      return;
    }
    console.warn(
      "[GraphicDisplay] onOpenSettings was clicked, but no onOpenSettings prop was provided. Pass it from DraggableGraphicDisplay so AppModals opens the settings modal."
    );
  };

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

    console.warn(
      "[GraphicDisplay] Settings saved locally, but no parent onSaveSettings / tank.onSave handler was found."
    );
  };

  function buildPanel(isExploreMode) {
    return (
      <GraphicDisplayPanel
        isExploreMode={isExploreMode}
        isPlay={isRunMode}
        title={title}
        lineColor={lineColor}
        styleBadge={styleBadge}
        statusLabel={statusLabel}
        bindDeviceId={bindDeviceId}
        onOpenSettings={onOpenSettings}
        totalizerEnabled={singleUnitsEnabled ? false : totEnabled}
        totalizerRateUnit={totalizerRateUnit}
        totalizerTotalUnit={totalizerTotalUnit}
        totalizerValue={totalizerValue}
        onTotalizerEnable={onTotalizerEnable}
        onTotalizerDisable={onTotalizerDisable}
        onTotalizerReset={onTotalizerReset}
        singleUnitsEnabled={singleUnitsEnabled}
        exploreStart={exploreStart}
        exploreEnd={exploreEnd}
        onExploreStartChange={setExploreStart}
        onExploreEndChange={setExploreEnd}
        singleUnit={singleUnitsUnit}
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        hoverTotalizerValue={hoverTotalizerValue}
        hoverTotalizerUnit={totalizerTotalUnit}

      onToggleExplore={() => {
  if (isExploreMode) {
    setExploreOpen(false);
    setExploreStart("");
    setExploreEnd("");
  } else {
    setExploreOpen(true);
  }
}}

 onExport={() =>
  exportPointsCsv({
    title,
    points: pointsForView?.length ? pointsForView : activePoints,
    fmt: fmtTimeWithDate,
    totalizerEnabled: totEnabled,
    totalizerRateUnit,
  })
}
        timeUnit={timeUnit}
        sampleMs={sampleMs}
        windowSize={windowSize}
        yMin={yMin}
        yMax={yMax}
        yUnits={displayUnits}
        gridBackground={gridBackground}
        yTicks={yTicks}
        plotRef={plotRef}
        handlers={handlers}
        sel={sel}
        hover={hover}
        timeTicks={timeTicks}
        fmtTime={fmtTimeWithDate}
        svg={svg}
        mathOutput={mathOutput}
        err={historyLoading ? "Loading saved history..." : err}
        onSave={handleSettingsSave}
      />
    );
  }

  return (
    <>
     <GraphicDisplayExplorePortal
  open={exploreOpen}
  onClose={() => {
    setExploreOpen(false);
    setExploreStart("");
    setExploreEnd("");
  }}
  title={title}
  modalContent={buildPanel(true)}
>
        {buildPanel(false)}
      </GraphicDisplayExplorePortal>
    </>
  );
}