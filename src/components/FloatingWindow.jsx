// components/FloatingWindow.jsx
import React from "react";

export default function FloatingWindow({
  visible,
  title,
  position,
  size,
  onClose,
  onStartDragWindow,
  onStartResizeWindow,
  children,
}) {
  if (!visible) return null;

  return (
    <div
      className="floating-window"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        background: "white",
        color: "black",
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* HEADER (DRAG BAR) */}
      <div
        style={{
          height: 40,
          background: "#0f172a",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          fontWeight: "bold",
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartDragWindow(e);
        }}
      >
        {title}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          background: "white",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* RESIZE HANDLE */}
      <div
        style={{
          width: 16,
          height: 16,
          position: "absolute",
          right: 0,
          bottom: 0,
          background: "#2563eb",
          cursor: "nwse-resize",
          borderTopLeftRadius: 6,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow(e);
        }}
      />
    </div>
  );
}
