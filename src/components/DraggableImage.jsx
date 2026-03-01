// src/components/DraggableImage.jsx
import React from "react";

export default function DraggableImage({ src, scale = 1, baseW = 120 }) {
  const s = Number(scale || 1);
  const bw = Number(baseW || 120);

  return (
    <img
      src={src}
      draggable={false}
      alt=""
      style={{
        width: `${bw * s}px`,   // ✅ base width * scale
        maxWidth: "none",       // ✅ no cap
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