// src/components/DashboardShapesPanel.jsx
import React from "react";

const ICON_STROKE_WIDTH = 1.8;

const SHAPES = [
  {
    type: "paintArrow",
    label: "Arrow",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <path
          d="M8 21H28"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d="M22 14L31 21L22 28"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    type: "paintCircle",
    label: "Circle",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <circle
          cx="21"
          cy="21"
          r="11"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      </svg>
    ),
  },
  {
    type: "paintSquare",
    label: "Square",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <rect
          x="10"
          y="10"
          width="22"
          height="22"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      </svg>
    ),
  },
  {
    type: "paintRectangle",
    label: "Rectangle",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <rect
          x="7"
          y="12"
          width="28"
          height="18"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      </svg>
    ),
  },
  {
    type: "paintOval",
    label: "Oval",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <ellipse
          cx="21"
          cy="21"
          rx="14"
          ry="9"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
        />
      </svg>
    ),
  },
  {
    type: "paintTriangle",
    label: "Triangle",
    icon: (
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none">
        <path
          d="M21 9L33 31H9L21 9Z"
          stroke="#0f172a"
          strokeWidth={ICON_STROKE_WIDTH}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function ShapeCard({ item }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("shape", item.type);
    e.dataTransfer.setData("text/plain", item.type);
    e.dataTransfer.setData("strokeWidth", "1.6");
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={`Drag ${item.label}`}
      style={{
        width: 68,
        height: 68,
        borderRadius: 10,
        border: "1px solid #dbe4ee",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: "grab",
        userSelect: "none",
        transition: "all 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid #60a5fa";
        e.currentTarget.style.boxShadow = "0 3px 10px rgba(59,130,246,0.16)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid #dbe4ee";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0px)";
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.icon}
      </div>

      <div
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          color: "#334155",
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {item.label}
      </div>
    </div>
  );
}

export default function DashboardShapesPanel({ visible = true, title = "Shapes" }) {
  if (!visible) return null;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        border: "1px solid #dbe4ee",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid #e5e7eb",
          background:
            "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: 0.2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          Drag
        </div>
      </div>

      <div
        style={{
          padding: "10px 8px",
          display: "grid",
          gridTemplateColumns: "repeat(2, 68px)",
          gap: 8,
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        {SHAPES.map((item) => (
          <ShapeCard key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}