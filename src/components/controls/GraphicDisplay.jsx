// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

// ✅ extracted utilities
import {
  computeMathOutput,
  msPerUnit,
  fmtTimeWithDate,
} from "./graphicDisplay/utils";

const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" }, // safe if you later add
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
      : base === "zhc1661"
      ? [
          `/zhc1661/device/${deviceId}`,
          `/zhc1661/devices/${deviceId}`,
          `/zhc1661/${deviceId}`,
          `/zhc1661/one/${deviceId}`,
        ]
      : [];

  for (const p of directCandidates) {
    try {
      const r = await apiGet(p, { signal });
      return r?.row ?? r?.device ?? r;
    } catch (e) {
      // continue
    }
  }

  // fallback list scan (some endpoints only give live in list)
  const rawCandidates =
    base === "zhc1921"
      ? ["/zhc1921/devices", "/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : base === "zhc1661"
      ? ["/zhc1661/devices", "/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"]
      : [];

  for (const p of rawCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      const rawRow =
        arr.find((r) => {
          const id =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";
          return String(id) === String(deviceId);
        }) || null;

      if (rawRow) return rawRow;
    } catch (e) {
      // continue
    }
  }

  return null;
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
  // ✅ INTERACTION: ping + zoom (timeline)
  // ===============================
  const plotRef = useRef(null);

  // zoom range in timestamps (inclusive)
  const [zoom, setZoom] = useState(null); // {t0, t1} | null

  // selection while dragging to zoom
  const selRef = useRef({
    dragging: false,
    x0: 0,
    x1: 0,
  });
  const [sel, setSel] = useState(null); // {x0, x1} in px within plot

  // hover ping
  const [hover, setHover] = useState(null); // {xPx, yPx, t, y}

  // if data changed a lot (new binding), clear zoom
  useEffect(() => {
    setZoom(null);
    setSel(null);
    setHover(null);
  }, [bindModel, bindDeviceId, bindField]);

  const pointsForView = useMemo(() => {
    if (!zoom) return points;
    const a = Math.min(zoom.t0, zoom.t1);
    const b = Math.max(zoom.t0, zoom.t1);
    return points.filter((p) => p.t >= a && p.t <= b);
  }, [points, zoom]);

  const timeRange = useMemo(() => {
    const arr = pointsForView.length ? pointsForView : points;
    if (!arr.length) return { tMin: null, tMax: null };
    const tMin = arr[0].t;
    const tMax = arr[arr.length - 1].t;
    return { tMin, tMax };
  }, [pointsForView, points]);

  const timeTicks = useMemo(() => {
    const { tMin, tMax } = timeRange;
    if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin) return [];
    const N = 5; // 5 labels
    const span = tMax - tMin;
    const out = [];
    for (let i = 0; i < N; i++) {
      const t = tMin + (span * i) / (N - 1);
      out.push({ t, label: fmtTimeWithDate(t), frac: i / (N - 1) });
    }
    return out;
  }, [timeRange]);

  function pxToTime(xPx) {
    const el = plotRef.current;
    const { tMin, tMax } = timeRange;
    if (!el || !Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin)
      return null;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(Math.max(xPx / Math.max(1, rect.width), 0), 1);
    return tMin + frac * (tMax - tMin);
  }

  function findNearestPointByTime(t) {
    const arr = pointsForView.length ? pointsForView : points;
    if (!arr.length || !Number.isFinite(t)) return null;
    // arr is time-ordered
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid].t < t) lo = mid + 1;
      else hi = mid;
    }
    const i = lo;
    const p1 = arr[i];
    const p0 = i > 0 ? arr[i - 1] : null;
    if (!p0) return p1;
    return Math.abs(p1.t - t) < Math.abs(p0.t - t) ? p1 : p0;
  }

  function handlePointerMove(e) {
    const el = plotRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (selRef.current.dragging) {
      selRef.current.x1 = x;
      setSel({ x0: selRef.current.x0, x1: selRef.current.x1 });
      return;
    }

    const t = pxToTime(x);
    const p = findNearestPointByTime(t);
    if (!p) {
      setHover(null);
      return;
    }

    // map point y -> pixel for tooltip positioning
    const minY = Number(yMin);
    const maxY = Number(yMax);
    const span = maxY - minY;
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const yy = clamp(p.y, minY, maxY);
    const yPx = rect.height - ((yy - minY) / Math.max(1e-9, span)) * rect.height;

    setHover({
      xPx: x,
      yPx,
      t: p.t,
      y: p.y,
    });
  }

  function handlePointerLeave() {
    if (!selRef.current.dragging) setHover(null);
  }

  function handlePointerDown(e) {
    if (e.button !== 0) return;
    const el = plotRef.current;
    if (!el) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;

    selRef.current.dragging = true;
    selRef.current.x0 = x;
    selRef.current.x1 = x;
    setSel({ x0: x, x1: x });
  }

  function handlePointerUp(e) {
    const el = plotRef.current;
    if (!el) return;
    if (!selRef.current.dragging) return;

    e.preventDefault();
    e.stopPropagation();

    selRef.current.dragging = false;

    const x0 = selRef.current.x0;
    const x1 = selRef.current.x1;

    setSel(null);

    if (Math.abs(x1 - x0) < 8) return;

    const t0 = pxToTime(x0);
    const t1 = pxToTime(x1);
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return;

    setZoom({ t0, t1 });
  }

  function handleDoubleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setZoom(null);
    setSel(null);
  }

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

    const arr = pointsForView.length ? pointsForView : points;
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
            }}
          >
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
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onPointerMoveCapture={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              left: 84,
              right: 10,
              top: 10,
              bottom: 36,
              cursor: selRef.current.dragging ? "crosshair" : "default",
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
                  stroke="rgba(12, 90, 200, 0.95)"
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
                      (plotRef.current?.getBoundingClientRect?.().width || 0) -
                        260
                    ),
                    top: Math.min(
                      Math.max(hover.yPx - 26, 8),
                      (plotRef.current?.getBoundingClientRect?.().height || 0) -
                        60
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
                      {Number.isFinite(hover.y)
                        ? Number(hover.y).toFixed(2)
                        : "--"}
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

          {/* ✅ Removed "LINE MODE" badge (as requested) */}
        </div>
      </div>
    </div>
  );
}
