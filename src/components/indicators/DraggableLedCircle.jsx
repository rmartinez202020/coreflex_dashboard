import React from "react";

/**
 * DraggableLedCircle
 * ✅ Dual mode:
 * - Palette mode (Sidebar)
 * - Canvas mode (Dashboard)
 *
 * ✅ Supports circle/square via tank.properties.shapeStyle
 * ✅ Shows OFF / ON text clearly with spacing
 */
export default function DraggableLedCircle({
  // Canvas mode
  tank,

  // Palette mode
  label = "Led Circle",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "ledCircle",
    w: 70,
    h: 90, // ⬅️ taller to allow text
    status: "off",
    properties: {
      shapeStyle: "circle",
      colorOn: "#22c55e",
      colorOff: "#9ca3af",
      offText: "OFF",
      onText: "ON",
    },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? payload.w;
    const h = tank.h ?? payload.h;

    const status =
      tank.status ??
      tank.properties?.status ??
      tank.properties?.value ??
      "off";

    const isOn = status === "on" || status === true || status === 1;

    const shapeStyle =
      tank.properties?.shapeStyle ?? payload.properties.shapeStyle;

    const colorOn = tank.properties?.colorOn ?? payload.properties.colorOn;
    const colorOff = tank.properties?.colorOff ?? payload.properties.colorOff;

    const textOn = tank.properties?.onText ?? "ON";
    const textOff = tank.properties?.offText ?? "OFF";

    const diameter = Math.min(w, h - 22); // ⬅️ reserve space for text
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
          gap: 6, // ⬅️ space between LED and text
          userSelect: "none",
        }}
      >
        {/* LED */}
        <div
          style={{
            width: diameter,
            height: diameter,
            borderRadius: isCircle ? "50%" : 6,
            background: isOn ? colorOn : colorOff,
            border: "2px solid rgba(0,0,0,0.65)",
            boxShadow: isOn
              ? "0 0 12px rgba(34,197,94,0.65)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
          }}
        />

        {/* TEXT */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#111827",
            lineHeight: "14px",
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {isOn ? textOn : textOff}
        </div>
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
        e.dataTransfer.setData("shape", "ledCircle");
        e.dataTransfer.setData("text/plain", "ledCircle");
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
