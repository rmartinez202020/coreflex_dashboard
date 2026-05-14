import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#020617",

  heightValue = "--",
  temperatureValue = "--",
  batteryValue = "--",
  dateValue = "--",

  showTelemetry = true,
}) {
  const iconFont = "Arial, Helvetica, sans-serif";

  return (
    <svg
      width={size}
      height={Math.round(size * 0.82)}
      viewBox="0 0 770 515"
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
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Tank body */}
        <path d="M27 107 C27 97 34 90 47 86 L257 28 C267 25 278 24 287 27 L493 85 C507 89 514 97 514 109" />
        <path d="M27 107 C27 119 36 126 51 130 L263 193 C271 195 279 195 287 192 L490 129 C507 124 514 117 514 108" />
        <path d="M51 130 L51 396" />
        <path d="M514 108 L514 389" />
        <path d="M281 194 L281 486" />
        <path d="M51 396 L281 486" />
        <path d="M281 486 L514 390" />

        {/* Rounded top lip */}
        <path d="M30 116 L262 185 C273 188 282 188 292 185 L510 118" opacity="0.65" />
        <path d="M28 132 L260 202 C273 206 282 206 294 202 L512 135" opacity="0.65" />

        {/* Inner dashed construction lines */}
        <path d="M52 397 L281 315" strokeDasharray="8 11" />
        <path d="M281 315 L513 389" strokeDasharray="8 11" />

        {/* Raised top hatch */}
        <path d="M174 83 L281 53 L380 82 L274 116 Z" />
        <path d="M174 83 L174 101 L274 136 L274 116" />
        <path d="M380 82 L380 99 L274 136" />
        <path d="M174 101 L274 136 L380 99" />

        {/* Front circular ports */}
        <ellipse cx="91" cy="355" rx="20" ry="33" />
        <ellipse cx="98" cy="356" rx="14" ry="27" />
        <ellipse cx="104" cy="357" rx="8" ry="20" />

        <ellipse cx="196" cy="393" rx="20" ry="33" />
        <ellipse cx="203" cy="394" rx="14" ry="27" />
        <ellipse cx="209" cy="395" rx="8" ry="20" />

        {/* Feet */}
        <path d="M36 407 L67 419 L67 443 L36 431 Z" />
        <path d="M67 419 L84 414 L84 436 L67 443 Z" />

        <path d="M254 474 L284 486 L284 510 L254 499 Z" />
        <path d="M284 486 L309 477 L309 500 L284 510 Z" />

        <path d="M462 412 L493 399 L493 423 L462 436 Z" />
        <path d="M493 399 L511 392 L511 414 L493 423 Z" />

        {/* Bottom rim */}
        <path d="M51 407 L281 497" opacity="0.65" />
        <path d="M281 497 L514 400" opacity="0.65" />
      </g>

      {showTelemetry && (
        <g fontFamily="Inter, Arial, Helvetica, sans-serif">
          <circle cx="592" cy="110" r="28" fill="rgba(34,197,94,0.18)" />
          <text x="592" y="111" fill="#22c55e" fontSize="32" fontWeight="600" textAnchor="middle" dominantBaseline="central" fontFamily={iconFont}>↕</text>
          <text x="644" y="104" fill="#0f172a" fontSize="22">Height</text>
          <text x="644" y="142" fill="#16a34a" fontSize="28" fontWeight="500" fontFamily="monospace">{heightValue}</text>

          <circle cx="592" cy="198" r="28" fill="rgba(249,115,22,0.18)" />
          <text x="592" y="199" fill="#ef4444" fontSize="30" fontWeight="600" textAnchor="middle" dominantBaseline="central" fontFamily={iconFont}>♨</text>
          <text x="644" y="192" fill="#0f172a" fontSize="22">Temperature</text>
          <text x="644" y="230" fill="#f97316" fontSize="28" fontWeight="500" fontFamily="monospace">{temperatureValue}</text>

          <circle cx="592" cy="286" r="28" fill="rgba(34,197,94,0.18)" />
          <text x="592" y="287" fill="#22c55e" fontSize="30" fontWeight="600" textAnchor="middle" dominantBaseline="central" fontFamily={iconFont}>▯</text>
          <text x="644" y="280" fill="#0f172a" fontSize="22">Battery</text>
          <text x="644" y="318" fill="#16a34a" fontSize="28" fontWeight="500" fontFamily="monospace">{batteryValue}</text>

          <circle cx="592" cy="374" r="28" fill="rgba(59,130,246,0.18)" />
          <text x="592" y="375" fill="#2584ff" fontSize="30" fontWeight="600" textAnchor="middle" dominantBaseline="central" fontFamily={iconFont}>▣</text>
          <text x="644" y="368" fill="#0f172a" fontSize="22">Date</text>
          <text x="644" y="406" fill="#2584ff" fontSize="24" fontWeight="500" fontFamily="monospace">{dateValue}</text>
        </g>
      )}
    </svg>
  );
}
