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
];

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

          <span>{ctrl.label}</span>
        </div>
      ))}
    </div>
  );
}
