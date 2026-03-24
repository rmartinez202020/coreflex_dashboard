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
  rateUnitToTimeBase,
} from "./graphicDisplay/runtimeHelpers";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

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
  const lastOnlineRef = useRef(null);

  // ✅ NEW: runtime Timeseries Bar modal state
  const [timeseriesBarOpen, setTimeseriesBarOpen] = useState(false);

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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ load full historian from backend once per widget/dashboard
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!widgetId) {
        setPoints([]);
        setHistoryLoaded(true);
        return;
      }

      const token = String(getToken() || "").trim();
      const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
      const tenantAccessSafe = String(tenantAccessLevel || "").trim();

      // ✅ allow private JWT flow OR public tenant flow
      if (!token && !tenantEmailSafe) {
        setHistoryLoaded(true);
        return;
      }

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
            .find(
              (p) =>
                !p?.gap &&
                Number.isFinite(Number(p?.t)) &&
                Number.isFinite(Number(p?.y))
            );

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
        setErr("Failed to load saved history.");
        setPoints([]);
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
    singleUnitsEnabled,
    tankTotEnabled,
    totalizerRateUnit,
    totalizerTotalUnit,
    tenantEmail,
    tenantAccessLevel,
    isRunMode,
  ]);

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

          dbg("OFFLINE: inserting GAP point", { now });
          return [...prev, { t: now, y: null, gap: true }];
        });

        lastOnlineRef.current = false;

        if (err === "Failed to load saved history.") {
          setErr("");
        }
        return;
      }

      if (!wasOnline) {
        setPoints((prev) => {
          const t = now;
          const lastPoint = prev.length ? prev[prev.length - 1] : null;
          if (lastPoint?.gap) return prev;
          dbg("ONLINE RESUME: inserting GAP point", { t });
          return [...prev, { t, y: null, gap: true }];
        });
      }

      lastOnlineRef.current = true;

      if (Number.isFinite(out)) {
        if (
          isOnlineNow &&
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

            if (
              Number.isFinite(dtBase) &&
              dtBase > 0 &&
              Number.isFinite(avgRate) &&
              avgRate > 0
            ) {
              totalizerAccumRef.current += avgRate * dtBase;
              setRunningTotalizer(totalizerAccumRef.current);
            }
          }

          totalizerLastPointRef.current = currPoint;
        } else {
          totalizerLastPointRef.current = null;
        }

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
    singleUnitsEnabled,
    totEnabled,
    totalizerRateUnit,
    totalizerTotalUnit,
  ]);

  const exploreFilteredPoints = useMemo(() => {
    if (!exploreOpen) return points;

    const startMs = exploreStart ? new Date(exploreStart).getTime() : null;
    const endMs = exploreEnd ? new Date(exploreEnd).getTime() : null;

    return (points || []).filter((p) => {
      const t = Number(p?.t);

      if (!Number.isFinite(t)) return false;
      if (startMs !== null && Number.isFinite(startMs) && t < startMs)
        return false;
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
        err={historyLoading ? "Loading saved history..." : err}
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
        points={activePoints}
        totalizerRateUnit={totalizerRateUnit}
        totalizerTotalUnit={totalizerTotalUnit}
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