// src/components/controls/graphicDisplay/hooks/usePingZoom.js
import { useMemo, useRef, useState, useEffect } from "react";

function interpolateYAtTime(pointsArr, t) {
  const arr = Array.isArray(pointsArr) ? pointsArr : [];
  if (!arr.length || !Number.isFinite(t)) return null;

  const pts = arr
    .map((p) => ({
      t: Number(p?.t),
      y: Number(p?.y),
      gap: !!p?.gap,
    }))
    .filter((p) => !p.gap && Number.isFinite(p.t) && Number.isFinite(p.y));

  if (!pts.length) return null;

  if (t <= pts[0].t) return pts[0].y;
  if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].y;

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

function distance(a, b) {
  const dx = Number(a?.x || 0) - Number(b?.x || 0);
  const dy = Number(a?.y || 0) - Number(b?.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

export default function usePingZoom({
  points,
  yMin,
  yMax,
  fmtTimeWithDate,
  hoverAnywhere = false,
  isExploreMode = false,
  exploreStartMs = null,
  exploreEndMs = null,
}) {
  const plotRef = useRef(null);

  const [zoom, setZoom] = useState(null); // {t0,t1}
  const [sel, setSel] = useState(null);
  const [hover, setHover] = useState(null);

  const selRef = useRef({ dragging: false, x0: 0, x1: 0 });

  // ✅ touch / pointer tracking
  const activePointersRef = useRef(new Map());
  const pinchRef = useRef({
    active: false,
    startDist: 0,
    startZoom: null,
    startRange: null,
    anchorFrac: 0.5,
  });

  // ✅ IMPORTANT:
  // In Explore mode, the user-selected Start/End range must control the time domain.
  // So whenever Explore mode is active, clear any previous drag-zoom window.
  useEffect(() => {
    if (isExploreMode) {
      setZoom(null);
      setSel(null);
      selRef.current.dragging = false;
      pinchRef.current.active = false;
    }
  }, [isExploreMode, exploreStartMs, exploreEndMs]);

  const basePoints = useMemo(() => {
    const arr = Array.isArray(points) ? points : [];

    if (!isExploreMode) return arr;

    return arr.filter((p) => {
      const t = Number(p?.t);
      if (!Number.isFinite(t)) return false;
      if (Number.isFinite(exploreStartMs) && t < exploreStartMs) return false;
      if (Number.isFinite(exploreEndMs) && t > exploreEndMs) return false;
      return true;
    });
  }, [points, isExploreMode, exploreStartMs, exploreEndMs]);

  const pointsForView = useMemo(() => {
    // ✅ In Explore mode, obey ONLY the user-selected Start/End timeframe.
    if (isExploreMode) return basePoints;

    if (!zoom) return basePoints;

    const a = Math.min(zoom.t0, zoom.t1);
    const b = Math.max(zoom.t0, zoom.t1);

    return basePoints.filter((p) => {
      const t = Number(p?.t);
      return Number.isFinite(t) && t >= a && t <= b;
    });
  }, [basePoints, zoom, isExploreMode]);

  const timeRange = useMemo(() => {
  const arr = Array.isArray(pointsForView) ? pointsForView : [];

  const drawable = arr
    .map((p) => ({
      t: Number(p?.t),
      y: Number(p?.y),
      gap: !!p?.gap,
    }))
    .filter((p) => !p.gap && Number.isFinite(p.t) && Number.isFinite(p.y));

  if (!drawable.length) return { tMin: null, tMax: null };

  const first = drawable[0].t;
  const last = drawable[drawable.length - 1].t;

  // ✅ In Explore mode, still obey the selected Start/End if they exist,
  // but default to the first/last drawable points, not raw gap points.
  if (isExploreMode) {
    const tMin = Number.isFinite(exploreStartMs) ? exploreStartMs : first;
    const tMax = Number.isFinite(exploreEndMs) ? exploreEndMs : last;
    return tMax > tMin ? { tMin, tMax } : { tMin: first, tMax: last };
  }

  return { tMin: first, tMax: last };
}, [pointsForView, isExploreMode, exploreStartMs, exploreEndMs]);



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

  function getRect() {
    return plotRef.current?.getBoundingClientRect?.() || null;
  }

  function pxToTimeWithRange(xPx, tMin, tMax, width) {
    if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin || !width) {
      return null;
    }
    const frac = Math.min(Math.max(xPx / width, 0), 1);
    return tMin + frac * (tMax - tMin);
  }

  function pxToTime(xPx) {
    const rect = getRect();
    const { tMin, tMax } = timeRange;
    if (!rect) return null;
    return pxToTimeWithRange(xPx, tMin, tMax, rect.width);
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

  function updateHoverAtX(xClamped) {
    const rect = getRect();
    if (!rect) return;

    const t = pxToTime(xClamped);

    if (hoverAnywhere) {
      const y = interpolateYAtTime(pointsForView, t);
      if (!Number.isFinite(y)) {
        setHover(null);
        return;
      }
      setHoverFromTimeAndY(rect, xClamped, t, y);
      return;
    }

    const p = findNearestPointByTime(t);
    if (!p) {
      setHover(null);
      return;
    }

    setHoverFromTimeAndY(rect, xClamped, p.t, Number(p.y));
  }

  function beginSelectionAtX(xClamped) {
    // ✅ In Explore mode, disable drag-to-zoom so Start/End fully control the range.
    if (isExploreMode) return;

    selRef.current.dragging = true;
    selRef.current.x0 = xClamped;
    selRef.current.x1 = xClamped;
    setSel({ x0: xClamped, x1: xClamped });
  }

  function finishSelection() {
    if (!selRef.current.dragging) return;
    if (isExploreMode) {
      selRef.current.dragging = false;
      setSel(null);
      return;
    }

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

  function handlePointerMove(e) {
    const rect = getRect();
    if (!rect) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    const pointers = [...activePointersRef.current.values()];

    // ✅ pinch zoom for touch/tablet
    if (!isExploreMode && pointers.length === 2) {
      const p0 = pointers[0];
      const p1 = pointers[1];
      const dist = distance(p0, p1);

      if (!pinchRef.current.active) {
        const { tMin, tMax } = timeRange;
        if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin) return;

        pinchRef.current.active = true;
        pinchRef.current.startDist = dist;
        pinchRef.current.startZoom = zoom;
        pinchRef.current.startRange = { tMin, tMax };
        pinchRef.current.anchorFrac = Math.min(
          Math.max(((p0.x + p1.x) / 2) / rect.width, 0),
          1
        );

        selRef.current.dragging = false;
        setSel(null);
        return;
      }

      const startDist = pinchRef.current.startDist;
      const startRange = pinchRef.current.startRange;
      if (!startRange || !Number.isFinite(startDist) || startDist <= 0) return;

      const startSpan = startRange.tMax - startRange.tMin;
      if (!Number.isFinite(startSpan) || startSpan <= 0) return;

      const scale = dist / startDist;
      if (!Number.isFinite(scale) || scale <= 0) return;

      const newSpan = startSpan / scale;
      const anchorFrac = pinchRef.current.anchorFrac;
      const anchorTime = startRange.tMin + anchorFrac * startSpan;

      let newTMin = anchorTime - anchorFrac * newSpan;
      let newTMax = newTMin + newSpan;

      const fullArr = Array.isArray(basePoints) ? basePoints : [];
      const fullMin = fullArr.length ? Number(fullArr[0]?.t) : null;
      const fullMax = fullArr.length ? Number(fullArr[fullArr.length - 1]?.t) : null;

      if (Number.isFinite(fullMin) && Number.isFinite(fullMax) && fullMax > fullMin) {
        const minSpan = Math.max(1000, (fullMax - fullMin) / 5000);
        const clampedSpan = Math.max(minSpan, Math.min(newSpan, fullMax - fullMin));

        newTMin = anchorTime - anchorFrac * clampedSpan;
        newTMax = newTMin + clampedSpan;

        if (newTMin < fullMin) {
          newTMin = fullMin;
          newTMax = fullMin + clampedSpan;
        }
        if (newTMax > fullMax) {
          newTMax = fullMax;
          newTMin = fullMax - clampedSpan;
        }
      }

      setZoom({ t0: newTMin, t1: newTMax });

      const midX = (p0.x + p1.x) / 2;
      const midXClamped = Math.min(Math.max(midX, 0), rect.width);
      updateHoverAtX(midXClamped);
      return;
    }

    const x = e.clientX - rect.left;
    const xClamped = Math.min(Math.max(x, 0), rect.width);

    if (selRef.current.dragging) {
      selRef.current.x1 = xClamped;
      setSel({ x0: selRef.current.x0, x1: xClamped });
      return;
    }

    updateHoverAtX(xClamped);
  }

  function handlePointerDown(e) {
    const rect = getRect();
    if (!rect) return;

    try {
      plotRef.current?.setPointerCapture?.(e.pointerId);
    } catch {}

    const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);

    activePointersRef.current.set(e.pointerId, { x, y });

    const pointers = [...activePointersRef.current.values()];

    // ✅ two-finger gesture = pinch mode, not selection mode
    if (!isExploreMode && pointers.length === 2) {
      selRef.current.dragging = false;
      setSel(null);
      pinchRef.current.active = false;
      return;
    }

    // ✅ touch devices: one finger should scrub/show value, not start selection immediately
    if (e.pointerType === "touch") {
      updateHoverAtX(x);
      return;
    }

    if (e.button !== 0) return;
    beginSelectionAtX(x);
  }

  function handlePointerUp(e) {
    try {
      plotRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {}

    activePointersRef.current.delete(e.pointerId);

    const remaining = activePointersRef.current.size;

    if (pinchRef.current.active && remaining < 2) {
      pinchRef.current.active = false;
      return;
    }

    // ✅ for touch, single-finger up just leaves last hover visible
    if (e.pointerType === "touch") {
      return;
    }

    finishSelection();
  }

  function handlePointerLeave() {
    if (!selRef.current.dragging && !pinchRef.current.active) {
      // ✅ keep hover visible on touch devices; clear mainly for mouse
      setHover((prev) => prev);
    }
  }

  function handleDoubleClick() {
    // ✅ In Explore mode, double-click should not override the Start/End range.
    if (isExploreMode) {
      setSel(null);
      return;
    }

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
      onPointerCancel: handlePointerUp,
      onDoubleClick: handleDoubleClick,
    },
  };
}