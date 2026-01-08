import React from "react";

/**
 * Professional industrial push button
 * - Variant: "NO" (green) or "NC" (red)
 * - Press animation (pressed=true)
 * - Scales with width/height
 */

// ✅ Named export (optional safety)
export function PushButtonControl({
  variant = "NO", // "NO" = green, "NC" = red
  width = 110,
  height = 110,
  pressed = false,
  label, // optional override
}) {
  const safeW = Math.max(70, Number(width) || 110);
  const safeH = Math.max(70, Number(height) || 110);
  const size = Math.min(safeW, safeH);

  // sizing (guarded)
  const bezel = Math.max(7, Math.round(size * 0.105));
  const ring = Math.max(5, Math.round(size * 0.085));

  // make sure face never goes negative
  const btn = Math.max(26, size - bezel * 2 - ring * 2);

  const v = String(variant).toUpperCase();
  const isGreen = v === "NO";
  const text = (label ?? (isGreen ? "NO" : "NC")).toUpperCase();

  const bezelBg =
    "linear-gradient(180deg, #2B2B2B 0%, #0E0E0E 55%, #1B1B1B 100%)";

  const ringBg =
    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.55) 100%)";

  const faceBg = isGreen
    ? "linear-gradient(180deg, #66FF87 0%, #2DE255 55%, #11AA31 100%)"
    : "linear-gradient(180deg, #FF6060 0%, #E60000 55%, #B20000 100%)";

  // press effect
  const pressDepth = Math.max(3, Math.round(size * 0.055));
  const translateY = pressed ? pressDepth : 0;

  const faceShadow = pressed
    ? "inset 0 10px 16px rgba(0,0,0,0.55), inset 0 2px 6px rgba(255,255,255,0.10)"
    : "0 10px 18px rgba(0,0,0,0.45), inset 0 2px 8px rgba(255,255,255,0.12), inset 0 -10px 14px rgba(0,0,0,0.35)";

  const highlight = isGreen
    ? "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)"
    : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)";

  return (
    <div
      style={{
        width: safeW,
        height: safeH,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* Bezel */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: bezelBg,
          boxShadow: "0 12px 22px rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: bezel,
        }}
      >
        {/* Inner ring */}
        <div
          style={{
            width: size - bezel * 2,
            height: size - bezel * 2,
            borderRadius: (size - bezel * 2) / 2,
            background: "#0A0A0A",
            boxShadow:
              "inset 0 8px 16px rgba(0,0,0,0.75), inset 0 -2px 6px rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: ring,
            position: "relative",
            overflow: "hidden", // ✅ important: clip the sheen
          }}
        >
          {/* ring sheen */}
          <div
            style={{
              position: "absolute",
              inset: Math.max(0, ring - 2),
              borderRadius: "999px",
              background: ringBg,
              pointerEvents: "none",
              opacity: 0.9,
            }}
          />

          {/* Button face */}
          <div
            style={{
              width: btn,
              height: btn,
              borderRadius: btn / 2,
              background: faceBg,
              transform: `translateY(${translateY}px)`,
              transition: "transform 120ms ease, box-shadow 120ms ease",
              boxShadow: faceShadow,
              border: "1px solid rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {/* glossy highlight */}
            <div
              style={{
                position: "absolute",
                inset: Math.max(6, Math.round(btn * 0.08)),
                borderRadius: "999px",
                background: highlight,
                pointerEvents: "none",
                opacity: pressed ? 0.28 : 0.45,
                transition: "opacity 120ms ease",
              }}
            />

            {/* Text */}
            <div
              style={{
                fontWeight: 900,
                color: "white",
                fontSize: Math.max(14, Math.round(btn * 0.24)),
                letterSpacing: Math.max(1, Math.round(btn * 0.02)),
                textShadow: "0 2px 4px rgba(0,0,0,0.55)",
                transform: `translateY(${pressed ? 1 : 0}px)`,
                transition: "transform 120ms ease",
              }}
            >
              {text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ Default export (safe for imports)
export default PushButtonControl;
