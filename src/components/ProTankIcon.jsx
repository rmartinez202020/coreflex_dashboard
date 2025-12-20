// ================================
// PROFESSIONAL INDUSTRIAL TANKS (BIG / DASHBOARD)
// ALL TANKS FULLY RESPONSIVE + SCALABLE
// ================================

// ⭐ STANDARD TANK (Dashboard)
export function StandardTank({ level = 0 }) {
  return (
    <div style={{ width: "100", height: "100" }}>
      <svg width="45" height="45" viewBox="0 0 160 180" preserveAspectRatio="none">
        <ellipse cx="60" cy="30" rx="45" ry="15" fill="none" stroke="#555" strokeWidth="2" />
        <line x1="15" y1="30" x2="15" y2="160" stroke="#555" strokeWidth="2" />
        <line x1="105" y1="30" x2="105" y2="160" stroke="#555" strokeWidth="2" />
        <path d="M 15 160 C 15 175, 105 175, 105 160" fill="none" stroke="#555" strokeWidth="2" />
        <path d="M 105 160 C 105 145, 15 145, 15 160" fill="none" stroke="#555" strokeWidth="2" strokeDasharray="5 5" />
        <text x="60" y="110" textAnchor="middle" fill="#555" fontSize="18" fontWeight="600">
          {level}%
        </text>
      </svg>
    </div>
  );
}

// ⭐ VERTICAL TANK (Dashboard)
export function VerticalTank({ level = 0 }) {
  return (
    <div style={{ width: "100", height: "100" }}>
      <svg width="45" height="45" viewBox="0 0 160 180" preserveAspectRatio="none">
        <ellipse cx="40" cy="25" rx="25" ry="10" fill="none" stroke="#555" strokeWidth="2" />
        <line x1="15" y1="25" x2="15" y2="165" stroke="#555" strokeWidth="2" />
        <line x1="65" y1="25" x2="65" y2="165" stroke="#555" strokeWidth="2" />
        <path d="M 15 165 C 15 180, 65 180, 65 165" fill="none" stroke="#555" strokeWidth="2" />
        <path d="M 65 165 C 65 150, 15 150, 15 165" fill="none" stroke="#555" strokeWidth="2" strokeDasharray="6 6" />
        <text x="40" y="105" textAnchor="middle" fill="#555" fontSize="16" fontWeight="600">
          {level}%
        </text>
      </svg>
    </div>
  );
}

// ⭐ HORIZONTAL TANK (Dashboard)
export const HorizontalTank = ({ level = 0 }) => {
  const stroke = "#727272";
  const strokeWidth = 1.5;

  const length = 160;
  const height = 110;
  const radiusX = 35;
  const radiusY = 18;

  const fillWidth = (length - radiusX * 2) * (level / 100);

  return (
    <div style={{ width: "100", height: "100" }}>
      <svg width="45" height="45" viewBox={`0 0 ${length} ${height}`} preserveAspectRatio="none">
        <path
          d={`M ${radiusX} ${height / 2 - radiusY}
             H ${length - radiusX}
             A ${radiusX} ${radiusY} 0 1 1 ${length - radiusX} ${height / 2 + radiusY}
             H ${radiusX}
             A ${radiusX} ${radiusY} 0 1 1 ${radiusX} ${height / 2 - radiusY}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <rect
          x={radiusX}
          y={height / 2 - radiusY}
          width={fillWidth}
          height={radiusY * 2}
          fill="#fde04788"
        />
        <text
          x={length / 2}
          y={height / 2 + 6}
          textAnchor="middle"
          fontSize="16"
          fill="#555"
          fontWeight="600"
        >
          {level}%
        </text>
      </svg>
    </div>
  );
};

// ⭐ SILO TANK (Dashboard)
export function SiloTank({
  level = 0,
  primaryValue,
  secondaryValue,
  fillColor = "#fde04788",
  alarm = false,
}) {
  const clampedLevel = Math.max(0, Math.min(100, level));
  const topY = 30;
  const bottomY = 140;
  const filledHeight = (bottomY - topY) * (clampedLevel / 100);
  const fillY = bottomY - filledHeight;
  const effectiveFill = alarm ? "#ff4d4d88" : fillColor;
  const displayPrimary = primaryValue ?? `${clampedLevel}%`;

  return (
    <div style={{ width: "100", height: "100" }}>
      <svg width="45" height="45" viewBox="0 0 160 200" preserveAspectRatio="none">
        <defs>
          <clipPath id="siloClip">
            <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" />
          </clipPath>
        </defs>

        <rect x="20" y={fillY} width="80" height={filledHeight} fill={effectiveFill} clipPath="url(#siloClip)" />

        <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" fill="none" stroke="#555" strokeWidth="2" />
        <path d="M 20 140 L 100 140 L 70 194 L 50 194 Z" fill="none" stroke="#555" strokeWidth="2" />

        <text
          x="60"
          y="90"
          textAnchor="middle"
          fill={alarm ? "#b91c1c" : "#555"}
          fontSize="18"
          fontWeight="600"
        >
          {displayPrimary}
        </text>

        {secondaryValue && (
          <text x="60" y="110" textAnchor="middle" fill="#555" fontSize="10">
            {secondaryValue}
          </text>
        )}
      </svg>
    </div>
  );
}

// ================================
// WHITE ICONS FOR LEFT MENU (Sidebar)
// ================================

// ⭐ WHITE OUTLINE — Standard Tank Icon
export function StandardTankIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 160 180">
      <ellipse cx="60" cy="30" rx="45" ry="15" fill="none" stroke="#ffffff" strokeWidth="2" />
      <line x1="15" y1="30" x2="15" y2="160" stroke="#ffffff" strokeWidth="2" />
      <line x1="105" y1="30" x2="105" y2="160" stroke="#ffffff" strokeWidth="2" />
      <path d="M 15 160 C 15 175, 105 175, 105 160" fill="none" stroke="#ffffff" strokeWidth="2" />
      <path d="M 105 160 C 105 145, 15 145, 15 160" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 5" />
    </svg>
  );
}

// ⭐ WHITE OUTLINE — Horizontal Tank Icon
export function HorizontalTankIcon() {
  return (
    <svg width="50" height="20" viewBox="0 0 160 110">
      <path
        d="M 35 37 H 125 A 35 18 0 1 1 125 73 H 35 A 35 18 0 1 1 35 37"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
}

// ⭐ WHITE OUTLINE — Vertical Tank Icon
export function VerticalTankIcon() {
  return (
    <svg width="30" height="70" viewBox="0 0 160 180">
      <ellipse cx="40" cy="25" rx="25" ry="10" fill="none" stroke="#ffffff" strokeWidth="2" />
      <line x1="15" y1="25" x2="15" y2="165" stroke="#ffffff" strokeWidth="2" />
      <line x1="65" y1="25" x2="65" y2="165" stroke="#ffffff" strokeWidth="2" />
      <path d="M 15 165 C 15 180, 65 180, 65 165" fill="none" stroke="#ffffff" strokeWidth="2" />
      <path d="M 65 165 C 65 150, 15 150, 15 165" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 6" />
    </svg>
  );
}

// ⭐ WHITE OUTLINE — Silo Tank Icon
export function SiloTankIcon() {
  return (
    <svg width="35" height="80" viewBox="0 0 160 200">
      <path d="M 20 30 A 40 12 0 0 1 100 30 L 100 140 L 20 140 Z" fill="none" stroke="#ffffff" strokeWidth="2" />
      <path d="M 20 140 L 100 140 L 70 194 L 50 194 Z" fill="none" stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}
