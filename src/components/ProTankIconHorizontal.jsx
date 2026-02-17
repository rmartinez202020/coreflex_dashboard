// src/components/ProTankIconHorizontal.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ HORIZONTAL TANK (Dashboard) — with liquid fill
export function HorizontalTank({
  level = 0,
  fillColor = "#60a5fa88",
  alarm = false,
  showPercentText = false,
  percentText,
}) {
  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // geometry (matches your outline)
  const x1 = 35;
  const x2 = 125;
  const topY = 37;
  const bottomY = 73;

  const w = x2 - x1;
  const h = bottomY - topY;

  const fillW = w * (clampedLevel / 100);
  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const clipId = "horizontalTankClip";

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* clip path for the “capsule” body */}
          <clipPath id={clipId}>
            <path d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37" />
          </clipPath>
        </defs>

        {/* LIQUID FILL */}
        <rect
          x={x1}
          y={topY}
          width={fillW}
          height={h}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE (same as original) */}
        <path
          d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37"
          fill="none"
          stroke="#727272"
          strokeWidth="1.5"
        />

        {/* % TEXT INSIDE */}
        {showPercentText ? (
          <text
            x="80"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 14,
              fontWeight: 700,
              fill: "#0f172a",
              opacity: 0.85,
              userSelect: "none",
            }}
          >
            {percentText ?? `${Math.round(clampedLevel)}%`}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

// ⭐ HORIZONTAL TANK ICON (Left menu) — unchanged
export function HorizontalTankIcon() {
  return (
    <svg width="50" height="20" viewBox="0 0 160 110">
      <path
        d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
}
