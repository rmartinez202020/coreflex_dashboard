// src/components/DisplaySettingsmodalOptions.jsx
import React from "react";

/**
 * Display style picker for Display Output widget.
 * Saves a simple string key (styleId) into tank.properties.displayStyle.
 *
 * 4 styles (includes the current/original one):
 * - classic (original)
 * - minimal
 * - darkDigital
 * - glassRounded
 */

const STYLES = [
  {
    id: "classic",
    title: "Classic (Original)",
    desc: "Your current look (light background, strong border).",
    sample: {
      bg: "#f3f4f6",
      border: "#6b7280",
      text: "#111827",
      radius: 8,
      shadow: "inset 0 0 8px rgba(0,0,0,0.25)",
      letterSpacing: 5,
      fontWeight: 800,
    },
  },
  {
    id: "minimal",
    title: "Minimal",
    desc: "Clean and simple (thin border, less shadow).",
    sample: {
      bg: "#ffffff",
      border: "#cbd5e1",
      text: "#0f172a",
      radius: 10,
      shadow: "none",
      letterSpacing: 4,
      fontWeight: 700,
    },
  },
  {
    id: "darkDigital",
    title: "Dark Digital",
    desc: "Dark screen + bright text (SCADA night mode).",
    sample: {
      bg: "#0b1220",
      border: "#1d4ed8",
      text: "#22c55e",
      radius: 10,
      shadow: "inset 0 0 12px rgba(0,0,0,0.55)",
      letterSpacing: 5,
      fontWeight: 900,
    },
  },
  {
    id: "glassRounded",
    title: "Glass Rounded",
    desc: "Soft glass look (rounded, subtle glow).",
    sample: {
      bg: "rgba(255,255,255,0.65)",
      border: "rgba(59,130,246,0.55)",
      text: "#0f172a",
      radius: 16,
      shadow:
        "0 8px 18px rgba(2, 6, 23, 0.18), inset 0 0 10px rgba(255,255,255,0.35)",
      letterSpacing: 4,
      fontWeight: 800,
    },
  },
];

function SampleDisplay({ label = "Temp", value = "12068", styleId = "classic" }) {
  const style = STYLES.find((s) => s.id === styleId)?.sample || STYLES[0].sample;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 6,
        }}
      >
        Preview
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#334155",
            textAlign: "center",
          }}
        >
          {label}
        </div>

        <div
          style={{
            width: "100%",
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: style.radius,
            boxShadow: style.shadow,
            fontFamily: "monospace",
            fontSize: 22,
            fontWeight: style.fontWeight,
            color: style.text,
            letterSpacing: style.letterSpacing,
            padding: "0 10px",
            userSelect: "none",
          }}
          title="Preview only"
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ✅ card renderer (reused for single + compact grid)
function StyleCard({
  s,
  active,
  onPick,
  previewValue,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={() => onPick?.(s.id)}
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 12,
        border: active ? "2px solid #22c55e" : "1px solid #e5e7eb",
        background: active ? "rgba(187,247,208,0.35)" : "#fff",
        padding: compact ? 10 : 12,
        cursor: "pointer",
        display: "grid",
        gap: compact ? 6 : 6,
        minWidth: 0,
      }}
      title="Select style"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div
          style={{
            fontWeight: 800,
            color: "#0f172a",
            fontSize: compact ? 13 : 14,
            lineHeight: 1.15,
          }}
        >
          {s.title}
        </div>
        {active ? (
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "#16a34a",
              border: "1px solid rgba(22,163,74,0.35)",
              background: "rgba(187,247,208,0.55)",
              padding: "2px 10px",
              borderRadius: 999,
              alignSelf: "center",
              whiteSpace: "nowrap",
            }}
          >
            Selected
          </div>
        ) : null}
      </div>

      <div style={{ fontSize: 12, color: "#475569" }}>{s.desc}</div>

      {/* tiny mini-preview bar */}
      <div
        style={{
          height: compact ? 34 : 36,
          borderRadius: s.sample.radius,
          border: `2px solid ${s.sample.border}`,
          background: s.sample.bg,
          boxShadow: s.sample.shadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontWeight: s.sample.fontWeight,
          color: s.sample.text,
          letterSpacing: s.sample.letterSpacing,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "0 8px",
        }}
      >
        {previewValue}
      </div>
    </button>
  );
}

export default function DisplaySettingsmodalOptions({
  value = "classic",
  onChange,
  previewLabel = "Temp",
  previewValue = "12068",
}) {
  // ✅ top two full width, bottom two side-by-side
  const classic = STYLES.find((s) => s.id === "classic");
  const minimal = STYLES.find((s) => s.id === "minimal");
  const darkDigital = STYLES.find((s) => s.id === "darkDigital");
  const glassRounded = STYLES.find((s) => s.id === "glassRounded");

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16 }}>Display Style</div>

      <SampleDisplay label={previewLabel} value={previewValue} styleId={value} />

      <div style={{ display: "grid", gap: 10 }}>
        {/* ✅ Full-width top two */}
        {classic ? (
          <StyleCard
            s={classic}
            active={classic.id === value}
            onPick={onChange}
            previewValue={previewValue}
          />
        ) : null}

        {minimal ? (
          <StyleCard
            s={minimal}
            active={minimal.id === value}
            onPick={onChange}
            previewValue={previewValue}
          />
        ) : null}

        {/* ✅ Bottom two in 2 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          {darkDigital ? (
            <StyleCard
              s={darkDigital}
              active={darkDigital.id === value}
              onPick={onChange}
              previewValue={previewValue}
              compact
            />
          ) : null}

          {glassRounded ? (
            <StyleCard
              s={glassRounded}
              active={glassRounded.id === value}
              onPick={onChange}
              previewValue={previewValue}
              compact
            />
          ) : null}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.35 }}>
        This saves into <b>tank.properties.displayStyle</b>. Next step is to make{" "}
        <b>DraggableDisplayBox</b> render using this style key.
      </div>
    </div>
  );
}
