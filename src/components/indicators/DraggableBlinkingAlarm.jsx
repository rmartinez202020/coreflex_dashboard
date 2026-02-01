import React from "react";

/**
 * DraggableBlinkingAlarm
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar): small preview + label, sets dataTransfer "shape"
 * 2) Canvas mode (Dashboard): renders blinking alarm widget using `tank`
 *
 * ✅ Behavior update:
 * - Background does NOT blink
 * - Only accent elements blink (bar + light)
 */
export default function DraggableBlinkingAlarm({
  // Canvas mode
  tank,

  // Palette mode
  label = "Blinking Alarm",
  onDragStart,
  onClick,

  // open settings modal on double click
  onOpenSettings,
}) {
  const payload = {
    shape: "blinkingAlarm",
    w: 240,
    h: 70,
    text: "ALARM",
    isActive: false,
    blinkMs: 500,

    // colors
    colorOn: "#ef4444",
    colorOff: "#0b1220",

    // style
    alarmStyle: "annunciator", // annunciator | banner | stackLight | minimal
    alarmTone: "critical", // optional (modal saves it)
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

    // ✅ IMPORTANT: these are now used ONLY for accents (NOT background)
    const colorOn =
      tank.colorOn ?? tank.properties?.colorOn ?? payload.colorOn;

    const colorOff =
      tank.colorOff ?? tank.properties?.colorOff ?? payload.colorOff;

    const alarmStyle =
      tank.properties?.alarmStyle ?? tank.alarmStyle ?? payload.alarmStyle;

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

    // ✅ BASE never blinks
    const baseBg = colorOff || "#0b1220";

    // ✅ Accent blinks between ON and "dim"
    const dimAccent = "rgba(148,163,184,0.22)";
    const accent = isActive ? (blinkOn ? colorOn : dimAccent) : dimAccent;

    const glow = isActive
      ? blinkOn
        ? `0 0 18px rgba(0,0,0,0), 0 0 18px ${hexToGlow(colorOn)}`
        : "inset 0 2px 10px rgba(0,0,0,0.45)"
      : "inset 0 2px 10px rgba(0,0,0,0.45)";

    const handleDoubleClick = (e) => {
      e.stopPropagation();
      onOpenSettings?.(tank);
    };

    const commonWrap = {
      width: w,
      height: h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
    };

    const title = isActive ? "Alarm ACTIVE" : "Alarm inactive";

    const textLeft = {
      fontWeight: 1000,
      letterSpacing: 1.2,
      fontSize: Math.max(12, Math.round(h * 0.22)),
      color: "#e5e7eb",
      textTransform: "uppercase",
      opacity: 0.95,
    };

    const textRight = {
      fontWeight: 900,
      letterSpacing: 1.4,
      fontSize: Math.max(11, Math.round(h * 0.18)),
      color: "rgba(226,232,240,0.7)",
      textTransform: "uppercase",
    };

    // =========================
    // ✅ PRO STYLES (NO BG BLINK)
    // =========================

    // 1) Annunciator Tile (Industrial): dot blinks only
    const Annunciator = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: baseBg,
          border: "1px solid rgba(148,163,184,0.25)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
        }}
        title={title}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: 1 }}>
            ALARM
          </div>
          <div style={textLeft}>{isActive ? "ACTIVE" : "NORMAL"}</div>
        </div>

        {/* ✅ blinking light */}
        <div
          style={{
            width: Math.max(12, Math.round(h * 0.22)),
            height: Math.max(12, Math.round(h * 0.22)),
            borderRadius: 999,
            background: accent,
            boxShadow: isActive && blinkOn ? `0 0 0 4px ${hexToGlow(colorOn)}` : "none",
            border: "2px solid rgba(255,255,255,0.10)",
            transition: "all 120ms linear",
          }}
        />
      </div>
    );

    // 2) Banner Strip (Modern): hazard stripe bar blinks only
    const Banner = () => {
      const stripeColor = accent;
      const stripe = isActive
        ? `repeating-linear-gradient(45deg, ${stripeColor}, ${stripeColor} 10px, rgba(0,0,0,0.45) 10px, rgba(0,0,0,0.45) 20px)`
        : "rgba(148,163,184,0.14)";

      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 14,
            background: baseBg,
            border: "1px solid rgba(148,163,184,0.25)",
            boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          title={title}
        >
          {/* ✅ blinking bar only */}
          <div
            style={{
              height: Math.max(10, Math.round(h * 0.22)),
              background: stripe,
              opacity: isActive ? 1 : 0.75,
              transition: "all 120ms linear",
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
            }}
          >
            <div style={textLeft}>{text}</div>
            <div style={textRight}>{isActive ? "ACTIVE" : "NORMAL"}</div>
          </div>
        </div>
      );
    };

    // 3) Stack Light (Lens + Label): lens blinks only
    const StackLight = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: baseBg,
          border: "1px solid rgba(148,163,184,0.25)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.22)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 14px",
        }}
        title={title}
      >
        <div
          style={{
            width: Math.max(18, Math.round(h * 0.38)),
            height: Math.max(18, Math.round(h * 0.38)),
            borderRadius: 999,
            background: accent,
            border: "2px solid rgba(255,255,255,0.10)",
            boxShadow: isActive && blinkOn ? `0 0 14px ${hexToGlow(colorOn)}` : "none",
            transition: "all 120ms linear",
          }}
        />
        <div style={{ ...textLeft, fontSize: Math.max(12, Math.round(h * 0.2)) }}>
          {isActive ? "ALARM ACTIVE" : "NORMAL"}
        </div>
      </div>
    );

    // 4) Minimal Outline (Clean): border glow blinks only (fill stays dark)
    const Minimal = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: baseBg,
          border: `1px solid ${
            isActive ? (blinkOn ? hexToGlow(colorOn) : "rgba(148,163,184,0.25)") : "rgba(148,163,184,0.25)"
          }`,
          boxShadow: isActive ? glow : "0 10px 26px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 120ms linear",
        }}
        title={title}
      >
        <div
          style={{
            fontWeight: 1000,
            letterSpacing: 2,
            fontSize: Math.max(13, Math.round(h * 0.26)),
            color: isActive ? (blinkOn ? colorOn : "rgba(226,232,240,0.75)") : "rgba(226,232,240,0.75)",
            textTransform: "uppercase",
            transition: "all 120ms linear",
          }}
        >
          {isActive ? "ALARM" : "OFF"}
        </div>
      </div>
    );

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
          borderRadius: 999,
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

// ✅ helper: convert hex to a soft glow rgba-ish string
function hexToGlow(hex) {
  if (!hex || typeof hex !== "string") return "rgba(239,68,68,0.55)";
  const c = hex.replace("#", "").trim();
  if (c.length !== 6) return "rgba(239,68,68,0.55)";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "rgba(239,68,68,0.55)";
  return `rgba(${r},${g},${b},0.55)`;
}
