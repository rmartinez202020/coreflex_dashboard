import React from "react";

export default function DraggableStateImage({ onDragStart, onClick, label = "State Image" }) {
  const payload = {
    shape: "stateImage",
    w: 160,
    h: 120,
    imgOn: "",
    imgOff: "",
    state: false,
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
      title="Drag State Image"
      role="button"
    >
      {label}
    </div>
  );
}
