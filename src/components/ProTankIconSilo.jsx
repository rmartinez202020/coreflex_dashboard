// src/components/ProTankIconSilo.jsx
import React, { useId } from "react";

const svgStyle = {
  width: "100%",
  height: "100%",
  display: "block",
};

// Convert hex to { rgb, opacity } for reliable SVG rendering
function hexToRgbOpacity(input) {
  const s = String(input || "").trim();
  if (!s) return { rgb: "rgb(0,255,0)", opacity: 0.55 };

  // #RGB
  if (s.startsWith("#") && s.length === 4) {
    const r = parseInt(s[1] + s[1], 16);
    const g = parseInt(s[2] + s[2], 16);
    const b = parseInt(s[3] + s[3], 16);
    return { rgb: `rgb(${r},${g},${b})`, opacity: 0.55 };
  }

  // #RRGGBB
  if (s.startsWith("#") && s.length === 7) {
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    return { rgb: `rgb(${r},${g},${b})`, opacity: 0.55 };
  }

  // #RRGGBBAA
  if (s.startsWith("#") && s.length === 9) {
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    const a = parseInt(s.slice(7, 9), 16);
    const opacity = Number.isFinite(a) ? Math.max(0, Math.min(1, a / 255)) : 0.55;
    return { rgb: `rgb(${r},${g},${b})`, opacity };
  }

  // fallback: let svg try it, but keep opacity
  return { rgb: s, opacity: 0.55 };
}

// ⭐ SILO TANK (Dashboard)
export function SiloTank({
  level = 0, // 0..100
  fillColor = "#00ff00",
  alarm = false,

  // percent text in the silo
  showPercentText = false,
  percentText = "",
  percentTextColor = "#111827",

  // ✅ NEW: bottom output text INSIDE svg (prevents clipping by parent)
  showBottomText = false,
  bottomText = "",
  bottomTextColor = "#111827",
}) {
  const rawId = useId();
  const safeId = `silo_${String(rawId).replace(/[^a-zA-Z0-9\-_]/g, "")}`;
  const maskId = `${safeId}_mask`;

  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0));

  // Body (cylinder) region
  const topY = 30;
  const bottomY = 140;
  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;

  const { rgb, opacity } = hexToRgbOpacity(alarm ? "#ff4d4d" : fillColor);

  // ✅ bigger viewBox so we can draw the bottom text INSIDE the SVG
  return (
    <div style={{ display: "inline-block" }}>
      <svg viewBox="0 0 160 240" preserveAspectRatio="xMidYMid meet" style={svgStyle}>
        <defs>
          {/* ✅ Mask is more reliable than clipPath in many React/SVG cases */}
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="160" height="240" fill="black" />
            {/* white = visible */}
            <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" fill="white" />
          </mask>
        </defs>

        {/* liquid fill (masked to the cylinder body) */}
        <rect
          x="20"
          y={fillY}
          width="80"
          height={filledHeight}
          fill={rgb}
          fillOpacity={opacity}
          mask={`url(#${maskId})`}
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

        {/* ✅ bottom output text INSIDE svg (won't be clipped) */}
        {showBottomText ? (
          <text
            x="60"
            y="225"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
            fontSize="18"
            fontWeight="700"
            fill={bottomTextColor}
            style={{ userSelect: "none" }}
          >
            {bottomText || "--"}
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
