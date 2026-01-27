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

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const clampMin = (n, min) => Math.max(min, n);

  // ✅ Convert workspace bounds into MAIN-relative coordinates
  const getWorkspaceBounds = (curSize = sz) => {
    const mainEl = document.querySelector("main");
    const mainRect = mainEl?.getBoundingClientRect?.();

    // hard fallback: viewport-like clamp
    if (!mainRect) {
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, window.innerWidth - curSize.width),
        maxY: Math.max(0, window.innerHeight - curSize.height),
        wsRightInMain: window.innerWidth,
        wsBottomInMain: window.innerHeight,
      };
    }

    // ✅ The ONLY correct target: the canvas/workspace div
    const wsEl = mainEl.querySelector('[data-coreflex-workspace="1"]');
    const wsRect = wsEl?.getBoundingClientRect?.();

    // fallback to main only if workspace missing (but you should add the attribute)
    if (!wsRect) {
      return {
        minX: 0,
        minY: 0,
        maxX: Math.max(0, mainRect.width - curSize.width),
        maxY: Math.max(0, mainRect.height - curSize.height),
        wsRightInMain: mainRect.width,
        wsBottomInMain: mainRect.height,
      };
    }

    const wsLeftInMain = wsRect.left - mainRect.left;
    const wsTopInMain = wsRect.top - mainRect.top;

    const wsRightInMain = wsLeftInMain + wsRect.width;
    const wsBottomInMain = wsTopInMain + wsRect.height;

    const minX = wsLeftInMain;
    const minY = wsTopInMain;

    const maxX = Math.max(minX, wsRightInMain - curSize.width);
    const maxY = Math.max(minY, wsBottomInMain - curSize.height);

    return { minX, minY, maxX, maxY, wsRightInMain, wsBottomInMain };
  };

  const startDrag = (e) => {
    e.stopPropagation();
    e.preventDefault();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
    };

    const onMove = (ev) => {
      const s = dragStartRef.current;
      if (!s) return;

      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;

      // ✅ bounds recalculated each move (always correct)
      const b = getWorkspaceBounds(sz);

      const nextX = clamp(s.startPos.x + dx, b.minX, b.maxX);
      const nextY = clamp(s.startPos.y + dy, b.minY, b.maxY);

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

      // ✅ clamp size so right/bottom edges can't pass workspace bounds
      const b = getWorkspaceBounds({ width: nextW, height: nextH });

      const maxAllowedW = Math.max(minW, b.wsRightInMain - s.startPos.x);
      const maxAllowedH = Math.max(minH, b.wsBottomInMain - s.startPos.y);

      nextW = Math.min(nextW, maxAllowedW);
      nextH = Math.min(nextH, maxAllowedH);

      setSz({ width: nextW, height: nextH });

      // ✅ after resize, also clamp position (in case size change forces it)
      const b2 = getWorkspaceBounds({ width: nextW, height: nextH });
      setPos((p) => ({
        x: clamp(p.x, b2.minX, b2.maxX),
        y: clamp(p.y, b2.minY, b2.maxY),
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

  // ✅ also clamp immediately on render (safety)
  useEffect(() => {
    if (!visible) return;
    const b = getWorkspaceBounds(sz);
    setPos((p) => ({
      x: clamp(p.x, b.minX, b.maxX),
      y: clamp(p.y, b.minY, b.maxY),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sz.width, sz.height]);

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

      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>

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
