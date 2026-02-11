import React from "react";

export default function DraggableBlinkingAlarm({
  // Canvas mode
  tank,
  sensorsData, // ✅ live data already polled by parent (every 3s)

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
    blinkMs: 500,

    // colors (used as fallback accents)
    colorOn: "#ef4444",
    colorOff: "#0b1220",

    // style
    alarmStyle: "annunciator", // annunciator | banner | stackLight | minimal
    alarmTone: "critical", // critical | warning | info
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const p = tank.properties || {};

    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    const text = tank.text ?? p.text ?? p.label ?? payload.text;

    const blinkMs = p.blinkMs ?? tank.blinkMs ?? payload.blinkMs;

    // ✅ IMPORTANT: read ONLY from properties (this matches your modal save)
    const alarmStyle = p.alarmStyle ?? payload.alarmStyle;
    const alarmTone = p.alarmTone ?? payload.alarmTone;

    // ✅ tone → accent ON color (does NOT affect background)
    const toneMap = {
      critical: { on: "#ef4444", glow: "rgba(239,68,68,0.55)" },
      warning: { on: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
      info: { on: "#3b82f6", glow: "rgba(59,130,246,0.45)" },
    };
    const tone = toneMap[alarmTone] || toneMap.critical;

    // ✅ If modal saved colorOn/colorOff, use those
    const colorOn = p.colorOn ?? tone.on ?? payload.colorOn;
    const baseBg = p.colorOff ?? payload.colorOff ?? "#0b1220";

    // =========================
    // ✅ TAG-DRIVEN ACTIVE (DEFAULT OFF)
    // =========================
    const tag = p.tag || {};
    const tagModel = String(tag?.model || "").trim(); // ✅ new
    const tagDeviceId = String(tag?.deviceId || "").trim();
    const tagField = String(tag?.field || "").trim();

    // ---- helpers (same as modal) ----
    const to01 = (v) => {
      if (v === undefined || v === null) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      if (typeof v === "number") return v > 0 ? 1 : 0;
      if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
        if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
        const n = Number(s);
        if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
      }
      return v ? 1 : 0;
    };

    const readTagFromRow = (row, field) => {
      if (!row || !field) return undefined;

      if (row[field] !== undefined) return row[field];

      const up = String(field).toUpperCase();
      if (row[up] !== undefined) return row[up];

      // di1..di6 -> in1..in6
      if (/^di[1-6]$/.test(field)) {
        const n = field.replace("di", "");
        const alt = `in${n}`;
        if (row[alt] !== undefined) return row[alt];
        const altUp = `IN${n}`;
        if (row[altUp] !== undefined) return row[altUp];
      }

      // do1..do4 -> out1..out4
      if (/^do[1-4]$/.test(field)) {
        const n = field.replace("do", "");
        const alt = `out${n}`;
        if (row[alt] !== undefined) return row[alt];
        const altUp = `OUT${n}`;
        if (row[altUp] !== undefined) return row[altUp];
      }

      return undefined;
    };

    const findDeviceRow = () => {
      const list = sensorsData?.devices;
      if (!Array.isArray(list) || !tagDeviceId) return null;

      // match possible shapes: deviceId / device_id / id
      return (
        list.find((r) => String(r?.deviceId ?? r?.device_id ?? r?.id ?? "").trim() === tagDeviceId) ||
        null
      );
    };

    const readTagValue = () => {
      if (!tagDeviceId || !tagField) return undefined;

      // A) sensorsData.values[deviceId][field] (legacy/optional)
      const byDev = sensorsData?.values?.[String(tagDeviceId)];
      if (byDev && Object.prototype.hasOwnProperty.call(byDev, tagField)) {
        return byDev[tagField];
      }

      // B) read from devices row (preferred)
      const row = findDeviceRow();
      if (row) {
        const v = readTagFromRow(row, tagField);
        if (v !== undefined) return v;
      }

      // C) fallback: sensorsData.tags[deviceId][field] if exists
      const v2 = sensorsData?.tags?.[String(tagDeviceId)]?.[tagField];
      if (v2 !== undefined) return v2;

      return undefined;
    };

    const deviceRow = findDeviceRow();
    const backendStatus = String(deviceRow?.status || "").trim().toLowerCase();
    const deviceIsOnline = backendStatus ? backendStatus === "online" : true; // if not present, don't block

    const v = readTagValue();
    const v01 = deviceIsOnline ? to01(v) : null;

    // ✅ DEFAULT OFF if tag not bound / missing / false
    const isActive = !!(tagDeviceId && tagField && deviceIsOnline && v01 === 1);

    // =========================
    // ✅ BLINK ENGINE (accents only)
    // =========================
    const [blinkOn, setBlinkOn] = React.useState(true);

    React.useEffect(() => {
      if (!isActive) {
        setBlinkOn(true);
        return;
      }
      const ms = Math.max(120, Number(blinkMs) || 500);
      const t = setInterval(() => setBlinkOn((x) => !x), ms);
      return () => clearInterval(t);
    }, [isActive, blinkMs]);

    // ✅ Accent blinks between ON color and dim
    const dimAccent = "rgba(148,163,184,0.22)";
    const accent = isActive ? (blinkOn ? colorOn : dimAccent) : dimAccent;

    const glow = isActive
      ? blinkOn
        ? `0 0 18px ${tone.glow || hexToGlow(colorOn)}`
        : "inset 0 2px 10px rgba(0,0,0,0.45)"
      : "inset 0 2px 10px rgba(0,0,0,0.45)";

    const handleDoubleClick = () => {
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

    const title = `BlinkingAlarm | ${isActive ? "ON" : "OFF"} | style=${
      alarmStyle || "annunciator"
    } | tone=${alarmTone || "critical"} | bound=${tagDeviceId || "—"}/${
      tagField || "—"
    }`;

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
            {String(text || "ALARM").toUpperCase()}
          </div>
          <div style={textLeft}>{isActive ? "ACTIVE" : "NORMAL"}</div>
        </div>

        <div
          style={{
            width: Math.max(12, Math.round(h * 0.22)),
            height: Math.max(12, Math.round(h * 0.22)),
            borderRadius: 999,
            background: accent,
            boxShadow:
              isActive && blinkOn
                ? `0 0 0 4px ${tone.glow || hexToGlow(colorOn)}`
                : "none",
            border: "2px solid rgba(255,255,255,0.10)",
            transition: "all 120ms linear",
          }}
        />
      </div>
    );

    // 2) Banner Strip (Modern)
    const Banner = () => {
      const bar = isActive
        ? `repeating-linear-gradient(
            45deg,
            ${accent},
            ${accent} 10px,
            rgba(0,0,0,0.45) 10px,
            rgba(0,0,0,0.45) 20px
          )`
        : "rgba(148,163,184,0.18)";

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
          <div
            style={{
              height: Math.max(10, Math.round(h * 0.22)),
              background: bar,
              opacity: isActive ? 1 : 0.7,
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
              opacity: isActive ? 1 : 0.85,
            }}
          >
            <span style={textLeft}>{isActive ? "ALARM" : "OFF"}</span>
            <span style={textRight}>{isActive ? "ACTIVE" : "NORMAL"}</span>
          </div>
        </div>
      );
    };

    // 3) Stack Light (Lens + Label)
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
            boxShadow:
              isActive && blinkOn ? `0 0 14px ${tone.glow || hexToGlow(colorOn)}` : "none",
            transition: "all 120ms linear",
          }}
        />
        <div style={{ ...textLeft, fontSize: Math.max(12, Math.round(h * 0.2)) }}>
          {isActive ? "ALARM ACTIVE" : "NORMAL"}
        </div>
      </div>
    );

    // 4) Minimal Outline (Clean)
    const Minimal = () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: baseBg,
          border: `1px solid ${
            isActive
              ? blinkOn
                ? tone.glow || hexToGlow(colorOn)
                : "rgba(148,163,184,0.25)"
              : "rgba(148,163,184,0.25)"
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
            color: isActive
              ? blinkOn
                ? colorOn
                : "rgba(226,232,240,0.75)"
              : "rgba(226,232,240,0.75)",
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
      return <Annunciator />;
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
