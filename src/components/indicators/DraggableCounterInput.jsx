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
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      {/* icon aligned left */}
      <span className="w-[16px] text-center text-base leading-none">
        🧮
      </span>

      {/* proper spacing from icon */}
      <span className="text-sm ml-3">{label}</span>
    </div>
  );
}
