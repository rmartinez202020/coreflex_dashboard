import React from "react";

/**
 * DraggableLedCircle
 * ✅ Dual mode:
 * - Palette mode (Sidebar): draggable row
 * - Canvas mode (Dashboard): renders LED with shape + on/off colors
 *
 * ✅ Supports:
 * - shapeStyle: "circle" | "square"
 * - colorOn / colorOff
 * - onText / offText (optional label under the LED)
 * - tag binding (stored in tank.properties.tag)
 *
 * IMPORTANT:
 * - Settings are saved in tank.properties (so Apply works)
 * - Tag evaluation is best done where you already merge live sensor values into tanks
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,

  // Palette mode
  label = "Led Circle",
  onDragStart,
  onClick,
}) {
  // ✅ default payload when dropped from Sidebar
  const payload = {
    shape: "ledCircle",
    w: 70,
    h: 70,
    status: "off",
    properties: {
      shapeStyle: "circle", // "circle" | "square"
      colorOn: "#22c55e",
      colorOff: "#9ca3af",

      // ✅ NEW (requested)
      onText: "ON",
      offText: "OFF",

      // ✅ NEW: tag binding (drives ON/OFF)
      tag: { deviceId: "", field: "" },
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const props = tank.properties || {};
    const defaults = payload.properties;

    const shapeStyle = props.shapeStyle ?? defaults.shapeStyle;
    const colorOn = props.colorOn ?? defaults.colorOn;
    const colorOff = props.colorOff ?? defaults.colorOff;

    const onText = props.onText ?? defaults.onText;
    const offText = props.offText ?? defaults.offText;

    // ✅ ON/OFF evaluation:
    // Prefer explicit tank.status if you set it elsewhere.
    // Otherwise fall back to tank.properties.status/value.
    const statusRaw =
      tank.status ?? props.status ?? props.value ?? tank.value ?? "off";

    const isOn =
      statusRaw === "on" ||
      statusRaw === true ||
      statusRaw === 1 ||
      statusRaw === "1";

    const diameter = Math.min(w, h);
    const isCircle = shapeStyle !== "square";

    return (
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          gap: 6,
        }}
        title={isOn ? onText || "ON" : offText || "OFF"}
      >
        <div
          style={{
            width: diameter,
            height: diameter,
            borderRadius: isCircle ? "50%" : 10,
            background: isOn ? colorOn : colorOff,
            border: "2px solid rgba(0,0,0,0.65)",
            boxShadow: isOn
              ? "0 0 12px rgba(34,197,94,0.65)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
          }}
        />

        {/* ✅ Optional ON/OFF text under the LED (requested) */}
        {(isOn ? onText : offText) ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.5,
              color: "#111",
              lineHeight: "12px",
              whiteSpace: "nowrap",
              maxWidth: Math.max(40, w),
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center",
            }}
          >
            {isOn ? onText : offText}
          </div>
        ) : null}
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE (Sidebar)
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        // ✅ IMPORTANT: Your drop handler supports "shape" drops and builds tank objects.
        // If you're using coreflex/palette elsewhere, keep it too.
        e.dataTransfer.setData("shape", "ledCircle");
        e.dataTransfer.setData("text/plain", "ledCircle");

        // Optional: for your newer palette JSON drop path (if you add it later)
        e.dataTransfer.setData("coreflex/palette", JSON.stringify(payload));

        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag LED"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: payload.properties.colorOn,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 8px rgba(34,197,94,0.5)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
