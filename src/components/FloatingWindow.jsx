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

  // ✅ NEW
  hideHeader = false,
}) {
  const [pos, setPos] = useState(position);
  const [sz, setSz] = useState(size);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setPos(position);
      setSz(size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const clampMin = (n, min) => Math.max(min, n);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // ✅ workspace bounds = <main> area (between sidebars)
  const getWorkspaceBounds = () => {
    const mainEl = document.querySelector("main");
    const r = mainEl?.getBoundingClientRect?.();

    // fallback if <main> not found
    if (!r) {
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, window.innerWidth - sz.width),
        maxY: Math.max(0, window.innerHeight - sz.height),
      };
    }

    // because FloatingWindow is positioned ABSOLUTE inside <main>,
    // its coordinates are relative to <main>, so bounds are:
    return {
      minX: 0,
      minY: 0,
      maxX: Math.max(0, r.width - sz.width),
      maxY: Math.max(0, r.height - sz.height),
    };
  };

  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const bounds = getWorkspaceBounds();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
      bounds,
    };

    const onMove = (ev) => {
      const s = dragStartRef.current;
      if (!s) return;

      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;

      // ✅ clamp position within workspace
      const nextX = clamp(s.startPos.x + dx, s.bounds.minX, s.bounds.maxX);
      const nextY = clamp(s.startPos.y + dy, s.bounds.minY, s.bounds.maxY);

      setPos({ x: nextX, y: nextY });
    };

    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (edge) => (e) => {
    e.stopPropagation();
    e.preventDefault();

    resizeStartRef.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startSize: { ...sz },
      startPos: { ...pos },
    };

    const minW = 520;
    const minH = 260;

    const onMove = (ev) => {
      const s = resizeStartRef.current;
      if (!s) return;

      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;

      let nextW = s.startSize.width;
      let nextH = s.startSize.height;

      if (s.edge === "right" || s.edge === "corner")
        nextW = clampMin(nextW + dx, minW);
      if (s.edge === "bottom" || s.edge === "corner")
        nextH = clampMin(nextH + dy, minH);

      // ✅ OPTIONAL: also prevent resize from extending outside workspace
      const mainEl = document.querySelector("main");
      const r = mainEl?.getBoundingClientRect?.();
      if (r) {
        const maxW = Math.max(minW, r.width - s.startPos.x);
        const maxH = Math.max(minH, r.height - s.startPos.y);
        nextW = Math.min(nextW, maxW);
        nextH = Math.min(nextH, maxH);
      }

      setSz({ width: nextW, height: nextH });

      // ✅ after resize, also clamp current position (in case size grew)
      const boundsNow = getWorkspaceBounds();
      setPos((p) => ({
        x: clamp(p.x, boundsNow.minX, boundsNow.maxX),
        y: clamp(p.y, boundsNow.minY, boundsNow.maxY),
      }));
    };

    const onUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const headerH = hideHeader ? 0 : 40;

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
      {/* ✅ HEADER (optional) */}
      {!hideHeader && (
        <div
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
      )}

      {/* ✅ BODY */}
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

      {/* ✅ If header is hidden, allow dragging by grabbing the very top area of the window */}
      {hideHeader && (
        <div
          onMouseDown={startDrag}
          title="Drag"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: 10,
            cursor: "move",
            zIndex: 12,
          }}
        />
      )}

      {/* ✅ RESIZE ZONES */}
      <div
        onMouseDown={startResize("right")}
        title="Resize"
        style={{
          position: "absolute",
          top: headerH,
          right: 0,
          width: 10,
          height: `calc(100% - ${headerH}px)`,
          cursor: "ew-resize",
          zIndex: 10,
        }}
      />

      <div
        onMouseDown={startResize("bottom")}
        title="Resize"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 10,
          cursor: "ns-resize",
          zIndex: 10,
        }}
      />

      <div
        onMouseDown={startResize("corner")}
        title="Resize"
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
