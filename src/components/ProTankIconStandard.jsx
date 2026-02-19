// src/components/ProTankIconStandard.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ STANDARD TANK (Dashboard)
export function StandardTank({
  level = 0, // 0..100
  fillColor = "#60a5fa88",
  alarm = false,

  // ✅ show percent text inside
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  // ✅ NEW (match ProTankIconSilo behavior)
  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // interior bounds (roughly between top ellipse and bottom curve)
  const topY = 30;
  const bottomY = 160;

  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* Clip to the inside of the tank body */}
          <clipPath id={clipId}>
            <path d="M 15 30 L 15 160 C 15 175, 105 175, 105 160 L 105 30 Z" />
          </clipPath>
        </defs>

        {/* liquid fill */}
        <rect
          x="15"
          y={fillY}
          width="90"
          height={filledHeight}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* tank outline */}
        <ellipse cx="60" cy="30" rx="45" ry="15" fill="none" stroke="#555" strokeWidth="2" />
        <line x1="15" y1="30" x2="15" y2="160" stroke="#555" strokeWidth="2" />
        <line x1="105" y1="30" x2="105" y2="160" stroke="#555" strokeWidth="2" />

        {/* bottom curve */}
        <path d="M 15 160 C 15 175, 105 175, 105 160" fill="none" stroke="#555" strokeWidth="2" />

        {/* dashed interior hint line */}
        <path
          d="M 105 160 C 105 145, 15 145, 15 160"
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {/* ✅ percent text inside */}
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

      {/* 🔥 Bottom label (same as ProTankIconSilo) */}
      {shouldShowBottom ? (
        <div
          style={{
            marginTop: 6,
            padding: "6px 14px",
            borderRadius: 8,
            background: "#eef2f7",
            border: "1px solid rgba(17,24,39,0.25)",
            fontFamily: "monospace",
            lineHeight: 1,
            color: bottomTextColor,
            userSelect: "none",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          {/* Bigger number */}
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            {String(bottomText || "").trim() || "--"}
          </span>

          {/* Bigger unit */}
          {String(bottomUnit || "").trim() ? (
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                opacity: 0.95,
              }}
            >
              {String(bottomUnit).trim()}
            </span>
          ) : null}
        </div>
      ) : null}
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
