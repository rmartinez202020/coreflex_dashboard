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
import GraphicDisplayTimeseriesBarModal from "./graphicDisplay/GraphicDisplayTimeseriesBarModal";
import {
  detectLaunchMode,
  exportPointsCsv,
  integrateRateToTotal,
  normalizeHistorianPoints,
  normalizeLineColor,
  normalizeOnlineStatusFromRow,
  RATE_TO_TOTAL_UNIT,
} from "./graphicDisplay/runtimeHelpers";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const MAX_CONTINUOUS_GAP_MS = 60 * 60 * 1000; // 1 hour

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeBarMathPoints(points) {
  return (Array.isArray(points) ? points : [])
    .filter((p) => !p?.gap)
    .map((p) => ({
      t: toNumber(p?.t),
      y: toNumber(p?.y),
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y))
    .sort((a, b) => a.t - b.t);
}

function rateUnitToTimeBase(rateUnit) {
  const u = String(rateUnit || "").trim();

  if (
    ["GPM", "CFM", "SCFM", "ACFM", "LPM", "m³/min", "kg/min", "lb/min"].includes(
      u
    )
  ) {
    return "minute";
  }

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
  ) {
    return "hour";
  }

  if (["kg/s", "W"].includes(u)) return "second";
  if (["BPD"].includes(u)) return "day";

  return "";
}

function dtMsToBaseUnits(dtMs, base) {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return 0;

  if (base === "minute") return dtMs / 60000;
  if (base === "hour") return dtMs / 3600000;
  if (base === "second") return dtMs / 1000;
  if (base === "day") return dtMs / 86400000;

  return 0;
}

function accumulateStepSegment(y, dtMs, base) {
  if (!Number.isFinite(y) || !Number.isFinite(dtMs) || dtMs <= 0) return 0;
  if (!base) return 0;

  const dtBase = dtMsToBaseUnits(dtMs, base);
  if (!Number.isFinite(dtBase) || dtBase <= 0) return 0;

  if (y <= 0) return 0;

  return y * dtBase;
}

function accumulateWithinMonth(points, startT, endT, rateUnit) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  if (!Number.isFinite(startT) || !Number.isFinite(endT) || endT <= startT) {
    return 0;
  }

  const base = rateUnitToTimeBase(rateUnit);
  if (!base) return 0;

  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const t1 = Number(p1?.t);
    const t2 = Number(p2?.t);
    const y1 = Number(p1?.y);

    if (
      !Number.isFinite(t1) ||
      !Number.isFinite(t2) ||
      !Number.isFinite(y1) ||
      t2 <= t1
    ) {
      continue;
    }

    const rawGapMs = t2 - t1;
    if (rawGapMs > MAX_CONTINUOUS_GAP_MS) continue;

    const segStart = Math.max(startT, t1);
    const segEnd = Math.min(endT, t2);

    if (segEnd <= segStart) continue;

    total += accumulateStepSegment(y1, segEnd - segStart, base);
  }

  return total;
}

function collectAvailableYears(points) {
  const years = new Set();
  for (const p of points) {
    const t = Number(p?.t);
    if (!Number.isFinite(t)) continue;
    years.add(new Date(t).getFullYear());
  }
  return [...years].sort((a, b) => a - b);
}

function buildMonthlyTotals(points, year, rateUnit) {
  const base = rateUnitToTimeBase(rateUnit);

  if (!base) {
    return Array.from({ length: 12 }, (_, idx) => ({
      monthIndex: idx,
      total: 0,
      start: new Date(year, idx, 1).getTime(),
      end: new Date(year, idx + 1, 1).getTime(),
    }));
  }

  return Array.from({ length: 12 }, (_, idx) => {
    const start = new Date(year, idx, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, idx + 1, 1, 0, 0, 0, 0).getTime();

    return {
      monthIndex: idx,
      total: accumulateWithinMonth(points, start, end, rateUnit),
      start,
      end,
    };
  });
}

export default function GraphicDisplay({
  tank,
  telemetryMap = null,
  isPlay = false,
  onSaveSettings,
  onOpenSettings: onOpenSettingsProp = null,
  dashboardId = null,

  // ✅ NEW: public tenant support
  tenantEmail = "",
  tenantAccessLevel = "",
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

  const windowMs = useMemo(() => {
    const unitMs = msPerUnit(timeUnit);
    if (!Number.isFinite(unitMs)) return 0;
    return unitMs * windowSize;
  }, [timeUnit, windowSize]);

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
    const bindingDash = String(
      T?.bindingDashboardId ||
        T?.binding_dashboard_id ||
        T?.properties?.bindingDashboardId ||
        T?.properties?.binding_dashboard_id ||
        ""
    ).trim();

    const rootDash = String(T?.dashboard_id || T?.dashboardId || "").trim();

    const injectedDash = String(
      T?.properties?.dashboardId || T?.properties?.dashboard_id || ""
    ).trim();

    const parentDash = String(dashboardId || "").trim();

    return bindingDash || rootDash || injectedDash || parentDash || "main";
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
  const lastOnlineRef = useRef(null);

  const [timeseriesBarOpen, setTimeseriesBarOpen] = useState(false);

  const [historyReloadSeq, setHistoryReloadSeq] = useState(0);
  const prevRunModeRef = useRef(isRunMode);

  const suppressNextResumeGapRef = useRef(false);

  useEffect(() => {
    const wasRunMode = prevRunModeRef.current === true;
    const isEnteringRunMode = !wasRunMode && isRunMode === true;

    if (isEnteringRunMode) {
      setHistoryReloadSeq((n) => n + 1);
      suppressNextResumeGapRef.current = true;
      lastSampleAtRef.current = 0;

      dbg("RUN MODE ENTER: forcing historian refresh", {
        widgetId,
        resolvedDashboardId,
        isPlay,
      });
    }

    prevRunModeRef.current = isRunMode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunMode, widgetId, resolvedDashboardId, isPlay]);

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
    lastOnlineRef.current = null;
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
  const [barPoints, setBarPoints] = useState([]);

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
      tenantEmail,
      tenantAccessLevel,
      telemetryMapType: telemetryMap ? typeof telemetryMap : "null",
      telemetryMapKeys:
        telemetryMap && typeof telemetryMap === "object"
          ? Object.keys(telemetryMap).slice(0, 10)
          : null,
      rootDashboardId: T?.dashboard_id || T?.dashboardId || "",
      injectedDashboardId:
        T?.properties?.dashboardId || T?.properties?.dashboard_id || "",
      parentDashboardId: dashboardId || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!widgetId) {
        setPoints([]);
        setBarPoints([]);
        setHistoryLoaded(true);
        return;
      }

      const token = String(getToken() || "").trim();
      const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
      const tenantAccessSafe = String(tenantAccessLevel || "").trim();

      if (!token && !tenantEmailSafe) {
        setPoints([]);
        setBarPoints([]);
        setHistoryLoaded(true);
        return;
      }

      if (!bindDeviceId || !bindField) {
        setPoints([]);
        setBarPoints([]);
        setErr("");
        setHistoryLoaded(true);
        return;
      }

      dbg("LOAD HISTORY: start", {
        widgetId,
        resolvedDashboardId,
        windowMs,
        isRunMode,
        historyReloadSeq,
      });

      setHistoryLoading(true);
      setHistoryLoaded(false);

      try {
        const url = new URL(`${API_URL}/graphic-display-bindings/history`);
        url.searchParams.set("dashboard_id", resolvedDashboardId);
        url.searchParams.set("widget_id", widgetId);

        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantEmailSafe ? { "X-Tenant-Email": tenantEmailSafe } : {}),
          ...(tenantAccessSafe ? { "X-Tenant-Access": tenantAccessSafe } : {}),
        };

        const res = await fetch(url.toString(), {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`History request failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        const normalized = normalizeHistorianPoints(data?.points || []);

        if (cancelled) return;

        const now = Date.now();
        let clipped = normalized;

        if (windowMs > 0) {
          const minT = now - windowMs;
          clipped = normalized.filter((p) => {
            const t = Number(p?.t);
            return Number.isFinite(t) && t >= minT;
          });
        }

        dbg("LOAD HISTORY: success", {
          requestedDashboardId: resolvedDashboardId,
          responseDashboardId: data?.dashboard_id,
          files: data?.files || [],
          filePointCounts: data?.file_point_counts || {},
          normalizedCount: normalized.length,
          clippedCount: clipped.length,
          lastPoint:
            clipped.length > 0 ? clipped[clipped.length - 1] : null,
          lastBarPoint:
            normalized.length > 0 ? normalized[normalized.length - 1] : null,
        });

        setPoints(clipped);
        setBarPoints(normalized);

        setRunningTotalizer(0);
        totalizerAccumRef.current = 0;

        const lastHistPoint = [...clipped]
          .reverse()
          .find(
            (p) =>
              !p?.gap &&
              Number.isFinite(Number(p?.t)) &&
              Number.isFinite(Number(p?.y))
          );

        totalizerLastPointRef.current = lastHistPoint
          ? { t: Number(lastHistPoint.t), y: Number(lastHistPoint.y) }
          : null;

        const lastHistOnlinePoint = [...clipped]
          .reverse()
          .find(
            (p) =>
              !p?.gap &&
              Number.isFinite(Number(p?.t)) &&
              Number.isFinite(Number(p?.y))
          );

        lastOnlineRef.current = !!lastHistOnlinePoint;

        const lastNumeric = [...clipped]
          .reverse()
          .find((p) => Number.isFinite(Number(p?.y)));

        if (lastNumeric) setMathOutput(Number(lastNumeric.y));
        else setMathOutput(null);

        lastSampleAtRef.current = 0;
        setErr("");
      } catch (e) {
        if (cancelled) return;
        dbgErr("LOAD HISTORY: failed", e);
        setErr("Failed to load saved history.");
        setPoints([]);
        setBarPoints([]);
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
          setHistoryLoaded(true);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    widgetId,
    resolvedDashboardId,
    windowMs,
    tenantEmail,
    tenantAccessLevel,
    isRunMode,
    historyReloadSeq,
    bindDeviceId,
    bindField,
  ]);

  useEffect(() => {
    if (!bindDeviceId || !bindField) return;

    if (!isPlaying) {
      const t = Date.now();

      setPoints((prev) => {
        const last = prev.length ? prev[prev.length - 1] : null;
        if (last?.gap) return prev;
        dbg("PAUSE: inserting GAP point (chart)", { t });
        return [...prev, { t, y: null, gap: true }];
      });

      setBarPoints((prev) => {
        const last = prev.length ? prev[prev.length - 1] : null;
        if (last?.gap) return prev;
        dbg("PAUSE: inserting GAP point (timeseries bar)", { t });
        return [...prev, { t, y: null, gap: true }];
      });
    }
  }, [isPlaying, bindDeviceId, bindField]);

  const lastSampleAtRef = useRef(0);

  useEffect(() => {
    if (!isRunMode) return;
    if (!isPlaying) return;
    if (!historyLoaded) return;

    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      setBarPoints([]);
      setDeviceOnline(null);
      totalizerLastPointRef.current = null;
      lastOnlineRef.current = null;
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

      const trimmedFormula = String(mathFormula || "").trim();
      const normalizedFormula = trimmedFormula.replace(/\bvalue\b/gi, "VALUE");

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

      const isOnlineNow = st.online === true;
      const wasOnline = lastOnlineRef.current === true;

      if (!isOnlineNow) {
        totalizerLastPointRef.current = null;

        setPoints((prev) => {
          const lastPoint = prev.length ? prev[prev.length - 1] : null;
          if (lastPoint?.gap) return prev;

          dbg("OFFLINE: inserting GAP point (chart)", { now });
          return [...prev, { t: now, y: null, gap: true }];
        });

        setBarPoints((prev) => {
          const lastPoint = prev.length ? prev[prev.length - 1] : null;
          if (lastPoint?.gap) return prev;

          dbg("OFFLINE: inserting GAP point (timeseries bar)", { now });
          return [...prev, { t: now, y: null, gap: true }];
        });

        lastOnlineRef.current = false;

        if (err === "Failed to load saved history.") {
          setErr("");
        }
        return;
      }

      if (!wasOnline) {
        if (suppressNextResumeGapRef.current) {
          dbg("ONLINE RESUME: suppressing first GAP after fresh history reload", {
            now,
          });
          suppressNextResumeGapRef.current = false;
        } else {
          setPoints((prev) => {
            const t = now;
            const lastPoint = prev.length ? prev[prev.length - 1] : null;
            if (lastPoint?.gap) return prev;
            dbg("ONLINE RESUME: inserting GAP point (chart)", { t });
            return [...prev, { t, y: null, gap: true }];
          });

          setBarPoints((prev) => {
            const t = now;
            const lastPoint = prev.length ? prev[prev.length - 1] : null;
            if (lastPoint?.gap) return prev;
            dbg("ONLINE RESUME: inserting GAP point (timeseries bar)", { t });
            return [...prev, { t, y: null, gap: true }];
          });
        }
      } else {
        suppressNextResumeGapRef.current = false;
      }

      lastOnlineRef.current = true;

      if (Number.isFinite(out)) {
        totalizerLastPointRef.current = { t: now, y: Number(out) };

        setPoints((prev) => {
          const lastPoint = prev.length ? prev[prev.length - 1] : null;

          if (
            lastPoint &&
            !lastPoint.gap &&
            Number(lastPoint.t) === now &&
            Number(lastPoint.y) === Number(out)
          ) {
            return prev;
          }

          const next = [...prev, { t: now, y: out }];

          if (windowMs > 0) {
            const minT = now - windowMs;

            return next.filter((p) => {
              const t = Number(p?.t);
              if (p?.gap) return true;
              return Number.isFinite(t) && t >= minT;
            });
          }

          return next;
        });

        setBarPoints((prev) => {
          const lastPoint = prev.length ? prev[prev.length - 1] : null;

          if (
            lastPoint &&
            !lastPoint.gap &&
            Number(lastPoint.t) === now &&
            Number(lastPoint.y) === Number(out)
          ) {
            return prev;
          }

          return [...prev, { t: now, y: out }];
        });
      } else {
        totalizerLastPointRef.current = null;
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
      totalizerLastPointRef.current = null;
      lastOnlineRef.current = false;
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
      if (startMs !== null && Number.isFinite(startMs) && t < startMs) {
        return false;
      }
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

  const normalizedBarPoints = useMemo(() => {
    return normalizeBarMathPoints(barPoints);
  }, [barPoints]);

  const totalizerDisplayYear = useMemo(() => {
    const years = collectAvailableYears(normalizedBarPoints);
    if (years.length) return years[years.length - 1];
    return new Date().getFullYear();
  }, [normalizedBarPoints]);

  const totalizerValue = useMemo(() => {
    if (singleUnitsEnabled) return null;
    if (!totEnabled) return null;
    if (!totalizerRateUnit) return null;
    if (!totalizerTotalUnit) return null;

    const monthlyTotals = buildMonthlyTotals(
      normalizedBarPoints,
      totalizerDisplayYear,
      totalizerRateUnit
    );

    return monthlyTotals.reduce((acc, m) => acc + (Number(m.total) || 0), 0);
  }, [
    singleUnitsEnabled,
    totEnabled,
    totalizerRateUnit,
    totalizerTotalUnit,
    normalizedBarPoints,
    totalizerDisplayYear,
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
    if (!bindDeviceId) {
      return {
        text: "--",
        color: "#64748b",
        bg: "rgba(148,163,184,0.16)",
        border: "rgba(148,163,184,0.35)",
      };
    }

    if (deviceOnline === true) {
      return {
        text: "ONLINE",
        color: "#16a34a",
        bg: "rgba(187,247,208,0.55)",
        border: "rgba(22,163,74,0.25)",
      };
    }

    if (deviceOnline === false) {
      return {
        text: "OFFLINE",
        color: "#dc2626",
        bg: "rgba(254,202,202,0.55)",
        border: "rgba(220,38,38,0.25)",
      };
    }

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
    totalizerLastPointRef.current = null;
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

  const onOpenTimeseriesBar = () => {
    setTimeseriesBarOpen(true);
    dbg("TIMESERIES BAR: open button clicked");
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

  const panelMessage = useMemo(() => {
    if (historyLoading) return "Loading saved history...";

    const hasBinding = !!bindDeviceId && !!bindField;

    if (!hasBinding) {
      return "Please open Settings, configure the device and signal, then click Apply.";
    }

    return err;
  }, [historyLoading, bindDeviceId, bindField, err]);

  const onOpenSettings = () => {
    dbg("SETTINGS: open");
    if (typeof onOpenSettingsProp === "function") {
      onOpenSettingsProp();
    }
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
    }
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
        showTimeseriesBarBtn={isRunMode}
        onOpenTimeseriesBar={onOpenTimeseriesBar}
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
        err={panelMessage}
        onSave={handleSettingsSave}
      />
    );
  }

  return (
    <>
      <GraphicDisplayTimeseriesBarModal
        open={timeseriesBarOpen}
        onClose={() => setTimeseriesBarOpen(false)}
        title={title}
        points={barPoints}
        totalizerRateUnit={totalizerRateUnit}
        totalizerTotalUnit={totalizerTotalUnit}
        widgetId={widgetId}
        dashboardId={resolvedDashboardId}
      />

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