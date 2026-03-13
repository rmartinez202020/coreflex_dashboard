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
        minHeight: 58,
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
        gap: 5,
      }}
    >
      <svg
        width="58"
        height="30"
        viewBox="0 0 120 70"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {/* segmented top arc */}
        <path
          d="M18 58 A42 42 0 0 1 36 27"
          fill="none"
          stroke="#22c55e"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M39 24 A42 42 0 0 1 54 18"
          fill="none"
          stroke="#84cc16"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M58 17 A42 42 0 0 1 73 19"
          fill="none"
          stroke="#facc15"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M77 21 A42 42 0 0 1 90 30"
          fill="none"
          stroke="#fb923c"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M93 34 A42 42 0 0 1 102 58"
          fill="none"
          stroke="#ef4444"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* small separators */}
        <line x1="34" y1="33" x2="30" y2="28" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="53" y1="21" x2="52" y2="14" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="72" y1="21" x2="75" y2="15" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="89" y1="31" x2="94" y2="27" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

        {/* needle shadow */}
        <line
          x1="60"
          y1="58"
          x2="79"
          y2="34"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* needle */}
        <line
          x1="60"
          y1="58"
          x2="77"
          y2="35"
          stroke="#111827"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* center hub */}
        <circle cx="60" cy="58" r="6.5" fill="#4b5563" />
        <circle cx="60" cy="58" r="2.8" fill="#9ca3af" />
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