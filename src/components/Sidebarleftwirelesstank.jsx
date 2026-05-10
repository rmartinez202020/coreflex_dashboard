// src/components/Sidebarleftwirelesstank.jsx
import React, { useMemo } from "react";

export default function Sidebarleftwirelesstank({
  size = 150,
  liquidLevel = 58,
  liquidColor = "#efe58a",
  strokeColor = "#2b2b2b",
  backgroundColor = "#ffffff",
}) {
  const level = Math.max(0, Math.min(100, Number(liquidLevel) || 0));

  const uid = useMemo(
    () => `wirelessTank_${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const tankTopY = 56;
  const tankBottomY = 184;
  const tankHeight = tankBottomY - tankTopY;

  const fillHeight = tankHeight * (level / 100);
  const fillY = tankBottomY - fillHeight;

  const leftFillY = fillY + 12;
  const rightFillY = fillY - 8;

  return (
    <svg
      width={size}
      height={Math.round(size * 0.92)}
      viewBox="0 0 260 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient id={`${uid}_liquid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff9b0" />
          <stop offset="55%" stopColor={liquidColor} />
          <stop offset="100%" stopColor="#e4d96d" />
        </linearGradient>

        <clipPath id={`${uid}_frontClip`}>
          <polygon points="68,68 238,82 238,184 68,184" />
        </clipPath>

        <clipPath id={`${uid}_leftClip`}>
          <polygon points="18,58 68,68 68,184 18,166" />
        </clipPath>

        <clipPath id={`${uid}_topWaterClip`}>
          <polygon points="18,58 68,68 238,82 188,58" />
        </clipPath>
      </defs>

      {/* top rear open surface */}
      <polygon
        points="18,58 188,58 238,82 68,68"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* left side wall */}
      <polygon
        points="18,58 68,68 68,184 18,166"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* front/main wall */}
      <polygon
        points="68,68 238,82 238,184 68,184"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* liquid left side */}
      <polygon
        points={`18,${leftFillY} 68,${fillY} 68,184 18,166`}
        fill={`url(#${uid}_liquid)`}
        opacity="0.82"
        clipPath={`url(#${uid}_leftClip)`}
      />

      {/* liquid front */}
      <polygon
        points={`68,${fillY} 238,${rightFillY} 238,184 68,184`}
        fill={`url(#${uid}_liquid)`}
        opacity="0.82"
        clipPath={`url(#${uid}_frontClip)`}
      />

      {/* liquid top plane */}
      <polygon
        points={`18,${leftFillY} 68,${fillY} 238,${rightFillY} 188,${
          rightFillY - 20
        }`}
        fill={`url(#${uid}_liquid)`}
        opacity="0.48"
        clipPath={`url(#${uid}_topWaterClip)`}
      />

      {/* liquid dashed level lines */}
      <polyline
        points={`18,${leftFillY} 68,${fillY} 238,${rightFillY}`}
        fill="none"
        stroke="#777"
        strokeDasharray="4 4"
        strokeWidth="1"
        opacity="0.85"
      />

      <line
        x1="68"
        y1={fillY}
        x2="188"
        y2={rightFillY - 20}
        stroke="#777"
        strokeDasharray="4 4"
        strokeWidth="1"
        opacity="0.65"
      />

      {/* back/inside dashed geometry */}
      <line
        x1="188"
        y1="58"
        x2="188"
        y2="154"
        stroke="#777"
        strokeDasharray="4 4"
        strokeWidth="1"
        opacity="0.7"
      />

      <line
        x1="68"
        y1="184"
        x2="188"
        y2="154"
        stroke="#777"
        strokeDasharray="4 4"
        strokeWidth="1"
        opacity="0.7"
      />

      <line
        x1="188"
        y1="154"
        x2="238"
        y2="184"
        stroke="#777"
        strokeDasharray="4 4"
        strokeWidth="1"
        opacity="0.7"
      />

      {/* front and top lip details */}
      <polyline
        points="18,58 68,68 238,82"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.4"
      />

      <polyline
        points="18,62 68,72 238,86"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        opacity="0.65"
      />

      <polyline
        points="18,166 68,184 238,184"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      {/* top transmitter/service box */}
      <polygon
        points="42,18 112,12 150,25 82,32"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <polygon
        points="42,18 82,32 82,66 42,52"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <polygon
        points="82,32 150,25 150,60 82,66"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <polyline
        points="42,52 82,66 150,60"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      <polyline
        points="46,21 83,34 146,28"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        opacity="0.65"
      />

      {/* top round port */}
      <ellipse
        cx="67"
        cy="42"
        rx="11"
        ry="17"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />

      <ellipse
        cx="67"
        cy="42"
        rx="7"
        ry="13"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.2"
      />

      <ellipse
        cx="67"
        cy="42"
        rx="3"
        ry="9"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
      />

      {/* left latches */}
      <g stroke={strokeColor} strokeWidth="1.25" fill={backgroundColor}>
        <polygon points="12,86 23,88 23,104 12,101" />
        <polyline points="12,86 17,78 23,88" fill="none" />
        <line x1="15" y1="93" x2="21" y2="94" />
        <line x1="15" y1="100" x2="21" y2="102" />

        <polygon points="58,98 70,101 70,118 58,114" />
        <polyline points="58,98 64,88 70,101" fill="none" />
        <line x1="61" y1="106" x2="68" y2="108" />
        <line x1="61" y1="114" x2="68" y2="116" />
      </g>

      {/* lower left/front ports */}
      <g fill={backgroundColor} stroke={strokeColor}>
        <ellipse cx="34" cy="150" rx="8" ry="15" strokeWidth="1.5" />
        <ellipse cx="34" cy="150" rx="5" ry="11" strokeWidth="1.2" />
        <ellipse cx="34" cy="150" rx="2.5" ry="7" strokeWidth="1" />

        <ellipse cx="75" cy="166" rx="8" ry="15" strokeWidth="1.5" />
        <ellipse cx="75" cy="166" rx="5" ry="11" strokeWidth="1.2" />
        <ellipse cx="75" cy="166" rx="2.5" ry="7" strokeWidth="1" />
      </g>

      {/* feet/base */}
      <polyline
        points="18,166 68,188 238,188"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        opacity="0.85"
      />

      <rect
        x="62"
        y="184"
        width="22"
        height="8"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1"
      />

      <rect
        x="206"
        y="184"
        width="22"
        height="8"
        fill={backgroundColor}
        stroke={strokeColor}
        strokeWidth="1"
      />
    </svg>
  );
}