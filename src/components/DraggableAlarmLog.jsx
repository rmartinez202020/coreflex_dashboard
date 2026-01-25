// src/components/DraggableAlarmLog.jsx
import React from "react";

export default function DraggableAlarmLog({
  obj,
  onOpen,
  onLaunch,
  selected,
  onSelect,
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: obj.x,
        top: obj.y,
        width: obj.w || 260,
        height: obj.h || 90,
        background: "#020617",
        border: selected ? "2px solid #2563eb" : "1px solid #1f2937",
        borderRadius: 10,
        color: "#e5e7eb",
        boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect?.(obj.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
    >
      <div style={header}>
        <span>🔔 Alarms Log (AI)</span>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={iconBtn}
            type="button"
            title="Open"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
          >
            ⧉
          </button>

          <button
            style={iconBtn}
            type="button"
            title="Launch"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onLaunch?.();
            }}
          >
            ↗
          </button>
        </div>
      </div>

      <div style={{ padding: 10, fontSize: 12, color: "#9ca3af" }}>
        Double-click to open alarm viewer
      </div>
    </div>
  );
}

const header = {
  height: 34,
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 10px",
  fontWeight: 900,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
};

const iconBtn = {
  width: 22,
  height: 22,
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e5e7eb",
  cursor: "pointer",
  lineHeight: "20px",
};
