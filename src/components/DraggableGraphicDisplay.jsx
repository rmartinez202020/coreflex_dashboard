import { useState, useRef, useEffect, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import GraphicDisplay from "./controls/GraphicDisplay";

export default function DraggableGraphicDisplay({
  tank,

  // ✅ these may exist in canvas mode
  onUpdate,
  onSelect,
  onDoubleClick,
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  dashboardMode = "edit",

  // ✅ palette mode optional props (if your RightPanel passes them)
  label = "Graphic Display (AI)",
  onDragStart,
  onClick,
}) {
  // =========================
  // ✅ PALETTE MODE (Entities panel)
  // =========================
  if (!tank) {
    return (
      <div
        draggable
        onDragStart={(e) => {
          // ✅ MUST match what DashboardCanvas expects
          const shape = "graphicDisplay";
          e.dataTransfer.setData("shape", shape);
          e.dataTransfer.setData("text/plain", shape);

          // preserve any external handler (some panels use it)
          onDragStart?.(e);
        }}
        onClick={onClick}
        className="cursor-grab active:cursor-grabbing"
        style={{ userSelect: "none" }}
      >
        <div className="w-full flex flex-col items-center">
          {/* ✅ same-style small preview tile */}
          <div className="w-[92px] h-[52px] rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
            <svg width="76" height="34" viewBox="0 0 76 34">
              {/* grid */}
              <path d="M8 28H70" stroke="#e5e7eb" strokeWidth="1" />
              <path d="M8 20H70" stroke="#e5e7eb" strokeWidth="1" />
              <path d="M8 12H70" stroke="#e5e7eb" strokeWidth="1" />

              {/* axes */}
              <path d="M8 6V28" stroke="#cbd5e1" strokeWidth="1.2" />
              <path d="M8 28H70" stroke="#cbd5e1" strokeWidth="1.2" />

              {/* line */}
              <path
                d="M10 24 L20 17 L30 20 L40 12 L50 14 L60 8 L68 10"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* dots */}
              <circle cx="10" cy="24" r="2" fill="#2563eb" />
              <circle cx="20" cy="17" r="2" fill="#2563eb" />
              <circle cx="30" cy="20" r="2" fill="#2563eb" />
              <circle cx="40" cy="12" r="2" fill="#2563eb" />
              <circle cx="50" cy="14" r="2" fill="#2563eb" />
              <circle cx="60" cy="8" r="2" fill="#2563eb" />
              <circle cx="68" cy="10" r="2" fill="#2563eb" />
            </svg>
          </div>

          <div className="mt-2 text-xs text-gray-700 text-center">
            {label}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // ✅ CANVAS MODE (your existing working code)
  // =========================
  const isPlay = dashboardMode === "play";
  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: tank.id,
      disabled: isPlay, // ✅ no dragging in play
    });

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
        newW = Math.max(300, startRef.current.w + (e.clientX - startRef.current.x));
      }
      if (resizeDir === "left") {
        newW = Math.max(300, startRef.current.w - (e.clientX - startRef.current.x));
      }
      if (resizeDir === "bottom") {
        newH = Math.max(180, startRef.current.h + (e.clientY - startRef.current.y));
      }
      if (resizeDir === "top") {
        newH = Math.max(180, startRef.current.h - (e.clientY - startRef.current.y));
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

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      style={style}
      {...attributes}
      onPointerDown={(e) => {
        if (isPlay) return;

        e.stopPropagation();

        onSelect?.(tank.id);

        listeners?.onPointerDown?.(e);
      }}
      onDoubleClick={(e) => {
        if (isPlay) return;
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
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

      {selected && !isPlay && (
        <>
          <div
            onMouseDown={(e) => startResize("left", e)}
            style={{
              position: "absolute",
              left: -4,
              top: 0,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -4,
              top: 0,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("top", e)}
            style={{
              position: "absolute",
              top: -4,
              left: 0,
              height: 8,
              width: "100%",
              cursor: "ns-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />
          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              height: 8,
              width: "100%",
              cursor: "ns-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />
        </>
      )}
    </div>
  );
}
