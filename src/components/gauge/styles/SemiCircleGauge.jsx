// src/components/gauge/styles/SemiCircleGauge.jsx

import React, { useMemo } from "react";
import {
  buildGaugeDefaults,
  computeGaugeValue,
  describeArc,
  formatCompactValue,
  getGaugePalette,
  normalizeRange,
  polarToCartesian,
  valueToAngle,
  getNeedleLine,
  getTickValues,
} from "../utils";

function isFiniteNumber(v) {
  return Number.isFinite(Number(v));
}

// ✅ SAME helper as other widgets
function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

export default function SemiCircleGauge({
  value = 0,
  settings = {},
  width = 220,
  height = 160,

  // ✅ ADD THIS (same pattern)
  isPlay = false,
  telemetryMap = null,
}) {
  const cfg = useMemo(() => buildGaugeDefaults(settings), [settings]);
  const palette = useMemo(() => getGaugePalette(cfg), [cfg]);

  const computed = useMemo(() => computeGaugeValue(value, cfg), [value, cfg]);

  const { min: minValue, max: maxValue } = useMemo(
    () => normalizeRange(cfg.minValue, cfg.maxValue),
    [cfg.minValue, cfg.maxValue]
  );

  // ✅ binding
  const bindModel = String(
    cfg.bindModel || settings?.bindModel || "zhc1921"
  ).trim();
  const bindDeviceId = String(
    cfg.bindDeviceId || settings?.bindDeviceId || ""
  ).trim();
  const hasBinding = !!bindDeviceId;

  const telemetryRow = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "")
    .trim()
    .toLowerCase();

  const deviceIsOffline = isPlay && hasBinding && backendStatus === "offline";

  const gaugeW = Math.max(180, Number(width) || 220);
  const gaugeH = Math.max(120, Number(height) || 160);

  // ✅ extra bottom room for Offline label
  const BLUE_BOX_EXTRA = 40;
  const BOTTOM_EXTRA = 22;
  const outerW = gaugeW + BLUE_BOX_EXTRA;
  const outerH = gaugeH + BOTTOM_EXTRA;

  const cx = gaugeW / 2;
  const cy = gaugeH * 0.68;

  const radius = Math.min(gaugeW / 2 - 8, cy - 8);

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

  const lowWarn = isFiniteNumber(cfg.lowWarn) ? Number(cfg.lowWarn) : null;
  const highWarn = isFiniteNumber(cfg.highWarn) ? Number(cfg.highWarn) : null;

  const zoneBounds = useMemo(() => {
    let low = lowWarn;
    let high = highWarn;

    if (low !== null) low = Math.max(minValue, Math.min(maxValue, low));
    if (high !== null) high = Math.max(minValue, Math.min(maxValue, high));

    if (low !== null && high !== null && high < low) {
      const tmp = low;
      low = high;
      high = tmp;
    }

    return { low, high };
  }, [lowWarn, highWarn, minValue, maxValue]);

  const zoneSegments = useMemo(() => {
    if (cfg.showZones === false) return [];

    const segments = [];
    const { low, high } = zoneBounds;

    if (low !== null && high !== null) {
      if (low > minValue) {
        segments.push({ from: minValue, to: low, color: palette.warning });
      }
      if (high > low) {
        segments.push({ from: low, to: high, color: palette.normal });
      }
      if (high < maxValue) {
        segments.push({ from: high, to: maxValue, color: palette.alarm });
      }
      return segments;
    }

    if (low !== null) {
      if (low > minValue) {
        segments.push({ from: minValue, to: low, color: palette.warning });
      }
      if (low < maxValue) {
        segments.push({ from: low, to: maxValue, color: palette.normal });
      }
      return segments;
    }

    if (high !== null) {
      if (high > minValue) {
        segments.push({ from: minValue, to: high, color: palette.normal });
      }
      if (high < maxValue) {
        segments.push({ from: high, to: maxValue, color: palette.alarm });
      }
      return segments;
    }

    segments.push({ from: minValue, to: maxValue, color: palette.normal });
    return segments;
  }, [cfg.showZones, zoneBounds, minValue, maxValue, palette]);

  return (
    <div
      style={{
        width: outerW,
        height: outerH,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "transparent",
        position: "relative",
      }}
    >
      <svg
        width={gaugeW}
        height={gaugeH}
        viewBox={`0 0 ${gaugeW} ${gaugeH}`}
        style={{ display: "block" }}
      >
        {cfg.title && (
          <text
            x={cx}
            y={65}
            fill={palette.label}
            fontSize="13"
            fontWeight="600"
            textAnchor="middle"
          >
            {cfg.title}
          </text>
        )}

        <path
          d={describeArc(cx, cy, radius, startAngle, endAngle)}
          fill="none"
          stroke={palette.border}
          strokeWidth="10"
          strokeLinecap="round"
        />

        {cfg.showZones !== false &&
          zoneSegments.map((seg, i) => {
            if (!(seg.to > seg.from)) return null;

            const segStart = valueToAngle(
              seg.from,
              minValue,
              maxValue,
              startAngle,
              endAngle
            );
            const segEnd = valueToAngle(
              seg.to,
              minValue,
              maxValue,
              startAngle,
              endAngle
            );

            return (
              <path
                key={`zone-${i}`}
                d={describeArc(cx, cy, radius, segStart, segEnd)}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeLinecap="round"
              />
            );
          })}

        {cfg.showTicks !== false &&
          ticks.map((t, i) => {
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

                {cfg.showLabels !== false && (
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
                )}
              </g>
            );
          })}

        <line
          x1={needle.x1}
          y1={needle.y1}
          x2={needle.x2}
          y2={needle.y2}
          stroke={palette.needle}
          strokeWidth="5"
          strokeLinecap="round"
        />

        <circle cx={cx} cy={cy} r="7" fill={palette.centerCap} />

        {cfg.units && (
          <text
            x={cx}
            y={cy - radius * 0.45}
            fill={palette.valueText}
            fontSize="16"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {cfg.units}
          </text>
        )}

        {cfg.showValue !== false && (
          <text
            x={cx}
            y={cy + 30}
            fill={palette.valueText}
            fontSize="18"
            fontWeight="700"
            textAnchor="middle"
          >
            {displayValue}
          </text>
        )}

        {/* ✅ OFFLINE BELOW VALUE, INSIDE SAME SVG */}
        {deviceIsOffline && (
          <text
            x={cx}
            y={cy + 48}
            fill="#dc2626"
            fontSize="12"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            Offline
          </text>
        )}
      </svg>
    </div>
  );
}