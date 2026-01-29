import React from "react";

export default function DraggableStatusTextBox({ onDragStart, onClick }) {
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
    <button
      className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("coreflex/palette", JSON.stringify(payload));
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Status Text Box"
      type="button"
    >
      <span className="inline-flex w-3 h-3 rounded bg-blue-500" />
      <span className="text-sm">Status Text Box</span>
    </button>
  );
}
