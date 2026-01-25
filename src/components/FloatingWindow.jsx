// components/FloatingWindow.jsx
import React from "react";

export default function FloatingWindow({
  visible,
  title,
  position,
  size,

  // actions
  onClose,
  onMinimize, // ✅ NEW (optional)
  onLaunch, // ✅ NEW (optional)
  onOpenSettings, // ✅ NEW (optional)

  // drag/resize
  onStartDragWindow,
  onStartResizeWindow,

  children,
}) {
  if (!visible) return null;

  // ✅ Clamp window size so it NEVER opens larger than the viewport
  const safeWidth = Math.min(size?.width ?? 820, window.innerWidth - 80);
  const safeHeight = Math.min(size?.height ?? 560, window.innerHeight - 120);

  return (
    <div
      className="floating-window"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,

        width: safeWidth,
        height: safeHeight,

        maxWidth: "calc(100vw - 80px)",
        maxHeight: "calc(100vh - 120px)",

        background: "white",
        color: "black",
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      }}
      // ✅ stop clicks from reaching canvas
      onMouseDown={(e) => e.stopPropagation()}
      // ✅ avoid weird double-click behaviors
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* HEADER (DRAG BAR ONLY) */}
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
          cursor: "move", // ✅ clearer than grab
          userSelect: "none",
          borderBottom: "2px solid #000",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartDragWindow?.(e); // ✅ safe optional
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>{title}</span>
        </div>

        {/* ✅ WINDOW BUTTONS */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onOpenSettings && (
            <button
              type="button"
              title="Settings"
              style={iconBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings?.();
              }}
            >
              ⚙
            </button>
          )}

          {onLaunch && (
            <button
              type="button"
              title="Launch"
              style={iconBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onLaunch?.();
              }}
            >
              ↗
            </button>
          )}

          {onMinimize && (
            <button
              type="button"
              title="Minimize"
              style={iconBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onMinimize?.();
              }}
            >
              —
            </button>
          )}

          <button
            type="button"
            title="Close"
            style={{ ...iconBtn, borderColor: "#7f1d1d" }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflow: "auto",
          background: "white",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
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

const iconBtn = {
  width: 28,
  height: 24,
  background: "#000",
  color: "#fff",
  borderRadius: 6,
  border: "1px solid #111",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "22px",
};
