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
        minHeight: 74,
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
        padding: "8px 6px",
        gap: 6,
      }}
    >
      <svg
        width="78"
        height="38"
        viewBox="0 0 78 38"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <path
          d="M10 30 A24 24 0 0 1 68 30"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M10 30 A24 24 0 0 1 52 10"
          fill="none"
          stroke="#2563eb"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <line
          x1="39"
          y1="30"
          x2="54"
          y2="14"
          stroke="#ea580c"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="39" cy="30" r="3.5" fill="#94a3b8" />
      </svg>

      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#111827",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
    </div>
  );
}