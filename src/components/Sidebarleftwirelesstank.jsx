import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#ffffff",

  // ✅ Telemetry values shown on the right side of the tank
  heightValue = "--",
  temperatureValue = "--",
  batteryValue = "--",
  dateValue = "--",

  showTelemetry = true,
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.94)}
      viewBox="0 0 820 470"
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

        {/* top filter box - angle matched to tank */}
        <path d="M58 52 L176 39 L266 58 L146 70 Z" />
        <path d="M58 52 L146 70 L146 122 L58 104 Z" />
        <path d="M146 70 L266 58 L266 110 L146 122 Z" />

        {/* top cap/lip */}
        <path d="M52 47 L176 33 L272 54" />
        <path d="M52 47 L142 65" />
        <path d="M52 55 L142 73 L272 61" />

        {/* bottom lip connected to tank */}
        <path d="M58 104 L146 122 L266 110" />
        <path d="M54 110 L140 129 L268 117" />
        <path d="M140 129 L135 125" />
        <path d="M268 117 L266 110" />

        {/* top round port */}
        <ellipse cx="92" cy="81" rx="12" ry="22" />
        <ellipse cx="96" cy="82" rx="9" ry="19" />
        <ellipse cx="100" cy="83" rx="5" ry="14" />

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

      {/* ✅ Telemetry information on the right side of Tank#1 */}
      {showTelemetry && (
        <g>
          {/* telemetry panel background */}
          <rect
            x="525"
            y="105"
            width="265"
            height="300"
            rx="18"
            fill="rgba(15, 23, 42, 0.92)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />

          <text
            x="550"
            y="138"
            fill="#ffffff"
            fontSize="18"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            Wireless Telemetry
          </text>

          {/* Height */}
          <circle cx="552" cy="178" r="17" fill="rgba(34,197,94,0.22)" />
          <text
            x="545"
            y="184"
            fill="#22c55e"
            fontSize="18"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            ↕
          </text>
          <text
            x="580"
            y="172"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="800"
            fontFamily="Arial, sans-serif"
          >
            Height
          </text>
          <text
            x="580"
            y="194"
            fill="#22c55e"
            fontSize="20"
            fontWeight="900"
            fontFamily="monospace"
          >
            {heightValue}
          </text>

          {/* Temperature */}
          <circle cx="552" cy="238" r="17" fill="rgba(249,115,22,0.22)" />
          <text
            x="544"
            y="244"
            fill="#fb923c"
            fontSize="18"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            ♨
          </text>
          <text
            x="580"
            y="232"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="800"
            fontFamily="Arial, sans-serif"
          >
            Temperature
          </text>
          <text
            x="580"
            y="254"
            fill="#fb923c"
            fontSize="20"
            fontWeight="900"
            fontFamily="monospace"
          >
            {temperatureValue}
          </text>

          {/* Battery */}
          <circle cx="552" cy="298" r="17" fill="rgba(34,197,94,0.22)" />
          <text
            x="545"
            y="304"
            fill="#22c55e"
            fontSize="18"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            🔋
          </text>
          <text
            x="580"
            y="292"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="800"
            fontFamily="Arial, sans-serif"
          >
            Battery
          </text>
          <text
            x="580"
            y="314"
            fill="#22c55e"
            fontSize="20"
            fontWeight="900"
            fontFamily="monospace"
          >
            {batteryValue}
          </text>

          {/* Date */}
          <circle cx="552" cy="358" r="17" fill="rgba(59,130,246,0.22)" />
          <text
            x="544"
            y="364"
            fill="#60a5fa"
            fontSize="18"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            ▣
          </text>
          <text
            x="580"
            y="352"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="800"
            fontFamily="Arial, sans-serif"
          >
            Date
          </text>
          <text
            x="580"
            y="374"
            fill="#60a5fa"
            fontSize="16"
            fontWeight="900"
            fontFamily="monospace"
          >
            {dateValue}
          </text>
        </g>
      )}
    </svg>
  );
}