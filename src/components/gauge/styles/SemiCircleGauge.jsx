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

  // ✅ Keep the widget box a little bigger so the blue resize handle
  // sits outside the visual gauge instead of on top of it.
  const outerW = Math.max(180, Number(width) || 220);
  const outerH = Math.max(120, Number(height) || 160);

  // ✅ Inner padding creates breathing room inside the selected box
  const padX = 22;
  const padTop = 14;
  const padBottom = 22;

  const innerW = Math.max(120, outerW - padX * 2);
  const innerH = Math.max(90, outerH - padTop - padBottom);

  const cx = padX + innerW / 2;
  const cy = padTop + innerH * 0.88;
  const radius = Math.min(innerW / 2, innerH) * 0.92;

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
  const unitsText = String(cfg.units || "").trim();

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
        width={outerW}
        height={outerH}
        viewBox={`0 0 ${outerW} ${outerH}`}
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
          const angle = valueToAngle(t, minValue, maxValue, startAngle, endAngle);

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
            style={{ userSelect: "none" }}
          >
            {unitsText ? `${displayValue} ${unitsText}` : displayValue}
          </text>
        )}

        {/* Title */}
        {cfg.title && (
          <text
            x={cx}
            y={outerH - 14}
            fill={palette.label}
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
            style={{ userSelect: "none" }}
          >
            {cfg.title}
          </text>
        )}
      </svg>
    </div>
  );
}