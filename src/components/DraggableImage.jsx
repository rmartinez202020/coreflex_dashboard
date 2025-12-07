// src/components/DraggableImage.jsx
export default function DraggableImage({ src, scale }) {
  return (
    <img
      src={src}
      draggable={false}
      style={{
        width: `${120 * (scale || 1)}px`,       // consistent base width
        maxWidth: 300,
        minWidth: 20,                           // allow very small scaling
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        display: "block",
      }}
    />
  );
}
