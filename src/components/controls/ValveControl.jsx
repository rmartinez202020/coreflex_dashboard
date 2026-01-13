import React, { useMemo } from "react";

/**
 * ValveControl (3 styles)
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
  const bvBodyId = `${gid}_bvBody`;
  const gvBodyId = `${gid}_gvBody`;
  const bfBodyId = `${gid}_bfBody`;

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
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.35) 100%)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
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
    if (type === "gate") return <GateValveIcon isOpen={isOpen} gvBodyId={gvBodyId} />;
    if (type === "butterfly")
      return <ButterflyValveIcon isOpen={isOpen} bfBodyId={bfBodyId} />;
    return <BallValveIcon isOpen={isOpen} bvBodyId={bvBodyId} />;
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
   ICONS (SVG)
========================= */

function BallValveIcon({ isOpen, bvBodyId }) {
  const angle = isOpen ? 0 : 90;

  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <defs>
        <linearGradient id={bvBodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="1" stopColor="#374151" />
        </linearGradient>
      </defs>

      <rect x="8" y="26" width="48" height="12" rx="6" fill={`url(#${bvBodyId})`} />
      <circle cx="32" cy="32" r="14" fill="#111827" stroke="#d1d5db" strokeWidth="2" />
      <circle cx="32" cy="32" r="8" fill="#0b1220" stroke="#9ca3af" strokeWidth="1" />

      <g transform={`translate(32 10) rotate(${angle}) translate(-32 -10)`}>
        <rect x="18" y="6" width="28" height="8" rx="4" fill="#ef4444" stroke="#7f1d1d" />
        <rect x="28" y="10" width="8" height="10" rx="4" fill="#111827" />
      </g>
    </svg>
  );
}

function GateValveIcon({ isOpen, gvBodyId }) {
  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <defs>
        <linearGradient id={gvBodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>

      <rect x="6" y="28" width="16" height="8" rx="4" fill="#4b5563" />
      <rect x="42" y="28" width="16" height="8" rx="4" fill="#4b5563" />

      <rect
        x="18"
        y="20"
        width="28"
        height="24"
        rx="8"
        fill={`url(#${gvBodyId})`}
        stroke="#111827"
      />

      <rect
        x="28"
        y={isOpen ? 14 : 26}
        width="8"
        height="18"
        rx="3"
        fill="#111827"
        opacity={0.95}
      />

      <rect x="30" y="10" width="4" height="12" rx="2" fill="#9ca3af" />

      <circle cx="32" cy="8" r="7" fill="#ef4444" stroke="#7f1d1d" />
      <circle cx="32" cy="8" r="2" fill="#111827" />
    </svg>
  );
}

function ButterflyValveIcon({ isOpen, bfBodyId }) {
  const angle = isOpen ? 0 : 90;

  return (
    <svg width="42" height="42" viewBox="0 0 64 64">
      <defs>
        <linearGradient id={bfBodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d1d5db" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
      </defs>

      <rect x="10" y="22" width="44" height="20" rx="10" fill={`url(#${bfBodyId})`} />

      <g transform={`translate(32 32) rotate(${angle}) translate(-32 -32)`}>
        <rect x="30" y="18" width="4" height="28" rx="2" fill="#ef4444" />
        <circle cx="32" cy="32" r="10" fill="rgba(0,0,0,0.15)" />
      </g>

      <rect x="30" y="10" width="4" height="12" rx="2" fill="#9ca3af" />
      <rect x="22" y="6" width="20" height="6" rx="3" fill="#ef4444" stroke="#7f1d1d" />
    </svg>
  );
}

