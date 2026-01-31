import React from "react";

/**
 * DraggableBlinkingAlarm
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders blinking alarm widget using `tank`
 *
 * ✅ NEW (Platform Creation 50):
 * - Supports 4 selectable styles (saved as tank.properties.alarmStyle)
 * - Supports onDoubleClick to open settings modal (props.onOpenSettings)
 */
export default function DraggableBlinkingAlarm({
  // Canvas mode
  tank,

  // Palette mode
  label = "Blinking Alarm",
  onDragStart,
  onClick,

  // ✅ NEW: open settings modal on double click
  onOpenSettings,
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

    // ✅ NEW
    alarmStyle: "style1",
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

    const blinkMs = tank.blinkMs ?? tank.properties?.blinkMs ?? payload.blinkMs;

    const colorOn = tank.colorOn ?? tank.properties?.colorOn ?? payload.colorOn;

    const colorOff = tank.colorOff ?? tank.properties?.colorOff ?? payload.colorOff;

    // ✅ NEW: style selector (from modal)
    const alarmStyle =
      tank.properties?.alarmStyle ??
      tank.alarmStyle ??
      payload.alarmStyle;

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

    const commonWrap = {
      width: w,
      height: h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    };

    const commonTitle = isActive ? "Alarm ACTIVE" : "Alarm inactive";

    const commonText = {
      fontWeight: 1000,
      letterSpacing: 2,
      fontSize: 18,
      color: isActive ? "#fff" : "#9ca3af",
      textTransform: "uppercase",
    };

    const glow = isActive
      ? "0 0 14px rgba(239,68,68,0.55)"
      : "inset 0 2px 6px rgba(0,0,0,0.35)";

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onOpenSettings?.(tank);
    };

    // =========================
    // ✅ STYLE RENDERERS (4 styles)
    // =========================
    const Style1 = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(0,0,0,0.75)",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          boxShadow: glow,
        }}
        title={commonTitle}
      >
        <div style={commonText}>{text}</div>
      </div>
    );

    const Style2 = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={commonTitle}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${Math.max(22, Math.round(w * 0.18))}px solid transparent`,
            borderRight: `${Math.max(22, Math.round(w * 0.18))}px solid transparent`,
            borderBottom: `${Math.max(44, Math.round(h * 0.9))}px solid ${bg}`,
            filter: isActive ? "drop-shadow(0 0 10px rgba(239,68,68,0.7))" : "none",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "62%",
              transform: "translate(-50%, -50%)",
              color: "white",
              fontWeight: 1000,
              fontSize: 22,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            !
          </div>
        </div>
      </div>
    );

    const Style3 = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(0,0,0,0.75)",
          background: "#0b1220",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.45)",
        }}
        title={commonTitle}
      >
        <div
          style={{
            width: Math.max(26, Math.round(Math.min(w, h) * 0.35)),
            height: Math.max(26, Math.round(Math.min(w, h) * 0.35)),
            borderRadius: 999,
            background: bg,
            boxShadow: isActive ? "0 0 18px rgba(239,68,68,0.85)" : "none",
            border: "2px solid rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            ...commonText,
            fontSize: 16,
            letterSpacing: 1.5,
            color: isActive ? "#fff" : "#94a3b8",
          }}
        >
          {text}
        </div>
      </div>
    );

    const Style4 = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(0,0,0,0.75)",
          background: bg,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: glow,
          position: "relative",
        }}
        title={commonTitle}
      >
        <div style={{ ...commonText, zIndex: 2 }}>
          {isActive ? "SIREN" : "OFF"}
        </div>

        {/* subtle wave overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: isActive ? 0.25 : 0.12,
            background:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.9) 0, transparent 55%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.9) 0, transparent 55%)",
          }}
        />
      </div>
    );

    const renderByStyle = () => {
      if (alarmStyle === "style2") return <Style2 />;
      if (alarmStyle === "style3") return <Style3 />;
      if (alarmStyle === "style4") return <Style4 />;
      return <Style1 />; // default
    };

    return (
      <div style={commonWrap} onDoubleClick={handleDoubleClick}>
        {renderByStyle()}
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
