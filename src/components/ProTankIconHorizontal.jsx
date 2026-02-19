// src/components/ProTankIconHorizontal.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "auto",
  display: "block",
};

// ⭐ HORIZONTAL TANK — Balanced Height Version
export function HorizontalTank({
  level = 0,
  fillColor = "#60a5fa88",
  alarm = false,

  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  showBottomText = false,
  bottomText = "",
  bottomUnit = "",
  bottomTextColor = "#111827",

  pointerEvents = "none",
}) {
  const clipId = useId();

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // ✅ Slightly taller than original, but not too much
  const x1 = 35;
  const x2 = 125;
  const capR = 35;

  const topY = 32;      // balanced
  const bottomY = 86;   // balanced

  const totalW = x2 - x1 + capR * 2; // 160
  const h = bottomY - topY;

  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;

  const shouldShowBottom =
    showBottomText || String(bottomText || "").trim() !== "";

  // Bottom → Top fill
  const fillH = h * (clampedLevel / 100);
  const fillY = bottomY - fillH;
  const fillX = x1 - capR;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents,
      }}
    >
      <svg
        viewBox="0 0 160 115"
        preserveAspectRatio="xMidYMid meet"
        style={{
          ...svgStyle,
          pointerEvents,
        }}
      >
        <defs>
          <clipPath id={clipId}>
            {/* Reduced arc height for smoother look */}
            <path d="M 35 32 H 125 A 35 26 0 1 1 125 86 H 35 A 35 26 0 1 1 35 32" />
          </clipPath>
        </defs>

        {/* LIQUID FILL */}
        <rect
          x={fillX}
          y={fillY}
          width={totalW}
          height={fillH}
          fill={effectiveFill}
          clipPath={`url(#${clipId})`}
        />

        {/* OUTLINE */}
        <path
          d="M 35 32 H 125 A 35 26 0 1 1 125 86 H 35 A 35 26 0 1 1 35 32"
          fill="none"
          stroke="#727272"
          strokeWidth="1.5"
        />

        {/* % TEXT */}
        {showPercentText ? (
          <text
            x="80"
            y="59"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
            fontSize="15"
            fontWeight="700"
            fill={percentTextColor}
            style={{ userSelect: "none", opacity: 0.9 }}
          >
            {percentText || `${Math.round(clampedLevel)}%`}
          </text>
        ) : null}
      </svg>

      {shouldShowBottom ? (
        <div
          style={{
            marginTop: -8,
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
            pointerEvents,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900 }}>
            {String(bottomText || "").trim() || "--"}
          </span>

          {String(bottomUnit || "").trim() ? (
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {String(bottomUnit).trim()}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function HorizontalTankIcon() {
  return (
    <svg width="50" height="20" viewBox="0 0 160 115">
      <path
        d="M 35 32 H 125 A 35 26 0 1 1 125 86 H 35 A 35 26 0 1 1 35 32"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
}
