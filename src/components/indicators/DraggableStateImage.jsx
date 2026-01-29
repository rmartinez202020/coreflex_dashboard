import React from "react";

export default function DraggableStateImage({ onDragStart, onClick }) {
  const payload = {
    shape: "stateImage",
    w: 160,
    h: 120,
    // You can later wire real URLs or library keys:
    imgOn: "",
    imgOff: "",
    state: false,
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
      title="Drag State Image"
      type="button"
    >
      <span className="inline-flex w-3 h-3 rounded bg-purple-500" />
      <span className="text-sm">State Image</span>
    </button>
  );
}
