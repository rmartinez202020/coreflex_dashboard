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

  // ✅ NEW: show bottom output label (value + unit) under the silo (like your screenshot)
  showBottomText = false,
  bottomText = "", // ex: "16666" or "16666.00"
  bottomUnit = "", // ex: "lb", "psi", "gal", etc (from modal)
  bottomTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // ✅ FULL tank height INCLUDING the cone
  // body starts at y=30, cone tip ends at y=194
  const topY = 30;
  const bottomY = 194;

  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      {/* viewBox is 0..120 (tank centered at x=60) */}
      <svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ clip path includes BOTH body + cone so fill starts at cone bottom */}
          <clipPath id={clipId}>
            <path
              d="
                M 20 30
                A 40 12 0 0 1 100 30
                L 100 140
                L 70 194
                L 50 194
                L 20 140
                Z
              "
            />
          </clipPath>
        </defs>

        {/* ✅ liquid fill (use wide rect and clip it) */}
        <rect x="0" y={fillY} width="120" height={filledHeight} fill={effectiveFill} clipPath={`url(#${clipId})`} />

        {/* tank outline */}
        <path
          d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z"
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />
        <path d="M 20 140 L 100 140 L 70 194 L 50 194 Z" fill="none" stroke="#555" strokeWidth="2" />

        {/* percent text inside */}
        {showPercentText ? (
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
        ) : null}
      </svg>

      {/* ✅ bottom output label (value + unit) */}
      {shouldShowBottom ? (
        <div
          style={{
            marginTop: 6,
            padding: "4px 10px",
            borderRadius: 6,
            background: "#e5e7eb",
            border: "1px solid #cbd5e1",
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 14,
            lineHeight: 1,
            color: bottomTextColor,
            userSelect: "none",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          <span>{String(bottomText || "").trim() || "--"}</span>
          {String(bottomUnit || "").trim() ? (
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>{String(bottomUnit).trim()}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// WHITE ICON (LEFT MENU)
export function SiloTankIcon() {
  return (
    <svg width="35" height="80" viewBox="0 0 120 200">
      <path
        d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path d="M 20 140 L 100 140 L 70 194 L 50 194 Z" fill="none" stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}
