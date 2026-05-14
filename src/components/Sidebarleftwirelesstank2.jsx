// Sidebarleftwirelesstank2.jsx
import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#ffffff",

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
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* main tank body */}
        <path d="M60 120 L345 45 C357 42 370 42 383 46 L610 115" />
        <path d="M60 120 C45 125 38 136 40 148 C42 160 54 166 72 170" />
        <path d="M610 115 C627 120 636 132 633 145 C630 156 618 163 600 166" />

        <path d="M72 170 L335 225" />
        <path d="M335 225 L600 166" />

        <path d="M40 148 L40 410" />
        <path d="M633 145 L633 395" />
        <path d="M72 170 L72 405" />
        <path d="M335 225 L335 490" />
        <path d="M600 166 L600 395" />

        <path d="M72 405 L335 490" />
        <path d="M335 490 L600 395" />

        {/* front corner */}
        <path d="M335 225 L335 490" />

        {/* top rim */}
        <path d="M50 138 L335 198 L623 136" />
        <path d="M56 152 L335 212 L616 150" />

        {/* top square hatch */}
        <path d="M232 96 L350 70 L458 96 L337 128 Z" />
        <path d="M232 96 L232 112 L337 144 L337 128" />
        <path d="M458 96 L458 112 L337 144" />
        <path d="M255 100 L350 80 L435 99 L337 123 Z" />

        {/* bottom rim */}
        <path d="M40 410 L72 424 L318 502" />
        <path d="M318 502 C334 508 354 506 372 499" />
        <path d="M372 499 L602 420" />
        <path d="M602 420 C618 414 629 402 633 392" />

        {/* inside intermittent level line */}
        <path
          d="M40 322 L335 235 L633 320"
          stroke={strokeColor}
          strokeDasharray="14 14"
          opacity="0.75"
        />

        {/* front lower ports */}
        <ellipse cx="138" cy="352" rx="18" ry="31" />
        <ellipse cx="145" cy="353" rx="12" ry="25" />
        <ellipse cx="152" cy="354" rx="7" ry="18" />

        <ellipse cx="270" cy="390" rx="18" ry="31" />
        <ellipse cx="277" cy="391" rx="12" ry="25" />
        <ellipse cx="284" cy="392" rx="7" ry="18" />

        {/* feet */}
        <path d="M55 420 L92 431 L92 458 L55 447 Z" />
        <path d="M92 431 L118 424 L118 450 L92 458 Z" />

        <path d="M315 500 L355 512 L355 540 L315 528 Z" />
        <path d="M355 512 L382 503 L382 530 L355 540 Z" />

        <path d="M535 436 L572 424 L572 452 L535 464 Z" />
        <path d="M572 424 L598 417 L598 443 L572 452 Z" />
      </g>

      {showTelemetry && (
        <g>
          <circle cx="690" cy="135" r="30" fill="rgba(34,197,94,0.18)" />
          <text x="690" y="135" fill="#16a34a" fontSize="34" fontWeight="500" textAnchor="middle" dominantBaseline="central">
            ↕
          </text>
          <text x="755" y="127" fill="#0f172a" fontSize="24" fontWeight="400">
            Height
          </text>
          <text x="755" y="165" fill="#16a34a" fontSize="36" fontWeight="400" fontFamily="monospace">
            {heightValue}
          </text>

          <circle cx="690" cy="225" r="30" fill="rgba(249,115,22,0.18)" />
          <text x="690" y="225" fill="#ea580c" fontSize="34" fontWeight="500" textAnchor="middle" dominantBaseline="central">
            ♨
          </text>
          <text x="755" y="217" fill="#0f172a" fontSize="24" fontWeight="400">
            Temperature
          </text>
          <text x="755" y="255" fill="#ea580c" fontSize="36" fontWeight="400" fontFamily="monospace">
            {temperatureValue}
          </text>

          <circle cx="690" cy="315" r="30" fill="rgba(34,197,94,0.18)" />
          <text x="690" y="315" fill="#16a34a" fontSize="30" fontWeight="500" textAnchor="middle" dominantBaseline="central">
            🔋
          </text>
          <text x="755" y="307" fill="#0f172a" fontSize="24" fontWeight="400">
            Battery
          </text>
          <text x="755" y="345" fill="#16a34a" fontSize="36" fontWeight="400" fontFamily="monospace">
            {batteryValue}
          </text>

          <circle cx="690" cy="405" r="30" fill="rgba(59,130,246,0.18)" />
          <text x="690" y="405" fill="#2563eb" fontSize="34" fontWeight="500" textAnchor="middle" dominantBaseline="central">
            ▣
          </text>
          <text x="755" y="397" fill="#0f172a" fontSize="24" fontWeight="400">
            Date
          </text>
          <text x="755" y="435" fill="#2563eb" fontSize="26" fontWeight="400" fontFamily="monospace">
            {dateValue}
          </text>
        </g>
      )}
    </svg>
  );
}