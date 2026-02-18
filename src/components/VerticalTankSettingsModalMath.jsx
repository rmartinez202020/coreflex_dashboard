// src/components/VerticalTankSettingsModalMath.jsx
import React from "react";

function ensureAlpha(color) {
  const c = String(color || "").trim();
  if (!c) return "#60a5fa88";
  if (/^#[0-9a-fA-F]{6}$/.test(c)) return `${c}88`;
  return c;
}

export default function VerticalTankSettingsModalMath({
  sectionTitleStyle,
  labelStyle,
  fieldInputStyle,
  // values + setters
  name,
  setName,
  liveValue,
  outputValue,
  density,
  setDensity,
  maxCapacity,
  setMaxCapacity,
  materialColor,
  setMaterialColor,
  toNum,
}) {
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
      <div style={sectionTitleStyle}>Math</div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={labelStyle}>Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={fieldInputStyle}
          placeholder="Example: Tank #1"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Live VALUE</div>
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 120,
              height: 34,
              padding: "0 14px",
              borderRadius: 999,
              background: "rgba(187,247,208,0.55)",
              border: "1px solid rgba(22,163,74,0.25)",
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#0b3b18",
            }}
          >
            {Number.isFinite(Number(liveValue)) ? Number(liveValue).toFixed(2) : "--"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Output</div>
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 120,
              height: 34,
              padding: "0 14px",
              borderRadius: 999,
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {typeof outputValue === "number"
              ? Number(outputValue).toFixed(2)
              : Number.isFinite(Number(outputValue))
              ? Number(outputValue).toFixed(2)
              : String(outputValue ?? "0.00")}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Math</div>
        <textarea
          value={density}
          onChange={(e) => setDensity(String(e.target.value))}
          rows={4}
          style={{
            marginTop: 6,
            width: "100%",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            padding: 10,
            fontFamily: "monospace",
            fontSize: 12,
            outline: "none",
            background: "#fff",
          }}
          placeholder='Example: VALUE*1.5  or  CONCAT("Temp=", VALUE)'
        />
      </div>

      <div
        style={{
          borderTop: "1px dashed #e5e7eb",
          paddingTop: 12,
          marginTop: 4,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={sectionTitleStyle}>Capacity &amp; Color</div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={labelStyle}>Max Capacity</div>
          <input
            type="number"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(toNum(e.target.value))}
            style={fieldInputStyle}
            placeholder="Example: 5000"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div style={labelStyle}>Material / Liquid Color</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={String(materialColor || "#60a5fa").slice(0, 7)}
              onChange={(e) => setMaterialColor(ensureAlpha(e.target.value))}
              style={{
                width: 44,
                height: 38,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
                padding: 4,
                cursor: "pointer",
              }}
            />
            <input
              value={materialColor}
              onChange={(e) => setMaterialColor(ensureAlpha(e.target.value))}
              style={fieldInputStyle}
              placeholder="#00ff00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
