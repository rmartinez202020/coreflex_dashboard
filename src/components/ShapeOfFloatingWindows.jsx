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
 *
 * ✅ Resizable from:
 * - Right edge (E)
 * - Bottom edge (S)
 * - Bottom-right corner (SE)
 *
 * IMPORTANT:
 * - Uses Pointer Events (onPointerDown) to match useWindowDragResize hook
 * - Close button must stop propagation so it doesn't trigger drag
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

  const posX = position?.x ?? 120;
  const posY = position?.y ?? 120;
  const w = size?.width ?? 900;
  const h = size?.height ?? 600;

  const EDGE = 8; // grab thickness for right/bottom resize
  const HEADER_H = 40;

  return (
    <div
      className="floating-window"
      style={{
        position: "absolute",
        left: posX,
        top: posY,
        width: w,
        height: h,
        background: "white",
        color: "black",
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        touchAction: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* HEADER (DRAG BAR) */}
      <div
        style={{
          height: HEADER_H,
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
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartDragWindow?.(e);
        }}
      >
        {title}

        <button
          type="button"
          // ✅ CRITICAL: stop the header drag from stealing the click
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
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
            lineHeight: 1,
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
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* ✅ RIGHT EDGE RESIZE (E) */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: HEADER_H,
          width: EDGE,
          height: `calc(100% - ${HEADER_H}px)`,
          cursor: "ew-resize",
          background: "transparent",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "e");
        }}
      />

      {/* ✅ BOTTOM EDGE RESIZE (S) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: EDGE,
          cursor: "ns-resize",
          background: "transparent",
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "s");
        }}
      />

      {/* ✅ CORNER RESIZE (SE) */}
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
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "se");
        }}
      />
    </div>
  );
}
