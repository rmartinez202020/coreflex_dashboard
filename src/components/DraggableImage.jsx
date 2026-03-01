// src/components/DraggableImage.jsx
import React from "react";

export default function DraggableImage({ src, scale }) {
  const s = Number(scale || 1);

  return (
    <img
      src={src}
      draggable={false}
      alt=""
      style={{
        width: `${120 * s}px`,        // ✅ your 1:1 stays the same
        maxWidth: "none",             // ✅ IMPORTANT: remove 300px cap
        minWidth: 20,
        height: "auto",
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        display: "block",
      }}
    />
  );
}