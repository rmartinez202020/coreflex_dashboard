// src/components/DashboardShapesPanel.jsx
import React from "react";

const SHAPES = [
  {
    type: "paintArrow",
    label: "Arrow",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <path
          d="M8 21H28"
          stroke="#0f172a"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M22 14L31 21L22 28"
          stroke="#0f172a"
          strokeWidth="2.8"
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
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <circle
          cx="21"
          cy="21"
          r="11"
          stroke="#0f172a"
          strokeWidth="2.8"
        />
      </svg>
    ),
  },

  {
    type: "paintSquare",
    label: "Square",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <rect
          x="10"
          y="10"
          width="22"
          height="22"
          stroke="#0f172a"
          strokeWidth="2.8"
        />
      </svg>
    ),
  },

  {
    type: "paintRectangle",
    label: "Rectangle",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <rect
          x="7"
          y="12"
          width="28"
          height="18"
          stroke="#0f172a"
          strokeWidth="2.8"
        />
      </svg>
    ),
  },

  {
    type: "paintOval",
    label: "Oval",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <ellipse
          cx="21"
          cy="21"
          rx="14"
          ry="9"
          stroke="#0f172a"
          strokeWidth="2.8"
        />
      </svg>
    ),
  },

  {
    type: "paintTriangle",
    label: "Triangle",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <path
          d="M21 9L33 31H9L21 9Z"
          stroke="#0f172a"
          strokeWidth="2.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },

  {
    type: "paintComment",
    label: "Comment",
    icon: (
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
        <path
          d="M9 11H33V25H19L13 31V25H9V11Z"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function ShapeCard({ item }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData("shape", item.type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={`Drag ${item.label}`}
      style={{
        width: 88,
        height: 88,
        borderRadius: 14,
        border: "1px solid #dbe4ee",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: "grab",
        userSelect: "none",
        transition: "all 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid #60a5fa";
        e.currentTarget.style.boxShadow =
          "0 4px 14px rgba(59,130,246,0.18)";
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
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.icon}
      </div>

      <div
        style={{
          fontSize: 11,
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

export default function DashboardShapesPanel({
  visible = true,
  title = "Shapes",
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 16,
        border: "1px solid #dbe4ee",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "12px 14px",
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
            fontSize: 14,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: 0.2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
          }}
        >
          Drag & Drop
        </div>
      </div>

      {/* SHAPES GRID */}
      <div
        style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
          gap: 12,
          background: "#f8fafc",
        }}
      >
        {SHAPES.map((item) => (
          <ShapeCard key={item.type} item={item} />
        ))}
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid #e5e7eb",
          background: "#ffffff",
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.4,
        }}
      >
        Paint-style dashboard shapes for annotations, flow arrows, comments,
        process indicators, and industrial diagrams.
      </div>
    </div>
  );
}