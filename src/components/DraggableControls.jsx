// DraggableControls.jsx
import React from "react";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "Toggle Switch",
    icon: "🔘",
  },

  // 🟢 Push Button NO (Normally Open)
  {
    type: "pushButtonNO",
    label: "Push Button",
    badge: "NO",
    color: "green",
  },

  // 🔴 Push Button NC (Normally Closed)
  {
    type: "pushButtonNC",
    label: "Push Button",
    badge: "NC",
    color: "red",
  },

  {
    type: "interlockControl",
    label: "Interlock",
    icon: "🔒",
  },
];

export default function DraggableControls() {
  return (
    <div className="ml-4 space-y-2 mb-4 select-none">
      {CONTROLS.map((ctrl) => (
        <div
          key={ctrl.type}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("control", ctrl.type)}
          className="cursor-grab active:cursor-grabbing
                     text-sm text-gray-300 hover:text-white
                     flex items-center gap-2
                     px-2 py-1 rounded
                     hover:bg-gray-800"
        >
          {/* ICON / BADGE */}
          {ctrl.badge ? (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center
              text-xs font-bold text-white
              ${ctrl.color === "green" ? "bg-green-600" : "bg-red-600"}`}
            >
              {ctrl.badge}
            </div>
          ) : (
            <span className="text-lg">{ctrl.icon}</span>
          )}

          {/* LABEL */}
          <span className="flex-1">{ctrl.label}</span>

          {/* SUB LABEL */}
          {ctrl.badge && (
            <span className="text-[10px] text-gray-400 uppercase">
              {ctrl.badge === "NO" ? "Normally Open" : "Normally Closed"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
