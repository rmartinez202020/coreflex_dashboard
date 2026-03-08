import React from "react";

export default function DraggablePushButtonNO() {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("control", "pushButtonNO")}
      className="cursor-grab active:cursor-grabbing
                 text-[12px] text-gray-300 hover:text-white
                 flex items-center gap-1.5 leading-tight"
      style={{ userSelect: "none" }}
    >
      <span
        style={{
          background: "#22c55e",
          color: "white",
          fontWeight: 800,
          fontSize: 9,
          padding: "1px 5px",
          borderRadius: 999,
          lineHeight: "12px",
          minWidth: 22,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        NO
      </span>

      <span style={{ lineHeight: 1.1 }}>Push Button (DO)</span>
    </div>
  );
}