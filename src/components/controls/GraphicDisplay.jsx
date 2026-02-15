// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

// ✅ extracted utilities
import {
  computeMathOutput,
  msPerUnit,
  fmtTimeWithDate,
} from "./graphicDisplay/utils";

// ✅ extracted loader (API + row loader + field reader)
import { loadLiveRowForDevice, readAiField } from "./graphicDisplay/loader";

// ✅ NEW: extracted ping/zoom hook
import usePingZoom from "./graphicDisplay/hooks/usePingZoom";

// ✅ line color fallback
const DEFAULT_LINE_COLOR = "#0c5ac8";

function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
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

  // ✅ NEW: line color from settings panel (saved on tank)
  // (Settings panel uses `lineColor` prop name)
  const lineColor = normalizeLineColor(tank?.lineColor);

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

  useEffect(() => {
    // reset points if binding missing
    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      return;
    }

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
            const limit = maxPointsRef.current || 2;
            if (next.length > limit) next.splice(0, next.length - limit);
            return next;
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
  }, [bindModel, bindDeviceId, bindField, sampleMs, mathFormula]);

  // ===============================
  // ✅ INTERACTION: ping + zoom (timeline) via hook
  // ===============================
  const { plotRef, sel, hover, timeTicks, pointsForView, handlers } = usePingZoom({
    points,
    yMin: Number(yMin),
    yMax: Number(yMax),
    fmtTimeWithDate,
  });

  // ===============================
  // ✅ SVG PATH from points (TIME-BASED X so it always moves LEFT -> RIGHT)
  // ===============================
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
          padding: "6px 10px",
          borderBottom: "1px solid #e6e6e6",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
          flex: "0 0 auto",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              fontSize: 10,
              fontWeight: 800,
              border: "1px solid #ddd",
              borderRadius: 999,
              padding: "2px 8px",
              background: "#fff",
              color: "#333",
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            title={`Line color: ${lineColor}`}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: lineColor,
                border: "1px solid rgba(0,0,0,0.15)",
              }}
            />
            {styleBadge}
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
                <polyline
                  fill="none"
                  stroke={lineColor}   // ✅ NEW: uses selected color
                  strokeWidth="3"
                  points={svg.poly}
                />
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

          {/* ✅ X TIMELINE (date + time) */}
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
