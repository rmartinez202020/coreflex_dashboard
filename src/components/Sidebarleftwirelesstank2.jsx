// Sidebarleftwirelesstank2.jsx
import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#ffffff",

  // ✅ Telemetry values shown on the right side of Tank#2
  heightValue = "--",
  temperatureValue = "--",
  batteryValue = "--",
  dateValue = "--",

  showTelemetry = true,
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="0 0 1050 545"
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
        {/* main simplified tank body */}
        <path d="M70 118 L335 55 C347 52 360 52 372 55 L590 112" />
        <path d="M70 118 C55 122 47 132 49 144 C51 156 62 162 78 165" />
        <path d="M590 112 C606 116 615 126 613 139 C611 151 600 158 584 160" />

        <path d="M78 165 L330 214" />
        <path d="M330 214 L584 160" />

        <path d="M49 144 L49 408" />
        <path d="M613 139 L613 388" />
        <path d="M78 165 L78 402" />
        <path d="M330 214 L330 478" />
        <path d="M584 160 L584 389" />

        <path d="M78 402 L330 478" />
        <path d="M330 478 L584 389" />

        {/* rounded front vertical corner */}
        <path d="M330 214 C342 203 354 204 363 211" />
        <path d="M363 211 L363 464" />
        <path d="M330 478 C342 490 357 484 363 464" />

        {/* top rim - simplified */}
        <path d="M57 135 L330 188 L604 131" />
        <path d="M62 149 L330 201 L598 145" />

        {/* square top hatch */}
        <path d="M225 92 L345 68 L455 91 L333 120 Z" />
        <path d="M225 92 L225 108 L333 137 L333 120" />
        <path d="M455 91 L455 106 L333 137" />
        <path d="M246 96 L345 77 L432 94 L333 116 Z" />

        {/* bottom rim */}
        <path d="M50 407 L78 419 L315 490" />
        <path d="M315 490 C330 495 348 494 365 488" />
        <path d="M365 488 L585 414" />
        <path d="M585 414 C600 409 610 398 613 387" />
        <path d="M78 419 L315 490" opacity="0.55" />
        <path d="M365 488 L585 414" opacity="0.55" />

        {/* black intermittent inside level line - same position as red reference */}
        <path
          d="M49 322 L330 235 L613 318"
          stroke={strokeColor}
          strokeDasharray="14 14"
          opacity="0.75"
        />

        {/* front lower ports */}
        <ellipse cx="150" cy="355" rx="18" ry="30" />
        <ellipse cx="156" cy="356" rx="12" ry="24" />
        <ellipse cx="162" cy="357" rx="7" ry="17" />

        <ellipse cx="270" cy="390" rx="18" ry="30" />
        <ellipse cx="276" cy="391" rx="12" ry="24" />
        <ellipse cx="282" cy="392" rx="7" ry="17" />

        {/* feet */}
        <path d="M62 417 L96 426 L96 452 L62 442 Z" />
        <path d="M96 426 L118 420 L118 444 L96 452 Z" />

        <path d="M310 487 L348 497 L348 525 L310 514 Z" />
        <path d="M348 497 L374 489 L374 516 L348 525 Z" />

        <path d="M518 430 L552 420 L552 446 L518 457 Z" />
        <path d="M552 420 L576 414 L576 438 L552 446 Z" />
      </g>

      {/* ✅ Telemetry information only, no box/title */}
      {showTelemetry && (
        <g>
          {/* Height */}
          <circle cx="670" cy="135" r="30" fill="rgba(34,197,94,0.18)" />
          <text
            x="670"
            y="135"
            fill="#16a34a"
            fontSize="34"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ↕
          </text>
          <text x="735" y="127" fill="#0f172a" fontSize="24" fontWeight="400">
            Height
          </text>
          <text
            x="735"
            y="165"
            fill="#16a34a"
            fontSize="36"
            fontWeight="400"
            fontFamily="monospace"
          >
            {heightValue}
          </text>

          {/* Temperature */}
          <circle cx="670" cy="225" r="30" fill="rgba(249,115,22,0.18)" />
          <text
            x="670"
            y="225"
            fill="#ea580c"
            fontSize="34"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ♨
          </text>
          <text x="735" y="217" fill="#0f172a" fontSize="24" fontWeight="400">
            Temperature
          </text>
          <text
            x="735"
            y="255"
            fill="#ea580c"
            fontSize="36"
            fontWeight="400"
            fontFamily="monospace"
          >
            {temperatureValue}
          </text>

          {/* Battery */}
          <circle cx="670" cy="315" r="30" fill="rgba(34,197,94,0.18)" />
          <text
            x="670"
            y="315"
            fill="#16a34a"
            fontSize="30"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="central"
          >
            🔋
          </text>
          <text x="735" y="307" fill="#0f172a" fontSize="24" fontWeight="400">
            Battery
          </text>
          <text
            x="735"
            y="345"
            fill="#16a34a"
            fontSize="36"
            fontWeight="400"
            fontFamily="monospace"
          >
            {batteryValue}
          </text>

          {/* Date */}
          <circle cx="670" cy="405" r="30" fill="rgba(59,130,246,0.18)" />
          <text
            x="670"
            y="405"
            fill="#2563eb"
            fontSize="34"
            fontWeight="500"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ▣
          </text>
          <text x="735" y="397" fill="#0f172a" fontSize="24" fontWeight="400">
            Date
          </text>
          <text
            x="735"
            y="435"
            fill="#2563eb"
            fontSize="26"
            fontWeight="400"
            fontFamily="monospace"
          >
            {dateValue}
          </text>
        </g>
      )}
    </svg>
  );
}