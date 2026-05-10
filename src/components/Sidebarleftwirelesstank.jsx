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
        {/* main tank outer edges */}
        <path d="M30 104 L72 112" />
        <path d="M135 125 L492 104" />
        <path d="M30 104 L30 385" />
        <path d="M135 125 L135 452" />
        <path d="M492 104 L492 405" />
        <path d="M30 385 L135 452" />
        <path d="M135 452 L492 405" />

        {/* top rear opening */}
        <path d="M30 104 L72 100" />
        <path d="M266 82 L360 72" />
        <path d="M360 72 L492 104" />
        <path d="M360 72 L360 325" strokeDasharray="7 8" opacity="0.65" />

        {/* internal CAD lines */}
        <path
          d="M30 202 L135 235 L360 205 L492 240"
          strokeDasharray="7 8"
          opacity="0.58"
        />
        <path
          d="M135 354 L360 325 L492 405"
          strokeDasharray="7 8"
          opacity="0.42"
        />
        <path
          d="M135 235 L135 354 L360 325 L360 205"
          strokeDasharray="7 8"
          opacity="0.48"
        />

        {/* top filter box - wider */}
        <path d="M58 50 L176 32 L266 51 L146 70 Z" />
        <path d="M58 50 L146 70 L146 122 L58 103 Z" />
        <path d="M146 70 L266 51 L266 103 L146 122 Z" />

        {/* top cap/lip */}
        <path d="M52 45 L176 26 L272 47" />
        <path d="M52 45 L142 65" />
        <path d="M52 53 L142 73 L272 54" />

        {/* bottom lip connected to tank */}
        <path d="M58 103 L146 122 L266 103" />
        <path d="M54 109 L140 129 L268 110" />
        <path d="M140 129 L135 125" />
        <path d="M268 110 L266 103" />

        {/* top round port */}
        <ellipse cx="92" cy="79" rx="12" ry="22" />
        <ellipse cx="96" cy="80" rx="9" ry="19" />
        <ellipse cx="100" cy="81" rx="5" ry="14" />

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
