// DraggableControls.jsx
import React from "react";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "Toggle Switch (DO)",
    icon: "🔘",
  },

  // ✅ Keep NO / NC badge INSIDE the design (no "Normally ..." text)
  {
    type: "pushButtonNO",
    label: "Push Button (DO)",
    badge: { text: "NO", bg: "#22c55e" }, // green
  },
  {
    type: "pushButtonNC",
    label: "Push Button (DO)",
    badge: { text: "NC", bg: "#ef4444" }, // red
  },

  // ✅ Display Output (AO) — small display icon (instead of OUT pill)
  {
    type: "displayOutput",
    label: "Display Output (AO)",
    render: "displayOutput",
  },
];

function DisplayOutputIcon() {
  // ✅ Smaller “mini display” icon for tighter sidebar layout
  return (
    <div
      style={{
        width: 30, // was 38
        height: 18, // was 22
        borderRadius: 5, // was 6
        background: "linear-gradient(#f1f5f9, #dbeafe)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow:
          "0 2px 6px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* inner lcd */}
      <div
        style={{
          width: "86%",
          height: "70%",
          borderRadius: 4,
          background: "linear-gradient(#0b1220, #111827)",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontWeight: 900,
            fontSize: 8, // was 10
            letterSpacing: 1.0, // was 1.2
            color: "#93c5fd",
            textShadow: "0 0 6px rgba(147,197,253,0.22)",
            lineHeight: 1,
          }}
        >
          000
        </span>
      </div>

      {/* tiny indicator dot */}
      <div
        style={{
          position: "absolute",
          right: 2, // was 3
          bottom: 2, // was 3
          width: 4, // was 5
          height: 4, // was 5
          borderRadius: 999,
          background: "#22c55e",
          boxShadow: "0 0 7px rgba(34,197,94,0.42)",
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export default function DraggableControls() {
  return (
    // ✅ tighter indent + tighter spacing
    <div className="ml-2 space-y-1.5 mb-3">
      {CONTROLS.map((ctrl) => (
        <div
          key={ctrl.type}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("control", ctrl.type)}
          className="cursor-grab active:cursor-grabbing
                     text-[12px] text-gray-300 hover:text-white
                     flex items-center gap-1.5 leading-tight"
          style={{ userSelect: "none" }}
        >
          {/* ✅ Toggle keeps emoji but smaller */}
          {ctrl.icon && (
            <span style={{ fontSize: 12, lineHeight: 1 }}>{ctrl.icon}</span>
          )}

          {/* ✅ Push Buttons use smaller NO/NC badge */}
          {ctrl.badge && (
            <span
              style={{
                background: ctrl.badge.bg,
                color: "white",
                fontWeight: 800,
                fontSize: 9, // was 11
                padding: "1px 5px", // was 2px 6px
                borderRadius: 999,
                lineHeight: "12px", // was 14px
                minWidth: 22, // was 26
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {ctrl.badge.text}
            </span>
          )}

          {/* ✅ Display Output uses smaller mini display icon */}
          {ctrl.render === "displayOutput" && <DisplayOutputIcon />}

          {/* ✅ tighter text */}
          <span style={{ lineHeight: 1.1 }}>{ctrl.label}</span>
        </div>
      ))}
    </div>
  );
}