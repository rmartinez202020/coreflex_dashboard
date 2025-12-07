import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableTextBox({
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

  const [showEditor, setShowEditor] = useState(false);
  const [text, setText] = useState(tank.text || "Text...");
  const [fontSize, setFontSize] = useState(tank.fontSize || 16);
  const [color, setColor] = useState(tank.color || "#000000");
  const [borderColor, setBorderColor] = useState(tank.borderColor || "#000000");

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null); // "left" | "right" | "top" | "bottom"
  const startRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const width = tank.width || 150;
  const height = tank.height || 50;

  const baseTransform = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : "translate(0px, 0px)";

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
    : baseTransform;

  // Keep correct zIndex
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
    border: selected ? "2px solid #2563eb" : `2px solid ${borderColor}`,
    background: "white",
    padding: 4,
    cursor: isResizing ? "default" : "move",
    userSelect: "none",
    zIndex: resolvedZ,
  };

  // Start resize
  const startResize = (dir, e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDir(dir);

    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    };
  };

  // Resize logic
  useEffect(() => {
    const handleMove = (e) => {
      if (!isResizing || !resizeDir) return;

      let newWidth = startRef.current.width;
      let newHeight = startRef.current.height;

      if (resizeDir === "right") {
        newWidth = Math.max(40, startRef.current.width + (e.clientX - startRef.current.x));
      }
      if (resizeDir === "left") {
        newWidth = Math.max(40, startRef.current.width - (e.clientX - startRef.current.x));
      }
      if (resizeDir === "bottom") {
        newHeight = Math.max(20, startRef.current.height + (e.clientY - startRef.current.y));
      }
      if (resizeDir === "top") {
        newHeight = Math.max(20, startRef.current.height - (e.clientY - startRef.current.y));
      }

      safeOnUpdate({
        ...tank,
        width: newWidth,
        height: newHeight,
      });
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

  const applyChanges = () => {
    safeOnUpdate({
      ...tank,
      text,
      fontSize,
      color,
      borderColor,
      width,
      height,
    });
    setShowEditor(false);
  };

  return (
    <>
      <div
        className="draggable-item"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(tank.id);
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={() => setShowEditor(true)}
      >
        {/* TEXT */}
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize,
            color,
            overflow: "hidden",
          }}
        >
          {text}
        </div>

        {/* ⭐ 4px invisible resize edges ⭐ */}
        <div
          onMouseDown={(e) => startResize("left", e)}
          style={{
            position: "absolute",
            left: -2,
            top: 0,
            width: 4,
            height: "100%",
            cursor: "ew-resize",
          }}
        ></div>

        <div
          onMouseDown={(e) => startResize("right", e)}
          style={{
            position: "absolute",
            right: -2,
            top: 0,
            width: 4,
            height: "100%",
            cursor: "ew-resize",
          }}
        ></div>

        <div
          onMouseDown={(e) => startResize("top", e)}
          style={{
            position: "absolute",
            top: -2,
            left: 0,
            height: 4,
            width: "100%",
            cursor: "ns-resize",
          }}
        ></div>

        <div
          onMouseDown={(e) => startResize("bottom", e)}
          style={{
            position: "absolute",
            bottom: -2,
            left: 0,
            height: 4,
            width: "100%",
            cursor: "ns-resize",
          }}
        ></div>
      </div>

      {/* EDITOR POPUP */}
      {showEditor && (
        <div
          style={{
            position: "absolute",
            left: (tank.x || 0) + width + 25,
            top: tank.y || 0,
            background: "white",
            border: "1px solid #ccc",
            padding: 18,
            borderRadius: 10,
            zIndex: 99999,
            width: 260,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold">Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border p-2 rounded w-full"
              rows={3}
            />

            <label className="text-sm font-semibold">Font Size</label>
            <input
              type="number"
              min="8"
              max="60"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="border p-1 rounded w-[120px]"
            />

            <label className="text-sm font-semibold">Text Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

            <label className="text-sm font-semibold">Border Color</label>
            <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />

            <div className="flex justify-between mt-2">
              <button onClick={applyChanges} className="bg-blue-500 text-white px-4 py-2 rounded">
                Apply
              </button>
              <button onClick={() => setShowEditor(false)} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
