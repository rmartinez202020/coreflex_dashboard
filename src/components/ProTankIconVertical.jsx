// src/components/ProTankIconVertical.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ VERTICAL TANK (Dashboard)
export function VerticalTank({ level = 0 }) {
  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
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
      </svg>
    </div>
  );
}

// ⭐ VERTICAL TANK ICON (Left menu)
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
