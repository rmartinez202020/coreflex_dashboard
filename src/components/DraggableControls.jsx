// DraggableControls.jsx
import React from "react";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "Toggle Switch",
    icon: "🔘",
  },
  {
    type: "pushButtonControl",
    label: "Push Button",
    icon: "⏺",
  },
  {
    type: "selectorControl",
    label: "Selector Switch",
    icon: "🎚",
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
          onDragStart={(e) =>
            e.dataTransfer.setData("control", ctrl.type)
          }
          className="cursor-grab active:cursor-grabbing
                     text-sm text-gray-300 hover:text-white
                     flex items-center gap-2"
        >
          <span>{ctrl.icon}</span>
          {ctrl.label}
        </div>
      ))}
    </div>
  );
}
