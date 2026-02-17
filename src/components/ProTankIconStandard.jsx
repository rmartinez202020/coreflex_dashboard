// src/components/ProTankIconStandard.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ STANDARD TANK (Dashboard)
export function StandardTank({ level = 0 }) {
  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <ellipse cx="60" cy="30" rx="45" ry="15" fill="none" stroke="#555" strokeWidth="2" />
        <line x1="15" y1="30" x2="15" y2="160" stroke="#555" strokeWidth="2" />
        <line x1="105" y1="30" x2="105" y2="160" stroke="#555" strokeWidth="2" />
        <path d="M 15 160 C 15 175, 105 175, 105 160" fill="none" stroke="#555" strokeWidth="2" />
        <path
          d="M 105 160 C 105 145, 15 145, 15 160"
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      </svg>
    </div>
  );
}

// ⭐ STANDARD TANK ICON (Left menu)
export function StandardTankIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 160 180">
      <ellipse cx="60" cy="30" rx="45" ry="15" fill="none" stroke="#ffffff" strokeWidth="2" />
      <line x1="15" y1="30" x2="15" y2="160" stroke="#ffffff" strokeWidth="2" />
      <line x1="105" y1="30" x2="105" y2="160" stroke="#ffffff" strokeWidth="2" />
      <path d="M 15 160 C 15 175, 105 175, 105 160" fill="none" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M 105 160 C 105 145, 15 145, 15 160"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
    </svg>
  );
}
