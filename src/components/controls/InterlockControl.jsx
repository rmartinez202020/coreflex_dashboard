import React from "react";

export default function InterlockControl({
  locked = true,
  width = 220,
  height = 86,
}) {
  const statusText = locked ? "LOCKED" : "UNLOCKED";

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.45)",
        background:
          "linear-gradient(180deg, #2a2f36 0%, #15181d 55%, #0b0d10 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.30)",
        display: "flex",
        alignItems: "center",
        padding: "12px 14px",
        gap: 14,
      }}
    >
      {/* subtle gloss */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 55%)",
          pointerEvents: "none",
        }}
      />

      {/* LEFT: lock lens */}
      <div
        style={{
          width: height - 20,
          height: height - 20,
          borderRadius: 14,
          background: locked
            ? "radial-gradient(circle at 30% 25%, #ffd1d1 0%, #ff4b4b 35%, #8a0f0f 75%, #3a0505 100%)"
            : "radial-gradient(circle at 30% 25%, #d7ffe0 0%, #22c55e 35%, #0d6b2f 75%, #073518 100%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "inset 0 2px 10px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 30,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6))",
          }}
        >
          {locked ? "🔒" : "🔓"}
        </span>
      </div>

      {/* CENTER: text */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* INTERLOCK label */}
        <div
          style={{
            color: "rgba(255,255,255,0.95)",
            fontWeight: 900,
            letterSpacing: 1.2,
            fontSize: 16, // ⬅️ bigger
          }}
        >
          INTERLOCK
        </div>

        {/* STATUS */}
        <div
          style={{
            padding: "6px 16px",
            borderRadius: 999,
            fontSize: 14, // ⬅️ bigger
            fontWeight: 900,
            letterSpacing: 0.8,
            color: locked ? "#ffecec" : "#eafff1",
            background: locked
              ? "linear-gradient(180deg,#dc2626,#7f1d1d)"
              : "linear-gradient(180deg,#16a34a,#0f6a31)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
            width: "fit-content",
          }}
        >
          {statusText}
        </div>
      </div>

      {/* RIGHT: indicator dot */}
      <div
        style={{
          marginLeft: "auto",
          width: 14,
          height: 14,
          borderRadius: 999,
          background: locked
            ? "radial-gradient(circle at 30% 25%, #ffd1d1 0%, #ff3b3b 45%, #6a0c0c 100%)"
            : "radial-gradient(circle at 30% 25%, #d7ffe0 0%, #22c55e 45%, #0b4d22 100%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "inset 0 2px 6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
