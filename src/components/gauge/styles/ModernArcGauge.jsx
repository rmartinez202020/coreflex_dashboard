// src/components/gauge/styles/ModernArcGauge.jsx

import React, { useMemo } from "react";
import {
  buildGaugeDefaults,
  computeGaugeValue,
  formatCompactValue,
  getGaugePalette,
  getZoneColor,
  normalizeRange,
  polarToCartesian,
} from "../utils";

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function ModernArcGauge({
  value = 0,
  settings = {},
  width = 220,
  height = 200,
}) {
  const cfg = useMemo(() => buildGaugeDefaults(settings), [settings]);
  const palette = useMemo(() => getGaugePalette(cfg), [cfg]);

  const computed = useMemo(() => computeGaugeValue(value, cfg), [value, cfg]);

  const { min: minValue, max: maxValue } = useMemo(
    () => normalizeRange(cfg.minValue, cfg.maxValue),
    [cfg.minValue, cfg.maxValue]
  );

  const outerW = Math.max(180, Number(width) || 220);
  const outerH = Math.max(160, Number(height) || 200);

  const cx = outerW / 2;
  const cy = outerH * 0.6;
  const radius = Math.min(outerW, outerH) * 0.42;

  const startAngle = -130;
  const endAngle = 130;

  const progressAngle =
    startAngle +
    (computed.clampedValue - minValue) /
      (maxValue - minValue) *
      (endAngle - startAngle);

  const backgroundArc = describeArc(cx, cy, radius, startAngle, endAngle);
  const progressArc = describeArc(cx, cy, radius, startAngle, progressAngle);

  const zoneColor = getZoneColor(computed.displayValue, cfg);

  const displayValue = formatCompactValue(computed.displayValue, cfg.decimals);

  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={outerW}
        height={outerH}
        viewBox={`0 0 ${outerW} ${outerH}`}
        style={{ overflow: "visible" }}
      >
        {/* background arc */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* progress arc */}
        <path
          d={progressArc}
          fill="none"
          stroke={zoneColor}
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* centered value */}
        {cfg.showValue !== false && (
          <text
            x={cx}
            y={cy - 10}
            fill={palette.valueText}
            fontSize="26"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {displayValue}
          </text>
        )}

        {/* units */}
        {cfg.units && (
          <text
            x={cx}
            y={cy + 18}
            fill={palette.label}
            fontSize="13"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {cfg.units}
          </text>
        )}

        {/* title */}
        {cfg.title && (
          <text
            x={cx}
            y={outerH - 10}
            fill={palette.label}
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
          >
            {cfg.title}
          </text>
        )}

        {/* min */}
        <text
          x={polarToCartesian(cx, cy, radius + 10, startAngle).x}
          y={polarToCartesian(cx, cy, radius + 10, startAngle).y}
          fill={palette.label}
          fontSize="11"
          textAnchor="middle"
        >
          {minValue}
        </text>

        {/* max */}
        <text
          x={polarToCartesian(cx, cy, radius + 10, endAngle).x}
          y={polarToCartesian(cx, cy, radius + 10, endAngle).y}
          fill={palette.label}
          fontSize="11"
          textAnchor="middle"
        >
          {maxValue}
        </text>
      </svg>
    </div>
  );
}