// src/components/FloatingWindow.jsx
import React from "react";

/**
 * FloatingWindow (CONTROLLED)
 * - Position/size come ONLY from parent (useWindowDragResize)
 * - Drag/resize handled ONLY by onStartDragWindow/onStartResizeWindow
 * - This prevents the "open then jump" flicker completely
 */
export default function FloatingWindow({
  visible,
  title,
  position = { x: 120, y: 120 },
  size = { width: 900, height: 420 },

  onClose,
  onMinimize,
  onLaunch,

  // ✅ these MUST be provided by useWindowDragResize.getWindowProps(key)
  onStartDragWindow,
  onStartResizeWindow,

  children,
  hideHeader = false,
}) {
  if (!visible) return null;

  const headerH = hideHeader ? 0 : 40;

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
        border: "2px solid #1e293b",
        borderRadius: "12px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.55)",
        zIndex: 999999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {!hideHeader && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartDragWindow?.(e);
          }}
          style={{
            height: 40,
            background: "#0f172a",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
            cursor: "move",
            userSelect: "none",
          }}
        >
          <div style={{ fontWeight: 800 }}>{title}</div>

          <div style={{ display: "flex", gap: 8 }}>
            {onLaunch && (
              <button
                type="button"
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
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
              style={{ ...iconBtn, background: "#ef4444" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {/* ✅ allow drag even with hidden header */}
      {hideHeader && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartDragWindow?.(e);
          }}
          style={{
            position: "absolute",
            top: 0,
            height: 10,
            width: "100%",
            cursor: "move",
            zIndex: 20,
          }}
        />
      )}

      {/* ✅ resize handles (owned by window manager) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e);
        }}
        style={{
          position: "absolute",
          right: 0,
          top: headerH,
          width: 10,
          height: `calc(100% - ${headerH}px)`,
          cursor: "ew-resize",
          zIndex: 10,
        }}
      />

      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e);
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 10,
          cursor: "ns-resize",
          zIndex: 10,
        }}
      />

      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartResizeWindow?.(e);
        }}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: "nwse-resize",
          zIndex: 11,
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
};
