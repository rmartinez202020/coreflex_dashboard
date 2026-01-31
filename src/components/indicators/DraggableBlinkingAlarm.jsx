import React from "react";

/**
 * DraggableBlinkingAlarm
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): drag preview
 * 2) Canvas mode (Dashboard): professional alarm widget driven by `tank`
 *
 * ✅ Supports:
 * - tank.properties.alarmStyle   (tile | banner | stack | minimal)
 * - tank.properties.alarmTone    (critical | warning | info)
 * - tank.properties.colorOn / colorOff (optional overrides)
 * - onOpenSettings (double click)
 */
export default function DraggableBlinkingAlarm({
  tank,
  label = "Blinking Alarm",
  onDragStart,
  onClick,
  onOpenSettings,
}) {
  const payload = {
    shape: "blinkingAlarm",
    w: 240,
    h: 70,
    text: "ALARM",
    isActive: false,
    blinkMs: 500,

    // new defaults
    alarmStyle: "banner", // tile | banner | stack | minimal
    alarmTone: "critical", // critical | warning | info

    // optional direct overrides
    colorOn: null,
    colorOff: null,
  };

  const TONE = {
    critical: { on: "#ef4444", accent: "#ef4444" }, // red
    warning: { on: "#f59e0b", accent: "#f59e0b" }, // amber
    info: { on: "#3b82f6", accent: "#3b82f6" }, // blue
  };

  // =========================
  // ✅ CANVAS MODE
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

    const alarmTone =
      tank.properties?.alarmTone ?? tank.alarmTone ?? payload.alarmTone;

    const alarmStyle =
      tank.properties?.alarmStyle ?? tank.alarmStyle ?? payload.alarmStyle;

    const tone = TONE[alarmTone] || TONE.critical;

    const colorOff =
      tank.colorOff ??
      tank.properties?.colorOff ??
      payload.colorOff ??
      "#0b1220";

    const colorOn =
      tank.colorOn ??
      tank.properties?.colorOn ??
      payload.colorOn ??
      tone.on;

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
    const accent = tone.accent;

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onOpenSettings?.(tank);
    };

    const wrapStyle = {
      width: w,
      height: h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    };

    const cardBase = {
      width: "100%",
      height: "100%",
      borderRadius: 12,
      overflow: "hidden",
      background: "#0b1220",
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
      position: "relative",
    };

    const pill = {
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.04)",
    };

    const labelText = {
      fontWeight: 1000,
      letterSpacing: 1.2,
      fontSize: 12,
      color: "#e2e8f0",
      textTransform: "uppercase",
    };

    const statusText = {
      fontWeight: 1000,
      letterSpacing: 1,
      fontSize: 12,
      color: isActive ? "#0b1220" : "#e2e8f0",
      textTransform: "uppercase",
    };

    const lens = (on) => ({
      width: 12,
      height: 12,
      borderRadius: 999,
      background: on ? accent : "rgba(148,163,184,0.35)",
      boxShadow: on ? `0 0 14px ${accent}88` : "none",
      border: "1px solid rgba(255,255,255,0.12)",
      flex: "0 0 12px",
    });

    // -------------------------
    // STYLE: TILE (Industrial)
    // -------------------------
    const StyleTile = () => {
      return (
        <div style={cardBase} title={isActive ? "Alarm ACTIVE" : "Alarm inactive"}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isActive
                ? `linear-gradient(90deg, rgba(255,255,255,0.06), transparent 40%), ${bg}`
                : bg,
              opacity: 0.95,
            }}
          />
          <div
            style={{
              position: "relative",
              height: "100%",
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={labelText}>{text}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800 }}>
                {isActive ? "ACTIVE" : "NORMAL"}
              </div>
            </div>

            <div
              style={{
                ...pill,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isActive ? accent : "rgba(255,255,255,0.06)",
                borderColor: isActive ? `${accent}66` : "rgba(255,255,255,0.12)",
              }}
            >
              <span style={lens(isActive)} />
              <span style={statusText}>{isActive ? "ALARM" : "OFF"}</span>
            </div>
          </div>
        </div>
      );
    };

    // -------------------------
    // STYLE: BANNER (Modern)
    // -------------------------
    const StyleBanner = () => {
      const stripeOn = isActive;
      return (
        <div style={cardBase} title={isActive ? "Alarm ACTIVE" : "Alarm inactive"}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: bg,
              opacity: 0.95,
            }}
          />

          {/* stripe band */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: Math.max(10, Math.round(h * 0.18)),
              opacity: stripeOn ? 1 : 0.25,
              background: stripeOn
                ? `repeating-linear-gradient(135deg,
                    ${accent} 0, ${accent} 10px,
                    rgba(15,23,42,0.95) 10px, rgba(15,23,42,0.95) 20px)`
                : "rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          />

          <div
            style={{
              position: "relative",
              height: "100%",
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={lens(isActive)} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={labelText}>{text}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>
                  {isActive ? "ACTIVE" : "NORMAL"}
                </div>
              </div>
            </div>

            <div
              style={{
                fontWeight: 1000,
                fontSize: 12,
                letterSpacing: 1,
                color: isActive ? "#fff" : "#cbd5e1",
                textTransform: "uppercase",
                padding: "7px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              {isActive ? "ALARM" : "OFF"}
            </div>
          </div>
        </div>
      );
    };

    // -------------------------
    // STYLE: STACK (Lens + Label)
    // -------------------------
    const StyleStack = () => {
      return (
        <div style={cardBase} title={isActive ? "Alarm ACTIVE" : "Alarm inactive"}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: bg,
              opacity: 0.92,
            }}
          />
          <div
            style={{
              position: "relative",
              height: "100%",
              padding: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: Math.max(30, Math.round(Math.min(w, h) * 0.5)),
                height: Math.max(30, Math.round(Math.min(w, h) * 0.5)),
                borderRadius: 999,
                background: isActive ? accent : "rgba(148,163,184,0.22)",
                boxShadow: isActive ? `0 0 22px ${accent}aa` : "none",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={labelText}>{text}</div>
              <div
                style={{
                  fontWeight: 1000,
                  fontSize: 12,
                  letterSpacing: 1,
                  color: isActive ? "#fff" : "#cbd5e1",
                  textTransform: "uppercase",
                }}
              >
                {isActive ? "ALARM ACTIVE" : "NORMAL"}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // -------------------------
    // STYLE: MINIMAL (Clean)
    // -------------------------
    const StyleMinimal = () => {
      return (
        <div
          style={{
            ...cardBase,
            borderRadius: 14,
            background: "transparent",
            boxShadow: "none",
            border: `2px solid ${isActive ? accent : "rgba(148,163,184,0.25)"}`,
          }}
          title={isActive ? "Alarm ACTIVE" : "Alarm inactive"}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isActive ? `${accent}22` : "rgba(255,255,255,0.02)",
            }}
          />
          <div
            style={{
              position: "relative",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 6,
              padding: 10,
            }}
          >
            <div style={{ ...labelText, fontSize: 11, color: "#cbd5e1" }}>
              {text}
            </div>
            <div
              style={{
                fontWeight: 1100,
                fontSize: 16,
                letterSpacing: 2,
                color: isActive ? accent : "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              {isActive ? "ALARM" : "OFF"}
            </div>
          </div>
        </div>
      );
    };

    const renderByStyle = () => {
      if (alarmStyle === "tile") return <StyleTile />;
      if (alarmStyle === "stack") return <StyleStack />;
      if (alarmStyle === "minimal") return <StyleMinimal />;
      return <StyleBanner />; // default: banner
    };

    return (
      <div style={wrapStyle} onDoubleClick={handleDoubleClick}>
        {renderByStyle()}
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
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
          background: "#ef4444",
          border: "1px solid rgba(255,255,255,0.35)",
          boxShadow: "0 0 10px rgba(239,68,68,0.55)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
