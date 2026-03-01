import { useState, useRef, useEffect, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";

// ✅ Convert anything to 0/1 (for status)
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
  if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
  const n = Number(s);
  if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  return null;
}

export default function DraggableTextBox({
  tank,
  onUpdate,
  onSelect,
  onRightClick, // ✅ NEW
  onDoubleClick, // ✅ optional (if parent wants)
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  dashboardMode = "edit", // ✅ optional (defaults edit)
}) {
  if (!tank) return null;

  // ✅ FIX: Runtime modes (Play + Launch + Launched)
  const isRuntime =
    dashboardMode === "play" ||
    dashboardMode === "launch" ||
    dashboardMode === "launched";

  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const [showEditor, setShowEditor] = useState(false);

  // ✅ Base text user edits (this is the "design time" text)
  const [text, setText] = useState(tank.text || "Text...");
  const [fontSize, setFontSize] = useState(tank.fontSize || 16);
  const [color, setColor] = useState(tank.color || "#000000");
  const [borderColor, setBorderColor] = useState(
    tank.borderColor || "#000000"
  );

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null); // "left" | "right" | "top" | "bottom"
  const startRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const width = tank.width || 150;
  const height = tank.height || 50;

  // ✅ IMPORTANT:
  // In runtime, we allow status to drive what is displayed (OFF/ON text).
  // In edit, we display ONLY the configured base text (no live changes).
  //
  // Assumption: your StatusTextBox stores these optional fields in `tank`:
  // - tank.offText, tank.onText
  // - tank.statusValue OR tank.value OR tank.liveValue (1/0 or truthy)
  const displayText = useMemo(() => {
    if (!isRuntime) return text; // ✅ DO NOT CHANGE in Edit

    const raw =
      tank.statusValue ?? tank.value ?? tank.liveValue ?? tank.tagValue ?? null;

    const v01 = to01(raw);

    // if no live value yet, keep base text (or OFF text if you prefer)
    if (v01 === null) return text;

    const onTxt = tank.onText ?? "ON";
    const offTxt = tank.offText ?? "OFF";
    return v01 ? onTxt : offTxt;
  }, [
    isRuntime,
    text,
    tank.statusValue,
    tank.value,
    tank.liveValue,
    tank.tagValue,
    tank.onText,
    tank.offText,
  ]);

  // ✅ Keep local editor state in sync ONLY when tank changes (design-time)
  // (Do NOT force overwrite while editing)
  useEffect(() => {
    if (showEditor) return;
    setText(tank.text || "Text...");
    setFontSize(tank.fontSize || 16);
    setColor(tank.color || "#000000");
    setBorderColor(tank.borderColor || "#000000");
  }, [tank, showEditor]);

  // ✅ If editor is open or resizing or runtime: disable DnD to avoid fighting
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
    disabled: isRuntime || showEditor || isResizing,
  });

  const baseTransform = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : "translate(0px, 0px)";

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px)`
    : baseTransform;

  // ✅ FIX: prefer new z, fallback to legacy zIndex
  const resolvedZ = tank.z ?? tank.zIndex ?? 1;

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
    cursor: isRuntime ? "default" : isResizing ? "default" : "move",
    userSelect: "none",
    zIndex: resolvedZ,
  };

  // Start resize
  const startResize = (dir, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isRuntime) return;

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
        newWidth = Math.max(
          40,
          startRef.current.width + (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "left") {
        newWidth = Math.max(
          40,
          startRef.current.width - (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "bottom") {
        newHeight = Math.max(
          20,
          startRef.current.height + (e.clientY - startRef.current.y)
        );
      }
      if (resizeDir === "top") {
        newHeight = Math.max(
          20,
          startRef.current.height - (e.clientY - startRef.current.y)
        );
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
        {...(!isRuntime ? listeners : {})}
        {...attributes}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          if (isRuntime) return;
          onSelect?.(tank.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isRuntime) return;
          onSelect?.(tank.id);
          setShowEditor(true);
          onDoubleClick?.(tank);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isRuntime) return;

          onSelect?.(tank.id);
          onRightClick?.(e);
        }}
      >
        {/* TEXT */}
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize,
            color,
            overflow: "hidden",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: tank.fontWeight ?? 800,
          }}
        >
          {displayText}
        </div>

        {/* ⭐ 4px invisible resize edges ⭐ */}
        {!isRuntime && (
          <>
            <div
              onMouseDown={(e) => startResize("left", e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                left: -2,
                top: 0,
                width: 4,
                height: "100%",
                cursor: "ew-resize",
                pointerEvents: "auto",
              }}
            />

            <div
              onMouseDown={(e) => startResize("right", e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                right: -2,
                top: 0,
                width: 4,
                height: "100%",
                cursor: "ew-resize",
                pointerEvents: "auto",
              }}
            />

            <div
              onMouseDown={(e) => startResize("top", e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                top: -2,
                left: 0,
                height: 4,
                width: "100%",
                cursor: "ns-resize",
                pointerEvents: "auto",
              }}
            />

            <div
              onMouseDown={(e) => startResize("bottom", e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                bottom: -2,
                left: 0,
                height: 4,
                width: "100%",
                cursor: "ns-resize",
                pointerEvents: "auto",
              }}
            />
          </>
        )}
      </div>

      {/* EDITOR POPUP */}
      {showEditor && !isRuntime && (
        <div
          style={{
            position: "absolute",
            left: (tank.x || 0) + width + 25,
            top: tank.y || 0,
            background: "white",
            border: "1px solid #ccc",
            padding: 18,
            borderRadius: 10,
            zIndex: 999999,
            width: 260,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col gap-4">
            <label className="text-sm font-semibold">Text (design-time)</label>
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
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <label className="text-sm font-semibold">Border Color</label>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => setBorderColor(e.target.value)}
            />

            <div className="flex justify-between mt-2">
              <button
                onClick={applyChanges}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Apply
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}