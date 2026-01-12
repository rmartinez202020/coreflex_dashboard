import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import GraphicDisplay from "./controls/GraphicDisplay";

export default function DraggableGraphicDisplay({
  tank,
  onUpdate,
  onSelect,
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
  const [resizeDir, setResizeDir] = useState(null);
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
    cursor: isResizing ? "default" : "move",
    userSelect: "none",
    zIndex: tank.zIndex ?? 1,
  };

  const startResize = (dir, e) => {
    e.stopPropagation();
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
      {...listeners}
      {...attributes}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(tank.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        tank.onOpenSettings?.(tank);
      }}
    >
      <GraphicDisplay tank={tank} />

      {/* RIGHT EDGE */}
      {selected && (
        <div
          onMouseDown={(e) => startResize("right", e)}
          style={{
            position: "absolute",
            right: -3,
            top: 0,
            width: 6,
            height: "100%",
            cursor: "ew-resize",
          }}
        />
      )}

      {/* BOTTOM EDGE */}
      {selected && (
        <div
          onMouseDown={(e) => startResize("bottom", e)}
          style={{
            position: "absolute",
            bottom: -3,
            left: 0,
            height: 6,
            width: "100%",
            cursor: "ns-resize",
          }}
        />
      )}
    </div>
  );
}
