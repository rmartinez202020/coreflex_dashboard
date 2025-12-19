import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useCallback } from "react";

export default function DraggableDroppedTank({
  tank,
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  onSelect,
  onDoubleClick,
  children,
  onUpdate,
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
  });

  const [resizing, setResizing] = useState(false);

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);
  };

  const stopResize = useCallback(() => setResizing(false), []);

  const handleResize = useCallback(
    (e) => {
      if (!resizing) return;

      const newScale = Math.max(0.15, (tank.scale || 1) + e.movementX * 0.01);
      onUpdate({ ...tank, scale: newScale });
    },
    [resizing, tank, onUpdate]
  );

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", stopResize);
    } else {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    }

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [resizing, handleResize, stopResize]);

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const liveTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(${tank.scale || 1})`
    : `translate(${transform?.x || 0}px, ${transform?.y || 0}px) scale(${tank.scale || 1})`;

  const style = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    transform: liveTransform,
    transformOrigin: "top left",

    width: "fit-content",
    height: "fit-content",
    cursor: selected ? "grab" : "pointer",
    zIndex: tank.zIndex ?? 1,
    outline: selected ? "2px solid #2563eb" : "none",
    borderRadius: 8,
    background: "transparent",
    padding: 4,
    boxSizing: "border-box",
  };

  return (
    <div
      className="draggable-item"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Render IMAGE or TEXT passed in via children */}
      {children}

      {/* Resize Handle */}
      {selected && (
  <div
    onMouseDown={startResize}
    style={{
      position: "absolute",
      width: 10,
      height: 10,
      background: "#2563eb",
      right: -6,
      bottom: -6,
      borderRadius: 3,
      cursor: "nwse-resize",
      border: "1px solid white",
      zIndex: 99999,

      // 🔥 CRITICAL FIX
      transform: `scale(${1 / (tank.scale || 1)})`,
      transformOrigin: "bottom right",
    }}
  />
)}

    </div>
  );
}
