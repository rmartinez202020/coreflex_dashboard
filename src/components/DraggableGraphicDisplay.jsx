import { useEffect, useRef, useState } from "react";
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

  const width = tank.w ?? tank.width ?? 520;
  const height = tank.h ?? tank.height ?? 260;

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
    : transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : "translate(0px, 0px)";

  // Resize (TextBox style)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

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

      if (resizeDir === "right") {
        newW = Math.max(
          320,
          startRef.current.w + (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "left") {
        newW = Math.max(
          320,
          startRef.current.w - (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "bottom") {
        newH = Math.max(
          200,
          startRef.current.h + (e.clientY - startRef.current.y)
        );
      }
      if (resizeDir === "top") {
        newH = Math.max(
          200,
          startRef.current.h - (e.clientY - startRef.current.y)
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
  }, [isResizing, resizeDir, safeOnUpdate, tank, width, height]);

  const wrapperStyle = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    width,
    height,
    transform: activeTransform,
    transformOrigin: "top left",
    border: selected ? "2px solid #2563eb" : "2px solid transparent",
    borderRadius: 10,
    background: "white",
    overflow: "hidden",
    userSelect: "none",
    zIndex: tank.zIndex ?? 1,
  };

  // ✅ IMPORTANT: Drag is ONLY started from the handle.
  // We MERGE the dnd-kit handler so it definitely fires.
  const handleBarPointerDown = (e) => {
    e.stopPropagation(); // prevents canvas selection box
    onSelect?.(tank.id);

    // fire dnd-kit pointer down to start drag
    listeners?.onPointerDown?.(e);
  };

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      style={wrapperStyle}
      {...attributes}
      onMouseDown={(e) => {
        // select when clicking anywhere on the component
        e.stopPropagation();
        onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ DRAG HANDLE BAR */}
      <div
        // DON'T spread {...listeners} here because we'd override it
        // We call listeners.onPointerDown manually above.
        onPointerDown={handleBarPointerDown}
        style={{
          height: 28,
          width: "100%",
          cursor: isResizing ? "default" : "grab",
          background: selected ? "rgba(37,99,235,0.10)" : "rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          fontSize: 12,
          fontWeight: 800,
        }}
        title="Drag here"
      >
        {tank.title || "Graphic Display"}
      </div>

      {/* GRAPH AREA */}
      <div
        style={{
          width: "100%",
          height: "calc(100% - 28px)",
        }}
        onMouseDown={(e) => {
          // stop canvas selection box when clicking inside the graph
          e.stopPropagation();
          onSelect?.(tank.id);
        }}
      >
        <GraphicDisplay tank={tank} />
      </div>

      {/* ✅ RESIZE EDGES (TextBox style) */}
      {selected && (
        <>
          <div
            onMouseDown={(e) => startResize("left", e)}
            style={{
              position: "absolute",
              left: -2,
              top: 0,
              width: 6,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -2,
              top: 0,
              width: 6,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("top", e)}
            style={{
              position: "absolute",
              top: -2,
              left: 0,
              height: 6,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              height: 6,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 99999,
            }}
          />
        </>
      )}
    </div>
  );
}
