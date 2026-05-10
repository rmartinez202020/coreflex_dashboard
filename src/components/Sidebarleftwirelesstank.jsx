// src/components/Sidebarleftwirelesstank.jsx
import React from "react";

export default function Sidebarleftwirelesstank({
  size = 150,
  liquidLevel = 58,
  liquidColor = "#efe58a",
  strokeColor = "#2b2b2b",
  backgroundColor = "#ffffff",
}) {
  const level = Math.max(0, Math.min(100, liquidLevel));

  // liquid fill calculations
  const fillHeight = 88 * (level / 100);
  const fillY = 170 - fillHeight;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.92)}
      viewBox="0 0 220 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        overflow: "visible",
      }}
    >
      {/* =========================
          TOP SURFACE
      ========================= */}
      <polygon
        points="28,52 175,52 205,66 60,66"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* =========================
          LEFT SIDE
      ========================= */}
      <polygon
        points="28,52 60,66 60,170 28,156"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* =========================
          FRONT FACE
      ========================= */}
      <polygon
        points="60,66 205,66 205,170 60,170"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* =========================
          TOP SMALL BOX
      ========================= */}
      <polygon
        points="40,20 95,20 112,28 58,28"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <polygon
        points="40,20 58,28 58,52 40,44"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <polygon
        points="58,28 112,28 112,52 58,52"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* =========================
          FRONT LIQUID
      ========================= */}
      <clipPath id="wirelessTankFrontClip">
        <polygon points="60,66 205,66 205,170 60,170" />
      </clipPath>

      <rect
        x="60"
        y={fillY}
        width="145"
        height={fillHeight}
        fill={liquidColor}
        opacity="0.78"
        clipPath="url(#wirelessTankFrontClip)"
      />

      {/* =========================
          LEFT LIQUID
      ========================= */}
      <clipPath id="wirelessTankLeftClip">
        <polygon points="28,52 60,66 60,170 28,156" />
      </clipPath>

      <rect
        x="20"
        y={fillY}
        width="60"
        height={fillHeight}
        fill={liquidColor}
        opacity="0.78"
        clipPath="url(#wirelessTankLeftClip)"
      />

      {/* =========================
          LIQUID DASH LINE
      ========================= */}
      <line
        x1="60"
        y1={fillY}
        x2="205"
        y2={fillY}
        stroke="#808080"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      <line
        x1="28"
        y1={fillY - 10}
        x2="60"
        y2={fillY}
        stroke="#808080"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      {/* =========================
          BACK INNER DASH
      ========================= */}
      <line
        x1="175"
        y1="52"
        x2="175"
        y2="156"
        stroke="#9a9a9a"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      <line
        x1="175"
        y1="52"
        x2="205"
        y2="66"
        stroke="#9a9a9a"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      {/* =========================
          SENSOR PORT TOP
      ========================= */}
      <circle
        cx="52"
        cy="36"
        r="10"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <circle
        cx="52"
        cy="36"
        r="6"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      {/* =========================
          LEFT SIDE PORTS
      ========================= */}
      <circle
        cx="24"
        cy="138"
        r="8"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <circle
        cx="24"
        cy="138"
        r="4"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      <circle
        cx="38"
        cy="148"
        r="8"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <circle
        cx="38"
        cy="148"
        r="4"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      {/* =========================
          SMALL LEFT HANDLES
      ========================= */}
      <rect
        x="17"
        y="88"
        width="8"
        height="10"
        rx="1"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      <rect
        x="44"
        y="102"
        width="8"
        height="10"
        rx="1"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      {/* =========================
          FEET
      ========================= */}
      <rect
        x="52"
        y="170"
        width="10"
        height="5"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1"
      />

      <rect
        x="190"
        y="170"
        width="10"
        height="5"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
    </svg>
  );
}