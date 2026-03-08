// src/components/controls/graphicDisplay/hooks/useTrendSvg.js
import { useMemo } from "react";

/**
 * useTrendSvg
 * Builds SVG polyline segments from trend points.
 *
 * Inputs:
 * - points: full points array [{t,y,gap}]
 * - pointsForView: optional zoomed subset from usePingZoom
 * - yMin, yMax: numeric axis range
 * - dbg / dbgWarn: optional logging fns (no-ops if not provided)
 *
 * Output:
 * - { svg } where svg = { segs: string[][], W: number, H: number }
 */
export default function useTrendSvg({
  points,
  pointsForView,
  yMin,
  yMax,
  dbg,
  dbgWarn,
} = {}) {
  return useMemo(() => {
    const W = 1000;
    const H = 360;

    const minY = Number(yMin);
    const maxY = Number(yMax);
    const ySpan = maxY - minY;

    const warn = typeof dbgWarn === "function" ? dbgWarn : () => {};
    const log = typeof dbg === "function" ? dbg : () => {};

    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || ySpan <= 0) {
      warn("SVG: invalid y range", { minY, maxY, ySpan });
      return { svg: { segs: [], W, H } };
    }

    const arrRaw =
      Array.isArray(pointsForView) && pointsForView.length
        ? pointsForView
        : Array.isArray(points)
        ? points
        : [];

    if (!arrRaw.length) {
      log("SVG: no points to draw", {
        pointsCount: Array.isArray(points) ? points.length : 0,
        viewCount: Array.isArray(pointsForView) ? pointsForView.length : 0,
      });
      return { svg: { segs: [], W, H } };
    }

    const arr = arrRaw
      .map((p) => ({
        t: Number(p?.t),
        y: p?.y,
        gap: !!p?.gap || p?.y === null || p?.y === undefined,
      }))
      .filter((p) => Number.isFinite(p.t))
      .sort((a, b) => a.t - b.t);

    if (!arr.length) {
      warn("SVG: points present but none valid after sanitize");
      return { svg: { segs: [], W, H } };
    }

    const tMin = arr[0].t;
    const tMax = arr[arr.length - 1].t;
    const tSpan = Math.max(1, tMax - tMin);

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    const segs = [];
    let current = [];

    for (const p of arr) {
      if (p.gap) {
        if (current.length >= 2) segs.push(current);
        current = [];
        continue;
      }

      // ✅ Make the first point touch the Y-axis exactly
      const x = ((p.t - tMin) / tSpan) * W;

      const yy = clamp(Number(p.y), minY, maxY);
      const y = H - ((yy - minY) / ySpan) * H;

      current.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    if (current.length >= 2) segs.push(current);

    log("SVG: segs computed", {
      segsCount: segs.length,
      arrCount: arr.length,
      tMin,
      tMax,
      tSpan,
      firstX:
        segs.length && segs[0]?.length
          ? String(segs[0][0] || "").split(",")[0]
          : null,
      lastX:
        segs.length && segs[segs.length - 1]?.length
          ? String(segs[segs.length - 1][segs[segs.length - 1].length - 1] || "").split(",")[0]
          : null,
    });

    return { svg: { segs, W, H } };
  }, [points, pointsForView, yMin, yMax, dbg, dbgWarn]);
}