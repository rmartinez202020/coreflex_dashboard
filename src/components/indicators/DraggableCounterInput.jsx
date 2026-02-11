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
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full gap-1"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      {/* narrower icon column + slightly pulled left */}
      <span
        className="w-[14px] text-center text-base leading-none"
        style={{ marginLeft: -2 }}
      >
        🧮
      </span>

      <span className="text-sm">{label}</span>
    </div>
  );
}
