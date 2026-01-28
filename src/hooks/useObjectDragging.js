// src/hooks/useObjectDragging.js
import { useState } from "react";
import useAlignmentGuides from "./useAlignmentGuides";

// ✅ helpers
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const getCanvasRect = () => {
  const el = document.getElementById("coreflex-canvas-root");
  if (!el) return null;
  return {
    w: el.clientWidth || 0,
    h: el.clientHeight || 0,
  };
};

const getObjSize = (obj) => {
  // Prefer explicit sizes
  const w = obj?.w ?? obj?.width;
  const h = obj?.h ?? obj?.height;
  const scale = typeof obj?.scale === "number" ? obj.scale : 1;

  if (typeof w === "number" && typeof h === "number") {
    return { w: Math.max(1, w) * scale, h: Math.max(1, h) * scale };
  }

  // Fallback defaults by shape (safe estimates)
  switch (obj?.shape) {
    case "graphicDisplay":
      return { w: 520, h: 260 };
    case "alarmLog":
      return { w: obj?.w ?? obj?.width ?? 780, h: obj?.h ?? obj?.height ?? 360 };

    case "toggleSwitch":
    case "toggleControl":
      return { w: 180, h: 70 };

    case "interlock":
    case "interlockControl":
      return { w: 190, h: 80 };

    case "pushButtonNO":
    case "pushButtonNC":
      return { w: 110, h: 110 };

    case "displayOutput":
      return { w: 160, h: 60 };

    case "displayBox":
      return { w: 100, h: 40 };

    case "textBox":
      return { w: obj?.width ?? 160, h: obj?.height ?? 60 };

    case "img":
      // If you later store natural size, we can use it here.
      return { w: 220 * scale, h: 140 * scale };

    // Tanks / symbols / other
    default:
      return { w: 180, h: 120 };
  }
};

export default function useObjectDragging({
  selectedIds,
  droppedTanks,
  setDroppedTanks,
}) {
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

  const { guides, checkAlignment, clearGuides } = useAlignmentGuides();

  // ✅ Compute a clamped delta for ONE object
  const clampDeltaForObj = (obj, delta) => {
    const canvas = getCanvasRect();
    if (!canvas) return delta; // if canvas not found, don't block dragging

    const { w: objW, h: objH } = getObjSize(obj);

    const curX = obj?.x ?? 0;
    const curY = obj?.y ?? 0;

    // Allowed range for top-left corner
    const minX = 0;
    const minY = 0;
    const maxX = Math.max(0, canvas.w - objW);
    const maxY = Math.max(0, canvas.h - objH);

    const targetX = curX + (delta?.x || 0);
    const targetY = curY + (delta?.y || 0);

    const clampedX = clamp(targetX, minX, maxX);
    const clampedY = clamp(targetY, minY, maxY);

    return {
      x: clampedX - curX,
      y: clampedY - curY,
    };
  };

  // ✅ Compute a single clamped delta that works for the WHOLE GROUP
  const clampDeltaForGroup = (objs, delta) => {
    const canvas = getCanvasRect();
    if (!canvas) return delta;

    let minAllowedDx = -Infinity;
    let maxAllowedDx = Infinity;
    let minAllowedDy = -Infinity;
    let maxAllowedDy = Infinity;

    for (const obj of objs) {
      const { w: objW, h: objH } = getObjSize(obj);

      const curX = obj?.x ?? 0;
      const curY = obj?.y ?? 0;

      const minX = 0;
      const minY = 0;
      const maxX = Math.max(0, canvas.w - objW);
      const maxY = Math.max(0, canvas.h - objH);

      // For this object, what deltas keep it in bounds?
      const objMinDx = minX - curX;
      const objMaxDx = maxX - curX;
      const objMinDy = minY - curY;
      const objMaxDy = maxY - curY;

      // Intersect constraints
      minAllowedDx = Math.max(minAllowedDx, objMinDx);
      maxAllowedDx = Math.min(maxAllowedDx, objMaxDx);
      minAllowedDy = Math.max(minAllowedDy, objMinDy);
      maxAllowedDy = Math.min(maxAllowedDy, objMaxDy);
    }

    return {
      x: clamp(delta?.x || 0, minAllowedDx, maxAllowedDx),
      y: clamp(delta?.y || 0, minAllowedDy, maxAllowedDy),
    };
  };

  // LIVE DRAG (no snapping) — we only track delta visually, but keep guides
  const handleDragMove = ({ active, delta }) => {
    const activeObj = droppedTanks.find((o) => o.id === active?.id);
    if (activeObj) checkAlignment(activeObj, droppedTanks);

    // ✅ keep UI feedback but clamp the shown delta so preview doesn't drift outside
    if (!activeObj) {
      setDragDelta(delta);
      return;
    }

    const activeId = active?.id;
    const isGroupMove =
      activeId && selectedIds?.length > 1 && selectedIds.includes(activeId);

    if (isGroupMove) {
      const groupObjs = droppedTanks.filter((o) => selectedIds.includes(o.id));
      const clamped = clampDeltaForGroup(groupObjs, delta);
      setDragDelta(clamped);
    } else {
      const clamped = clampDeltaForObj(activeObj, delta);
      setDragDelta(clamped);
    }
  };

  // END DRAG (✅ supports multi-move + ✅ clamps to dashboard bounds)
  const handleDragEnd = ({ active, delta }) => {
    const activeId = active?.id;

    const isGroupMove =
      activeId && selectedIds?.length > 1 && selectedIds.includes(activeId);

    // Find objects to move
    const groupObjs = isGroupMove
      ? droppedTanks.filter((o) => selectedIds.includes(o.id))
      : [];

    const activeObj = droppedTanks.find((o) => o.id === activeId);

    // ✅ compute clamped delta (single or group)
    const clampedDelta = isGroupMove
      ? clampDeltaForGroup(groupObjs, delta)
      : activeObj
        ? clampDeltaForObj(activeObj, delta)
        : { x: delta?.x || 0, y: delta?.y || 0 };

    setDroppedTanks((prev) =>
      prev.map((obj) => {
        const shouldMove = isGroupMove
          ? selectedIds.includes(obj.id)
          : obj.id === activeId;

        if (!shouldMove) return obj;

        return {
          ...obj,
          x: (obj.x || 0) + (clampedDelta.x || 0),
          y: (obj.y || 0) + (clampedDelta.y || 0),
        };
      })
    );

    setDragDelta({ x: 0, y: 0 });
    clearGuides();
  };

  // ✅ if you ever wire onDragCancel, this prevents “stuck floating”
  const handleDragCancel = () => {
    setDragDelta({ x: 0, y: 0 });
    clearGuides();
  };

  return {
    dragDelta,
    setDragDelta,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    guides,
  };
}

