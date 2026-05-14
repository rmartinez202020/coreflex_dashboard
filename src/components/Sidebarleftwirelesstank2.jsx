// Sidebarleftwirelesstank2.jsx
import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#050b22",

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
      height={Math.round(size * 0.79)}
      viewBox="0 0 820 585"
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
        {/* Main top body */}
        <path d="M24 130 L270 62 C285 58 301 58 316 62 L505 115" />
        <path d="M24 130 C11 134 6 144 9 154 C12 164 25 170 43 174" />
        <path d="M505 115 C524 119 533 129 531 141 C529 153 516 160 497 164" />

        <path d="M43 174 L270 229" />
        <path d="M270 229 L497 164" />
        <path d="M11 153 L270 212" />
        <path d="M270 212 L530 139" />
        <path d="M18 164 L270 221" />
        <path d="M270 221 L520 151" />

        {/* Top rounded slab edge */}
        <path d="M270 212 C264 218 264 225 270 229" />
        <path d="M24 130 C95 151 184 174 270 195" />
        <path d="M270 195 L505 115" />

        {/* Vertical sides */}
        <path d="M43 174 L43 421" />
        <path d="M270 229 L270 522" />
        <path d="M497 164 L497 405" />
        <path d="M531 141 L531 388" />
        <path d="M9 154 L9 414" />

        {/* Front/side bottom shape */}
        <path d="M43 421 L270 522" />
        <path d="M270 522 L497 405" />
        <path d="M9 414 L43 421" />
        <path d="M497 405 L531 388" />

        {/* Bottom rim */}
        <path d="M9 414 C10 425 19 432 43 441 L249 533" />
        <path d="M249 533 C267 541 285 539 304 531" />
        <path d="M304 531 L507 426" />
        <path d="M507 426 C522 419 530 407 531 388" />

        {/* Front center vertical corner */}
        <path d="M270 229 C281 221 291 221 300 225" />
        <path d="M300 225 L300 513" />
        <path d="M270 522 C279 532 291 530 300 513" />
        <path d="M270 229 C267 312 267 438 270 522" />

        {/* Internal dashed level line */}
        <path
          d="M44 379 L270 284 L497 377"
          strokeDasharray="10 12"
          strokeWidth="2.4"
        />

        {/* Top hatch */}
        <path d="M177 121 L298 88 L401 117 L278 154 Z" />
        <path d="M177 121 L177 137 L278 173 L278 154" />
        <path d="M278 173 L401 135 L401 117" />
        <path d="M177 137 L278 173 L401 135" />
        <path d="M194 122 L298 96 L383 119 L278 148 Z" />

        {/* Left pipe */}
        <ellipse cx="91" cy="375" rx="19" ry="35" />
        <ellipse cx="96" cy="376" rx="13" ry="28" />
        <ellipse cx="101" cy="377" rx="8" ry="21" />
        <path d="M76 348 C90 335 113 341 126 361" />
        <path d="M75 397 C88 418 114 421 128 402" />

        {/* Center pipe */}
        <ellipse cx="202" cy="421" rx="19" ry="35" />
        <ellipse cx="207" cy="422" rx="13" ry="28" />
        <ellipse cx="212" cy="423" rx="8" ry="21" />
        <path d="M187 394 C201 381 224 387 237 407" />
        <path d="M186 443 C199 464 225 467 239 448" />

        {/* Feet */}
        <path d="M31 435 L63 444 L63 471 L31 461 Z" />
        <path d="M63 444 L84 436 L84 462 L63 471 Z" />
        <path d="M31 461 L63 471" />

        <path d="M272 520 L311 532 L311 560 L272 547 Z" />
        <path d="M311 532 L335 520 L335 548 L311 560 Z" />
        <path d="M272 547 L311 560" />

        <path d="M454 428 L484 414 L484 441 L454 456 Z" />
        <path d="M484 414 L506 404 L506 430 L484 441 Z" />
        <path d="M454 456 L484 441" />

        {/* Extra professional line depth */}
        <path d="M43 186 L270 239" opacity="0.55" />
        <path d="M300 235 L497 176" opacity="0.55" />
        <path d="M43 429 L270 527" opacity="0.5" />
        <path d="M300 520 L497 415" opacity="0.5" />
      </g>

      {showTelemetry && (
        <g>
          {/* Height */}
          <circle cx="615" cy="145" r="29" fill="rgba(34,197,94,0.18)" />
          <text
            x="615"
            y="146"
            fill="#16a34a"
            fontSize="36"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ↕
          </text>
          <text
            x="670"
            y="139"
            fill="#050b22"
            fontSize="24"
            fontWeight="400"
          >
            Height
          </text>
          <text
            x="670"
            y="178"
            fill="#00b050"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {heightValue}
          </text>

          {/* Temperature */}
          <circle cx="615" cy="235" r="29" fill="rgba(249,115,22,0.18)" />
          <text
            x="615"
            y="236"
            fill="#ff2d00"
            fontSize="34"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ♨
          </text>
          <text
            x="670"
            y="229"
            fill="#050b22"
            fontSize="24"
            fontWeight="400"
          >
            Temperature
          </text>
          <text
            x="670"
            y="268"
            fill="#ff3b00"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {temperatureValue}
          </text>

          {/* Battery */}
          <circle cx="615" cy="325" r="29" fill="rgba(34,197,94,0.18)" />
          <text
            x="615"
            y="326"
            fill="#22c55e"
            fontSize="30"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ▯
          </text>
          <text
            x="615"
            y="326"
            fill="#22c55e"
            fontSize="18"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ▌
          </text>
          <text
            x="670"
            y="319"
            fill="#050b22"
            fontSize="24"
            fontWeight="400"
          >
            Battery
          </text>
          <text
            x="670"
            y="358"
            fill="#00b050"
            fontSize="30"
            fontWeight="500"
            fontFamily="monospace"
          >
            {batteryValue}
          </text>

          {/* Date */}
          <circle cx="615" cy="415" r="29" fill="rgba(59,130,246,0.18)" />
          <text
            x="615"
            y="416"
            fill="#1473ff"
            fontSize="34"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ▣
          </text>
          <text
            x="670"
            y="409"
            fill="#050b22"
            fontSize="24"
            fontWeight="400"
          >
            Date
          </text>
          <text
            x="670"
            y="448"
            fill="#1473ff"
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