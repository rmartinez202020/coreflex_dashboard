import React from "react";

export default function DraggableBlinkingAlarm({ onDragStart, onClick }) {
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
    <button
      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("coreflex/palette", JSON.stringify(payload));
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Blinking Alarm"
      type="button"
    >
      <span className="inline-flex w-3 h-3 rounded bg-red-500" />
      <span className="text-sm">Blinking Alarm</span>
    </button>
  );
}
