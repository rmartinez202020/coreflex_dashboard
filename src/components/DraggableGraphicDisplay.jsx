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

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
    disabled: isPlay, // in PLAY you can disable dragging if you want
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null); // left | right | top | bottom
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const width = tank.w ?? 520;
  const height = tank.h ?? 260;

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
    : transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : "translate(0px, 0px)";

  const resolvedZ = typeof tank.zIndex === "number" ? tank.zIndex : 1;

  const style = {
    position: "absolute",
    isolation: "isolate",
    left: tank.x,
    top: tank.y,
    width,
    height,
    transform: activeTransform,
    transformOrigin: "top left",
    border: selected ? "2px solid #2563eb" : "2px solid transparent",
    cursor: isResizing ? "default" : "move",
    userSelect: "none",
    zIndex: resolvedZ,
  };

  const startResize = (dir, e) => {
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

      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;

      if (resizeDir === "right") newW = Math.max(320, startRef.current.w + dx);
      if (resizeDir === "left") newW = Math.max(320, startRef.current.w - dx);
      if (resizeDir === "bottom") newH = Math.max(200, startRef.current.h + dy);
      if (resizeDir === "top") newH = Math.max(200, startRef.current.h - dy);

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

  // ✅ While resizing, don't allow DnD listener to start
  const dragListeners = useMemo(() => {
    return isResizing ? {} : listeners || {};
  }, [isResizing, listeners]);

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      style={style}
      {...attributes}
      {...dragListeners}
      onPointerDownCapture={(e) => {
        // ✅ stop canvas selection box BEFORE it starts
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPlay) onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isPlay) onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* IMPORTANT: keep graphic mouse actions inside without triggering canvas selection */}
      <div
        style={{ width: "100%", height: "100%" }}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <GraphicDisplay tank={tank} />
      </div>

      {/* ⭐ 4px invisible resize edges (same as TextBox) ⭐ */}
      {selected && !isPlay && (
        <>
          {/* LEFT */}
          <div
            onMouseDown={(e) => startResize("left", e)}
            style={{
              position: "absolute",
              left: -2,
              top: 0,
              width: 4,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 999999,
            }}
          />
          {/* RIGHT */}
          <div
            onMouseDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -2,
              top: 0,
              width: 4,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 999999,
            }}
          />
          {/* TOP */}
          <div
            onMouseDown={(e) => startResize("top", e)}
            style={{
              position: "absolute",
              top: -2,
              left: 0,
              height: 4,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 999999,
            }}
          />
          {/* BOTTOM */}
          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              height: 4,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 999999,
            }}
          />
        </>
      )}
    </div>
  );
}
