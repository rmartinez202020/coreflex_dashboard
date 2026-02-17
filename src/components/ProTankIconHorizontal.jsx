// src/components/ProTankIconHorizontal.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ HORIZONTAL TANK (Dashboard)
export function HorizontalTank({ level = 0 }) {
  const stroke = "#727272";
  const strokeWidth = 1.5;

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <path
          d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37"
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    </div>
  );
}

// ⭐ HORIZONTAL TANK ICON (Left menu)
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
