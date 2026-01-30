import React from "react";

/**
 * DraggableBlinkingAlarm
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders blinking alarm widget using `tank`
 */
export default function DraggableBlinkingAlarm({
  // Canvas mode
  tank,

  // Palette mode
  label = "Blinking Alarm",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "blinkingAlarm",
    w: 220,
    h: 70,
    text: "ALARM",
    isActive: false,
    blinkMs: 500,
    colorOn: "#ef4444",
    colorOff: "#111827",
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const text =
      tank.text ?? tank.properties?.text ?? tank.properties?.label ?? payload.text;

    const isActive =
      tank.isActive ??
      tank.active ??
      tank.properties?.isActive ??
      tank.properties?.active ??
      payload.isActive;

    const blinkMs =
      tank.blinkMs ?? tank.properties?.blinkMs ?? payload.blinkMs;

    const colorOn =
      tank.colorOn ?? tank.properties?.colorOn ?? payload.colorOn;

    const colorOff =
      tank.colorOff ?? tank.properties?.colorOff ?? payload.colorOff;

    // Blink animation (only when active)
    const [blinkOn, setBlinkOn] = React.useState(true);

    React.useEffect(() => {
      if (!isActive) {
        setBlinkOn(true);
        return;
      }
      const ms = Math.max(120, Number(blinkMs) || 500);
      const t = setInterval(() => setBlinkOn((v) => !v), ms);
      return () => clearInterval(t);
    }, [isActive, blinkMs]);

    const bg = isActive ? (blinkOn ? colorOn : colorOff) : colorOff;

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
            width: "100%",
            height: "100%",
            border: "2px solid rgba(0,0,0,0.75)",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            letterSpacing: 2,
            fontSize: 18,
            color: isActive ? "#fff" : "#9ca3af",
            textTransform: "uppercase",
            boxShadow: isActive
              ? "0 0 14px rgba(239,68,68,0.55)"
              : "inset 0 2px 6px rgba(0,0,0,0.35)",
          }}
          title={isActive ? "Alarm ACTIVE" : "Alarm inactive"}
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
        // ✅ Use your app's standard drag payload
        e.dataTransfer.setData("shape", "blinkingAlarm");
        e.dataTransfer.setData("text/plain", "blinkingAlarm");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Blinking Alarm"
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
          borderRadius: 3,
          background: payload.colorOn,
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 10px rgba(239,68,68,0.55)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
