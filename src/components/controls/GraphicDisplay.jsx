import React from "react";

/**
 * GraphicDisplay
 * - Reads settings from `tank` (title, timeUnit, sampleMs, window)
 * - Adds padding so the title is not touching the border
 */
export default function GraphicDisplay({ tank }) {
  const title = tank?.title ?? "Graphic Display";
  const timeUnit = tank?.timeUnit ?? "seconds"; // seconds | minutes | hours | days
  const windowSize = tank?.window ?? 60;
  const sampleMs = tank?.sampleMs ?? 1000;

  return (
    <div
      style={{
        width: tank?.w ?? 520,
        height: tank?.h ?? 240,
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #cfcfcf",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "10px 12px 8px 12px", // ✅ more breathing room
          borderBottom: "1px solid #e6e6e6",
          background: "linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%)",
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 16,
            color: "#111",
            lineHeight: 1.2,
            marginBottom: 6, // ✅ pushes it away from border
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#444",
            fontSize: 12,
          }}
        >
          <span>
            Time: <b>{timeUnit}</b>
          </span>
          <span>•</span>
          <span>
            Sample: <b>{sampleMs} ms</b>
          </span>
          <span>•</span>
          <span>
            Window: <b>{windowSize}</b>
          </span>

          {/* Buttons (your existing ones can stay; placeholder visual only) */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              style={{
                border: "1px solid #bfe6c8",
                background: "linear-gradient(180deg,#bff2c7,#6fdc89)",
                color: "#0b3b18",
                fontWeight: 900,
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              RECORD
            </button>
            <button
              style={{
                border: "1px solid #ddd",
                background: "#f3f3f3",
                color: "#555",
                fontWeight: 800,
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              EXPORT
            </button>
            <button
              style={{
                border: "1px solid #ddd",
                background: "#f3f3f3",
                color: "#555",
                fontWeight: 800,
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      </div>

      {/* BODY / CHART AREA (placeholder) */}
      <div style={{ padding: 12 }}>
        <div
          style={{
            width: "100%",
            height: "170px",
            borderRadius: 10,
            border: "1px solid #d9d9d9",
            background: "linear-gradient(180deg,#ffffff,#fbfbfb)",
            position: "relative",
          }}
        >
          {/* grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 30px",
              borderRadius: 10,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 10,
              bottom: 10,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#555",
            }}
          >
            0.00
          </div>
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              fontFamily: "monospace",
              fontSize: 12,
              color: "#555",
            }}
          >
            100.00
          </div>
        </div>
      </div>
    </div>
  );
}
