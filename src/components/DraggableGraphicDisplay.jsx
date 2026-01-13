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
  dashboardMode = "edit",
}) {
  if (!tank) return null;

  const isPlay = dashboardMode === "play";
  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tank.id });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const width = tank.w ?? 520;
  const height = tank.h ?? 260;

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = useMemo(() => {
    if (isMultiDragging) return `translate(${dragDelta.x}px, ${dragDelta.y}px)`;
    if (transform) return `translate(${transform.x}px, ${transform.y}px)`;
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

    border: selected ? "2px solid #2563eb" : "2px solid transparent",
    borderRadius: 10,

    cursor: isPlay ? "default" : isDragging ? "grabbing" : "grab",
    userSelect: "none",
    zIndex: tank.zIndex ?? 1,
  };

  const startResize = (dir, e) => {
    if (isPlay) return;
    e.stopPropagation();
    e.preventDefault();

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
        newW = Math.max(300, startRef.current.w + (e.clientX - startRef.current.x));
      }
      if (resizeDir === "bottom") {
        newH = Math.max(180, startRef.current.h + (e.clientY - startRef.current.y));
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
      data-canvas-item="true"   // ✅ critical: canvas selection ignores this
      style={style}
      {...attributes}
      onPointerDown={(e) => {
        if (isPlay) return;

        // ✅ If resizing, don’t trigger drag
        if (isResizing) return;

        // ✅ start dnd drag
        listeners?.onPointerDown?.(e);

        // ✅ prevent canvas selection box
        e.stopPropagation();

        // ✅ select the item
        onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        if (isPlay) return;
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ CHART WRAPPER
          EDIT: block chart pointer events so drag works anywhere + no selection box
          PLAY: allow chart interactions if you add them later */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          overflow: "hidden",
          cursor: "inherit",
          pointerEvents: isPlay ? "auto" : "none",
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
              right: -4,
              top: 0,
              width: 12,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 999999,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          {/* BOTTOM EDGE */}
          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              height: 12,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 999999,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />
        </>
      )}
    </div>
  );
}
