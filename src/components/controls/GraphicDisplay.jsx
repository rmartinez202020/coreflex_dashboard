// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { computeMathOutput, msPerUnit, fmtTimeWithDate } from "./graphicDisplay/utils";
import { getRowFromTelemetryMap, readAiField } from "./graphicDisplay/loader";
import usePingZoom from "./graphicDisplay/hooks/usePingZoom";
import useTrendSvg from "./graphicDisplay/hooks/useTrendSvg";
import useTrendLayout from "./graphicDisplay/hooks/useTrendLayout";

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

  if (["online", "connected", "ok", "active", "up", "true", "yes", "1"].includes(s))
    return { online: true, label: "ONLINE" };
  if (["offline", "disconnected", "down", "inactive", "false", "no", "0"].includes(s))
    return { online: false, label: "OFFLINE" };

  return { online: null, label: "--" };
}

function exportPointsCsv({
  title = "Graphic Display",
  points = [],
  fmt = (t) => new Date(t).toISOString(),
  filePrefix = "graphic-display",
} = {}) {
  const safeTitle =
    String(title || "Graphic Display").replace(/[^\w\- ]+/g, "").trim() ||
    "Graphic Display";
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

export default function GraphicDisplay({
  tank,
  telemetryMap = null, // ✅ common poller map
  isPlay = false, // ✅ true in Play/Launch
  isExplore = false, // ✅ true only inside Explore overlay
}) {
  const title = tank?.title ?? "Graphic Display";
  const timeUnit = tank?.timeUnit ?? "seconds";
  const windowSize = Number(tank?.window ?? 60);
  const sampleMs = Number(tank?.sampleMs ?? 1000);
  const yMin = Number.isFinite(tank?.yMin) ? tank.yMin : 0;
  const yMax = Number.isFinite(tank?.yMax) ? tank.yMax : 100;
  const yUnits = tank?.yUnits ?? "";
  const graphStyle = tank?.graphStyle ?? "line";
  const bindModel = tank?.bindModel ?? "zhc1921";
  const bindDeviceId = String(tank?.bindDeviceId ?? "").trim();
  const bindField = String(tank?.bindField ?? "ai1").trim();
  const mathFormula = tank?.mathFormula ?? "";
  const lineColor = normalizeLineColor(tank?.lineColor);

  const DEBUG = useMemo(() => {
    if (tank?.debug) return true;
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    if (url.searchParams.get("gddebug") === "1") return true;
    return false;
  }, [tank]);

  const dbgKey = useMemo(() => {
    const widgetId =
      tank?.id ?? tank?.widgetId ?? tank?.widget_id ?? tank?.uuid ?? "";
    return widgetId
      ? `widget:${widgetId}`
      : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
  }, [tank, bindModel, bindDeviceId, bindField]);

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
    const widgetId =
      tank?.id ?? tank?.widgetId ?? tank?.widget_id ?? tank?.uuid ?? "";
    const base = widgetId
      ? `widget:${widgetId}`
      : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
    return `coreflex:graphicDisplay:points:${base}`;
  }, [tank, bindModel, bindDeviceId, bindField]);

  const yDivs = Number.isFinite(tank?.yDivs) ? Math.max(2, tank.yDivs) : 10;
  const xDivs = Number.isFinite(tank?.xDivs) ? Math.max(2, tank.xDivs) : 12;
  const yMinor = Number.isFinite(tank?.yMinor) ? Math.max(1, tank.yMinor) : 2;
  const xMinor = Number.isFinite(tank?.xMinor) ? Math.max(1, tank.xMinor) : 2;

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

  // 🔎 one-time: log binding
  useEffect(() => {
    dbg("MOUNT / bind", {
      isPlay,
      isExplore,
      isPlaying,
      bindModel,
      bindDeviceId,
      bindField,
      sampleMs,
      windowSize,
      timeUnit,
      mathFormula,
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
  }, [points, storageKey, bindDeviceId, bindField, windowSize, timeUnit, bindModel]);

  const lastSampleAtRef = useRef(0);

  // ✅ MAIN POLL (telemetryMap sync)
  useEffect(() => {
    if (!isPlay) return;
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
    isPlay,
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

  const { plotRef, sel, hover, timeTicks, pointsForView, handlers } = usePingZoom({
    points,
    yMin: Number(yMin),
    yMax: Number(yMax),
    fmtTimeWithDate,
  });

  const { svg } = useTrendSvg({
    points,
    pointsForView,
    yMin,
    yMax,
    dbg,
    dbgWarn,
  });

  // ✅ Explore style knobs
  const polyStrokeWidth = isExplore ? 2 : 3; // thinner in Explore
  const yTickFont = isExplore ? 13 : 11; // bigger labels in Explore
  const yTickPad = isExplore ? "2px 8px" : "1px 6px";
  const topValueFont = isExplore ? 14 : 12;

  const topBtnBase = {
    height: 36,
    padding: "0 18px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    lineHeight: "36px",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  };

  const topBtnDisabled = {
    ...topBtnBase,
    cursor: "not-allowed",
    opacity: 0.55,
  };

  const outputBoxStyle = {
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.92)",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 900,
    color: "#111",
    whiteSpace: "nowrap",
  };

  const styleIndicator = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: "0 6px",
        fontSize: 12,
        fontWeight: 900,
        color: "#111",
        whiteSpace: "nowrap",
      }}
      title={`Line color: ${lineColor}`}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 999,
          background: lineColor,
          border: "1px solid rgba(0,0,0,0.15)",
        }}
      />
      <span>{styleBadge}</span>
    </div>
  );

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

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #cfcfcf",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid #e6e6e6",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
          flex: "0 0 auto",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              flex: "0 0 auto",
            }}
          >
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              style={isPlaying ? topBtnDisabled : topBtnBase}
              disabled={isPlaying}
              title="Resume"
            >
              ▶ <span>Play</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              style={!isPlaying ? topBtnDisabled : topBtnBase}
              disabled={!isPlaying}
              title="Pause"
            >
              ⏸ <span>Pause</span>
            </button>

            <button
              type="button"
              onClick={() =>
                exportPointsCsv({
                  title,
                  points: pointsForView?.length ? pointsForView : points,
                  fmt: fmtTimeWithDate,
                })
              }
              style={topBtnBase}
              title="Export visible points to CSV"
            >
              ⬇ <span>Export</span>
            </button>

            {styleIndicator}

            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <div style={outputBoxStyle} title="Math Output">
                <span style={{ color: "#555" }}>Output:</span>
                <span style={{ color: "#0b3b18" }}>
                  {Number.isFinite(mathOutput) ? mathOutput.toFixed(2) : "--"}
                </span>
              </div>

              <div
                style={{
                  height: 22,
                  padding: "0 10px",
                  borderRadius: 999,
                  border: `1px solid ${statusLabel.border}`,
                  background: statusLabel.bg,
                  color: statusLabel.color,
                  fontSize: 11,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  letterSpacing: 0.2,
                  userSelect: "none",
                }}
                title={bindDeviceId ? `Device is ${statusLabel.text}` : "No device selected"}
              >
                {statusLabel.text}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#444",
            fontSize: 11,
            marginTop: 6,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <span>
            Time: <b>{timeUnit}</b>
          </span>
          <span>•</span>
          <span>
            Sample: <b>{sampleMs} ms</b>
          </span>
          <span>•</span>
          <span>
            Window: <b>{windowSize}</b>
          </span>
          <span>•</span>
          <span>
            Y: <b>{yMin}</b> → <b>{yMax}</b> {yUnits ? `(${yUnits})` : ""}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          padding: 12,
          display: "flex",
        }}
      >
        <div
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            width: "100%",
            height: "100%",
            borderRadius: 10,
            background: "linear-gradient(180deg,#ffffff,#fbfbfb)",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #d9d9d9",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...gridBackground,
              pointerEvents: "none",
            }}
          />

          {yTicks.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                bottom: 36,
                width: 72,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {[...yTicks].reverse().map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    fontFamily: "monospace",
                    fontSize: yTickFont,
                    color: "#555",
                    background: "rgba(255,255,255,0.78)",
                    padding: yTickPad,
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  {Number(v).toFixed(2)}
                </div>
              ))}
            </div>
          )}

          <div
            ref={plotRef}
            {...handlers}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerMoveCapture={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              left: 92,
              right: 10,
              top: 10,
              bottom: 36,
              cursor: sel ? "crosshair" : "default",
              touchAction: "none",
            }}
            title="Move mouse to ping time/value. Drag to zoom. Double-click to reset zoom."
          >
            <svg
              viewBox={`0 0 ${svg.W} ${svg.H}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {svg.segs.map((pts, idx) => (
                <polyline
                  key={idx}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={polyStrokeWidth}
                  points={pts.join(" ")}
                />
              ))}
            </svg>

            {sel ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: Math.min(sel.x0, sel.x1),
                  width: Math.max(1, Math.abs(sel.x1 - sel.x0)),
                  background: "rgba(59, 130, 246, 0.12)",
                  border: "1px solid rgba(59, 130, 246, 0.35)",
                  borderRadius: 6,
                  pointerEvents: "none",
                }}
              />
            ) : null}

            {hover ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: hover.xPx,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "rgba(0,0,0,0.18)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(
                      Math.max(hover.xPx + 10, 8),
                      (plotRef.current?.getBoundingClientRect?.().width || 0) - 260
                    ),
                    top: Math.min(
                      Math.max(hover.yPx - 26, 8),
                      (plotRef.current?.getBoundingClientRect?.().height || 0) - 60
                    ),
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#111",
                    background: "rgba(255,255,255,0.92)",
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.10)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
                    pointerEvents: "none",
                    maxWidth: 260,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  <div>{fmtTimeWithDate(hover.t)}</div>
                  <div>
                    Y:{" "}
                    <span style={{ color: "#0b3b18" }}>
                      {Number.isFinite(hover.y) ? Number(hover.y).toFixed(2) : "--"}
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            <div
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                fontFamily: "monospace",
                fontSize: topValueFont,
                fontWeight: 900,
                color: "#0b3b18",
                background: "rgba(255,255,255,0.85)",
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                pointerEvents: "none",
              }}
              title="Current math output"
            >
              {Number.isFinite(mathOutput) ? mathOutput.toFixed(2) : "--"}
            </div>

            {err ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  bottom: 10,
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#991b1b",
                  background: "rgba(255,241,242,0.92)",
                  border: "1px solid #fecaca",
                  padding: "6px 10px",
                  borderRadius: 10,
                  pointerEvents: "none",
                }}
              >
                {err}
              </div>
            ) : null}
          </div>

          <div
            style={{
              position: "absolute",
              left: 92,
              right: 10,
              bottom: 10,
              height: 22,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 8,
              pointerEvents: "none",
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 900,
              color: "#444",
            }}
          >
            {timeTicks.length ? (
              timeTicks.map((tk, idx) => (
                <div
                  key={idx}
                  style={{
                    maxWidth: "22%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "2px 6px",
                    borderRadius: 8,
                  }}
                  title={tk.label}
                >
                  {tk.label}
                </div>
              ))
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: "2px 6px",
                  borderRadius: 8,
                }}
              >
                --
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}