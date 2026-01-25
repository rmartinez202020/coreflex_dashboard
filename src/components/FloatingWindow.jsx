// src/components/FloatingWindow.jsx
import React, { useEffect, useRef, useState } from "react";

export default function FloatingWindow({
  visible,
  title,
  position = { x: 120, y: 120 },
  size = { width: 900, height: 420 },
  onClose,
  onMinimize,
  onLaunch,
  children,
}) {
  const [pos, setPos] = useState(position);
  const [sz, setSz] = useState(size);

  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  // Reset to given defaults when opened (optional but nice)
  useEffect(() => {
    if (visible) {
      setPos(position);
      setSz(size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setPos({
        x: startPos.x + dx,
        y: startPos.y + dy,
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...sz };

    const minW = 520;
    const minH = 260;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      setSz({
        width: Math.max(minW, startSize.width + dx),
        height: Math.max(minH, startSize.height + dy),
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="floating-window"
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: sz.width,
        height: sz.height,
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
      {/* HEADER BAR (DRAG HANDLE) */}
      <div
        ref={dragRef}
        onMouseDown={startDrag}
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
        <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onLaunch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch();
              }}
              title="Launch"
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
              title="Minimize"
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
            title="Close"
            style={{ ...iconBtn, background: "#ef4444", borderColor: "#b91c1c" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {/* RESIZE HANDLE (BOTTOM-RIGHT) */}
      <div
        ref={resizeRef}
        onMouseDown={startResize}
        title="Resize"
        style={{
          position: "absolute",
          right: 2,
          bottom: 2,
          width: 18,
          height: 18,
          cursor: "nwse-resize",
          background: "transparent",
        }}
      />
    </div>
  );
}

const iconBtn = {
  width: 28,
  height: 24,
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: "1",
};
