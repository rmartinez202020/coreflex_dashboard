// src/components/ProTankIconVertical.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ VERTICAL TANK (Dashboard) — with liquid fill
export function VerticalTank({
  level = 0,
  fillColor = "#60a5fa88",
  alarm = false,
  showPercentText = false,
  percentText,
}) {
  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // Geometry
  const topY = 25;
  const bottomY = 165;
  const leftX = 15;
  const rightX = 65;
  const innerW = rightX - leftX;

  const fillH = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - fillH;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  // Clip area for the vessel body
  const clipId = "verticalTankClip";

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <clipPath id={clipId}>
            {/* cylinder body clip (rectangle) */}
            <rect x={leftX} y={topY} width={innerW} height={bottomY - topY} />
          </clipPath>
        </defs>

        {/* LIQUID FILL */}
        <rect
          x={leftX}
          y={fillY}
          width={innerW}
          height={fillH}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE (same as original) */}
        <ellipse cx="40" cy="25" rx="25" ry="10" fill="none" stroke="#555" strokeWidth="2" />
        <line x1="15" y1="25" x2="15" y2="165" stroke="#555" strokeWidth="2" />
        <line x1="65" y1="25" x2="65" y2="165" stroke="#555" strokeWidth="2" />
        <path d="M 15 165 C 15 180, 65 180, 65 165" fill="none" stroke="#555" strokeWidth="2" />
        <path
          d="M 65 165 C 65 150, 15 150, 15 165"
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {/* % TEXT INSIDE */}
        {showPercentText ? (
          <text
            x="40"
            y="105"
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

// ⭐ VERTICAL TANK ICON (Left menu) — unchanged
export function VerticalTankIcon() {
  return (
    <svg width="30" height="70" viewBox="0 0 160 180">
      <ellipse cx="40" cy="25" rx="25" ry="10" fill="none" stroke="#ffffff" strokeWidth="2" />
      <line x1="15" y1="25" x2="15" y2="165" stroke="#ffffff" strokeWidth="2" />
      <line x1="65" y1="25" x2="65" y2="165" stroke="#ffffff" strokeWidth="2" />
      <path d="M 15 165 C 15 180, 65 180, 65 165" fill="none" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M 65 165 C 65 150, 15 150, 15 165"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
    </svg>
  );
}
