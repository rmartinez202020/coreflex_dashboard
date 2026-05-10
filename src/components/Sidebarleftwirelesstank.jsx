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
      viewBox="0 0 320 295"
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
        {/* MAIN TANK BODY - reference proportion */}
        <path d="M30 82 L225 82 L300 110 L100 110 Z" />
        <path d="M30 82 L100 110 L100 260 L30 228 Z" />
        <path d="M100 110 L300 110 L300 260 L100 260 Z" />

        {/* TOP RIM / DOUBLE EDGE */}
        <path d="M30 82 L30 76 L225 76 L300 104 L300 110" />
        <path d="M30 76 L100 104 L300 104" />
        <path d="M100 110 L100 260" />
        <path d="M30 228 L100 260 L300 260" />

        {/* INNER CAD DASHED GEOMETRY */}
        <path
          d="M30 162 L100 188 L300 188"
          strokeDasharray="6 6"
          opacity="0.65"
        />
        <path
          d="M100 188 L225 162 L300 188"
          strokeDasharray="6 6"
          opacity="0.55"
        />
        <path
          d="M225 82 L225 188"
          strokeDasharray="6 6"
          opacity="0.55"
        />

        {/* TOP TRANSMITTER / FILTER BOX */}
        <path d="M56 76 L56 30 L142 18 L190 32 L190 76 L100 92 Z" />
        <path d="M56 30 L102 46 L190 32" />
        <path d="M102 46 L102 92" />
        <path d="M56 76 L100 92 L190 76" />

        {/* DOUBLE EDGE ON BOX TOP */}
        <path d="M61 34 L103 49 L184 36" opacity="0.65" />
        <path d="M61 72 L100 86 L184 72" opacity="0.65" />

        {/* ROUND PORT ON BOX */}
        <ellipse cx="80" cy="54" rx="13" ry="22" />
        <ellipse cx="80" cy="54" rx="9" ry="17" />
        <ellipse cx="80" cy="54" rx="4" ry="11" />

        {/* LEFT SIDE LATCHES */}
        <path d="M10 130 L27 136 L27 157 L10 151 Z" />
        <path d="M12 130 L19 118 L27 136" />
        <path d="M14 140 L25 144" />
        <path d="M14 151 L25 155" />

        <path d="M72 146 L90 152 L90 174 L72 168 Z" />
        <path d="M74 146 L82 132 L90 152" />
        <path d="M76 157 L88 161" />
        <path d="M76 168 L88 172" />

        {/* LOWER ROUND PORTS */}
        <ellipse cx="48" cy="220" rx="11" ry="22" />
        <ellipse cx="48" cy="220" rx="7" ry="17" />
        <ellipse cx="48" cy="220" rx="3.5" ry="11" />

        <ellipse cx="91" cy="238" rx="11" ry="22" />
        <ellipse cx="91" cy="238" rx="7" ry="17" />
        <ellipse cx="91" cy="238" rx="3.5" ry="11" />

        {/* BOTTOM BASE / FEET */}
        <path d="M30 228 L100 266 L300 266" opacity="0.8" />

        <path d="M82 260 L82 278 L118 278 L118 266" />
        <path d="M255 260 L255 278 L292 278 L292 260" />
      </g>
    </svg>
  );
}