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
 *
 * IMPORTANT BEHAVIOR:
 * - A visual gap is created ONLY when the time difference between two
 *   consecutive valid history readings is more than 1 hour.
 * - We do NOT compare the last reading time to "now".
 * - We do NOT let null/gap placeholder samples define the X domain.
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

    // ✅ keep line close to Y axis, but not touching
    const PAD_LEFT = 6;
    const PAD_RIGHT = 6;
    const INNER_W = Math.max(1, W - PAD_LEFT - PAD_RIGHT);

    // ✅ create a break ONLY when two consecutive valid history readings
    // are more than 1 hour apart
    const MAX_POINT_GAP_MS = 60 * 60 * 1000;

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

    // ✅ Use only real drawable points to define X domain.
    // This prevents placeholder gap/null samples from creating fake blank space.
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

    // ✅ track previous VALID HISTORY reading only
    // null/gap placeholders do not become the comparison baseline
    let prevValidT = null;

    const flushCurrent = () => {
      if (current.length > 0) segs.push(current);
      current = [];
    };

    for (const p of arr) {
      // Ignore placeholder gap points for drawing.
      // They should not compare against "now" or create fake trailing gaps.
      if (p.gap) {
        flushCurrent();
        continue;
      }

      const yyNum = Number(p.y);
      if (!Number.isFinite(yyNum)) {
        flushCurrent();
        continue;
      }

      // ✅ Only compare current valid history reading vs previous valid history reading
      if (
        Number.isFinite(prevValidT) &&
        Number.isFinite(p.t) &&
        p.t - prevValidT > MAX_POINT_GAP_MS
      ) {
        flushCurrent();
      }

      const x = PAD_LEFT + ((p.t - tMin) / tSpan) * INNER_W;
      const yy = clamp(yyNum, minY, maxY);
      const y = H - ((yy - minY) / ySpan) * H;

      current.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      prevValidT = p.t;
    }

    flushCurrent();

    log("SVG: segs computed", {
      segsCount: segs.length,
      arrCount: arr.length,
      drawableCount: drawable.length,
      tMin,
      tMax,
      tSpan,
      padLeft: PAD_LEFT,
      padRight: PAD_RIGHT,
      maxPointGapMs: MAX_POINT_GAP_MS,
      firstDrawableT: drawable[0]?.t ?? null,
      lastDrawableT: drawable[drawable.length - 1]?.t ?? null,
      firstSegPoints: segs[0]?.length ?? 0,
      lastSegPoints: segs[segs.length - 1]?.length ?? 0,
      firstX:
        segs.length && segs[0]?.length
          ? String(segs[0][0] || "").split(",")[0]
          : null,
      lastX:
        segs.length && segs[segs.length - 1]?.length
          ? String(
              segs[segs.length - 1][segs[segs.length - 1].length - 1] || ""
            ).split(",")[0]
          : null,
    });

    return { svg: { segs, W, H } };
  }, [points, pointsForView, yMin, yMax, dbg, dbgWarn]);
}