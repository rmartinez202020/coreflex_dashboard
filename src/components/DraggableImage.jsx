// src/components/DraggableImage.jsx
import React from "react";

export default function DraggableImage({ src, scale = 1, baseW = 120 }) {
  const sRaw = Number(scale);
  const s = Number.isFinite(sRaw) && sRaw > 0 ? sRaw : 1;

  const bwRaw = Number(baseW);
  const bw = Number.isFinite(bwRaw) && bwRaw > 0 ? bwRaw : 120;

  return (
    <img
      src={src}
      draggable={false}
      alt=""
      style={{
        width: `${bw * s}px`, // ✅ base width * scale
        maxWidth: "none", // ✅ no cap
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