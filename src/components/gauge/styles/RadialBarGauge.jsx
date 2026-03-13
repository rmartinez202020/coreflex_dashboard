// src/components/gauge/styles/RadialBarGauge.jsx

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

function Segment({
  cx,
  cy,
  outerR,
  innerR,
  startAngle,
  endAngle,
  color,
  opacity = 1,
}) {
  const p1 = polarToCartesian(cx, cy, outerR, startAngle);
  const p2 = polarToCartesian(cx, cy, outerR, endAngle);
  const p3 = polarToCartesian(cx, cy, innerR, endAngle);
  const p4 = polarToCartesian(cx, cy, innerR, startAngle);

  const largeArcOuter = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const largeArcInner = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  const d = [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcOuter} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcInner} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");

  return <path d={d} fill={color} opacity={opacity} />;
}

export default function RadialBarGauge({
  value = 0,
  settings = {},
  width = 220,
  height = 220,
}) {
  const cfg = useMemo(() => buildGaugeDefaults(settings), [settings]);
  const palette = useMemo(() => getGaugePalette(cfg), [cfg]);
  const computed = useMemo(() => computeGaugeValue(value, cfg), [value, cfg]);

  const { min: minValue, max: maxValue } = useMemo(
    () => normalizeRange(cfg.minValue, cfg.maxValue),
    [cfg.minValue, cfg.maxValue]
  );

  const outerW = Math.max(180, Number(width) || 220);
  const outerH = Math.max(180, Number(height) || 220);

  const cx = outerW / 2;
  const cy = outerH * 0.54;

  const outerR = Math.min(outerW, outerH) * 0.38;
  const innerR = outerR - 22;

  const startAngle = -130;
  const endAngle = 130;

  const totalSegments = 28;
  const filledSegments = Math.round(
    Math.max(0, Math.min(1, computed.ratio)) * totalSegments
  );

  const zoneColor = getZoneColor(computed.displayValue, cfg);
  const displayValue = formatCompactValue(computed.displayValue, cfg.decimals);

  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const gap = 2.2;
    const fullSpan = (endAngle - startAngle) / totalSegments;
    const segStart = startAngle + i * fullSpan + gap / 2;
    const segEnd = startAngle + (i + 1) * fullSpan - gap / 2;
    const active = i < filledSegments;

    return {
      start: segStart,
      end: segEnd,
      active,
    };
  });

  const minPos = polarToCartesian(cx, cy, outerR + 16, startAngle);
  const maxPos = polarToCartesian(cx, cy, outerR + 16, endAngle);

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
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <filter id="radialGaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.16" />
          </filter>
        </defs>

        {segments.map((seg, idx) => (
          <Segment
            key={idx}
            cx={cx}
            cy={cy}
            outerR={outerR}
            innerR={innerR}
            startAngle={seg.start}
            endAngle={seg.end}
            color={seg.active ? zoneColor : "#e5e7eb"}
            opacity={seg.active ? 1 : 0.9}
          />
        ))}

        <circle
          cx={cx}
          cy={cy}
          r={innerR - 8}
          fill={palette.face}
          stroke={palette.border}
          strokeWidth="1.5"
          filter="url(#radialGaugeShadow)"
        />

        {cfg.title ? (
          <text
            x={cx}
            y={cy - 18}
            fill={palette.label}
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {cfg.title}
          </text>
        ) : null}

        {cfg.showValue !== false && (
          <text
            x={cx}
            y={cy + 10}
            fill={palette.valueText}
            fontSize="24"
            fontWeight="800"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {displayValue}
          </text>
        )}

        {cfg.units ? (
          <text
            x={cx}
            y={cy + 32}
            fill={palette.label}
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {cfg.units}
          </text>
        ) : null}

        {cfg.showLabels !== false && (
          <>
            <text
              x={minPos.x}
              y={minPos.y}
              fill={palette.label}
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ userSelect: "none" }}
            >
              {minValue}
            </text>

            <text
              x={maxPos.x}
              y={maxPos.y}
              fill={palette.label}
              fontSize="11"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ userSelect: "none" }}
            >
              {maxValue}
            </text>
          </>
        )}

        {cfg.formula ? (
          <text
            x={cx}
            y={outerH - 10}
            fill={computed.formulaOk ? palette.label : "#ef4444"}
            fontSize="10.5"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {computed.formulaOk ? `RAW ${computed.rawValue} → OUT ${displayValue}` : "FORMULA ERROR"}
          </text>
        ) : null}
      </svg>
    </div>
  );
}