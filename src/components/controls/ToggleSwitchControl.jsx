import React from "react";

/**
 * iOS-style toggle (operator-ready)
 * Fixes:
 * - No ON/OFF text inside
 * - Knob fully covers the green/red edge near the knob
 * - Thinner black borders (outer bezel + knob ring)
 */

export function ToggleSwitchControl({
  isOn = true,
  width = 180,
  height = 70,
  // keep prop if you want later, but default is OFF and we won't render text now
  showText = false,
  labelOn = "ON",
  labelOff = "OFF",
}) {
  // safety for resizing / weird values
  const safeW = Math.max(90, Number(width) || 180);
  const safeH = Math.max(40, Number(height) || 70);

  const outerRadius = safeH / 2;

  // Slightly smaller outer padding = thinner bezel look
  const bezelPad = Math.max(4, Math.round(safeH * 0.07));

  // Track padding inside the bezel
  const pad = Math.max(6, Math.round(safeH * 0.11));

  // ✅ Make knob a touch bigger so it covers the colored panel edge
  const knobSize = Math.max(18, safeH - pad * 2 + Math.round(safeH * 0.06));
  const knobTop = pad - Math.round(safeH * 0.03); // lift a bit to overlap edges more

  // ✅ ON = LEFT, OFF = RIGHT
  const knobLeft = isOn ? pad : safeW - pad - knobSize;

  // ✅ thinner borders
  const knobRing = Math.max(2, Math.round(safeH * 0.03));
  const bezelBorder = 1; // thin outer border

  const bezelBg =
    "linear-gradient(180deg, #3A3A3A 0%, #141414 50%, #2A2A2A 100%)";

  const trackShadow =
    "inset 0 4px 10px rgba(0,0,0,0.75), inset 0 -3px 8px rgba(255,255,255,0.08)";

  const panelBg = isOn
    ? "linear-gradient(180deg, #61FF78 0%, #22C63B 55%, #10A82B 100%)"
    : "linear-gradient(180deg, #FF4B4B 0%, #E00000 55%, #B10000 100%)";

  const knobBg =
    "linear-gradient(180deg, #4B4B4B 0%, #1F1F1F 55%, #3A3A3A 100%)";

  // ✅ Pull the colored panel inward so it won’t peek around the knob edge
  const panelInset = Math.max(10, Math.round(safeH * 0.20));

  return (
    <div
      style={{
        width: safeW,
        height: safeH,
        borderRadius: outerRadius,
        background: bezelBg,
        padding: bezelPad,
        border: `${bezelBorder}px solid rgba(0,0,0,0.65)`,
        boxShadow:
          "0 10px 20px rgba(0,0,0,0.55), inset 0 2px 6px rgba(255,255,255,0.06)",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: outerRadius - 6,
          background: "#111",
          boxShadow: trackShadow,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Color Panel */}
        <div
          style={{
            position: "absolute",
            inset: panelInset,
            borderRadius: outerRadius,
            background: panelBg,
            boxShadow:
              "inset 0 2px 6px rgba(255,255,255,0.18), inset 0 -4px 10px rgba(0,0,0,0.35)",
          }}
        />

        {/* ✅ Removed ON/OFF text inside (kept optional switch if you ever want it back) */}
        {showText && (
          <div
            style={{
              position: "absolute",
              left: Math.max(10, Math.round(safeH * 0.18)),
              right: Math.max(10, Math.round(safeH * 0.18)),
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: isOn ? "flex-start" : "flex-end",
              fontWeight: 800,
              letterSpacing: Math.max(1, Math.round(safeH * 0.04)),
              color: "rgba(255,255,255,0.92)",
              fontSize: Math.max(12, Math.floor(safeH * 0.28)),
              textShadow: "0 2px 4px rgba(0,0,0,0.55)",
              paddingLeft: isOn ? Math.round(safeH * 0.22) : 0,
              paddingRight: isOn ? 0 : Math.round(safeH * 0.22),
              zIndex: 2,
            }}
          >
            {isOn ? labelOn : labelOff}
          </div>
        )}

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
              "0 8px 16px rgba(0,0,0,0.6), inset 0 2px 5px rgba(255,255,255,0.12), inset 0 -6px 10px rgba(0,0,0,0.5)",
            border: `${knobRing}px solid rgba(0,0,0,0.55)`,
            zIndex: 3,
            transition: "left 180ms ease",
          }}
        />
      </div>
    </div>
  );
}

export default ToggleSwitchControl;
