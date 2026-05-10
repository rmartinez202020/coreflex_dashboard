import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#ffffff",
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.94)}
      viewBox="0 0 500 470"
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
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* main tank */}
        <path d="M30 95 L135 125 L492 95 L492 405 L135 452 L30 385 Z" />
        <path d="M30 95 L135 125 L135 452" />
        <path d="M492 95 L492 405" />
        <path d="M30 385 L135 452 L492 405" />
        <path d="M30 95 L30 385" />

        {/* top opening, split so it does not cut through the filter box */}
        <path d="M30 95 L72 107" />
        <path d="M252 108 L360 72 L492 95" />
        <path d="M135 125 L492 95" />
        <path d="M360 72 L360 325" strokeDasharray="7 8" opacity="0.65" />

        {/* internal CAD lines */}
        <path
          d="M30 202 L135 235 L360 205 L492 240"
          strokeDasharray="7 8"
          opacity="0.65"
        />
        <path
          d="M34 384 L135 354 L360 325 L488 404"
          strokeDasharray="4 9"
          opacity="0.42"
        />
        <path
          d="M135 235 L135 354 L360 325 L360 205"
          strokeDasharray="7 8"
          opacity="0.5"
        />

        {/* top filter box */}
        <path d="M72 48 L178 32 L252 50 L145 68 Z" />
        <path d="M72 48 L145 68 L145 126 L72 106 Z" />
        <path d="M145 68 L252 50 L252 108 L145 126 Z" />

        {/* top cap/lip */}
        <path d="M66 42 L178 25 L258 44" />
        <path d="M66 42 L140 63" />
        <path d="M66 50 L140 71 L258 52" />

        {/* bottom lip sitting on tank */}
        <path d="M72 106 L145 126 L252 108" />
        <path d="M68 112 L140 134 L254 116" />
        <path d="M140 134 L135 125" />
        <path d="M254 116 L252 108" />

        {/* top round port */}
        <ellipse cx="103" cy="82" rx="13" ry="24" />
        <ellipse cx="107" cy="83" rx="10" ry="21" />
        <ellipse cx="111" cy="84" rx="6" ry="16" />

        {/* side latches */}
        <path d="M28 160 L45 166 L45 188 L28 183 Z" />
        <path d="M31 160 L38 150 L45 166" />
        <path d="M32 172 L42 175" />
        <path d="M32 183 L42 186" />
        <path d="M21 166 L28 160 L28 183 L21 190 Z" />

        <path d="M106 189 L127 197 L127 224 L106 216 Z" />
        <path d="M109 189 L118 176 L127 197" />
        <path d="M111 203 L124 207" />
        <path d="M111 216 L124 220" />
        <path d="M100 197 L106 189 L106 216 L100 223 Z" />

        {/* lower round ports */}
        <ellipse cx="46" cy="360" rx="10" ry="23" />
        <ellipse cx="50" cy="360" rx="8" ry="20" />
        <ellipse cx="54" cy="360" rx="5" ry="15" />

        <ellipse cx="112" cy="395" rx="12" ry="24" />
        <ellipse cx="116" cy="395" rx="9" ry="21" />
        <ellipse cx="120" cy="395" rx="5" ry="16" />

        {/* feet */}
        <path d="M140 452 L140 466 L178 461 L178 447" />
        <path d="M146 453 L146 461 L171 458 L171 449" />
        <path d="M432 413 L432 428 L468 423 L468 409" />
        <path d="M438 413 L438 421 L461 418 L461 410" />
      </g>
    </svg>
  );
}
