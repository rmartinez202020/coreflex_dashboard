// src/components/ProTankIconSilo.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

export function SiloTank({
  level = 0, // 0..100
  fillColor = "#fde04788",
  alarm = false,
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // ⭐ IMPORTANT: full tank height including cone
  const topY = 30;
  const bottomY = 194; // ← was 140 before (WRONG)

  const totalHeight = bottomY - topY;
  const filledHeight = totalHeight * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ CLIP PATH NOW INCLUDES CONE */}
          <clipPath id={clipId}>
            <path d="
              M 20 30
              A 40 12 0 0 1 100 30
              L 100 140
              L 70 194
              L 50 194
              L 20 140
              Z
            " />
          </clipPath>
        </defs>

        {/* Liquid fill */}
        <rect
          x="0"
          y={fillY}
          width="120"
          height={filledHeight}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* Tank outline */}
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

        {/* Percent text */}
        {showPercentText && (
          <text
            x="60"
            y="100"
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
        )}
      </svg>
    </div>
  );
}
