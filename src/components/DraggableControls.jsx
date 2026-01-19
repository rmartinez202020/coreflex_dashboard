// DraggableControls.jsx
import React from "react";

const CONTROLS = [
  {
    type: "toggleControl",
    label: "  Toggle Switch (DO)",
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

  {
    type: "interlockControl",
    label: "Interlock (DI)",
    icon: "🔒",
  },

  // ✅ Display Output (AO) — small display icon (instead of OUT pill)
  {
    type: "displayOutput",
    label: "Display Output (AO)",
    render: "displayOutput",
  },
];

function DisplayOutputIcon() {
  // small “mini display” icon to match the Display Output concept
  // (rectangular, LCD-ish, but compact for sidebar)
  return (
    <div
      style={{
        width: 38,
        height: 22,
        borderRadius: 6,
        background: "linear-gradient(#f1f5f9, #dbeafe)",
        border: "1px solid rgba(255,255,255,0.25)",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(15,23,42,0.35)",
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
          width: "84%",
          height: "68%",
          borderRadius: 4,
          background: "linear-gradient(#0b1220, #111827)",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <span
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontWeight: 900,
            fontSize: 10,
            letterSpacing: 1.2,
            color: "#93c5fd",
            textShadow: "0 0 6px rgba(147,197,253,0.25)",
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
          right: 3,
          bottom: 3,
          width: 5,
          height: 5,
          borderRadius: 999,
          background: "#22c55e",
          boxShadow: "0 0 8px rgba(34,197,94,0.45)",
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export default function DraggableControls() {
  return (
    <div className="ml-4 space-y-2 mb-4">
      {CONTROLS.map((ctrl) => (
        <div
          key={ctrl.type}
          draggable
          onDragStart={(e) => e.dataTransfer.setData("control", ctrl.type)}
          className="cursor-grab active:cursor-grabbing
                     text-sm text-gray-300 hover:text-white
                     flex items-center gap-2"
        >
          {/* Toggle + Interlock keep emoji icons */}
          {ctrl.icon && <span>{ctrl.icon}</span>}

          {/* Push Buttons use the NO/NC badge */}
          {ctrl.badge && (
            <span
              style={{
                background: ctrl.badge.bg,
                color: "white",
                fontWeight: 800,
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 999,
                lineHeight: "14px",
                minWidth: 26,
                textAlign: "center",
              }}
            >
              {ctrl.badge.text}
            </span>
          )}

          {/* ✅ Display Output uses a mini display icon */}
          {ctrl.render === "displayOutput" && <DisplayOutputIcon />}

          <span>{ctrl.label}</span>
        </div>
      ))}
    </div>
  );
}
