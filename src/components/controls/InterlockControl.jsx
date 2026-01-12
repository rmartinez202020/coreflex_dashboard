import React from "react";

export default function InterlockControl({
  locked = true,
  width = 220,
  height = 86,
  label = "INTERLOCK",
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
        border: "1px solid rgba(0,0,0,0.35)",
        background:
          "linear-gradient(180deg, #2a2f36 0%, #15181d 55%, #0b0d10 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        padding: "10px 12px",
        gap: 12,
      }}
      title={`${label}: ${statusText}`}
    >
      {/* subtle top gloss */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0) 55%)",
          pointerEvents: "none",
        }}
      />

      {/* LEFT: lock lens */}
      <div
        style={{
          width: height - 22,
          height: height - 22,
          borderRadius: 14,
          background: locked
            ? "radial-gradient(circle at 30% 25%, #ffd1d1 0%, #ff4b4b 35%, #8a0f0f 75%, #3a0505 100%)"
            : "radial-gradient(circle at 30% 25%, #d7ffe0 0%, #22c55e 35%, #0d6b2f 75%, #073518 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "inset 0 2px 10px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* inner ring */}
        <div
          style={{
            position: "absolute",
            inset: 7,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            pointerEvents: "none",
          }}
        />

        {/* lock icon */}
        <div
          style={{
            color: "rgba(255,255,255,0.92)",
            fontSize: 26,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.55))",
            lineHeight: 1,
          }}
        >
          {locked ? "🔒" : "🔓"}
        </div>
      </div>

      {/* CENTER: text */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            letterSpacing: 0.6,
            fontSize: 13,
          }}
        >
          {label}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* status pill */}
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.4,
              color: locked ? "#ffe8e8" : "#eafff1",
              background: locked
                ? "linear-gradient(180deg,#b91c1c,#7f1d1d)"
                : "linear-gradient(180deg,#16a34a,#0f6a31)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            {statusText}
          </div>

          {/* small “safety” tag */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            SAFETY
          </div>
        </div>
      </div>

      {/* RIGHT: small indicator dot */}
      <div
        style={{
          marginLeft: "auto",
          width: 14,
          height: 14,
          borderRadius: 999,
          background: locked
            ? "radial-gradient(circle at 30% 25%, #ffd1d1 0%, #ff3b3b 45%, #6a0c0c 100%)"
            : "radial-gradient(circle at 30% 25%, #d7ffe0 0%, #22c55e 45%, #0b4d22 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "inset 0 2px 6px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)",
        }}
        aria-label={statusText}
      />
    </div>
  );
}
