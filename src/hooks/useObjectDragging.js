// src/hooks/useObjectDragging.js
import { useState } from "react";
import useAlignmentGuides from "./useAlignmentGuides";

export default function useObjectDragging({
  selectedIds,
  droppedTanks,
  setDroppedTanks,
}) {
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

  const { guides, checkAlignment, clearGuides } = useAlignmentGuides();

  // LIVE DRAG (no snapping)
  const handleDragMove = ({ active, delta }) => {
    const activeObj = droppedTanks.find((o) => o.id === active?.id);
    if (activeObj) checkAlignment(activeObj, droppedTanks);

    setDragDelta(delta);
  };

  // END DRAG (✅ supports multi-move)
  const handleDragEnd = ({ active, delta }) => {
    const activeId = active?.id;

    // ✅ if dragging one of the selected items, move ALL selected
    const isGroupMove =
      activeId && selectedIds?.length > 1 && selectedIds.includes(activeId);

    setDroppedTanks((prev) =>
      prev.map((obj) => {
        const shouldMove = isGroupMove
          ? selectedIds.includes(obj.id)
          : obj.id === activeId;

        if (!shouldMove) return obj;

        return {
          ...obj,
          x: (obj.x || 0) + (delta?.x || 0),
          y: (obj.y || 0) + (delta?.y || 0),
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
    handleDragCancel, // safe to export (optional usage)
    guides,
  };
}
