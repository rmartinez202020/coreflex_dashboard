// src/components/controls/graphicDisplay/hooks/useTrendLayout.js
import { useMemo } from "react";

/**
 * useTrendLayout
 * Pure layout helpers for GraphicDisplay:
 * - style badge label
 * - y-axis ticks
 * - grid background CSS
 */
export default function useTrendLayout({
  graphStyle = "line",
  yMin = 0,
  yMax = 100,
  yDivs = 10,
  xDivs = 12,
  yMinor = 2,
  xMinor = 2,
} = {}) {
  const styleBadge = useMemo(() => {
    if (graphStyle === "line") return "LINE";
    if (graphStyle === "area") return "AREA";
    if (graphStyle === "bar") return "BAR";
    if (graphStyle === "step") return "STEP";
    return "LINE";
  }, [graphStyle]);

  const yTicks = useMemo(() => {
    const min = Number(yMin);
    const max = Number(yMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return [];
    const step = (max - min) / Number(yDivs || 10);
    const arr = [];
    for (let i = 0; i <= Number(yDivs || 10); i++) arr.push(min + step * i);
    return arr;
  }, [yMin, yMax, yDivs]);

  const gridBackground = useMemo(() => {
    const safeXDivs = Math.max(2, Number(xDivs || 12));
    const safeYDivs = Math.max(2, Number(yDivs || 10));
    const safeXMinor = Math.max(1, Number(xMinor || 2));
    const safeYMinor = Math.max(1, Number(yMinor || 2));

    // same math you had, just centralized
    const majorX = Math.max(24, Math.round(520 / safeXDivs));
    const majorY = Math.max(20, Math.round(260 / safeYDivs));
    const minorX = Math.max(8, Math.round(majorX / (safeXMinor + 1)));
    const minorY = Math.max(8, Math.round(majorY / (safeYMinor + 1)));

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

  return { styleBadge, yTicks, gridBackground };
}