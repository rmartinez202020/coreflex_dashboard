import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#020617",

  // Telemetry values shown on the right side of Tank#2
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
      height={Math.round(size * 0.792)}
      viewBox="0 0 770 610"
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
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Tank body */}
        <path d="M27 137 C27 126 35 119 48 115 L257 57 C267 55 278 55 287 57 L493 116 C507 120 514 128 514 138" />
        <path d="M27 137 C27 150 36 157 51 161 L263 223 C271 225 279 225 287 222 L490 159 C507 154 514 148 514 138" />
        <path d="M51 161 L51 426" />
        <path d="M514 138 L514 420" />
        <path d="M281 224 L281 516" />
        <path d="M51 426 L281 516" />
        <path d="M281 516 L514 420" />

        {/* Rounded top lip */}
        <path d="M30 146 L262 215 C273 218 282 218 292 215 L510 148" opacity="0.72" />
        <path d="M28 162 L260 232 C273 236 282 236 294 232 L512 165" opacity="0.72" />

        {/* Inner dashed construction lines visible in reference */}
        <path d="M52 427 L281 345" strokeDasharray="8 11" />
        <path d="M281 345 L513 419" strokeDasharray="8 11" />

        {/* Raised top hatch */}
        <path d="M174 112 L281 83 L380 112 L274 146 Z" />
        <path d="M174 112 L174 130 L274 166 L274 146" />
        <path d="M380 112 L380 129 L274 166" />
        <path d="M174 130 L274 166 L380 129" />

        {/* Front circular ports */}
        <ellipse cx="91" cy="386" rx="20" ry="33" />
        <ellipse cx="98" cy="387" rx="14" ry="27" />
        <ellipse cx="104" cy="388" rx="8" ry="20" />
        <path d="M74 362 C88 348 111 355 124 375" />
        <path d="M74 409 C88 431 114 430 126 408" />

        <ellipse cx="196" cy="424" rx="20" ry="33" />
        <ellipse cx="203" cy="425" rx="14" ry="27" />
        <ellipse cx="209" cy="426" rx="8" ry="20" />
        <path d="M179 400 C193 386 216 393 229 413" />
        <path d="M179 447 C193 469 219 468 231 446" />

        {/* Feet */}
        <path d="M36 438 L67 449 L67 473 L36 462 Z" />
        <path d="M67 449 L84 444 L84 466 L67 473 Z" />
        <path d="M36 462 L67 473" />

        <path d="M254 505 L284 516 L284 540 L254 529 Z" />
        <path d="M284 516 L309 507 L309 530 L284 540 Z" />
        <path d="M254 529 L284 540" />

        <path d="M462 443 L493 430 L493 454 L462 467 Z" />
        <path d="M493 430 L511 423 L511 445 L493 454 Z" />
        <path d="M462 467 L493 454" />

        {/* Bottom rim */}
        <path d="M51 437 L281 527" opacity="0.72" />
        <path d="M281 527 L514 430" opacity="0.72" />
      </g>

      {showTelemetry && (
        <g fontFamily="Inter, Arial, Helvetica, sans-serif">
          {/* Height */}
          <circle cx="591" cy="146" r="29" fill="rgba(34,197,94,0.18)" />
          <text
            x="591"
            y="147"
            fill="#22c55e"
            fontSize="34"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={iconFont}
          >
            ↕
          </text>
          <text x="644" y="137" fill="#0f172a" fontSize="24" fontWeight="400">
            Height
          </text>
          <text
            x="644"
            y="176"
            fill="#16a34a"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {heightValue}
          </text>

          {/* Temperature */}
          <circle cx="591" cy="234" r="29" fill="rgba(249,115,22,0.18)" />
          <text
            x="591"
            y="235"
            fill="#ef3b24"
            fontSize="32"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={iconFont}
          >
            ♨
          </text>
          <text x="644" y="225" fill="#0f172a" fontSize="24" fontWeight="400">
            Temperature
          </text>
          <text
            x="644"
            y="264"
            fill="#f97316"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {temperatureValue}
          </text>

          {/* Battery */}
          <circle cx="591" cy="322" r="29" fill="rgba(34,197,94,0.18)" />
          <text
            x="591"
            y="323"
            fill="#22c55e"
            fontSize="32"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={iconFont}
          >
            ▯
          </text>
          <text x="644" y="313" fill="#0f172a" fontSize="24" fontWeight="400">
            Battery
          </text>
          <text
            x="644"
            y="352"
            fill="#16a34a"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {batteryValue}
          </text>

          {/* Date */}
          <circle cx="591" cy="410" r="29" fill="rgba(59,130,246,0.18)" />
          <text
            x="591"
            y="411"
            fill="#2584ff"
            fontSize="32"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={iconFont}
          >
            ▣
          </text>
          <text x="644" y="401" fill="#0f172a" fontSize="24" fontWeight="400">
            Date
          </text>
          <text
            x="644"
            y="440"
            fill="#2584ff"
            fontSize="26"
            fontWeight="500"
            fontFamily="monospace"
          >
            {dateValue}
          </text>
        </g>
      )}
    </svg>
  );
}
