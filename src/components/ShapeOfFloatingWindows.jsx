import React from "react";

export default function ShapeOfFloatingWindows({
  visible,
  title,
  position = { x: 120, y: 120 },
  size = { width: 900, height: 420 },

  onClose,
  onMinimize,
  onLaunch,

  // provided by useWindowDragResize.getWindowProps(key)
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
          fontWeight: 900,
          cursor: "grab",
          userSelect: "none",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartDragWindow?.(e);
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{title}</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onLaunch && (
            <button
              type="button"
              title="Launch"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              style={iconBtn}
            >
              ↗
            </button>
          )}

          {onMinimize && (
            <button
              type="button"
              title="Minimize"
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              style={iconBtn}
            >
              —
            </button>
          )}

          <button
            type="button"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            style={{ ...iconBtn, background: "#ef4444", border: "1px solid #b91c1c" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{ flex: 1, overflow: "auto", background: "white" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* ✅ RIGHT RESIZE HANDLE */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "e"); // "e" = east
        }}
        style={{
          position: "absolute",
          top: 40,
          right: 0,
          width: 10,
          height: "calc(100% - 40px)",
          cursor: "ew-resize",
          zIndex: 20,
        }}
      />

      {/* ✅ BOTTOM RESIZE HANDLE */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "s"); // "s" = south
        }}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 10,
          cursor: "ns-resize",
          zIndex: 20,
        }}
      />

      {/* ✅ CORNER RESIZE HANDLE */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e, "se"); // "se" = south-east
        }}
        style={{
          width: 16,
          height: 16,
          position: "absolute",
          right: 0,
          bottom: 0,
          background: "#2563eb",
          cursor: "nwse-resize",
          borderTopLeftRadius: 6,
          zIndex: 21,
        }}
      />
    </div>
  );
}

const iconBtn = {
  width: 28,
  height: 24,
  borderRadius: 6,
  background: "#111827",
  color: "white",
  border: "1px solid #334155",
  cursor: "pointer",
  fontWeight: 900,
};
