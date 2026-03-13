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

    bindModel: "zhc1921",
    bindDeviceId: "",
    bindField: "ai1",

    units: "",
    minValue: 0,
    maxValue: 100,
    decimals: 0,

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
    } catch {}

    onDragStart?.(e, payload);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={title}
      style={{
        width: "100%",
        cursor: "grab",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 4px",
        gap: 4,
      }}
    >
      <svg
        width="56"
        height="30"
        viewBox="0 0 120 70"
        style={{ display: "block" }}
      >
        {/* GREEN */}
        <path
          d="M20 60 A40 40 0 0 1 40 30"
          fill="none"
          stroke="#22c55e"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* YELLOW */}
        <path
          d="M40 30 A40 40 0 0 1 65 22"
          fill="none"
          stroke="#facc15"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* ORANGE */}
        <path
          d="M65 22 A40 40 0 0 1 88 35"
          fill="none"
          stroke="#fb923c"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* RED */}
        <path
          d="M88 35 A40 40 0 0 1 100 60"
          fill="none"
          stroke="#ef4444"
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* needle */}
        <line
          x1="60"
          y1="60"
          x2="78"
          y2="36"
          stroke="#111827"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <circle cx="60" cy="60" r="5" fill="#4b5563" />
      </svg>

      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#111827",
          textAlign: "center",
        }}
      >
        {title}
      </div>
    </div>
  );
}