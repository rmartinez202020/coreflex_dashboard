import React from "react";

/**
 * DraggableInterlock
 * - Palette mode only (Sidebar)
 * - Drops a "shape" payload that DashboardCanvas already supports:
 *   tank.shape === "interlock" || "interlockControl"
 */
export default function DraggableInterlock({
  label = "Interlock (DI)",
  onDragStart,
  onClick,
}) {
  // ✅ Default object (this is the key to your “first time” look)
  const payload = {
    shape: "interlock",
    w: 260,
    h: 100,

    // ✅ IMPORTANT: give defaults immediately so it renders like your v54 design
    properties: {
      interlockStyle: "shield",
      interlockTone: "critical",
      colorOn: "#ef4444",
      colorOff: "#0b1220",

      interlockTitle: "INTERLOCK",
      lockedText: "LOCKED",
      unlockedText: "CLEAR",

      // no tag yet (user sets later)
      tag: { deviceId: "", field: "" },
    },
  };

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={(e) => {
        // ✅ match how your other indicators work
        e.dataTransfer.setData("shape", payload.shape);
        e.dataTransfer.setData("text/plain", payload.shape);

        // ✅ also pass the default config so drop handler can apply it
        e.dataTransfer.setData("coreflex_shape_payload", JSON.stringify(payload));

        onDragStart?.(e);
      }}
      className="cursor-grab active:cursor-grabbing text-sm text-gray-300 hover:text-white flex items-center gap-2"
      style={{ userSelect: "none" }}
      title="Drag onto dashboard"
    >
      <span style={{ fontSize: 14 }}>🔒</span>
      <span>{label}</span>
    </div>
  );
}
