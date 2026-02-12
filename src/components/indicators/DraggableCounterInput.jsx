import React from "react";

export default function DraggableCounterInput({
  // menu defaults
  variant = "menu", // "menu" | "canvas"
  label = "Counter Input (DI)",

  // ✅ CANVAS: we support either passing `tank` OR passing value props
  tank = null, // optional full dropped object (preferred)
  value = 0, // legacy fallback
  count, // optional legacy fallback

  // canvas positioning
  x,
  y,
  id,
  isSelected,
  onSelect,
  onStartDragObject,
  onReset, // optional reset callback
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("shape", "counterInput");
    e.dataTransfer.setData("text/plain", "counterInput");
    e.dataTransfer.effectAllowed = "copy";
  };

  // ===============================
  // ✅ CANVAS VARIANT
  // ===============================
  if (variant === "canvas") {
    // ✅ Prefer tank.properties (this is where your modal saves data)
    const props = tank?.properties || {};

    const title = String(props?.title || label || "Counter").slice(0, 32);

    const digitsRaw = Number(props?.digits ?? 4);
    const digits = Number.isFinite(digitsRaw)
      ? Math.max(1, Math.min(10, digitsRaw))
      : 4;

    // ✅ Read count from (best -> worst):
    // 1) tank.properties.count (modal + your increment logic)
    // 2) tank.value / tank.count (if you sync them)
    // 3) explicit props: count/value (legacy)
    // 4) default 0
    const nRaw =
      props?.count ??
      tank?.value ??
      tank?.count ??
      count ??
      value ??
      0;

    const n = Number(nRaw);
    const safe = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
    const display = String(safe).padStart(digits, "0");

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
          width: 150,
          borderRadius: 6,
          border: isSelected ? "2px solid #2563eb" : "2px solid #9ca3af",
          background: "#f3f4f6",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 8,
          userSelect: "none",
          cursor: "move",
        }}
        title={title}
      >
        {/* TITLE */}
        <div
          style={{
            fontWeight: 800,
            fontSize: 14,
            marginBottom: 6,
            color: "#111827",
            textAlign: "center",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>

        {/* DISPLAY */}
        <div
          style={{
            width: "100%",
            height: 36,
            borderRadius: 4,
            border: "2px solid #8f8f8f",
            background: "#e5e7eb",
            boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: "1px",
            color: "#111",
            marginBottom: 8,
          }}
        >
          {display}
        </div>

        {/* RESET BUTTON */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onReset?.(id);
          }}
          style={{
            width: "100%",
            height: 28,
            borderRadius: 4,
            border: "none",
            background: "#ef4444",
            color: "white",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 2px 0 rgba(0,0,0,0.25)",
          }}
        >
          Reset
        </button>
      </div>
    );
  }

  // ===============================
  // ✅ MENU VARIANT (LEFT SIDEBAR)
  // ===============================
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="select-none cursor-grab active:cursor-grabbing flex items-center w-full"
      title="Drag to canvas"
      style={{ userSelect: "none" }}
    >
      <span className="w-[16px] text-center text-base leading-none">🧮</span>
      <span className="text-sm ml-2">{label}</span>
    </div>
  );
}
