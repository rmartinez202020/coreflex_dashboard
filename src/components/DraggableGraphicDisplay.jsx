import { useState, useRef, useEffect } from "react";
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
}) {
  if (!tank) return null;

  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
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
    cursor: isResizing ? "default" : "move",
    userSelect: "none",
    zIndex: tank.zIndex ?? 1,
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

      if (resizeDir === "right") newW = Math.max(300, startRef.current.w + dx);
      if (resizeDir === "left") newW = Math.max(300, startRef.current.w - dx);

      if (resizeDir === "bottom")
        newH = Math.max(180, startRef.current.h + dy);
      if (resizeDir === "top") newH = Math.max(180, startRef.current.h - dy);

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

  // ✅ Bigger hit area like TextBox (but easier)
  const EDGE = 10;

  // ✅ Handles must be ABOVE the chart to receive hover/cursor
  const handleBase = {
    position: "absolute",
    zIndex: 9999,
    pointerEvents: "auto",
    background: "transparent", // keep invisible
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!isResizing ? listeners : {})}
      onMouseDownCapture={(e) => {
        const isResizeHandle = e.target.closest("[data-resize-handle='true']");
        if (!isResizeHandle) e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ In EDIT + selected, disable pointer events inside chart so edges are easy to hit */}
      <div style={{ width: "100%", height: "100%", pointerEvents: selected ? "none" : "auto" }}>
        <GraphicDisplay tank={tank} />
      </div>

      {/* ⭐ 4-edge resize (BIG hit areas) */}
      {selected && (
        <>
          {/* LEFT */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => startResize("left", e)}
            style={{
              ...handleBase,
              left: -EDGE / 2,
              top: 0,
              width: EDGE,
              height: "100%",
              cursor: "ew-resize",
            }}
          />

          {/* RIGHT */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => startResize("right", e)}
            style={{
              ...handleBase,
              right: -EDGE / 2,
              top: 0,
              width: EDGE,
              height: "100%",
              cursor: "ew-resize",
            }}
          />

          {/* TOP */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => startResize("top", e)}
            style={{
              ...handleBase,
              top: -EDGE / 2,
              left: 0,
              height: EDGE,
              width: "100%",
              cursor: "ns-resize",
            }}
          />

          {/* BOTTOM */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              ...handleBase,
              bottom: -EDGE / 2,
              left: 0,
              height: EDGE,
              width: "100%",
              cursor: "ns-resize",
            }}
          />
        </>
      )}
    </div>
  );
}
