import { useMemo, useRef, useState, useEffect } from "react";

export default function usePingZoom({
  points,
  yMin,
  yMax,
  fmtTimeWithDate,
}) {
  const plotRef = useRef(null);

  const [zoom, setZoom] = useState(null); // {t0,t1}
  const [sel, setSel] = useState(null);
  const selRef = useRef({ dragging: false, x0: 0, x1: 0 });

  const [hover, setHover] = useState(null);

  // Reset zoom when data changes heavily
  useEffect(() => {
    setZoom(null);
    setSel(null);
    setHover(null);
  }, [points]);

  const pointsForView = useMemo(() => {
    if (!zoom) return points;
    const a = Math.min(zoom.t0, zoom.t1);
    const b = Math.max(zoom.t0, zoom.t1);
    return points.filter((p) => p.t >= a && p.t <= b);
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
    if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin)
      return [];

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
    if (!el || !Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin)
      return null;

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

  function handlePointerMove(e) {
    const el = plotRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (selRef.current.dragging) {
      selRef.current.x1 = x;
      setSel({ x0: selRef.current.x0, x1: x });
      return;
    }

    const t = pxToTime(x);
    const p = findNearestPointByTime(t);
    if (!p) {
      setHover(null);
      return;
    }

    const span = yMax - yMin;
    const yy = Math.min(Math.max(p.y, yMin), yMax);
    const yPx = rect.height - ((yy - yMin) / span) * rect.height;

    setHover({ xPx: x, yPx, t: p.t, y: p.y });
  }

  function handlePointerDown(e) {
    if (e.button !== 0) return;
    const el = plotRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;

    selRef.current.dragging = true;
    selRef.current.x0 = x;
    selRef.current.x1 = x;

    setSel({ x0: x, x1: x });
  }

  function handlePointerUp(e) {
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
