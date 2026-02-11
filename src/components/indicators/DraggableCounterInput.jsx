import React from "react";

export default function DraggableCounterInput({
  label = "Counter Input (DI)",
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("type", "counterInput");
    e.dataTransfer.setData("text/plain", "counterInput");
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full gap-2"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      {/* Fixed-width icon column to align with other indicators */}
      <span className="w-[18px] text-center text-base leading-none">
        🧮
      </span>

      {/* Label */}
      <span className="text-sm">{label}</span>
    </div>
  );
}
