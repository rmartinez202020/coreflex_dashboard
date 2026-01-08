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

  /* OUTER — movement only (NO visuals here) */
  const outerStyle = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    transform: liveTransform,
    transformOrigin: "top left",
    cursor: selected ? "grab" : "pointer",
    zIndex: tank.zIndex ?? 1,
  };

  /* INNER — tight visual bounds */
  const visualWrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: selected ? "1px solid #2563eb" : "1px solid transparent",
  };

  // ✅ Identify toggle only (so we don’t affect any other object)
  const isToggle =
    tank.shape === "toggleSwitch" || tank.shape === "toggleControl";

  /* SVG FIX — critical */
  const contentStyle = {
    display: "inline-block",
    width: "auto",
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",

    // ✅ ONLY toggle needs clicks; keep the old behavior for everything else
    pointerEvents: isToggle ? "auto" : "none",
  };

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      style={outerStyle}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();

        // ✅ ONLY toggle: flip ON/OFF here (so it works even if child click is swallowed)
        if (isToggle) {
          onUpdate?.({ ...tank, isOn: !(tank.isOn ?? true) });
          return;
        }

        // ✅ everything else: normal selection behavior
        onSelect(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 🔒 SELECTION BOUNDS LIVE HERE */}
      <div style={visualWrapperStyle}>
        <div style={contentStyle}>{children}</div>
      </div>

      {/* Resize handle */}
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
            transform: `scale(${1 / (tank.scale || 1)})`,
            transformOrigin: "bottom right",
          }}
        />
      )}
    </div>
  );
}
