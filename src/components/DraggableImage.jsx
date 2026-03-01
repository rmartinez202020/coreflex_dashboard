// src/components/DraggableImage.jsx
import React from "react";

const BASE_W = 120; // ✅ this is your 1:1 size

export default function DraggableImage({ src }) {
  if (!src) return null;

  return (
    <img
      src={src}
      draggable={false}
      alt=""
      style={{
        width: BASE_W,        // ✅ 1:1 base size
        height: "auto",
        maxWidth: "none",     // ✅ don't clamp (parent scale handles it)
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        display: "block",
      }}
    />
  );
}