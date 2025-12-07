// ===============================
//  TANK ICONS FOR SIDEBAR
//  Clean SVG minimal industrial
//  FIXED viewBox padding so ALL tanks resize correctly
// ===============================

// ⭐ STANDARD TANK (fixed)
export const StandardTankIcon = () => (
  <svg width="40" height="40" viewBox="0 0 120 140">
    <rect
      x="20"
      y="30"
      width="80"
      height="80"
      rx="15"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
  </svg>
);

// ⭐ HORIZONTAL TANK (fixed)
export const HorizontalTankIcon = () => (
  <svg width="60" height="40" viewBox="0 0 200 120">
    <rect
      x="20"
      y="30"
      width="160"
      height="60"
      rx="30"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
  </svg>
);

// ⭐ VERTICAL TANK (fixed)
export const VerticalTankIcon = () => (
  <svg width="40" height="60" viewBox="0 0 120 200">
    <rect
      x="35"
      y="20"
      width="50"
      height="160"
      rx="25"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
  </svg>
);

// ⭐ SILO TANK (already good — no changes)
export const SiloTankIcon = () => (
  <svg width="50" height="70" viewBox="0 0 100 180">
    <rect
      x="20"
      y="10"
      width="60"
      height="110"
      rx="20"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
    <polygon
      points="20,120 80,120 50,170"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
  </svg>
);
