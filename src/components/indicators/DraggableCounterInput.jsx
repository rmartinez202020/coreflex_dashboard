import React from "react";

export default function DraggableCounterInput({
  // menu defaults
  variant = "menu", // "menu" | "canvas"
  label = "Counter Input (DI)",

  // canvas defaults
  value = 0,
  decimals = 3,

  // canvas positioning (only used if you render it absolutely)
  x,
  y,
  id,
  isSelected,
  onSelect,
  onStartDragObject,
}) {
  const handleDragStart = (e) => {
    // ✅ MUST use "shape" because useDropHandler reads e.dataTransfer.getData("shape")
    e.dataTransfer.setData("shape", "counterInput");
    e.dataTransfer.setData("text/plain", "counterInput");
    e.dataTransfer.effectAllowed = "copy";
  };

  // ---------- CANVAS VARIANT (the 0.000 box) ----------
  if (variant === "canvas") {
    const safeDecimals = Number.isFinite(Number(decimals))
      ? Math.max(0, Math.min(6, Number(decimals)))
      : 3;

    const display = Number.isFinite(Number(value))
      ? Number(value).toFixed(safeDecimals)
      : Number(0).toFixed(safeDecimals);

    return (
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect?.(id);
          onStartDragObject?.(e, id);
        }}
        style={{
          position: x !== undefined && y !== undefined ? "absolute" : "relative",
          left: x,
          top: y,
          width: 95,
          height: 34,
          borderRadius: 4,
          border: isSelected ? "2px solid #2563eb" : "2px solid #8f8f8f",
          background: "#f2f2f2",
          boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontWeight: 900,
          fontSize: 16,
          letterSpacing: "0.5px",
          color: "#111",
          userSelect: "none",
          cursor: "move",
        }}
        title={label}
      >
        {display}
      </div>
    );
  }

  // ---------- MENU VARIANT (left sidebar item) ----------
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      {/* icon aligned left */}
      <span className="w-[16px] text-center text-base leading-none">🧮</span>

      {/* spacing from icon */}
      <span className="text-sm ml-2">{label}</span>
    </div>
  );
}
