// src/components/DraggableValves.jsx
import React from "react";
import ValveControl from "./controls/ValveControl";

const VALVES = [
  {
    key: "ball",
    label: "Ball Valve",
  },
  {
    key: "gate",
    label: "Gate Valve",
  },
  {
    key: "butterfly",
    label: "Butterfly Valve",
  },
];

export default function DraggableValves() {
  return (
    <div className="ml-4 space-y-3 mb-2">
      {VALVES.map((v) => (
        <div
          key={v.key}
          draggable
          onDragStart={(e) => {
            // we drag a "control" payload so your existing drop handler pattern can use it
            const payload = {
              type: "valveControl",
              shape: "valveControl",
              valveType: v.key, // "ball" | "gate" | "butterfly"
              label: v.label,
              isOpen: true,
              w: 220,
              h: 90,
            };
            e.dataTransfer.setData("control", JSON.stringify(payload));
          }}
          className="cursor-grab active:cursor-grabbing select-none"
          style={{ width: 210 }}
          title={`Drag ${v.label}`}
        >
          {/* Mini preview using your real ValveControl design */}
          <div style={{ transform: "scale(0.85)", transformOrigin: "left top" }}>
            <ValveControl
              type={v.key}
              isOpen={true}
              width={220}
              height={70}
              label={v.label}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
