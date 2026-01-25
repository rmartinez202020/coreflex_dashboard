// src/components/DraggableAlarmLog.jsx
import React from "react";

export default function DraggableAlarmLog({
  obj,
  onOpen,
  onLaunch,
  selected,
  onSelect,
}) {
  const w = obj.w || 300;
  const h = obj.h || 100;

  const handleMouseDown = (e) => {
    // ✅ don't select when clicking buttons (so you don't open/drag accidentally)
    e.stopPropagation();
    onSelect?.(obj.id);
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      style={{
        position: "absolute",
        left: obj.x,
        top: obj.y,
        width: w,
        height: h,
        background: "#020617",
        border: selected ? "2px solid #2563eb" : "1px solid #1f2937",
        borderRadius: 10,
        color: "#e5e7eb",
        boxShadow: "0 10px 30px rgba(0,0,0,.5)",
        cursor: "pointer",
        overflow: "hidden",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
    >
      <div style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔔</span>
          <span style={{ fontWeight: 900 }}>Alarms Log (AI)</span>
          <span style={pill}>AI</span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Open */}
          <button
            style={iconBtn}
            onMouseDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            title="Open Alarm Log"
          >
            ⧉
          </button>

          {/* Launch */}
          <button
            style={iconBtn}
            onMouseDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              onLaunch?.();
            }}
            title="Launch Alarm Log"
          >
            ↗
          </button>
        </div>
      </div>

      <div style={body}>
        <div style={hintRow}>
          <span style={dot} />
          <span style={hintText}>Double-click to open alarm viewer</span>
        </div>

        <div style={subText}>
          Tracks active alarms from AI tags (live view when launched)
        </div>
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
  borderBottom: "1px solid #1f2937",
};

const pill = {
  fontSize: 10,
  fontWeight: 900,
  padding: "2px 6px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.18)",
  border: "1px solid rgba(59,130,246,0.35)",
  color: "#bfdbfe",
  letterSpacing: 0.5,
};

const iconBtn = {
  width: 24,
  height: 24,
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 6,
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: "24px",
};

const body = {
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const hintRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const dot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#f59e0b",
  boxShadow: "0 0 0 3px rgba(245,158,11,0.18)",
};

const hintText = {
  fontSize: 12,
  color: "#cbd5e1",
  fontWeight: 700,
};

const subText = {
  fontSize: 11,
  color: "#9ca3af",
  lineHeight: "14px",
};
