import React from "react";

export default function Sidebarleftwirelesstank({
  size = 220,
  strokeColor = "#ffffff",
  heightValue = "--",
  liquidTankLevelValue,
  liquidLevelNumeric = null,
  tankHeightNumeric = null,
  temperatureValue = "--",
  batteryValue = "--",
  dateValue = "--",

  previous1Height = "--",
  previous2Height = "--",
  previous3Height = "--",

  previous1Date = "--",
  previous2Date = "--",
  previous3Date = "--",

  showTelemetry = true,
}) {
  const tankLevelValue =
    liquidTankLevelValue !== undefined &&
    liquidTankLevelValue !== null &&
    liquidTankLevelValue !== ""
      ? liquidTankLevelValue
      : heightValue;

  const liquidValue = Number(liquidLevelNumeric);
  const tankHeight = Number(tankHeightNumeric);

  let fillPercent = 0;

  if (
    Number.isFinite(liquidValue) &&
    Number.isFinite(tankHeight) &&
    tankHeight > 0
  ) {
    fillPercent = liquidValue / tankHeight;
  }

  fillPercent = Math.max(0, Math.min(1, fillPercent));

  const showLiquid = fillPercent > 0.001;

  const fillPercentLabel = `${Math.round(fillPercent * 100)}%`;

  // Liquid surface control points
  const xA = 30;
  const xFront = 135;
  const xB = 360;
  const xC = 492;

  const leftBottomY = 385;
  const frontBottomY = 452;
  const backBottomY = 405;

  const leftTopY = 104;
  const frontTopY = 125;
  const backTopY = 104;

  const yLeft = leftBottomY - fillPercent * (leftBottomY - leftTopY);
  const yFront = frontBottomY - fillPercent * (frontBottomY - frontTopY);
  const yBack = backBottomY - fillPercent * (backBottomY - backTopY);

  // ✅ Keep angle B as-is.
  // ✅ Modify angle A to match B.
  const slopeB = (yBack - yFront) / (xC - xFront);
  const yCenter = yLeft + slopeB * (xB - xA);

  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="0 0 980 620"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{
        display: "block",
        overflow: "visible",
        maxWidth: "100%",
      }}
    >
      {showLiquid && (
        <g>
          <polygon
            points={`
              30,385
              135,452
              492,405
              492,${yBack}
              360,${yCenter}
              135,${yFront}
              30,${yLeft}
            `}
            fill="rgba(255,235,120,0.64)"
            stroke="none"
          />

          <polygon
            points={`
              30,${yLeft}
              360,${yCenter}
              492,${yBack}
              135,${yFront}
            `}
            fill="rgba(255,245,150,0.84)"
            stroke="rgba(180,150,40,0.45)"
            strokeWidth="1.5"
          />

          <path
            d={`
              M30 ${yLeft}
              L360 ${yCenter}
              L492 ${yBack}
              M30 ${yLeft}
              L135 ${yFront}
              L492 ${yBack}
            `}
            stroke="rgba(180,150,40,0.65)"
            strokeWidth="2"
            strokeDasharray="5 5"
            fill="none"
          />
        </g>
      )}

      <g
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M30 104 L72 112" />
        <path d="M135 125 L492 104" />
        <path d="M30 104 L30 385" />
        <path d="M135 125 L135 452" />
        <path d="M492 104 L492 405" />
        <path d="M30 385 L135 452" />
        <path d="M135 452 L492 405" />

        <path d="M30 104 L72 100" />
        <path d="M266 82 L360 72" />
        <path d="M360 72 L492 104" />
        <path d="M360 72 L360 325" strokeDasharray="7 8" opacity="0.65" />

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

        <path d="M58 52 L176 39 L266 58 L146 70 Z" />
        <path d="M58 52 L146 70 L146 122 L58 104 Z" />
        <path d="M146 70 L266 58 L266 110 L146 122 Z" />

        <path d="M52 47 L176 33 L272 54" />
        <path d="M52 47 L142 65" />
        <path d="M52 55 L142 73 L272 61" />

        <path d="M58 104 L146 122 L266 110" />
        <path d="M54 110 L140 129 L268 117" />
        <path d="M140 129 L135 125" />
        <path d="M268 117 L266 110" />

        <ellipse cx="92" cy="81" rx="12" ry="22" />
        <ellipse cx="96" cy="82" rx="9" ry="19" />
        <ellipse cx="100" cy="83" rx="5" ry="14" />

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

        <ellipse cx="46" cy="360" rx="10" ry="23" />
        <ellipse cx="50" cy="360" rx="8" ry="20" />
        <ellipse cx="54" cy="360" rx="5" ry="15" />

        <ellipse cx="112" cy="395" rx="12" ry="24" />
        <ellipse cx="116" cy="395" rx="9" ry="21" />
        <ellipse cx="120" cy="395" rx="5" ry="16" />

        <path d="M140 452 L140 466 L178 461 L178 447" />
        <path d="M146 453 L146 461 L171 458 L171 449" />
        <path d="M432 413 L432 428 L468 423 L468 409" />
        <path d="M438 413 L438 421 L461 418 L461 410" />
      </g>

      {/* ✅ Smaller + more to the right */}
      <text
        x="305"
        y="255"
        fill="#000000"
        fontSize="40"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
        pointerEvents="none"
      >
        {fillPercentLabel}
      </text>

      {/* Previous readings table */}
      <g>
        {/* Outer table */}
        <rect
          x="0"
          y="505"
          width="930"
          height="84"
          fill="none"
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* Vertical separators */}
        <line
          x1="310"
          y1="505"
          x2="310"
          y2="589"
          stroke="#111827"
          strokeWidth="1.2"
        />

        <line
          x1="620"
          y1="505"
          x2="620"
          y2="589"
          stroke="#111827"
          strokeWidth="1.2"
        />

        {/* Horizontal separator */}
        <line
          x1="0"
          y1="547"
          x2="930"
          y2="547"
          stroke="#111827"
          strokeWidth="1.2"
        />

        {/* Previous #1 */}
        <text
          x="155"
          y="535"
          fill="#000"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Arial"
        >
          {previous1Height}
        </text>

        <text
          x="155"
          y="575"
          fill="#000"
          fontSize="11"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {previous1Date}
        </text>

        {/* Previous #2 */}
        <text
          x="465"
          y="535"
          fill="#000"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Arial"
        >
          {previous2Height}
        </text>

        <text
          x="465"
          y="575"
          fill="#000"
          fontSize="11"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {previous2Date}
        </text>

        {/* Previous #3 */}
        <text
          x="775"
          y="535"
          fill="#000"
          fontSize="18"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Arial"
        >
          {previous3Height}
        </text>

        <text
          x="775"
          y="575"
          fill="#000"
          fontSize="11"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {previous3Date}
        </text>
      </g>

      {showTelemetry && (
        <g>
          <circle cx="560" cy="130" r="30" fill="rgba(34,197,94,0.18)" />
          <text
            x="560"
            y="130"
            fill="#16a34a"
            fontSize="34"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ↕
          </text>
          <text x="625" y="122" fill="#0f172a" fontSize="24">
            Liquid Tank Level
          </text>
          <text
            x="625"
            y="160"
            fill="#16a34a"
            fontSize="36"
            fontFamily="monospace"
          >
            {tankLevelValue}
          </text>

          <circle cx="560" cy="220" r="30" fill="rgba(249,115,22,0.18)" />
          <text
            x="560"
            y="220"
            fill="#ea580c"
            fontSize="34"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ♨
          </text>
          <text x="625" y="212" fill="#0f172a" fontSize="24">
            Temperature
          </text>
          <text
            x="625"
            y="250"
            fill="#ea580c"
            fontSize="36"
            fontFamily="monospace"
          >
            {temperatureValue}
          </text>

          <circle cx="560" cy="310" r="30" fill="rgba(34,197,94,0.18)" />
          <text
            x="560"
            y="310"
            fill="#16a34a"
            fontSize="30"
            textAnchor="middle"
            dominantBaseline="central"
          >
            🔋
          </text>
          <text x="625" y="302" fill="#0f172a" fontSize="24">
            Battery
          </text>
          <text
            x="625"
            y="340"
            fill="#16a34a"
            fontSize="36"
            fontFamily="monospace"
          >
            {batteryValue}
          </text>

          <circle cx="560" cy="400" r="30" fill="rgba(59,130,246,0.18)" />
          <text
            x="560"
            y="400"
            fill="#2563eb"
            fontSize="34"
            textAnchor="middle"
            dominantBaseline="central"
          >
            ▣
          </text>
          <text x="625" y="392" fill="#0f172a" fontSize="24">
            Date
          </text>
          <text
            x="625"
            y="430"
            fill="#2563eb"
            fontSize="26"
            fontFamily="monospace"
          >
            {dateValue}
          </text>
        </g>
      )}
    </svg>
  );
}