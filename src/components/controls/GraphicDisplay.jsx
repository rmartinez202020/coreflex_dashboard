// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// ✅ extracted utilities
import { computeMathOutput, msPerUnit, fmtTimeWithDate } from "./graphicDisplay/utils";

// ✅ extracted loader (API + row loader + field reader)
import { loadLiveRowForDevice, readAiField } from "./graphicDisplay/loader";

// ✅ extracted ping/zoom hook
import usePingZoom from "./graphicDisplay/hooks/usePingZoom";

// ✅ line color fallback
const DEFAULT_LINE_COLOR = "#0c5ac8";

function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
}

// ✅ CSV export helper
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

// ✅ localStorage helpers
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

  // small buffer so timeline doesn’t look “empty” on edge
  const bufferMs = Math.min(keepMs * 0.15, 30_000); // up to 30s buffer
  const cutoff = Date.now() - (keepMs + bufferMs);

  const cleaned = arr
    .map((p) => ({
      t: Number(p?.t),
      y: p?.y,
    }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t)
    .filter((p) => p.t >= cutoff);

  return cleaned;
}

export default function GraphicDisplay({ tank }) {
  const title = tank?.title ?? "Graphic Display";
  const timeUnit = tank?.timeUnit ?? "seconds";
  const windowSize = Number(tank?.window ?? 60);
  const sampleMs = Number(tank?.sampleMs ?? 1000);
  const yMin = Number.isFinite(tank?.yMin) ? tank.yMin : 0;
  const yMax = Number.isFinite(tank?.yMax) ? tank.yMax : 100;
  const yUnits = tank?.yUnits ?? "";
  const graphStyle = tank?.graphStyle ?? "line";

  // ✅ binding + math
  const bindModel = tank?.bindModel ?? "zhc1921";
  const bindDeviceId = String(tank?.bindDeviceId ?? "").trim();
  const bindField = String(tank?.bindField ?? "ai1").trim();
  const mathFormula = tank?.mathFormula ?? "";

  // ✅ line color from settings panel (saved on tank)
  const lineColor = normalizeLineColor(tank?.lineColor);

  // ✅ stable storage key (per widget if possible, otherwise per binding)
  const storageKey = useMemo(() => {
    const widgetId =
      tank?.id ?? tank?.widgetId ?? tank?.widget_id ?? tank?.uuid ?? "";
    const base = widgetId ? `widget:${widgetId}` : `bind:${bindModel}:${bindDeviceId}:${bindField}`;
    return `coreflex:graphicDisplay:points:${base}`;
  }, [tank, bindModel, bindDeviceId, bindField]);

  // ✅ grid divisions
  const yDivs = Number.isFinite(tank?.yDivs) ? Math.max(2, tank.yDivs) : 10;
  const xDivs = Number.isFinite(tank?.xDivs) ? Math.max(2, tank.xDivs) : 12;
  const yMinor = Number.isFinite(tank?.yMinor) ? Math.max(1, tank.yMinor) : 2;
  const xMinor = Number.isFinite(tank?.xMinor) ? Math.max(1, tank.xMinor) : 2;

  const styleBadge = (() => {
    if (graphStyle === "line") return "LINE";
    if (graphStyle === "area") return "AREA";
    if (graphStyle === "bar") return "BAR";
    if (graphStyle === "step") return "STEP";
    return "LINE";
  })();

  // ✅ derived Y ticks
  const yTicks = useMemo(() => {
    const min = Number(yMin);
    const max = Number(yMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return [];
    const step = (max - min) / yDivs;
    const arr = [];
    for (let i = 0; i <= yDivs; i++) arr.push(min + step * i);
    return arr;
  }, [yMin, yMax, yDivs]);

  // ✅ background grid (major + minor)
  const gridBackground = useMemo(() => {
    const majorX = Math.max(24, Math.round(520 / xDivs));
    const majorY = Math.max(20, Math.round(260 / yDivs));
    const minorX = Math.max(8, Math.round(majorX / (xMinor + 1)));
    const minorY = Math.max(8, Math.round(majorY / (yMinor + 1)));

    return {
      backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to right, rgba(0,0,0,0.085) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.085) 1px, transparent 1px)
      `,
      backgroundSize: `
        ${minorX}px ${minorY}px,
        ${minorX}px ${minorY}px,
        ${majorX}px ${majorY}px,
        ${majorX}px ${majorY}px
      `,
      backgroundPosition: `0 0, 0 0, 0 0, 0 0`,
    };
  }, [xDivs, yDivs, xMinor, yMinor]);

  // ===============================
  // ✅ LIVE POLL + MATH OUTPUT + TREND POINTS
  // ===============================
  const [liveValue, setLiveValue] = useState(null);
  const [mathOutput, setMathOutput] = useState(null);
  const [err, setErr] = useState("");

  const [points, setPoints] = useState([]); // [{t:number, y:number}]

  // ✅ local playback controls
  const [isPlaying, setIsPlaying] = useState(true);

  const maxPoints = useMemo(() => {
    const win = Number.isFinite(windowSize) ? Math.max(2, windowSize) : 60;
    const smp = Number.isFinite(sampleMs) ? Math.max(250, sampleMs) : 1000;
    const units = msPerUnit(timeUnit);
    const totalMs = win * units;
    return Math.max(2, Math.round(totalMs / smp));
  }, [windowSize, sampleMs, timeUnit]);

  // ✅ avoid stale maxPoints in interval closure
  const maxPointsRef = useRef(maxPoints);
  useEffect(() => {
    maxPointsRef.current = maxPoints;
  }, [maxPoints]);

  // ===============================
  // ✅ LOAD points from localStorage when binding/widget changes
  // ===============================
  useEffect(() => {
    // if binding missing, clear + don't load
    if (!bindDeviceId || !bindField) {
      setPoints([]);
      return;
    }

    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? safeJsonParse(raw) : null;

    const loaded = Array.isArray(parsed?.points) ? parsed.points : Array.isArray(parsed) ? parsed : [];
    const pruned = prunePointsByWindow(loaded, windowSize, timeUnit);

    setPoints(pruned);

    // best effort: restore last values for display
    const last = pruned.length ? pruned[pruned.length - 1] : null;
    if (last && Number.isFinite(Number(last.y))) {
      setMathOutput(Number(last.y));
    }
  }, [storageKey, bindDeviceId, bindField, windowSize, timeUnit]);

  // ===============================
  // ✅ SAVE points to localStorage (debounced)
  // ===============================
  const saveTimerRef = useRef(null);

  useEffect(() => {
    // only save when we have a binding
    if (!bindDeviceId || !bindField) return;

    // debounce writes
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      const pruned = prunePointsByWindow(points, windowSize, timeUnit);
      // keep it compact (avoid runaway)
      const limit = Math.max(50, Number(maxPointsRef.current || 200));
      const finalPoints = pruned.length > limit ? pruned.slice(pruned.length - limit) : pruned;

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
      } catch {
        // ignore quota errors
      }
    }, 350);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [points, storageKey, bindDeviceId, bindField, windowSize, timeUnit, bindModel, bindField, bindDeviceId]);

  // ===============================
  // ✅ LIVE POLL
  // ===============================
  useEffect(() => {
    // reset points if binding missing
    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      return;
    }

    // ✅ if paused, do not poll (but keep chart visible)
    if (!isPlaying) return;

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setErr("");

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
        const out = computeMathOutput(safeLive, mathFormula);

        if (cancelled) return;

        setLiveValue(safeLive);
        setMathOutput(out);

        if (Number.isFinite(out)) {
          const t = Date.now();
          setPoints((prev) => {
            const next = [...prev, { t, y: out }];

            // prune by time window first (so reopen looks correct)
            const pruned = prunePointsByWindow(next, windowSize, timeUnit);

            // also enforce max points based on sample/window
            const limit = maxPointsRef.current || 2;
            if (pruned.length > limit) pruned.splice(0, pruned.length - limit);

            return pruned;
          });
        }
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setErr("Trend read failed (device endpoint / tag field).");
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 1000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [bindModel, bindDeviceId, bindField, sampleMs, mathFormula, isPlaying, windowSize, timeUnit]);

  // ===============================
  // ✅ INTERACTION: ping + zoom (timeline) via hook
  // ===============================
  const { plotRef, sel, hover, timeTicks, pointsForView, handlers } = usePingZoom({
    points,
    yMin: Number(yMin),
    yMax: Number(yMax),
    fmtTimeWithDate,
  });

  // ✅ SVG PATH from points (TIME-BASED X so it always moves LEFT -> RIGHT)
  const svg = useMemo(() => {
    const W = 1000;
    const H = 360;
    const minY = Number(yMin);
    const maxY = Number(yMax);
    const ySpan = maxY - minY;

    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || ySpan <= 0) {
      return { poly: "", W, H, tMin: null, tMax: null };
    }

    const arr = pointsForView?.length ? pointsForView : points;
    if (!arr.length) {
      return { poly: "", W, H, tMin: null, tMax: null };
    }

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const tMin = arr[0]?.t ?? Date.now();
    const tMax = arr[arr.length - 1]?.t ?? tMin;
    const tSpan = Math.max(1, tMax - tMin);

    const coords = arr.map((p) => {
      const x = ((p.t - tMin) / tSpan) * W;
      const yy = clamp(p.y, minY, maxY);
      const y = H - ((yy - minY) / ySpan) * H;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return { poly: coords.join(" "), W, H, tMin, tMax };
  }, [points, pointsForView, yMin, yMax]);

  // ✅ BIGGER top-right button styles
  const topBtnBase = {
    height: 30,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    lineHeight: "30px",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const topBtnDisabled = {
    ...topBtnBase,
    cursor: "not-allowed",
    opacity: 0.55,
  };

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

          {/* TOP-RIGHT: Play / Pause / Export */}
          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              flex: "0 0 auto",
            }}
          >
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              style={isPlaying ? topBtnDisabled : topBtnBase}
              disabled={isPlaying}
              title="Resume polling"
            >
              ▶ <span>Play</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              style={!isPlaying ? topBtnDisabled : topBtnBase}
              disabled={!isPlaying}
              title="Pause polling"
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

            {/* style badge */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                border: "1px solid #ddd",
                borderRadius: 999,
                padding: "4px 10px",
                background: "#fff",
                color: "#333",
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 30,
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
              {styleBadge}
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
            marginTop: 4,
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

          <span style={{ marginLeft: "auto" }} title="Math Output">
            Output:{" "}
            <b>{Number.isFinite(mathOutput) ? mathOutput.toFixed(2) : "--"}</b>
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

          {/* Y ticks */}
          {yTicks.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                bottom: 36,
                width: 64,
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
                    fontSize: 11,
                    color: "#555",
                    background: "rgba(255,255,255,0.78)",
                    padding: "1px 6px",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  {Number(v).toFixed(2)}
                </div>
              ))}
            </div>
          )}

          {/* PLOT AREA (interactive) */}
          <div
            ref={plotRef}
            {...handlers}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerMoveCapture={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              left: 84,
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
              {svg.poly ? (
                <polyline fill="none" stroke={lineColor} strokeWidth="3" points={svg.poly} />
              ) : null}
            </svg>

            {/* Selection rectangle (zoom) */}
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

            {/* Crosshair + tooltip (ping) */}
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

            {/* Value overlay (top-right) */}
            <div
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                fontFamily: "monospace",
                fontSize: 12,
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

          {/* X TIMELINE */}
          <div
            style={{
              position: "absolute",
              left: 84,
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
