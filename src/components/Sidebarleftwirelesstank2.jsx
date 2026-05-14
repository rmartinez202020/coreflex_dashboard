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
        {/* top slab */}
        <path d="M45 83 L335 25 C346 23 358 23 370 25 L574 65" />
        <path d="M45 83 C33 86 27 93 28 102 C29 111 38 116 52 118" />
        <path d="M574 65 C589 68 597 76 596 87 C595 96 586 102 571 105" />
        <path d="M52 118 L321 160" />
        <path d="M321 160 L571 105" />
        <path d="M45 94 L322 138 L578 84" />
        <path d="M51 108 L322 151 L572 98" />
        <path d="M321 138 C315 146 315 154 321 160" />
        <path d="M28 102 L28 401" />
        <path d="M596 87 L596 381" />

        {/* large front and side faces */}
        <path d="M52 118 L52 396" />
        <path d="M321 160 L321 467" />
        <path d="M571 105 L571 371" />
        <path d="M52 396 L321 467" />
        <path d="M321 467 L571 386" />
        <path d="M52 383 L321 450" />
        <path d="M321 450 L571 371" />
        <path d="M348 155 L348 456" />
        <path d="M321 160 C330 151 340 151 348 155" />
        <path d="M321 450 C329 459 340 461 348 456" />

        {/* rounded front vertical corner */}
        <path d="M321 160 C334 169 344 169 348 155" />
        <path d="M321 467 C334 480 347 476 348 456" />
        <path d="M321 160 C317 245 317 374 321 467" />
        <path d="M348 155 C344 247 344 370 348 456" />

        {/* bottom raised rim */}
        <path d="M30 398 C32 409 39 416 52 420 L306 487" />
        <path d="M306 487 C322 492 342 490 359 484" />
        <path d="M359 484 L574 414" />
        <path d="M574 414 C587 410 594 401 596 389" />
        <path d="M30 386 L52 396" />
        <path d="M596 376 L571 386" />
        <path d="M52 420 L306 487" opacity="0.55" />
        <path d="M359 484 L574 414" opacity="0.55" />

        {/* front lower ports */}
        <ellipse cx="100" cy="350" rx="17" ry="29" />
        <ellipse cx="105" cy="351" rx="12" ry="23" />
        <ellipse cx="110" cy="352" rx="7" ry="17" />
        <path d="M86 330 C97 321 116 326 127 341" />
        <path d="M85 366 C96 384 117 386 129 372" />

        <ellipse cx="220" cy="383" rx="17" ry="29" />
        <ellipse cx="225" cy="384" rx="12" ry="23" />
        <ellipse cx="230" cy="385" rx="7" ry="17" />
        <path d="M206 363 C217 354 236 359 247 374" />
        <path d="M205 399 C216 417 237 419 249 405" />

        {/* short foot tabs */}
        <path d="M36 418 L67 426 L67 446 L36 438 Z" />
        <path d="M67 426 L82 421 L82 439 L67 446 Z" />
        <path d="M36 438 L67 446" />

        <path d="M306 486 L342 495 L342 517 L306 508 Z" />
        <path d="M342 495 L364 488 L364 508 L342 517 Z" />
        <path d="M306 508 L342 517" />

        <path d="M523 430 L550 422 L550 444 L523 452 Z" />
        <path d="M550 422 L568 417 L568 436 L550 444 Z" />
        <path d="M523 452 L550 444" />

        {/* subtle panel duplicates to mimic technical line art */}
        <path d="M55 128 L318 169" opacity="0.4" />
        <path d="M352 164 L568 116" opacity="0.4" />
        <path d="M55 389 L318 456" opacity="0.4" />
        <path d="M352 463 L568 395" opacity="0.4" />
        <path d="M55 118 L321 160" opacity="0.35" />
        <path d="M321 160 L571 105" opacity="0.35" />
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