import React from "react";

export default function DraggableLedCircle({ onDragStart, onClick }) {
  const payload = {
    shape: "ledCircle",
    w: 80,
    h: 80,
    status: "off", // default
    colorOn: "#22c55e",
    colorOff: "#9ca3af",
    label: "LED",
  };

  return (
    <button
      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("coreflex/palette", JSON.stringify(payload));
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag LED Circle"
      type="button"
    >
      <span className="inline-flex w-3 h-3 rounded-full bg-green-500" />
      <span className="text-sm">Led Circle</span>
    </button>
  );
}
