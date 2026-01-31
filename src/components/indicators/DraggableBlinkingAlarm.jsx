import React from "react";

/**
 * DraggableBlinkingAlarm
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders blinking alarm widget using `tank`
 *
 * ✅ NEW:
 * - Professional HMI styles via tank.properties.alarmStyle:
 *   "annunciator" | "banner" | "stackLight" | "minimal"
 * - Alarm tone via tank.properties.alarmTone:
 *   "critical" | "warning" | "info"
 * - Supports onDoubleClick to open settings modal (props.onOpenSettings)
 */
export default function DraggableBlinkingAlarm({
  // Canvas mode
  tank,

  // Palette mode
  label = "Blinking Alarm",
  onDragStart,
  onClick,

  // ✅ open settings modal on double click
  onOpenSettings,
}) {
  const payload = {
    shape: "blinkingAlarm",
    w: 240,
    h: 74,
    text: "ALARM",
    isActive: false,
    blinkMs: 500,
    colorOn: "#ef4444",
    colorOff: "#0b1220",

    // ✅ professional defaults
    alarmStyle: "annunciator", // annunciator|banner|stackLight|minimal
    alarmTone: "critical", // critical|warning|info
  };

  // =========================
  // ✅ CANVAS MODE (real widget)
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const text =
      tank.text ??
      tank.properties?.text ??
      tank.properties?.label ??
      payload.text;

    const isActive =
      tank.isActive ??
      tank.active ??
      tank.properties?.isActive ??
      tank.properties?.active ??
      payload.isActive;

    const blinkMs = tank.blinkMs ?? tank.properties?.blinkMs ?? payload.blinkMs;

    const colorOn = tank.colorOn ?? tank.properties?.colorOn ?? payload.colorOn;
    const colorOff =
      tank.colorOff ?? tank.properties?.colorOff ?? payload.colorOff;

    // ✅ professional selectors (from modal)
    const alarmStyle =
      tank.properties?.alarmStyle ?? tank.alarmStyle ?? payload.alarmStyle;

    const alarmTone =
      tank.properties?.alarmTone ?? tank.alarmTone ?? payload.alarmTone;

    // Tone defaults (only used if you want tone-based colors)
    const toneMap = {
      critical: { on: "#ef4444", glow: "rgba(239,68,68,0.55)" },
      warning: { on: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
      info: { on: "#3b82f6", glow: "rgba(59,130,246,0.45)" },
    };

    const tone = toneMap[alarmTone] || toneMap.critical;

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

    // If user provided colorOn/colorOff, honor it.
    // Otherwise tone.on is a nicer default.
    const effectiveOn = colorOn || tone.on;
    const effectiveOff = colorOff;

    const bg = isActive ? (blinkOn ? effectiveOn : effectiveOff) : effectiveOff;

    const commonWrap = {
      width: w,
      height: h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    };

    const commonTitle = isActive ? "Alarm ACTIVE" : "Alarm NORMAL";

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onOpenSettings?.(tank);
    };

    // =========================
    // ✅ PROFESSIONAL STYLES
    // =========================

    // 1) Industrial Annunciator tile (best overall)
    const Annunciator = () => {
      const glow = isActive ? tone.glow : "rgba(0,0,0,0)";
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            background: "#0b1220",
            border: "1px solid rgba(148,163,184,0.22)",
            boxShadow: isActive
              ? `0 10px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04), 0 0 22px ${glow}`
              : "0 10px 30px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            color: "white",
            boxSizing: "border-box",
          }}
          title={commonTitle}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 11,
                opacity: 0.65,
                letterSpacing: 1,
                fontWeight: 800,
              }}
            >
              ALARM
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.6 }}>
              {text}
            </div>
          </div>

          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: isActive ? bg : "rgba(148,163,184,0.35)",
              boxShadow: isActive ? `0 0 0 4px ${tone.glow}` : "none",
              transition: "all 150ms ease",
            }}
            title={isActive ? "Active" : "Normal"}
          />
        </div>
      );
    };

    // 2) Top Banner strip (modern)
    const Banner = () => {
      const stripeColor = isActive ? bg : "rgba(148,163,184,0.18)";
      const stripe = isActive
        ? `repeating-linear-gradient(45deg, ${stripeColor}, ${stripeColor} 10px, rgba(0,0,0,0.25) 10px, rgba(0,0,0,0.25) 20px)`
        : stripeColor;

      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.22)",
            background: "#0b1220",
            color: "white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
          }}
          title={commonTitle}
        >
          <div
            style={{
              height: 12,
              background: stripe,
              opacity: isActive ? 1 : 0.7,
            }}
          />
          <div
            style={{
              height: "calc(100% - 12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              fontWeight: 900,
              letterSpacing: 0.7,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 14 }}>{text}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {isActive ? "ACTIVE" : "NORMAL"}
            </div>
          </div>
        </div>
      );
    };

    // 3) Stack light (industrial lens + label)
    const StackLight = () => {
      const lensSize = Math.max(18, Math.round(Math.min(w, h) * 0.28));
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            background: "#0b1220",
            border: "1px solid rgba(148,163,184,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 12,
            boxSizing: "border-box",
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
          }}
          title={commonTitle}
        >
          <div
            style={{
              width: lensSize,
              height: lensSize,
              borderRadius: 999,
              background: isActive ? bg : "rgba(148,163,184,0.25)",
              border: "2px solid rgba(255,255,255,0.10)",
              boxShadow: isActive
                ? `0 0 18px ${tone.glow}, inset 0 -2px 6px rgba(0,0,0,0.35)`
                : "inset 0 -2px 6px rgba(0,0,0,0.35)",
            }}
          />
          <div
            style={{
              color: "white",
              fontWeight: 900,
              letterSpacing: 0.6,
              fontSize: 14,
              opacity: isActive ? 1 : 0.78,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        </div>
      );
    };

    // 4) Minimal outline + glow (super clean)
    const Minimal = () => {
      const border = isActive
        ? "rgba(239,68,68,0.55)"
        : "rgba(148,163,184,0.22)";
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 12,
            border: `1px solid ${border}`,
            background: "rgba(2,6,23,0.92)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 950,
            letterSpacing: 1,
            boxShadow: isActive
              ? `0 0 18px ${tone.glow}`
              : "0 10px 25px rgba(0,0,0,0.25)",
            transition: "all 140ms ease",
            boxSizing: "border-box",
          }}
          title={commonTitle}
        >
          <span style={{ color: isActive ? bg : "rgba(226,232,240,0.75)" }}>
            {text}
          </span>
        </div>
      );
    };

    const renderByStyle = () => {
      if (alarmStyle === "banner") return <Banner />;
      if (alarmStyle === "stackLight") return <StackLight />;
      if (alarmStyle === "minimal") return <Minimal />;
      return <Annunciator />; // default
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
          borderRadius: 4,
          background: payload.colorOn,
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 10px rgba(239,68,68,0.45)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
