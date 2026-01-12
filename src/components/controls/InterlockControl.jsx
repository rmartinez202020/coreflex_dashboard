import React from "react";

export default function InterlockControl({
  locked = true,
  width = 190,
  height = 80,
}) {
  const label = locked ? "LOCKED" : "UNLOCKED";

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 14,
        border: "1px solid #cfcfcf",
        background: "linear-gradient(180deg,#ffffff,#f3f3f3)",
        boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        padding: 10,
        gap: 12,
      }}
    >
      <div
        style={{
          width: height - 20,
          height: height - 20,
          borderRadius: 12,
          border: "1px solid #ddd",
          background: locked
            ? "linear-gradient(180deg,#ffe5e5,#ffb3b3)"
            : "linear-gradient(180deg,#e6ffe9,#baf5c4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        }}
      >
        {locked ? "🔒" : "🔓"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ fontWeight: 900, color: "#111" }}>INTERLOCK</div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#333" }}>
          {label}
        </div>
      </div>

      <div
        style={{
          marginLeft: "auto",
          fontSize: 11,
          fontWeight: 800,
          color: "#666",
        }}
      >
        Safety
      </div>
    </div>
  );
}
