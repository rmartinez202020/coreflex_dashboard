import React, { useMemo } from "react";

/**
 * ValveControl (3 styles) - INDUSTRIAL ICONS (no emojis)
 * type: "ball" | "gate" | "butterfly"
 * isOpen: boolean
 * width/height are respected by the wrapper (Dashboard objects use w/h)
 */
export default function ValveControl({
  type = "ball",
  isOpen = true,
  width = 220,
  height = 90,
  label = "VALVE",
}) {
  const W = width;
  const H = height;

  // ✅ prevent SVG gradient ID collisions when multiple valves exist
  const gid = useMemo(() => `valve_${Math.random().toString(16).slice(2)}`, []);
  const steelId = `${gid}_steel`;

  const outer = {
    width: W,
    height: H,
    borderRadius: 14,
    border: "1px solid #1f2937",
    background:
      "linear-gradient(180deg, rgba(25,25,25,0.98) 0%, rgba(7,7,7,0.98) 100%)",
    boxShadow: "0 10px 18px rgba(0,0,0,0.28)",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
  };

  const statusPill = {
    marginLeft: "auto",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.4,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: isOpen
      ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
      : "linear-gradient(180deg,#ffb4b4,#ef4444)",
    color: isOpen ? "#0b3b18" : "#3b0b0b",
    minWidth: 78,
    textAlign: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
  };

  const title = {
    color: "#f9fafb",
    fontWeight: 900,
    fontSize: 16,
    lineHeight: 1,
    letterSpacing: 0.6,
  };

  const sub = {
    marginTop: 4,
    color: "rgba(255,255,255,0.70)",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 0.2,
  };

  const iconWrap = {
    width: 54,
    height: 54,
    borderRadius: 14,
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 45%, rgba(0,0,0,0.40) 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
    flex: "0 0 auto",
  };

  const typeBadge = {
    position: "absolute",
    top: 8,
    right: 10,
    fontSize: 10,
    fontWeight: 900,
    padding: "2px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.6,
  };

  const Icon = () => {
    if (type === "gate")
      return <GateValveIcon isOpen={isOpen} steelId={steelId} />;
    if (type === "butterfly")
      return <ButterflyValveIcon isOpen={isOpen} steelId={steelId} />;
    return <BallValveIcon isOpen={isOpen} steelId={steelId} />;
  };

  return (
    <div style={outer}>
      <div style={typeBadge}>{String(type).toUpperCase()}</div>

      <div style={iconWrap}>
        <Icon />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={title}>{label}</div>
        <div style={sub}>Status: {isOpen ? "OPEN" : "CLOSED"}</div>
      </div>

      <div style={statusPill}>{isOpen ? "OPEN" : "CLOSED"}</div>
    </div>
  );
}

/* =========================
   ICONS (SVG) - INDUSTRIAL
========================= */

function SteelDefs({ steelId }) {
  return (
    <defs>
      <linearGradient id={steelId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e5e7eb" />
        <stop offset="0.35" stopColor="#9ca3af" />
        <stop offset="1" stopColor="#374151" />
      </linearGradient>
    </defs>
  );
}

function BallValveIcon({ isOpen, steelId }) {
  // OPEN = handle horizontal, CLOSED = vertical
  const angle = isOpen ? 0 : 90;

  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <SteelDefs steelId={steelId} />

      {/* pipe */}
      <rect x="4" y="28" width="56" height="8" rx="4" fill="#4b5563" />

      {/* body */}
      <circle
        cx="32"
        cy="32"
        r="14"
        fill="#111827"
        stroke="#9ca3af"
        strokeWidth="2"
      />

      {/* ball */}
      <circle cx="32" cy="32" r="7" fill="#0b1220" stroke="#6b7280" />

      {/* handle */}
      <g transform={`rotate(${angle} 32 14)`}>
        <rect
          x="16"
          y="11"
          width="32"
          height="6"
          rx="3"
          fill={`url(#${steelId})`}
          stroke="#111827"
          strokeWidth="1"
        />
        <rect x="30" y="17" width="4" height="8" rx="2" fill="#6b7280" />
      </g>
    </svg>
  );
}

function GateValveIcon({ isOpen, steelId }) {
  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <SteelDefs steelId={steelId} />

      {/* pipes */}
      <rect x="4" y="28" width="16" height="8" rx="4" fill="#4b5563" />
      <rect x="44" y="28" width="16" height="8" rx="4" fill="#4b5563" />

      {/* body */}
      <rect
        x="18"
        y="22"
        width="28"
        height="20"
        rx="6"
        fill="#111827"
        stroke="#9ca3af"
        strokeWidth="2"
      />
      <rect
        x="21"
        y="25"
        width="22"
        height="14"
        rx="5"
        fill={`url(#${steelId})`}
        opacity={0.95}
      />

      {/* gate (up=open / down=closed) */}
      <rect
        x="28"
        y={isOpen ? 16 : 28}
        width="8"
        height="16"
        rx="2"
        fill="#9ca3af"
      />

      {/* stem */}
      <rect x="30" y="6" width="4" height="18" rx="2" fill="#6b7280" />

      {/* wheel */}
      <circle cx="32" cy="6" r="5" fill="#374151" stroke="#9ca3af" />
      <circle cx="32" cy="6" r="2" fill="#111827" />
    </svg>
  );
}

function ButterflyValveIcon({ isOpen, steelId }) {
  // OPEN = disk parallel, CLOSED = perpendicular
  const angle = isOpen ? 0 : 90;

  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <SteelDefs steelId={steelId} />

      {/* pipe/body */}
      <rect
        x="6"
        y="24"
        width="52"
        height="16"
        rx="8"
        fill="#111827"
        stroke="#9ca3af"
        strokeWidth="2"
      />
      <rect
        x="9"
        y="26"
        width="46"
        height="12"
        rx="6"
        fill={`url(#${steelId})`}
        opacity={0.95}
      />

      {/* disk */}
      <g transform={`rotate(${angle} 32 32)`}>
        <rect x="30" y="18" width="4" height="28" rx="2" fill="#6b7280" />
      </g>

      {/* stem */}
      <rect x="30" y="6" width="4" height="12" rx="2" fill="#6b7280" />
    </svg>
  );
}
