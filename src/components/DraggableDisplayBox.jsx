// DraggableDisplayBox.jsx
import React from "react";

export default function DraggableDisplayBox({ tank }) {
  const props = tank.properties || {};

  // FORMAT like "000.00", "00", "0000", etc.
  const numberFormat = props.numberFormat || "00000";
  const label = props.label || "";
  const theme = props.theme || "gray"; // internal theme ID

  // Extract integer + decimal pattern
  const [intPart, decPart] = numberFormat.split(".");

  const totalInt = intPart.length; // number of zeros before decimal
  const totalDec = decPart ? decPart.length : 0;

  let rawValue = props.value ?? 0;

  // Convert to fixed decimals if needed
  let formattedValue =
    totalDec > 0
      ? Number(rawValue).toFixed(totalDec)
      : String(Math.round(rawValue));

  // Now pad integer part
  if (totalDec > 0) {
    let [i, d] = formattedValue.split(".");
    i = i.padStart(totalInt, "0");
    d = d.padEnd(totalDec, "0");
    formattedValue = `${i}.${d}`;
  } else {
    formattedValue = String(formattedValue).padStart(totalInt, "0");
  }

  // THEMES
  const themes = {
    green: {
      bg: "#d9ffe0",
      text: "#005500",
      border: "#00aa33",
    },
    red: {
      bg: "#ffe5e5",
      text: "#8b0000",
      border: "#cc0000",
    },
    blue: {
      bg: "#e0f0ff",
      text: "#003c77",
      border: "#0077cc",
    },
    gray: {
      bg: "#f3f4f6", // your sidebar gray
      text: "#111827",
      border: "#6b7280",
    },
    dark: {
      bg: "#1f2937", // bg-gray-800
      text: "#22d3ee",
      border: "#0ea5e9",
    },
  };

  const colors = themes[theme] || themes.gray;
  const scale = tank.scale || 1;

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      {/* LABEL ABOVE DISPLAY */}
      {label && (
        <div
          style={{
            marginBottom: 4,
            fontSize: `${16 * scale}px`,
            fontWeight: "600",
            color: "#374151",
            pointerEvents: "none",
          }}
        >
          {label}
        </div>
      )}

      {/* DIGITAL DISPLAY */}
      <div
        style={{
          width: `${160 * scale}px`,
          height: `${65 * scale}px`,
          background: colors.bg,
          color: colors.text,
          fontFamily: "monospace",
          fontSize: `${28 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: `3px solid ${colors.border}`,
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.35)",
          letterSpacing: "6px",
          padding: "0 8px",
          fontWeight: "700",
          pointerEvents: "none",
        }}
      >
        {formattedValue}
      </div>
    </div>
  );
}
