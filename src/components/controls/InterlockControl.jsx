import React from "react";

export default function InterlockControl({
  // ✅ State
  locked = true,

  // ✅ Layout
  width = 220,
  height = 86,

  // ✅ From settings modal
  interlockStyle = "shield", // shield|gate|pill|minimal
  colorOn = "#ef4444",
  colorOff = "#0b1220",

  // Optional label text
  title = "INTERLOCK",
  lockedText = "LOCKED",
  unlockedText = "UNLOCKED",
}) {
  const isOn = Boolean(locked); // ON => LOCKED

  const statusText = isOn ? lockedText : unlockedText;

  // ✅ helper: best-effort glow color from hex/rgb
  const toGlow = (c, alpha = 0.55) => {
    if (!c) return `rgba(239,68,68,${alpha})`;
    if (String(c).startsWith("rgba(") || String(c).startsWith("rgb(")) return c;
    // hex -> rgba (simple)
    const hex = String(c).replace("#", "").trim();
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return `rgba(239,68,68,${alpha})`;
  };

  const ON = colorOn;
  const OFF = colorOff;

  const glow = toGlow(ON, 0.55);

  // =========================
  // STYLE: shield (your current “industrial lock lens”)
  // =========================
  const Shield = () => {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: 16,
          position: "relative",
          userSelect: "none",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.45)",
          background:
            "linear-gradient(180deg, #2a2f36 0%, #15181d 55%, #0b0d10 100%)",
          boxShadow:
            isOn
              ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.30), 0 0 16px ${glow}`
              : "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.30)",
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          gap: 14,
        }}
      >
        {/* subtle gloss */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 22%, rgba(255,255,255,0) 55%)",
            pointerEvents: "none",
          }}
        />

        {/* LEFT: lock lens */}
        <div
          style={{
            width: height - 20,
            height: height - 20,
            borderRadius: 14,
            background: isOn
              ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, ${ON} 38%, rgba(0,0,0,0.65) 100%)`
              : `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18) 0%, rgba(148,163,184,0.20) 38%, rgba(0,0,0,0.70) 100%)`,
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: isOn
              ? `inset 0 2px 10px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.4), 0 0 16px ${glow}`
              : "inset 0 2px 10px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 30,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6))",
            }}
          >
            {isOn ? "🔒" : "🔓"}
          </span>
        </div>

        {/* CENTER: text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.95)",
              fontWeight: 900,
              letterSpacing: 1.2,
              fontSize: 16,
            }}
          >
            {title}
          </div>

          <div
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: 0.8,
              color: isOn ? "#fff" : "rgba(226,232,240,0.82)",
              background: isOn
                ? `linear-gradient(180deg, ${ON}, rgba(0,0,0,0.35))`
                : "linear-gradient(180deg, rgba(148,163,184,0.20), rgba(15,23,42,0.75))",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: isOn ? `0 0 14px ${glow}` : "inset 0 1px 0 rgba(255,255,255,0.10)",
              width: "fit-content",
            }}
          >
            {statusText}
          </div>
        </div>

        {/* RIGHT: indicator dot */}
        <div
          style={{
            marginLeft: "auto",
            width: 14,
            height: 14,
            borderRadius: 999,
            background: isOn
              ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55) 0%, ${ON} 45%, rgba(0,0,0,0.65) 100%)`
              : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18) 0%, rgba(148,163,184,0.26) 45%, rgba(0,0,0,0.70) 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: isOn
              ? `inset 0 2px 6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${glow}`
              : "inset 0 2px 6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    );
  };

  // =========================
  // STYLE: gate (banner-like bar)
  // =========================
  const Gate = () => {
    const topBar = isOn
      ? `linear-gradient(90deg, ${ON}, rgba(0,0,0,0.25))`
      : "linear-gradient(90deg, rgba(148,163,184,0.22), rgba(0,0,0,0.25))";

    return (
      <div
        style={{
          width,
          height,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.45)",
          background: OFF,
          boxShadow: isOn
            ? `0 10px 24px rgba(0,0,0,0.28), 0 0 18px ${glow}`
            : "0 10px 24px rgba(0,0,0,0.22)",
          position: "relative",
          userSelect: "none",
        }}
      >
        <div style={{ height: 14, background: topBar }} />

        <div
          style={{
            height: "calc(100% - 14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, letterSpacing: 1 }}>
              {title}
            </div>
            <div style={{ fontSize: 16, fontWeight: 1000 }}>
              {isOn ? "LOCKED" : "CLEAR"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                fontSize: 22,
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.6))",
                opacity: isOn ? 1 : 0.85,
              }}
            >
              {isOn ? "🔒" : "🔓"}
            </div>

            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: isOn ? ON : "rgba(148,163,184,0.35)",
                boxShadow: isOn ? `0 0 12px ${glow}` : "none",
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // STYLE: pill (compact badge + dot)
  // =========================
  const Pill = () => {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.45)",
          background: "linear-gradient(180deg, #0f172a, #0b1220)",
          boxShadow: isOn
            ? `0 10px 24px rgba(0,0,0,0.28), 0 0 18px ${glow}`
            : "0 10px 24px rgba(0,0,0,0.22)",
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          gap: 12,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 1000,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {title}
          </div>

          <div
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${isOn ? glow : "rgba(148,163,184,0.22)"}`,
              background: isOn ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.10)",
              color: isOn ? "#fff" : "rgba(226,232,240,0.78)",
              fontWeight: 1000,
              fontSize: 13,
              width: "fit-content",
            }}
          >
            {statusText}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22 }}>{isOn ? "🔒" : "🔓"}</div>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: isOn ? ON : "rgba(148,163,184,0.30)",
              boxShadow: isOn ? `0 0 14px ${glow}` : "none",
            }}
          />
        </div>
      </div>
    );
  };

  // =========================
  // STYLE: minimal (clean outline)
  // =========================
  const Minimal = () => {
    return (
      <div
        style={{
          width,
          height,
          borderRadius: 16,
          border: `1px solid ${isOn ? glow : "rgba(148,163,184,0.20)"}`,
          background: "rgba(2,6,23,0.92)",
          boxShadow: isOn ? `0 0 18px ${glow}` : "0 10px 24px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          gap: 12,
          userSelect: "none",
          color: "white",
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: isOn ? ON : "rgba(148,163,184,0.25)",
            boxShadow: isOn ? `0 0 12px ${glow}` : "none",
          }}
        />
        <div style={{ fontWeight: 1000, letterSpacing: 0.6 }}>
          {isOn ? "INTERLOCK" : "OFF"}
        </div>
        <div style={{ marginLeft: "auto", fontFamily: "monospace", opacity: 0.9 }}>
          {statusText}
        </div>
      </div>
    );
  };

  // =========================
  // SWITCH
  // =========================
  if (interlockStyle === "gate") return <Gate />;
  if (interlockStyle === "pill") return <Pill />;
  if (interlockStyle === "minimal") return <Minimal />;
  return <Shield />; // default
}
