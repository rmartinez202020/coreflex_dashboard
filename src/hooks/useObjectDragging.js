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
    const activeObj = droppedTanks.find((o) => o.id === active.id);
    if (activeObj) checkAlignment(activeObj, droppedTanks);

    setDragDelta(delta);
  };

  // END DRAG (no snapping, just normal movement)
  const handleDragEnd = ({ active, delta }) => {
    setDroppedTanks((prev) =>
      prev.map((obj) =>
        obj.id === active.id
          ? {
              ...obj,
              x: obj.x + delta.x,
              y: obj.y + delta.y,
            }
          : obj
      )
    );

    setDragDelta({ x: 0, y: 0 });
    clearGuides();
  };

  return { dragDelta, setDragDelta, handleDragMove, handleDragEnd, guides };
}
