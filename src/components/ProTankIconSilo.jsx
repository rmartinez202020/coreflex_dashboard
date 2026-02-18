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
  // ✅ sanitize id (React useId can contain ":" which can cause url(#id) issues in some SVG cases)
  const rawId = useId();
  const clipId = `siloClip_${String(rawId).replace(/[^a-zA-Z0-9\-_]/g, "")}`;

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  const topY = 30;
  const bottomY = 140;
  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ IMPORTANT: force userSpace units so the path coords work correctly */}
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" />
          </clipPath>
        </defs>

        {/* liquid fill */}
        <rect
          x="20"
          y={fillY}
          width="80"
          height={filledHeight}
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

        {/* percent text inside */}
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
