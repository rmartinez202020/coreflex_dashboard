import React from "react";

export default function DraggableCounterInput({ label = "Counter Input" }) {
  const handleDragStart = (e) => {
    // This is the type your DashboardCanvas / drop handler should look for.
    // If your drop handler uses a different key, tell me and I’ll match it.
    e.dataTransfer.setData("type", "counterInput");
    e.dataTransfer.setData("text/plain", "counterInput");
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="select-none cursor-grab active:cursor-grabbing inline-flex items-center gap-2 w-full"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      <span className="text-base leading-none">🧮</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
