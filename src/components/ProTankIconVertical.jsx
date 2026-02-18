// src/components/ProTankIconVertical.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ VERTICAL TANK (Dashboard) — now matches SiloTank behavior style-wise
export function VerticalTank({
  level = 0, // 0..100
  fillColor = "#60a5fa88",
  alarm = false,

  // percent text inside
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  // bottom output (same idea as SiloTank)
  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // Geometry
  const topY = 25;
  const bodyBottomY = 165;
  const bottomCurveY = 180; // ✅ the outline bottom curve reaches here
  const leftX = 15;
  const rightX = 65;
  const innerW = rightX - leftX;

  // ✅ Fill should reach the curved bottom, not stop at 165
  const filledHeight = (bottomCurveY - topY) * (clampedLevel / 100);
  const fillY = bottomCurveY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ Clip matches the inside including the rounded bottom */}
          <clipPath id={clipId}>
            <path
              d={`
                M ${leftX} ${topY}
                L ${leftX} ${bodyBottomY}
                C ${leftX} ${bottomCurveY}, ${rightX} ${bottomCurveY}, ${rightX} ${bodyBottomY}
                L ${rightX} ${topY}
                Z
              `}
            />
          </clipPath>
        </defs>

        {/* LIQUID FILL */}
        <rect
          x={leftX}
          y={fillY}
          width={innerW}
          height={filledHeight}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE */}
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

        {/* % TEXT INSIDE */}
        {showPercentText ? (
          <text
            x="40"
            y="105"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
            fontSize="14"
            fontWeight="700"
            fill={percentTextColor}
            style={{ userSelect: "none", opacity: 0.9 }}
          >
            {percentText || `${Math.round(clampedLevel)}%`}
          </text>
        ) : null}
      </svg>

      {/* 🔥 Bottom label (same UI idea as SiloTank) */}
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
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          >
            {String(bottomText || "").trim() || "--"}
          </span>

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

// ⭐ VERTICAL TANK ICON (Left menu) — unchanged
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
