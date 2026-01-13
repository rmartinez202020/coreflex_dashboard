import { useRef, useState } from "react";

export default function useCanvasSelection({
  droppedTanks,
  setSelectedIds,
  setSelectedTank,
  hideContextMenu,
}) {
  const [selectionBox, setSelectionBox] = useState(null);

  // Track whether we actually moved enough to be considered a selection drag
  const movedRef = useRef(false);

  // How far mouse must move before we consider it a selection drag
  const DRAG_THRESHOLD_PX = 4;

  // ===============================
  // Helpers
  // ===============================
  const isClickOnObject = (e) => {
    // If the click started on any draggable object, do not start selection
    // This covers clicks inside SVG/canvas inside the object too.
    return !!e.target.closest(".draggable-item");
  };

  const getMousePos = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Estimate bounding box for selection
  const getObjectBounds = (t) => {
    // Graphic uses w/h, text uses width/height, tanks/images use scale.
    const scale = typeof t.scale === "number" ? t.scale : 1;

    // Prefer explicit width/height (text boxes)
    const width =
      (typeof t.w === "number" ? t.w : null) ??
      (typeof t.width === "number" ? t.width : null) ??
      // reasonable fallback base size for icon-like items
      120 * scale;

    const height =
      (typeof t.h === "number" ? t.h : null) ??
      (typeof t.height === "number" ? t.height : null) ??
      80 * scale;

    return {
      x1: t.x ?? 0,
      y1: t.y ?? 0,
      x2: (t.x ?? 0) + width,
      y2: (t.y ?? 0) + height,
    };
  };

  const rectsIntersect = (a, b) => {
    return !(a.x2 < b.x1 || a.x1 > b.x2 || a.y2 < b.y1 || a.y1 > b.y2);
  };

  // ===============================
  // Mouse Down – start selection
  // ===============================
  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // left click only

    // 🚫 DO NOT START SELECTION IF CLICK IS ON AN OBJECT
    if (isClickOnObject(e)) return;

    const { x: startX, y: startY } = getMousePos(e);

    movedRef.current = false;

    setSelectionBox({
      active: true,
      startX,
      startY,
      x: startX,
      y: startY,
      width: 0,
      height: 0,
    });

    // Clear previous selection
    setSelectedIds([]);
    setSelectedTank(null);
    hideContextMenu?.();
  };

  // ===============================
  // Mouse Move – resize selection
  // ===============================
  const handleCanvasMouseMove = (e) => {
    if (!selectionBox?.active) return;

    const { x, y } = getMousePos(e);

    const dx = x - selectionBox.startX;
    const dy = y - selectionBox.startY;

    // don't show selection box until user actually drags a bit
    if (!movedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
        return;
      }
      movedRef.current = true;
    }

    setSelectionBox((prev) => ({
      ...prev,
      x: Math.min(prev.startX, x),
      y: Math.min(prev.startY, y),
      width: Math.abs(x - prev.startX),
      height: Math.abs(y - prev.startY),
    }));
  };

  // ===============================
  // Mouse Up – finalize selection
  // ===============================
  const handleCanvasMouseUp = () => {
    if (!selectionBox?.active) {
      setSelectionBox(null);
      return;
    }

    // If user didn't drag enough, treat as "click empty canvas" -> just clear selection
    if (!movedRef.current) {
      setSelectionBox(null);
      return;
    }

    const { x, y, width, height } = selectionBox;

    const selRect = {
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
    };

    const ids = droppedTanks
      .filter((t) => {
        const b = getObjectBounds(t);
        return rectsIntersect(selRect, b);
      })
      .map((t) => t.id);

    setSelectedIds(ids);
    setSelectedTank(ids[0] || null);
    setSelectionBox(null);
  };

  return {
    selectionBox,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
  };
}
