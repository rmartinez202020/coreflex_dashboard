// src/components/ProTankIcon.jsx
import React from "react";
import { SiloTank, SiloTankIcon } from "./ProTankIconSilo";

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

// ================================
// WHITE ICONS FOR LEFT MENU (UNCHANGED)
// ================================

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

// ✅ re-exported from ProTankIconSilo.jsx
export { SiloTank, SiloTankIcon };
