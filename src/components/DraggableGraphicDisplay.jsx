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
  const [resizeDir, setResizeDir] = useState(null); // "left" | "right" | "top" | "bottom"
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

    // ✅ IMPORTANT: allow resize handles that sit slightly outside
    overflow: "visible",
  };

  const startResize = (dir, e) => {
    // ✅ prevent canvas selection box + prevent DnD drag
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
      if (resizeDir === "bottom") newH = Math.max(180, startRef.current.h + dy);

      // Optional: enable left/top resize later (needs changing x/y too)
      // For now we keep it simple like your screenshot edges.
      if (resizeDir === "left") newW = Math.max(300, startRef.current.w - dx);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      // ✅ DO NOT spread {...listeners} here because we need to stopPropagation cleanly
      onPointerDown={(e) => {
        // If we are resizing, do nothing
        if (isResizing) return;

        // 1) prevent canvas selection box
        e.stopPropagation();

        // 2) select item
        onSelect?.(tank.id);

        // 3) start dnd drag
        listeners?.onPointerDown?.(e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ✅ Important: block internal clicks from starting selection-box */}
      <div
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GraphicDisplay tank={tank} />
      </div>

      {/* ✅ 4px invisible resize edges (like TextBox) */}
      {selected && (
        <>
          {/* LEFT */}
          <div
            onPointerDown={(e) => startResize("left", e)}
            style={{
              position: "absolute",
              left: -2,
              top: 0,
              width: 4,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 999999,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          {/* RIGHT */}
          <div
            onPointerDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -2,
              top: 0,
              width: 4,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 999999,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          {/* TOP */}
          <div
            onPointerDown={(e) => startResize("top", e)}
            style={{
              position: "absolute",
              top: -2,
              left: 0,
              height: 4,
              width: "100%",
              cursor: "ns-resize",
              zIndex: 999999,
              pointerEvents: "auto",
              background: "transparent",
            }}
          />

          {/* BOTTOM */}
          <div
            onPointerDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              height: 4,
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
