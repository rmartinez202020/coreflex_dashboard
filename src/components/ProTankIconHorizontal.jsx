// src/components/ProTankIconHorizontal.jsx
import React from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// ⭐ HORIZONTAL TANK (Dashboard) — matches Silo/Standard/Vertical behavior
export function HorizontalTank({
  level = 0, // 0..100
  fillColor = "#60a5fa88",
  alarm = false,

  // percent text inside
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  // bottom output (same as SiloTank)
  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",
}) {
  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // geometry (outline path you use)
  // Path: M 35 37 H 125 A 35 18 ... so the "caps" extend beyond x=35..125
  const x1 = 35;
  const x2 = 125;
  const capR = 35; // horizontal radius of end caps
  const topY = 37;
  const bottomY = 73;

  // ✅ total interior width INCLUDING rounded caps
  const totalW = (x2 - x1) + capR * 2; // 90 + 70 = 160
  const h = bottomY - topY;

  // ✅ fill should start at the far left of the cap
  const fillX = x1 - capR;
  const fillW = totalW * (clampedLevel / 100);

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  // ✅ unique clipPath id per instance (prevents SVG id collisions)
  const clipId = React.useId();

  const shouldShowBottom = showBottomText || String(bottomText || "").trim() !== "";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          <clipPath id={clipId}>
            <path d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37" />
          </clipPath>
        </defs>

        {/* ✅ LIQUID FILL (now covers BOTH caps at 100%) */}
        <rect
          x={fillX}
          y={topY}
          width={fillW}
          height={h}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE */}
        <path
          d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37"
          fill="none"
          stroke="#727272"
          strokeWidth="1.5"
        />

        {/* % TEXT INSIDE */}
        {showPercentText ? (
          <text
            x="80"
            y="55"
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

      {/* 🔥 Bottom label (same style as ProTankIconSilo/Standard/Vertical) */}
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

// ⭐ HORIZONTAL TANK ICON (Left menu)
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
