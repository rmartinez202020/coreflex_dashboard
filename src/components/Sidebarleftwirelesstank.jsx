// src/components/Sidebarleftwirelesstank.jsx
import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#dbeafe",
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.92)}
      viewBox="0 0 420 420"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{
        display: "block",
        overflow: "visible",
        maxWidth: "100%",
      }}
    >
      <g
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* =========================
            MAIN TANK
        ========================= */}

        {/* top plane */}
        <path d="M78 95 L265 95 L345 124 L158 124 Z" />

        {/* left side */}
        <path d="M78 95 L158 124 L158 330 L78 294 Z" />

        {/* front face */}
        <path d="M158 124 L345 124 L345 330 L158 330 Z" />

        {/* top lip */}
        <path d="M72 88 L265 88 L352 118" />
        <path d="M72 88 L152 118" />
        <path d="M72 95 L72 88" />
        <path d="M352 118 L352 124" />

        {/* bottom */}
        <path d="M78 294 L158 330 L345 330" />

        {/* =========================
            INNER DASHED CAD LINES
        ========================= */}

        <path
          d="M78 190 L158 218 L345 218"
          strokeDasharray="6 6"
          opacity="0.7"
        />

        <path
          d="M158 218 L265 190 L345 218"
          strokeDasharray="6 6"
          opacity="0.7"
        />

        <path
          d="M265 95 L265 218"
          strokeDasharray="6 6"
          opacity="0.7"
        />

        {/* =========================
            TOP FILTER BOX
        ========================= */}

        {/* top */}
        <path d="M98 66 L170 58 L225 73 L153 82 Z" />

        {/* left */}
        <path d="M98 66 L153 82 L153 124 L98 104 Z" />

        {/* front */}
        <path d="M153 82 L225 73 L225 114 L153 124 Z" />

        {/* extra lip */}
        <path d="M94 62 L170 54 L230 70" />
        <path d="M94 62 L149 78" />

        {/* lower edge */}
        <path d="M98 104 L153 120 L225 114" />

        {/* =========================
            ROUND PORT TOP
        ========================= */}

        <ellipse cx="122" cy="88" rx="14" ry="24" />
        <ellipse cx="122" cy="88" rx="9" ry="18" />
        <ellipse cx="122" cy="88" rx="4" ry="11" />

        {/* =========================
            SIDE LATCHES
        ========================= */}

        {/* rear latch */}
        <path d="M54 170 L72 176 L72 198 L54 192 Z" />
        <path d="M56 170 L63 158 L72 176" />
        <path d="M59 181 L69 184" />
        <path d="M59 192 L69 194" />

        {/* front latch */}
        <path d="M132 192 L151 198 L151 223 L132 216 Z" />
        <path d="M134 192 L142 178 L151 198" />
        <path d="M137 204 L148 208" />
        <path d="M137 216 L148 219" />

        {/* =========================
            LOWER ROUND PORTS
        ========================= */}

        {/* rear lower port */}
        <ellipse cx="93" cy="258" rx="12" ry="23" />
        <ellipse cx="93" cy="258" rx="8" ry="17" />
        <ellipse cx="93" cy="258" rx="4" ry="10" />

        {/* front lower port */}
        <ellipse cx="144" cy="285" rx="12" ry="23" />
        <ellipse cx="144" cy="285" rx="8" ry="17" />
        <ellipse cx="144" cy="285" rx="4" ry="10" />

        {/* =========================
            FEET
        ========================= */}

        <path d="M112 330 L112 352 L144 352 L144 340" />
        <path d="M286 330 L286 349 L320 349 L320 330" />
      </g>
    </svg>
  );
}