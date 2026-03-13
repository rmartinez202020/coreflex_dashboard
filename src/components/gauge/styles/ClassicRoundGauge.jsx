// src/components/gauge/styles/ClassicRoundGauge.jsx

import React, { useMemo } from "react";
import {
  buildGaugeDefaults,
  computeGaugeValue,
  formatGaugeValue,
  getGaugePalette,
  getNeedleLine,
  getTickValues,
  normalizeRange,
  polarToCartesian,
  valueToAngle,
} from "../utils";

function TickMarks({
  cx,
  cy,
  radius,
  minValue,
  maxValue,
  showTicks,
  showLabels,
  tickColor,
  labelColor,
  decimals,
}) {
  const majorTicks = useMemo(
    () => getTickValues(minValue, maxValue, 6),
    [minValue, maxValue]
  );

  const minorTicks = useMemo(() => {
    const arr = [];
    const majorCount = majorTicks.length;
    if (majorCount < 2) return arr;

    for (let i = 0; i < majorCount - 1; i += 1) {
      const start = majorTicks[i];
      const end = majorTicks[i + 1];
      const step = (end - start) / 5;

      for (let j = 1; j < 5; j += 1) {
        arr.push(start + step * j);
      }
    }

    return arr;
  }, [majorTicks]);

  if (!showTicks && !showLabels) return null;

  return (
    <>
      {showTicks &&
        minorTicks.map((v, idx) => {
          const angle = valueToAngle(v, minValue, maxValue, -130, 130);
          const p1 = polarToCartesian(cx, cy, radius - 10, angle);
          const p2 = polarToCartesian(cx, cy, radius - 2, angle);

          return (
            <line
              key={`minor-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={tickColor}
              strokeWidth="1.5"
              opacity="0.75"
              strokeLinecap="round"
            />
          );
        })}

      {majorTicks.map((v, idx) => {
        const angle = valueToAngle(v, minValue, maxValue, -130, 130);
        const p1 = polarToCartesian(cx, cy, radius - 16, angle);
        const p2 = polarToCartesian(cx, cy, radius - 1, angle);
        const lp = polarToCartesian(cx, cy, radius - 34, angle);

        return (
          <g key={`major-${idx}`}>
            {showTicks && (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={tickColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {showLabels && (
              <text
                x={lp.x}
                y={lp.y}
                fill={labelColor}
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ userSelect: "none" }}
              >
                {formatGaugeValue(v, decimals)}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

function ZoneArc({
  cx,
  cy,
  radius,
  fromValue,
  toValue,
  minValue,
  maxValue,
  color,
  width = 12,
}) {
  const startAngle = valueToAngle(fromValue, minValue, maxValue, -130, 130);
  const endAngle = valueToAngle(toValue, minValue, maxValue, -130, 130);

  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  const d = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity="0.95"
    />
  );
}

function GaugeZones({
  cx,
  cy,
  radius,
  minValue,
  maxValue,
  lowWarn,
  highWarn,
  showZones,
  palette,
}) {
  if (!showZones) return null;

  const hasLow = Number.isFinite(Number(lowWarn));
  const hasHigh = Number.isFinite(Number(highWarn));

  const lo = Number(minValue);
  const hi = Number(maxValue);
  const lw = Number(lowWarn);
  const hw = Number(highWarn);

  if (!hasLow && !hasHigh) {
    return (
      <ZoneArc
        cx={cx}
        cy={cy}
        radius={radius}
        fromValue={lo}
        toValue={hi}
        minValue={lo}
        maxValue={hi}
        color={palette.normal}
      />
    );
  }

  if (hasLow && hasHigh && lw < hw) {
    return (
      <>
        <ZoneArc
          cx={cx}
          cy={cy}
          radius={radius}
          fromValue={lo}
          toValue={lw}
          minValue={lo}
          maxValue={hi}
          color={palette.warning}
        />
        <ZoneArc
          cx={cx}
          cy={cy}
          radius={radius}
          fromValue={lw}
          toValue={hw}
          minValue={lo}
          maxValue={hi}
          color={palette.normal}
        />
        <ZoneArc
          cx={cx}
          cy={cy}
          radius={radius}
          fromValue={hw}
          toValue={hi}
          minValue={lo}
          maxValue={hi}
          color={palette.alarm}
        />
      </>
    );
  }

  if (hasLow) {
    return (
      <>
        <ZoneArc
          cx={cx}
          cy={cy}
          radius={radius}
          fromValue={lo}
          toValue={lw}
          minValue={lo}
          maxValue={hi}
          color={palette.warning}
        />
        <ZoneArc
          cx={cx}
          cy={cy}
          radius={radius}
          fromValue={lw}
          toValue={hi}
          minValue={lo}
          maxValue={hi}
          color={palette.normal}
        />
      </>
    );
  }

  return (
    <>
      <ZoneArc
        cx={cx}
        cy={cy}
        radius={radius}
        fromValue={lo}
        toValue={hw}
        minValue={lo}
        maxValue={hi}
        color={palette.normal}
      />
      <ZoneArc
        cx={cx}
        cy={cy}
        radius={radius}
        fromValue={hw}
        toValue={hi}
        minValue={lo}
        maxValue={hi}
        color={palette.alarm}
      />
    </>
  );
}

export default function ClassicRoundGauge({
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

  const outerW = Math.max(160, Number(width) || 220);
  const outerH = Math.max(170, Number(height) || 220);

  const title = String(cfg.title || "").trim();
  const units = String(cfg.units || "").trim();
  const showValue = cfg.showValue !== false;
  const showTicks = cfg.showTicks !== false;
  const showLabels = cfg.showLabels !== false;

  const svgW = outerW;
  const svgH = outerH;

  const cx = svgW / 2;
  const cy = Math.max(82, svgH * 0.5);
  const radius = Math.max(56, Math.min(svgW, svgH) * 0.42);

  const needleAngle = valueToAngle(
    computed.clampedValue,
    computed.min,
    computed.max,
    -130,
    130
  );

  const needle = getNeedleLine({
    cx,
    cy,
    radius: radius - 4,
    angleDeg: needleAngle,
    tailLength: 15,
    tipOffset: 8,
  });

  // ✅ no left-padded zeros
  const displayInt = Number.isFinite(Number(computed.displayValue))
    ? Math.round(Number(computed.displayValue))
    : 0;

  const displayPlain = String(
    Math.max(0, Math.min(9999, Math.abs(displayInt)))
  );

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
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <filter
            id="classicGaugeShadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.18" />
          </filter>

          <radialGradient id="classicGaugeFace" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={palette.face} />
            <stop offset="75%" stopColor={palette.face} />
            <stop offset="100%" stopColor={palette.background} />
          </radialGradient>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={radius + 16}
          fill="#f7f7f7"
          stroke="#d9d9d9"
          strokeWidth="2"
          filter="url(#classicGaugeShadow)"
        />

        <circle
          cx={cx}
          cy={cy}
          r={radius + 9}
          fill="#fafafa"
          stroke="#ececec"
          strokeWidth="1.5"
        />

        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="url(#classicGaugeFace)"
          stroke={palette.border}
          strokeWidth="1.8"
        />

        <GaugeZones
          cx={cx}
          cy={cy}
          radius={radius - 6}
          minValue={minValue}
          maxValue={maxValue}
          lowWarn={cfg.lowWarn}
          highWarn={cfg.highWarn}
          showZones={cfg.showZones !== false}
          palette={palette}
        />

        <TickMarks
          cx={cx}
          cy={cy}
          radius={radius - 2}
          minValue={minValue}
          maxValue={maxValue}
          showTicks={showTicks}
          showLabels={showLabels}
          tickColor={palette.tick}
          labelColor={palette.label}
          decimals={0}
        />

        {title ? (
          <text
            x={cx}
            y={cy - radius * 0.4}
            fill={palette.label}
            fontSize="16"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            {title}
          </text>
        ) : null}

        {units ? (
          <text
            x={cx}
            y={cy + radius * 0.16}
            fill={palette.label}
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none", opacity: 0.9 }}
          >
            {units}
          </text>
        ) : null}

        <line
          x1={needle.x1}
          y1={needle.y1}
          x2={needle.x2}
          y2={needle.y2}
          stroke={palette.needle}
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        <circle
          cx={cx}
          cy={cy}
          r="10"
          fill={palette.centerCap}
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
        <circle
          cx={cx}
          cy={cy}
          r="4.5"
          fill="#f8fafc"
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {showValue && (
          <text
            x={cx}
            y={cy + radius * 0.56}
            fill={palette.valueText}
            fontSize="28"
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              letterSpacing: "2px",
              userSelect: "none",
            }}
          >
            {displayPlain}
          </text>
        )}

        {/* ✅ removed RAW → OUT text */}
      </svg>
    </div>
  );
}