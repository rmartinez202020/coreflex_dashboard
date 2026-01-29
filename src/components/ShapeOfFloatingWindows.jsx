// src/components/ShapeOfFloatingWindows.jsx
import React from "react";

/**
 * ShapeOfFloatingWindows
 * -----------------------------------
 * Shared window shell for ALL libraries:
 * - Image Library
 * - CoreFlex IOTs Library
 * - HMI / HVAC / Manufacturing / Tanks
 *
 * ❌ NOT used by Alarm Log (Alarm Log stays custom)
 */
export default function ShapeOfFloatingWindows({
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
        left: position?.x ?? 120,
        top: position?.y ?? 120,
        width: size?.width ?? 900,
        height: size?.height ?? 600,
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
          onStartDragWindow?.(e);
        }}
      >
        {title}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 20,
            cursor: "pointer",
          }}
          aria-label="Close window"
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
          onStartResizeWindow?.(e);
        }}
      />
    </div>
  );
}
