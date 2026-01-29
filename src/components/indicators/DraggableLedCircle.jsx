import React from "react";

export default function DraggableLedCircle({ onDragStart, onClick, label = "Led Circle" }) {
  const payload = {
    shape: "ledCircle",
    w: 80,
    h: 80,
    status: "off",
    colorOn: "#22c55e",
    colorOff: "#9ca3af",
    label: "LED",
  };

  return (
    <div
      className="cursor-pointer text-sm"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("coreflex/palette", JSON.stringify(payload));
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Led Circle"
      role="button"
    >
      {label}
    </div>
  );
}
