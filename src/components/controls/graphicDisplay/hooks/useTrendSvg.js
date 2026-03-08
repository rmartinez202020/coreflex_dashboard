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

    // ✅ IMPORTANT:
    // Use only drawable (non-gap, numeric) points to define the X domain.
    // Otherwise an early gap/null sample creates a blank space before the line.
    const drawable = arr.filter(
      (p) => !p.gap && Number.isFinite(Number(p.y))
    );

    if (!drawable.length) {
      log("SVG: no drawable points after sanitize");
      return { svg: { segs: [], W, H } };
    }

    const tMin = drawable[0].t;
    const tMax = drawable[drawable.length - 1].t;
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

      const yyNum = Number(p.y);
      if (!Number.isFinite(yyNum)) {
        if (current.length >= 2) segs.push(current);
        current = [];
        continue;
      }

      const x = ((p.t - tMin) / tSpan) * W;
      const yy = clamp(yyNum, minY, maxY);
      const y = H - ((yy - minY) / ySpan) * H;

      current.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    if (current.length >= 2) segs.push(current);

    log("SVG: segs computed", {
      segsCount: segs.length,
      arrCount: arr.length,
      drawableCount: drawable.length,
      tMin,
      tMax,
      tSpan,
      firstDrawableT: drawable[0]?.t ?? null,
      lastDrawableT: drawable[drawable.length - 1]?.t ?? null,
    });

    return { svg: { segs, W, H } };
  }, [points, pointsForView, yMin, yMax, dbg, dbgWarn]);
}