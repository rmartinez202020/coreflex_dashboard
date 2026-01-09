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
  dashboardMode = "edit",
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
  });

  const isPlay = dashboardMode === "play";
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

  const outerStyle = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    transform: liveTransform,
    transformOrigin: "top left",
    cursor: selected ? "grab" : "pointer",
    zIndex: tank.zIndex ?? 1,
  };

  const visualWrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: selected ? "1px solid #2563eb" : "1px solid transparent",
  };

  const isToggle =
    tank.shape === "toggleSwitch" || tank.shape === "toggleControl";

  const isPushButton =
    tank.shape === "pushButtonNO" || tank.shape === "pushButtonNC";

  const contentStyle = {
    display: "inline-block",
    pointerEvents: isPlay && (isToggle || isPushButton) ? "auto" : "none",
  };

  /* =============================
     MOMENTARY PUSH BUTTON LOGIC
     ============================= */

  const handleMouseDown = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    // Toggle (latching)
    if (isToggle) {
      onUpdate({ ...tank, isOn: !(tank.isOn ?? true) });
      return;
    }

    // NO = pressed while down
    if (tank.shape === "pushButtonNO") {
      onUpdate({ ...tank, pressed: true });
      return;
    }

    // NC = released while down
    if (tank.shape === "pushButtonNC") {
      onUpdate({ ...tank, pressed: false });
      return;
    }
  };

  const handleMouseUp = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    // NO returns to released
    if (tank.shape === "pushButtonNO") {
      onUpdate({ ...tank, pressed: false });
      return;
    }

    // NC returns to pressed
    if (tank.shape === "pushButtonNC") {
      onUpdate({ ...tank, pressed: true });
      return;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={outerStyle}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isPlay) {
          e.stopPropagation();
          onSelect(tank.id);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isPlay) onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={visualWrapperStyle}>
        <div
          style={contentStyle}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // safety: release if cursor leaves
        >
          {children}
        </div>
      </div>

      {/* Resize handle — EDIT only */}
      {selected && !isPlay && (
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
