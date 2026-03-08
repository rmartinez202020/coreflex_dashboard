import React from "react";
import DraggablePushButtonNO from "./DraggablePushButtonNO";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "Toggle Switch (DO)",
    icon: "🔘",
  },

  // ✅ Keep only NC here because NO is now extracted
  {
    type: "pushButtonNC",
    label: "Push Button (DO)",
    badge: { text: "NC", bg: "#ef4444" },
  },

  {
    type: "displayOutput",
    label: "Display Output (AO)",
    render: "displayOutput",
  },
];

function DisplayOutputIcon() {
  return (
    <div
      style={{
        width: 30,
        height: 18,
        borderRadius: 5,
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
            fontSize: 8,
            letterSpacing: 1.0,
            color: "#93c5fd",
            textShadow: "0 0 6px rgba(147,197,253,0.22)",
            lineHeight: 1,
          }}
        >
          000
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          right: 2,
          bottom: 2,
          width: 4,
          height: 4,
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
    <div className="ml-2 space-y-1.5 mb-3">
      {/* ✅ extracted NO */}
      <DraggablePushButtonNO />

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
          {ctrl.icon && (
            <span style={{ fontSize: 12, lineHeight: 1 }}>{ctrl.icon}</span>
          )}

          {ctrl.badge && (
            <span
              style={{
                background: ctrl.badge.bg,
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
              {ctrl.badge.text}
            </span>
          )}

          {ctrl.render === "displayOutput" && <DisplayOutputIcon />}

          <span style={{ lineHeight: 1.1 }}>{ctrl.label}</span>
        </div>
      ))}
    </div>
  );
}