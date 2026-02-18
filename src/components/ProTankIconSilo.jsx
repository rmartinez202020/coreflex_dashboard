// src/components/ProTankIconSilo.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ SILO TANK (Dashboard)
export function SiloTank({
  level = 0, // 0..100
  fillColor = "#fde04788",
  alarm = false,

  // percent text inside
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  // bottom output
  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  const topY = 30;
  const bottomY = 194;

  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <clipPath id={clipId}>
            <path
              d="
                M 20 30
                A 40 12 0 0 1 100 30
                L 100 140
                L 70 194
                L 50 194
                L 20 140
                Z
              "
            />
          </clipPath>
        </defs>

        <rect
          x="0"
          y={fillY}
          width="120"
          height={filledHeight}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        <path
          d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z"
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />
        <path d="M 20 140 L 100 140 L 70 194 L 50 194 Z" fill="none" stroke="#555" strokeWidth="2" />

        {showPercentText ? (
          <text
            x="60"
            y="100"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
            fontSize="18"
            fontWeight="600"
            fill={percentTextColor}
            style={{ userSelect: "none" }}
          >
            {percentText || `${Math.round(clampedLevel)}%`}
          </text>
        ) : null}
      </svg>

      {/* 🔥 Bottom label */}
      {shouldShowBottom ? (
        <div
          style={{
            marginTop: 6,
            padding: "6px 14px",
            borderRadius: 8,
            background: "#eef2f7",
            border: "1px solid rgba(17,24,39,0.25)",
            fontFamily: "monospace",
            lineHeight: 1,
            color: bottomTextColor,
            userSelect: "none",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          {/* Bigger number */}
          <span
            style={{
              fontSize: 18,      // 🔥 bigger number
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            {String(bottomText || "").trim() || "--"}
          </span>

          {/* Bigger unit */}
          {String(bottomUnit || "").trim() ? (
            <span
              style={{
                fontSize: 14,     // 🔥 bigger unit
                fontWeight: 800,
                opacity: 0.95,
              }}
            >
              {String(bottomUnit).trim()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// WHITE ICON (LEFT MENU)
export function SiloTankIcon() {
  return (
    <svg width="35" height="80" viewBox="0 0 120 200">
      <path
        d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path
        d="M 20 140 L 100 140 L 70 194 L 50 194 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
}
