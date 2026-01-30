import React from "react";

/**
 * DraggableLedCircle
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): renders icon + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders the actual LED circle using `tank`
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
    w: 80,
    h: 80,
    status: "off",
    colorOn: "#22c55e",
    colorOff: "#9ca3af",
    label: "LED",
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? 80;
    const h = tank.h ?? tank.height ?? 80;

    const status = tank.status ?? tank.properties?.status ?? "off";
    const colorOn =
      tank.colorOn ?? tank.properties?.colorOn ?? payload.colorOn;
    const colorOff =
      tank.colorOff ?? tank.properties?.colorOff ?? payload.colorOff;

    const isOn = status === "on" || status === true;

    const text = tank.label ?? tank.properties?.label ?? payload.label;

    const diameter = Math.min(w, h);

    return (
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            background: isOn ? colorOn : colorOff,
            border: "2px solid rgba(0,0,0,0.65)",
            boxShadow: isOn
              ? "0 0 12px rgba(34,197,94,0.65)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: "rgba(0,0,0,0.75)",
            fontSize: 12,
          }}
          title={`LED: ${isOn ? "ON" : "OFF"}`}
        >
          {text}
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
        // ✅ Use the system your app already uses
        e.dataTransfer.setData("shape", "ledCircle");
        e.dataTransfer.setData("text/plain", "ledCircle");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Led Circle"
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
          background: payload.colorOn,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 8px rgba(34,197,94,0.5)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
