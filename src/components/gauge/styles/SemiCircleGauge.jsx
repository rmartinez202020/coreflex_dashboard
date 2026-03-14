// src/components/gauge/styles/SemiCircleGauge.jsx

import React, { useMemo } from "react";
import {
  buildGaugeDefaults,
  computeGaugeValue,
  formatCompactValue,
  getGaugePalette,
  normalizeRange,
  polarToCartesian,
  valueToAngle,
  getNeedleLine,
  getTickValues,
} from "../utils";

export default function SemiCircleGauge({
  value = 0,
  settings = {},
  width = 220,
  height = 160,
}) {
  const cfg = useMemo(() => buildGaugeDefaults(settings), [settings]);
  const palette = useMemo(() => getGaugePalette(cfg), [cfg]);

  const computed = useMemo(() => computeGaugeValue(value, cfg), [value, cfg]);

  const { min: minValue, max: maxValue } = useMemo(
    () => normalizeRange(cfg.minValue, cfg.maxValue),
    [cfg.minValue, cfg.maxValue]
  );

  // original gauge size
  const gaugeW = Math.max(180, Number(width) || 220);
  const gaugeH = Math.max(120, Number(height) || 160);

  // ✅ make ONLY the blue selection box wider
  const BLUE_BOX_EXTRA = 40;

  const outerW = gaugeW + BLUE_BOX_EXTRA;
  const outerH = gaugeH;

  const cx = gaugeW / 2;
  const cy = gaugeH * 0.85;
  const radius = Math.min(gaugeW, gaugeH) * 0.85;

  const startAngle = -90;
  const endAngle = 90;

  const needleAngle = valueToAngle(
    computed.clampedValue,
    computed.min,
    computed.max,
    startAngle,
    endAngle
  );

  const needle = getNeedleLine({
    cx,
    cy,
    radius: radius - 10,
    angleDeg: needleAngle,
    tailLength: 12,
    tipOffset: 8,
  });

  const ticks = getTickValues(minValue, maxValue, 6);
  const displayValue = formatCompactValue(computed.displayValue, cfg.decimals);

  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <svg
        width={gaugeW}
        height={gaugeH}
        viewBox={`0 0 ${gaugeW} ${gaugeH}`}
        style={{ overflow: "visible", display: "block" }}
      >
        {/* Gauge arc */}
        <path
          d={`
            M ${polarToCartesian(cx, cy, radius, endAngle).x}
              ${polarToCartesian(cx, cy, radius, endAngle).y}
            A ${radius} ${radius} 0 0 0
              ${polarToCartesian(cx, cy, radius, startAngle).x}
              ${polarToCartesian(cx, cy, radius, startAngle).y}
          `}
          fill="none"
          stroke={palette.border}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Ticks */}
        {ticks.map((t, i) => {
          const angle = valueToAngle(
            t,
            minValue,
            maxValue,
            startAngle,
            endAngle
          );

          const p1 = polarToCartesian(cx, cy, radius - 14, angle);
          const p2 = polarToCartesian(cx, cy, radius - 2, angle);
          const label = polarToCartesian(cx, cy, radius - 30, angle);

          return (
            <g key={i}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={palette.tick}
                strokeWidth="2"
              />

              <text
                x={label.x}
                y={label.y}
                fill={palette.label}
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ userSelect: "none" }}
              >
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <line
          x1={needle.x1}
          y1={needle.y1}
          x2={needle.x2}
          y2={needle.y2}
          stroke={palette.needle}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Needle center */}
        <circle cx={cx} cy={cy} r="7" fill={palette.centerCap} />

        {/* Value */}
        {cfg.showValue !== false && (
          <text
            x={cx}
            y={cy - radius * 0.45}
            fill={palette.valueText}
            fontSize="18"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {displayValue} {cfg.units}
          </text>
        )}

        {/* Title */}
        {cfg.title && (
          <text
            x={cx}
            y={gaugeH - 10}
            fill={palette.label}
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
          >
            {cfg.title}
          </text>
        )}
      </svg>
    </div>
  );
}