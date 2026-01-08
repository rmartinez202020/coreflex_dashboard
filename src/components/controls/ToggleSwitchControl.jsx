import React from "react";

/**
 * iOS-style toggle (final visual tuning)
 * - Slim black bezel
 * - Larger green/red fill
 * - NO text inside
 * - Knob fully covers color edge
 */

export default function ToggleSwitchControl({
  isOn = true,
  width = 180,
  height = 70,
}) {
  const safeW = Math.max(90, Number(width) || 180);
  const safeH = Math.max(40, Number(height) || 70);

  const radius = safeH / 2;

  /* === VISUAL TUNING === */
  const bezelPad = Math.max(3, Math.round(safeH * 0.05));   // thinner outer bezel
  const trackPad = Math.max(4, Math.round(safeH * 0.08));   // thinner inner track
  const panelInset = Math.max(6, Math.round(safeH * 0.14)); // larger green area

  const knobSize = safeH - trackPad * 2 + Math.round(safeH * 0.05);
  const knobTop = trackPad - Math.round(safeH * 0.02);

  // ON = LEFT, OFF = RIGHT
  const knobLeft = isOn
    ? trackPad
    : safeW - trackPad - knobSize;

  const bezelBg =
    "linear-gradient(180deg, #2E2E2E 0%, #0F0F0F 50%, #1F1F1F 100%)";

  const trackBg = "#0B0B0B";

  const panelBg = isOn
    ? "linear-gradient(180deg, #5CFF72 0%, #2EDB4A 60%, #14A82E 100%)"
    : "linear-gradient(180deg, #FF5050 0%, #E00000 60%, #B10000 100%)";

  const knobBg =
    "linear-gradient(180deg, #3C3C3C 0%, #141414 60%, #2A2A2A 100%)";

  return (
    <div
      style={{
        width: safeW,
        height: safeH,
        borderRadius: radius,
        background: bezelBg,
        padding: bezelPad,
        boxShadow: "0 10px 20px rgba(0,0,0,0.45)",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: radius - 4,
          background: trackBg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Color fill */}
        <div
          style={{
            position: "absolute",
            inset: panelInset,
            borderRadius: radius,
            background: panelBg,
          }}
        />

        {/* Knob */}
        <div
          style={{
            position: "absolute",
            top: knobTop,
            left: knobLeft,
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            background: knobBg,
            boxShadow:
              "0 6px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.12)",
            border: "2px solid rgba(0,0,0,0.55)", // thinner ring
            transition: "left 180ms ease",
            zIndex: 3,
          }}
        />
      </div>
    </div>
  );
}
