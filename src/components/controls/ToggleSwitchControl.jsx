// src/components/controls/ToggleSwitchControl.jsx
import React from "react";
import ToggleSwitchPropertiesModal from "./ToggleSwitchPropertiesModal";

export default function ToggleSwitchControl({
  isOn = true,
  width = 180,
  height = 70,

  // ✅ keep old behavior by default
  visualOnly = true,

  // ✅ parent should pass true when dashboard is launched (PLAY)
  isLaunched = false,

  // ✅ optional (parent should pass to enable saving binding)
  widget = null,
  onSaveWidget = null,
}) {
  const [openProps, setOpenProps] = React.useState(false);

  const safeW = Math.max(90, Number(width) || 180);
  const safeH = Math.max(40, Number(height) || 70);

  const radius = safeH / 2;

  /* === VISUAL TUNING === */
  const bezelPad = Math.max(2, Math.round(safeH * 0.045));
  const trackPad = Math.max(4, Math.round(safeH * 0.075));
  const panelInset = Math.max(8, Math.round(safeH * 0.13));

  const knobSize = safeH - trackPad * 2 + Math.round(safeH * 0.04);
  const knobTop = trackPad - Math.round(safeH * 0.015);

  // ON = LEFT, OFF = RIGHT
  const knobLeft = isOn ? trackPad : safeW - trackPad - knobSize;

  const bezelBg =
    "linear-gradient(180deg, #2B2B2B 0%, #0E0E0E 50%, #1C1C1C 100%)";

  const trackBg = "#0A0A0A";

  const panelBg = isOn
    ? "linear-gradient(180deg, #63FF78 0%, #2EE04C 60%, #14A82E 100%)"
    : "linear-gradient(180deg, #FF4F4F 0%, #E00000 60%, #B10000 100%)";

  const knobBg =
    "linear-gradient(180deg, #3A3A3A 0%, #141414 60%, #2A2A2A 100%)";

  // ✅ only allow edit affordances in EDIT mode
  const canEdit = !visualOnly && !isLaunched;

  // ✅ cardinal arrows cursor on hover in EDIT mode
  const hoverCursor = canEdit ? "move" : "default";

  // ✅ safety: if dashboard switches to launched while modal open, close it
  React.useEffect(() => {
    if (isLaunched && openProps) setOpenProps(false);
  }, [isLaunched, openProps]);

  return (
    <>
      <div
        title={isOn ? "ON" : "OFF"}
        onDoubleClick={
          canEdit
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenProps(true);
              }
            : undefined
        }
        style={{
          width: safeW,
          height: safeH,
          borderRadius: radius,
          background: bezelBg,
          padding: bezelPad,
          boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
          position: "relative",
          userSelect: "none",

          // ✅ cardinal arrows cursor when hovering in EDIT mode
          cursor: hoverCursor,

          // ✅ keep existing behavior: in visualOnly we don't interact at all
          pointerEvents: visualOnly ? "none" : "auto",
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
          {/* Color panel */}
          <div
            style={{
              position: "absolute",
              inset: panelInset,
              borderRadius: radius,
              background: panelBg,
              zIndex: 1,
            }}
          />

          {/* ON / OFF text */}
          <div
            style={{
              position: "absolute",
              inset: panelInset,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: Math.max(14, Math.round(safeH * 0.28)),
              letterSpacing: 1,
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.45)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {isOn ? "ON" : "OFF"}
          </div>

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
              border: "2px solid rgba(0,0,0,0.5)",
              transition: "left 180ms ease",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <ToggleSwitchPropertiesModal
        open={openProps}
        toggleSwitch={widget}
        onClose={() => setOpenProps(false)}
        onSave={(nextWidget) => {
          if (typeof onSaveWidget === "function") onSaveWidget(nextWidget);
        }}
        // ✅ pass through so modal hard-blocks in PLAY
        isLaunched={isLaunched}
      />
    </>
  );
}
