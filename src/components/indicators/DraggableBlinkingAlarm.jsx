import React from "react";

export default function DraggableBlinkingAlarm({ onDragStart, onClick, label = "Blinking Alarm" }) {
  const payload = {
    shape: "blinkingAlarm",
    w: 140,
    h: 50,
    text: "ALARM",
    isActive: false,
    blinkMs: 500,
    colorOn: "#ef4444",
    colorOff: "#111827",
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
      title="Drag Blinking Alarm"
      role="button"
    >
      {label}
    </div>
  );
}
