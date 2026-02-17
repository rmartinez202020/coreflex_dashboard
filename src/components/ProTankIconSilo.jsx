// src/components/ProTankIconSilo.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ SILO TANK (Dashboard)
export function SiloTank({
  level = 0,
  primaryValue,
  secondaryValue,
  fillColor = "#fde04788",
  alarm = false,
}) {
  const clampedLevel = Math.max(0, Math.min(100, level));
  const topY = 30;
  const bottomY = 140;
  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;
  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <clipPath id="siloClip">
            <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" />
          </clipPath>
        </defs>

        <rect
          x="20"
          y={fillY}
          width="80"
          height={filledHeight}
          fill={effectiveFill}
          clipPath="url(#siloClip)"
        />

        <path
          d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z"
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />
        <path
          d="M 20 140 L 100 140 L 70 194 L 50 194 Z"
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export function SiloTankIcon() {
  return (
    <svg width="35" height="80" viewBox="0 0 160 200">
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
