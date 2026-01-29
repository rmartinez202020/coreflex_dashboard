import React from "react";

export default function DraggableStatusTextBox({ onDragStart, onClick, label = "Status Text Box" }) {
  const payload = {
    shape: "statusTextBox",
    w: 220,
    h: 60,
    text: "STATUS",
    value: "OK",
    bg: "#ffffff",
    border: "#d1d5db",
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
      title="Drag Status Text Box"
      role="button"
    >
      {label}
    </div>
  );
}
