import { useState } from "react";

export default function useCanvasSelection({
  droppedTanks,
  setSelectedIds,
  setSelectedTank,
  hideContextMenu,
}) {
  const [selectionBox, setSelectionBox] = useState(null);

  // ===============================
  // Mouse Down – start selection
  // ===============================
  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // left click only

    // ❌ DO NOT START SELECTION if clicking on ANY draggable item
    if (e.target.closest("[data-canvas-item='true']")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionBox({
      active: true,
      startX,
      startY,
      x: startX,
      y: startY,
      width: 0,
      height: 0,
    });

    setSelectedIds([]);
    setSelectedTank(null);
    hideContextMenu();
  };

  // ===============================
  // Mouse Move – resize selection
  // ===============================
  const handleCanvasMouseMove = (e) => {
    if (!selectionBox?.active) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    const { x, y, width, height } = selectionBox;
    const x2 = x + width;
    const y2 = y + height;

    const ids = droppedTanks
      .filter(
        (t) =>
          t.x >= x &&
          t.y >= y &&
          t.x <= x2 &&
          t.y <= y2
      )
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
