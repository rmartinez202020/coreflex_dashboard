// src/components/controls/graphicDisplay/hooks/usePingZoom.js
import { useMemo, useRef, useState, useEffect } from "react";

function interpolateYAtTime(pointsArr, t) {
  const arr = Array.isArray(pointsArr) ? pointsArr : [];
  if (!arr.length || !Number.isFinite(t)) return null;

  // ignore gaps / non-finite
  const pts = arr
    .map((p) => ({
      t: Number(p?.t),
      y: Number(p?.y),
      gap: !!p?.gap,
    }))
    .filter((p) => !p.gap && Number.isFinite(p.t) && Number.isFinite(p.y));

  if (!pts.length) return null;

  // clamp ends
  if (t <= pts[0].t) return pts[0].y;
  if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].y;

  // first point with time >= t
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (pts[mid].t < t) lo = mid + 1;
    else hi = mid;
  }

  const p1 = pts[lo];
  const p0 = lo > 0 ? pts[lo - 1] : null;
  if (!p0) return p1.y;

  const t0 = p0.t;
  const t1 = p1.t;
  const y0 = p0.y;
  const y1 = p1.y;

  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 === t0) return y0;

  const a = (t - t0) / (t1 - t0);
  return y0 + a * (y1 - y0);
}

export default function usePingZoom({
  points,
  yMin,
  yMax,
  fmtTimeWithDate,
  hoverAnywhere = false, // ✅ new
}) {
  const plotRef = useRef(null);

  const [zoom, setZoom] = useState(null); // {t0,t1}
  const [sel, setSel] = useState(null);
  const selRef = useRef({ dragging: false, x0: 0, x1: 0 });

  const [hover, setHover] = useState(null);

  // ✅ IMPORTANT: do NOT reset zoom/hover on every points update (points changes constantly)
  // If you ever want to auto-reset zoom when binding changes, do it in GraphicDisplay.jsx
  // using a key (bindDeviceId/bindField), not the points array.

  const pointsForView = useMemo(() => {
    if (!zoom) return points;
    const a = Math.min(zoom.t0, zoom.t1);
    const b = Math.max(zoom.t0, zoom.t1);
    return (points || []).filter((p) => p.t >= a && p.t <= b);
  }, [points, zoom]);

  const timeRange = useMemo(() => {
    if (!pointsForView.length) return { tMin: null, tMax: null };
    return {
      tMin: pointsForView[0].t,
      tMax: pointsForView[pointsForView.length - 1].t,
    };
  }, [pointsForView]);

  const timeTicks = useMemo(() => {
    const { tMin, tMax } = timeRange;
    if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin) return [];

    const N = 5;
    const span = tMax - tMin;

    return Array.from({ length: N }, (_, i) => {
      const t = tMin + (span * i) / (N - 1);
      return { t, label: fmtTimeWithDate(t) };
    });
  }, [timeRange, fmtTimeWithDate]);

  function pxToTime(xPx) {
    const el = plotRef.current;
    const { tMin, tMax } = timeRange;
    if (!el || !Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin) return null;

    const rect = el.getBoundingClientRect();
    const frac = Math.min(Math.max(xPx / rect.width, 0), 1);
    return tMin + frac * (tMax - tMin);
  }

  function findNearestPointByTime(t) {
    if (!pointsForView.length || !Number.isFinite(t)) return null;

    let lo = 0;
    let hi = pointsForView.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (pointsForView[mid].t < t) lo = mid + 1;
      else hi = mid;
    }

    const p1 = pointsForView[lo];
    const p0 = lo > 0 ? pointsForView[lo - 1] : null;

    if (!p0) return p1;
    return Math.abs(p1.t - t) < Math.abs(p0.t - t) ? p1 : p0;
  }

  function setHoverFromTimeAndY(rect, xClamped, t, y) {
    const span = yMax - yMin;
    if (!Number.isFinite(span) || span === 0) return setHover(null);
    if (!Number.isFinite(y) || !Number.isFinite(t)) return setHover(null);

    const yy = Math.min(Math.max(y, yMin), yMax);
    const yPx = rect.height - ((yy - yMin) / span) * rect.height;

    setHover({ xPx: xClamped, yPx, t, y });
  }

  function handlePointerMove(e) {
    const el = plotRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xClamped = Math.min(Math.max(x, 0), rect.width);

    if (selRef.current.dragging) {
      selRef.current.x1 = xClamped;
      setSel({ x0: selRef.current.x0, x1: xClamped });
      return;
    }

    const t = pxToTime(xClamped);

    // ✅ Explore: hover ANYWHERE (interpolated)
    if (hoverAnywhere) {
      const y = interpolateYAtTime(pointsForView, t);
      if (!Number.isFinite(y)) {
        setHover(null);
        return;
      }
      setHoverFromTimeAndY(rect, xClamped, t, y);
      return;
    }

    // default: nearest sampled point
    const p = findNearestPointByTime(t);
    if (!p) {
      setHover(null);
      return;
    }
    setHoverFromTimeAndY(rect, xClamped, p.t, Number(p.y));
  }

  function handlePointerDown(e) {
    if (e.button !== 0) return;
    const el = plotRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xClamped = Math.min(Math.max(x, 0), rect.width);

    selRef.current.dragging = true;
    selRef.current.x0 = xClamped;
    selRef.current.x1 = xClamped;

    setSel({ x0: xClamped, x1: xClamped });
  }

  function handlePointerUp() {
    if (!selRef.current.dragging) return;

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

  function handlePointerLeave() {
    if (!selRef.current.dragging) setHover(null);
  }

  function handleDoubleClick() {
    setZoom(null);
    setSel(null);
  }

  return {
    plotRef,
    sel,
    hover,
    timeTicks,
    pointsForView,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onDoubleClick: handleDoubleClick,
    },
  };
}