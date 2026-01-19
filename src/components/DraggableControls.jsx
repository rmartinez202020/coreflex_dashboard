// DraggableControls.jsx
import React from "react";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "Toggle Switch",
    icon: "🔘",
  },

  // ✅ Keep NO / NC badge INSIDE the design (no "Normally ..." text)
  {
    type: "pushButtonNO",
    label: "Push Button",
    badge: { text: "NO", bg: "#22c55e" }, // green
  },
  {
    type: "pushButtonNC",
    label: "Push Button",
    badge: { text: "NC", bg: "#ef4444" }, // red
  },

  {
    type: "interlockControl",
    label: "Interlock",
    icon: "🔒",
  },

  // ✅ NEW: Display Output (Device Output)
  // This uses a professional circular "OUT" button look (different from Display Input)
  {
    type: "displayOutput",
    label: "Display Output",
    render: "displayOutput",
  },
];

function DisplayOutputIcon() {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        position: "relative",
        background:
          "radial-gradient(circle at 30% 30%, #93c5fd 0%, #2563eb 38%, #0b2a6b 100%)",
        boxShadow:
          "0 4px 10px rgba(0,0,0,0.35), inset 0 0 10px rgba(255,255,255,0.14)",
        border: "2px solid rgba(255,255,255,0.20)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* inner ring */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.35)",
        }}
      />
      {/* OUT label */}
      <div
        style={{
          zIndex: 2,
          color: "white",
          fontWeight: 900,
          fontSize: 10,
          letterSpacing: 0.8,
          textShadow: "0 1px 6px rgba(0,0,0,0.55)",
          fontFamily: "system-ui, Arial",
        }}
      >
        OUT
      </div>
      {/* indicator dot */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          right: 5,
          width: 5,
          height: 5,
          borderRadius: 999,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 0 6px rgba(255,255,255,0.45)",
        }}
      />
    </div>
  );
}

export default function DraggableControls() {
  return (
    <div className="ml-4 space-y-2 mb-4">
      {CONTROLS.map((ctrl) => (
        <div
          key={ctrl.type}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("control", ctrl.type)}
          className="cursor-grab active:cursor-grabbing
                     text-sm text-gray-300 hover:text-white
                     flex items-center gap-2"
        >
          {/* Toggle + Interlock keep emoji icons */}
          {ctrl.icon && <span>{ctrl.icon}</span>}

          {/* Push Buttons use the NO/NC badge */}
          {ctrl.badge && (
            <span
              style={{
                background: ctrl.badge.bg,
                color: "white",
                fontWeight: 800,
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 999,
                lineHeight: "14px",
                minWidth: 26,
                textAlign: "center",
              }}
            >
              {ctrl.badge.text}
            </span>
          )}

          {/* ✅ Display Output uses a professional mini "OUT" button icon */}
          {ctrl.render === "displayOutput" && <DisplayOutputIcon />}

          <span>{ctrl.label}</span>
        </div>
      ))}
    </div>
  );
}
