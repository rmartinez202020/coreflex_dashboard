import { useState, useRef, useEffect, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import GraphicDisplay from "./controls/GraphicDisplay";

export default function DraggableGraphicDisplay({
  tank,
  onUpdate,
  onSelect,
  onDoubleClick,
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  dashboardMode = "edit", // ✅ allow play/edit behavior
}) {
  if (!tank) return null;

  const isPlay = dashboardMode === "play";
  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: tank.id,
    });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const width = tank.w ?? 520;
  const height = tank.h ?? 260;

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = useMemo(() => {
    if (isMultiDragging) {
      return `translate(${dragDelta.x}px, ${dragDelta.y}px)`;
    }
    if (transform) {
      return `translate(${transform.x}px, ${transform.y}px)`;
    }
    return "translate(0px, 0px)";
  }, [isMultiDragging, dragDelta.x, dragDelta.y, transform]);

  const style = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    width,
    height,
    transform: activeTransform,
    transformOrigin: "top left",

    // ✅ selection border
    border: selected ? "2px solid #2563eb" : "2px solid transparent",
    borderRadius: 10,

    // ✅ Make the "hand" appear ANYWHERE over the graphic in EDIT
    cursor: isPlay ? "default" : isDragging ? "grabbing" : "grab",

    userSelect: "none",
    zIndex: tank.zIndex ?? 1,
  };

  const startResize = (dir, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlay) return;

    setIsResizing(true);
    setResizeDir(dir);

    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: width,
      h: height,
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isResizing || !resizeDir) return;

      let newW = startRef.current.w;
      let newH = startRef.current.h;

      if (resizeDir === "right") {
        newW = Math.max(
          300,
          startRef.current.w + (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "bottom") {
        newH = Math.max(
          180,
          startRef.current.h + (e.clientY - startRef.current.y)
        );
      }

      safeOnUpdate({ ...tank, w: newW, h: newH });
    };

    const stopMove = () => {
      setIsResizing(false);
      setResizeDir(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopMove);
    };
  }, [isResizing, resizeDir, safeOnUpdate, tank]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={(e) => {
        if (isPlay) return;

        // ✅ 1) start drag (DnD-kit)
        listeners?.onPointerDown?.(e);

        // ✅ 2) prevent canvas selection box
        e.stopPropagation();

        // ✅ 3) select the item
        onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        if (isPlay) return;
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ In EDIT: don't let the chart steal the cursor/events (so grab hand shows everywhere) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          overflow: "hidden",
          cursor: "inherit",
          pointerEvents: isPlay ? "auto" : "none", // ✅ KEY LINE
        }}
      >
        <GraphicDisplay tank={tank} />
      </div>

      {/* ✅ Resize edges (EDIT only) */}
      {selected && !isPlay && (
        <>
          {/* RIGHT EDGE */}
          <div
            onMouseDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -3,
              top: 0,
              width: 10,
              height: "100%",
              cursor: "ew-resize",
              pointerEvents: "auto",
            }}
          />

          {/* BOTTOM EDGE */}
          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -3,
              left: 0,
              height: 10,
              width: "100%",
              cursor: "ns-resize",
              pointerEvents: "auto",
            }}
          />
        </>
      )}
    </div>
  );
}
