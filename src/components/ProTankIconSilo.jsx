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

  // ✅ show percent text inside the silo
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // ✅ FULL interior bounds (TOP of cylinder -> BOTTOM of cone)
  const topY = 30;
  const bottomY = 194;

  // Fill from bottom upward
  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  // ✅ One interior path that includes BOTH the cylinder + cone
  // Cylinder: 20..100 from y=30..140
  // Cone: down to (70,194) and (50,194)
  const interiorPath = "M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 70 194 L 50 194 L 20 140 Z";

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <clipPath id={clipId}>
            <path d={interiorPath} />
          </clipPath>
        </defs>

        {/* ✅ liquid fill (now fills from cone bottom up) */}
        <rect
          x="20"
          y={fillY}
          width="80"
          height={Math.max(0, filledHeight)}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* tank outline */}
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

        {/* percent text */}
        {showPercentText ? (
          <text
            x="60"
            y="95"
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
    </div>
  );
}

// WHITE ICON (LEFT MENU)
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
