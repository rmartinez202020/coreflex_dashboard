// src/components/ProTankIconVertical.jsx
import React, { useId } from "react";

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
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // Geometry (matches your outline)
  const topY = 25;
  const bodyBottomY = 165;
  const bottomCurveY = 180; // ✅ IMPORTANT: your base curve reaches here
  const leftX = 15;
  const rightX = 65;
  const innerW = rightX - leftX;

  // ✅ Fill should go ALL the way to bottom curve
  const fillH = (bottomCurveY - topY) * (clampedLevel / 100);
  const fillY = bottomCurveY - fillH;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ Clip matches the inside of the tank INCLUDING the rounded bottom */}
          <clipPath id={clipId}>
            <path
              d={`
                M ${leftX} ${topY}
                L ${leftX} ${bodyBottomY}
                C ${leftX} ${bottomCurveY}, ${rightX} ${bottomCurveY}, ${rightX} ${bodyBottomY}
                L ${rightX} ${topY}
                Z
              `}
            />
          </clipPath>
        </defs>

        {/* ✅ LIQUID FILL */}
        <rect
          x={leftX}
          y={fillY}
          width={innerW}
          height={fillH}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE (unchanged) */}
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
