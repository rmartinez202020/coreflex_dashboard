import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#1f2933",
  liquidColor = "#efe76a",
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.94)}
      viewBox="0 0 500 470"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ display: "block", overflow: "visible", maxWidth: "100%" }}
    >
      <defs>
        <linearGradient id="tankLiquid" x1="80" y1="205" x2="420" y2="405">
          <stop offset="0" stopColor={liquidColor} stopOpacity="0.55" />
          <stop offset="0.55" stopColor={liquidColor} stopOpacity="0.82" />
          <stop offset="1" stopColor={liquidColor} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <g stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M30 202 L135 235 L360 205 L492 240 L492 406 L135 452 L30 385 Z"
          fill="url(#tankLiquid)"
          stroke="none"
        />

        <path d="M30 95 L135 125 L492 95 L492 405 L135 452 L30 385 Z" />
        <path d="M30 95 L135 125 L135 452" />
        <path d="M135 125 L492 95" />
        <path d="M30 91 L135 120 L492 90" />
        <path d="M135 125 L360 72 L492 95" />
        <path d="M360 72 L360 205" strokeDasharray="6 7" opacity="0.65" />

        <path d="M30 202 L135 235 L360 205 L492 240" strokeDasharray="6 7" opacity="0.62" />
        <path d="M30 385 L135 354 L360 325 L492 405" strokeDasharray="6 7" opacity="0.55" />
        <path d="M135 235 L135 354 L360 325 L360 205" strokeDasharray="6 7" opacity="0.55" />

        <path d="M72 42 L180 28 L252 45 L143 61 Z" />
        <path d="M72 42 L143 61 L143 123 L72 102 Z" />
        <path d="M143 61 L252 45 L252 107 L143 123 Z" />
        <path d="M67 37 L180 22 L257 40" />
        <path d="M67 37 L139 56" />
        <path d="M72 102 L143 123 L252 107" />

        <ellipse cx="104" cy="78" rx="13" ry="25" />
        <ellipse cx="108" cy="79" rx="10" ry="22" />
        <ellipse cx="112" cy="80" rx="6" ry="17" />

        <path d="M28 160 L45 166 L45 188 L28 183 Z" />
        <path d="M31 160 L38 150 L45 166" />
        <path d="M106 189 L127 197 L127 224 L106 216 Z" />
        <path d="M109 189 L118 176 L127 197" />

        <ellipse cx="46" cy="360" rx="10" ry="23" />
        <ellipse cx="50" cy="360" rx="8" ry="20" />
        <ellipse cx="54" cy="360" rx="5" ry="15" />

        <ellipse cx="112" cy="395" rx="12" ry="24" />
        <ellipse cx="116" cy="395" rx="9" ry="21" />
        <ellipse cx="120" cy="395" rx="5" ry="16" />

        <path d="M140 452 L140 466 L178 461 L178 447" />
        <path d="M432 413 L432 428 L468 423 L468 409" />
      </g>
    </svg>
  );
}
