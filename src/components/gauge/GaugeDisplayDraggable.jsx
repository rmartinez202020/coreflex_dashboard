// src/components/gauge/GaugeDisplayDraggable.jsx

import React from "react";

export default function GaugeDisplayDraggable({
  onDragStart,
  title = "Gauge Display (AI)",
}) {
  const payload = {
    type: "gaugeDisplay",
    shape: "gaugeDisplay",
    title: "Gauge",
    gaugeStyle: "classic",

    // AI binding
    bindModel: "zhc1921",
    bindDeviceId: "",
    bindField: "ai1",

    // display
    units: "",
    minValue: 0,
    maxValue: 100,
    decimals: 0,
    formula: "",

    // options
    showValue: true,
    showTicks: true,
    showLabels: true,
    showZones: true,

    // thresholds
    lowWarn: null,
    highWarn: null,

    // default size
    width: 220,
    height: 220,
    w: 220,
    h: 220,
  };

  const handleDragStart = (e) => {
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.setData("text/plain", payload.type);

      // ✅ IMPORTANT: your drop handler reads "shape"
      e.dataTransfer.setData("shape", payload.shape);

      e.dataTransfer.effectAllowed = "copy";
    } catch {
      // ignore browser drag payload issues
    }

    onDragStart?.(e, payload);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={title}
      style={{
        width: "100%",
        minHeight: 56,
        border: "1px solid #d1d5db",
        borderRadius: 10,
        background: "#ffffff",
        cursor: "grab",
        userSelect: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 4px",
        gap: 4,
      }}
    >
      <svg
        width="46"
        height="26"
        viewBox="0 0 120 70"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {/* GREEN */}
        <path
          d="M10 60 A50 50 0 0 1 35 27"
          fill="none"
          stroke="#22c55e"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* YELLOW-GREEN */}
        <path
          d="M35 27 A50 50 0 0 1 58 12"
          fill="none"
          stroke="#84cc16"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* YELLOW */}
        <path
          d="M58 12 A50 50 0 0 1 80 17"
          fill="none"
          stroke="#facc15"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* ORANGE */}
        <path
          d="M80 17 A50 50 0 0 1 98 33"
          fill="none"
          stroke="#fb923c"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* RED */}
        <path
          d="M98 33 A50 50 0 0 1 110 60"
          fill="none"
          stroke="#ef4444"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* small ticks */}
        <line x1="22" y1="48" x2="18" y2="44" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="40" y1="27" x2="37" y2="21" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="61" y1="18" x2="61" y2="11" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="83" y1="22" x2="86" y2="15" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="101" y1="40" x2="106" y2="36" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

        {/* needle shadow */}
        <line
          x1="60"
          y1="60"
          x2="84"
          y2="31"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* needle */}
        <line
          x1="60"
          y1="60"
          x2="82"
          y2="33"
          stroke="#111827"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* hub */}
        <circle cx="60" cy="60" r="7" fill="#4b5563" />
        <circle cx="60" cy="60" r="3.2" fill="#9ca3af" />
      </svg>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#111827",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
    </div>
  );
}