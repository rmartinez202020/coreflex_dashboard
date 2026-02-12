// src/components/alarm/AlarmLogResizeEdges.jsx
import React from "react";

// ✅ ALARM LOG RESIZE HANDLES (ONLY ONE VERSION)
// - INSIDE the box, thicker, always on top
// ✅ clamps resize so it cannot exceed canvas bounds
export default function AlarmLogResizeEdges({
  tank,
  onUpdate,
  minW = 520,
  minH = 240,
  canvasId = "coreflex-canvas-root",
}) {
  const dragRef = React.useRef(null);

  const getCanvasWH = () => {
    const el = document.getElementById(canvasId);
    if (!el) return { w: null, h: null };
    return { w: el.clientWidth, h: el.clientHeight };
  };

  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const startW = tank.w ?? tank.width ?? 780;
    const startH = tank.h ?? tank.height ?? 360;

    dragRef.current = { mode, startX, startY, startW, startH };

    const onMove = (ev) => {
      const cur = dragRef.current;
      if (!cur) return;

      const dx = ev.clientX - cur.startX;
      const dy = ev.clientY - cur.startY;

      let nextW = cur.startW;
      let nextH = cur.startH;

      if (cur.mode === "right") nextW = Math.max(minW, cur.startW + dx);
      if (cur.mode === "bottom") nextH = Math.max(minH, cur.startH + dy);
      if (cur.mode === "corner") {
        nextW = Math.max(minW, cur.startW + dx);
        nextH = Math.max(minH, cur.startH + dy);
      }

      // ✅ Clamp to canvas bounds (so resize cannot exceed dashboard area)
      const { w: canvasW, h: canvasH } = getCanvasWH();
      const objX = tank.x ?? 0;
      const objY = tank.y ?? 0;

      if (canvasW != null) {
        const maxW = Math.max(minW, canvasW - objX);
        nextW = Math.min(nextW, maxW);
      }

      if (canvasH != null) {
        const maxH = Math.max(minH, canvasH - objY);
        nextH = Math.min(nextH, maxH);
      }

      onUpdate?.({ ...tank, w: nextW, h: nextH });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const EDGE = 14;
  const CORNER = 18;

  return (
    <>
      {/* RIGHT EDGE */}
      <div
        onPointerDown={startDrag("right")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: EDGE,
          height: "100%",
          cursor: "ew-resize",
          zIndex: 1000000,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />

      {/* BOTTOM EDGE */}
      <div
        onPointerDown={startDrag("bottom")}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: EDGE,
          cursor: "ns-resize",
          zIndex: 1000000,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />

      {/* CORNER */}
      <div
        onPointerDown={startDrag("corner")}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: CORNER,
          height: CORNER,
          cursor: "nwse-resize",
          zIndex: 1000001,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />
    </>
  );
}
