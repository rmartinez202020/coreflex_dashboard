// src/components/Sidebarleftwirelesstank.jsx
import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#dbeafe",
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.9)}
      viewBox="0 0 260 235"
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
        <path d="M22 70 L91 58 L238 78 L170 94 Z" />
        <path d="M22 70 L22 176 L170 208 L170 94 Z" />
        <path d="M170 94 L238 78 L238 181 L170 208 Z" />

        <path d="M22 70 L22 64 L91 52 L238 72 L238 78" />
        <path d="M22 64 L170 88 L238 72" />
        <path d="M22 176 L170 208 L238 181" />

        <path d="M22 176 L170 150 L238 181" strokeDasharray="6 6" opacity="0.65" />
        <path d="M170 94 L170 208" strokeDasharray="6 6" opacity="0.65" />
        <path d="M91 58 L91 150" strokeDasharray="6 6" opacity="0.45" />

        <path d="M52 62 L52 24 L118 13 L170 27 L170 66 L106 78 Z" />
        <path d="M52 24 L106 39 L170 27" />
        <path d="M106 39 L106 78" />
        <path d="M52 62 L106 74 L170 66" />
        <path d="M58 28 L107 42 L164 31" opacity="0.6" />

        <ellipse cx="74" cy="43" rx="12" ry="18" />
        <ellipse cx="74" cy="43" rx="8" ry="14" />
        <ellipse cx="74" cy="43" rx="4" ry="9" />

        <path d="M8 105 L24 109 L24 127 L8 123 Z" />
        <path d="M10 105 L17 96 L24 109" />
        <path d="M12 114 L22 116" />
        <path d="M12 123 L22 125" />

        <path d="M58 118 L76 122 L76 142 L58 138 Z" />
        <path d="M60 118 L68 108 L76 122" />
        <path d="M62 127 L73 130" />
        <path d="M62 138 L73 140" />

        <ellipse cx="38" cy="160" rx="10" ry="18" />
        <ellipse cx="38" cy="160" rx="6" ry="13" />
        <ellipse cx="38" cy="160" rx="3" ry="8" />

        <ellipse cx="84" cy="176" rx="10" ry="18" />
        <ellipse cx="84" cy="176" rx="6" ry="13" />
        <ellipse cx="84" cy="176" rx="3" ry="8" />

        <path d="M65 202 L65 216 L94 216 L94 211" />
        <path d="M205 195 L205 209 L233 209 L233 183" />
      </g>
    </svg>
  );
}