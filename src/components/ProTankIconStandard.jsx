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

  // ✅ bottom output (match ProTankIconSilo behavior)
  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // -------------------------
  // ✅ CENTERED GEOMETRY
  // -------------------------
  const TANK_W = 90;
  const X0 = (160 - TANK_W) / 2; // 35
  const X1 = X0 + TANK_W; // 125
  const CX = (X0 + X1) / 2; // 80

  // Tank top ellipse geometry
  const topEllipseCY = 30;
  const topEllipseRX = 45;
  const topEllipseRY = 15;

  // ✅ This is the REAL top-most inside point of the tank
  // (so 100% fill reaches the top dome)
  const topFillY = topEllipseCY - topEllipseRY; // 15

  // Bottom of the rounded shape
  const bodyBottomY = 160;
  const clipBottomY = 175;

  // ✅ Fill uses full inside height (topFillY -> clipBottomY)
  const filledHeight = (clipBottomY - topFillY) * (clampedLevel / 100);
  const fillY = clipBottomY - filledHeight;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 160 180" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ Clip includes TOP DOME so 100% fill covers everything */}
          <clipPath id={clipId}>
            <path
              d={`
                M ${X0} ${topEllipseCY}
                A ${topEllipseRX} ${topEllipseRY} 0 0 1 ${X1} ${topEllipseCY}
                L ${X1} ${bodyBottomY}
                C ${X1} ${clipBottomY}, ${X0} ${clipBottomY}, ${X0} ${bodyBottomY}
                Z
              `}
            />
          </clipPath>
        </defs>

        {/* liquid fill */}
        <rect
          x={X0}
          y={fillY}
          width={TANK_W}
          height={filledHeight}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* tank outline */}
        <ellipse
          cx={CX}
          cy={topEllipseCY}
          rx={topEllipseRX}
          ry={topEllipseRY}
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />
        <line x1={X0} y1={topEllipseCY} x2={X0} y2={bodyBottomY} stroke="#555" strokeWidth="2" />
        <line x1={X1} y1={topEllipseCY} x2={X1} y2={bodyBottomY} stroke="#555" strokeWidth="2" />

        {/* bottom curve */}
        <path
          d={`M ${X0} ${bodyBottomY} C ${X0} ${clipBottomY}, ${X1} ${clipBottomY}, ${X1} ${bodyBottomY}`}
          fill="none"
          stroke="#555"
          strokeWidth="2"
        />

        {/* dashed interior hint line */}
        <path
          d={`M ${X1} ${bodyBottomY} C ${X1} 145, ${X0} 145, ${X0} ${bodyBottomY}`}
          fill="none"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {/* percent text inside */}
        {showPercentText ? (
          <text
            x={CX}
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

      {/* Bottom label */}
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
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.3 }}>
            {String(bottomText || "").trim() || "--"}
          </span>

          {String(bottomUnit || "").trim() ? (
            <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.95 }}>
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
  const TANK_W = 90;
  const X0 = (160 - TANK_W) / 2;
  const X1 = X0 + TANK_W;
  const CX = (X0 + X1) / 2;

  const topEllipseCY = 30;
  const topEllipseRX = 45;
  const topEllipseRY = 15;

  const bodyBottomY = 160;
  const clipBottomY = 175;

  return (
    <svg width="40" height="40" viewBox="0 0 160 180">
      <ellipse
        cx={CX}
        cy={topEllipseCY}
        rx={topEllipseRX}
        ry={topEllipseRY}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <line x1={X0} y1={topEllipseCY} x2={X0} y2={bodyBottomY} stroke="#ffffff" strokeWidth="2" />
      <line x1={X1} y1={topEllipseCY} x2={X1} y2={bodyBottomY} stroke="#ffffff" strokeWidth="2" />
      <path
        d={`M ${X0} ${bodyBottomY} C ${X0} ${clipBottomY}, ${X1} ${clipBottomY}, ${X1} ${bodyBottomY}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <path
        d={`M ${X1} ${bodyBottomY} C ${X1} 145, ${X0} 145, ${X0} ${bodyBottomY}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
    </svg>
  );
}
