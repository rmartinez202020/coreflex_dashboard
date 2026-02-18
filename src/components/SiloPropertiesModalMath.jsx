// src/components/SiloPropertiesModalMath.jsx
import React from "react";

export default function SiloPropertiesModalMath({
  // styles
  sectionTitleStyle,
  labelStyle,
  fieldInputStyle,
  fieldSelectStyle,

  // unit options
  UNIT_OPTIONS,

  // values + setters
  title,
  setTitle,
  unit,
  setUnit,

  liveValue,
  outputValue,

  density,
  setDensity,

  maxCapacity,
  setMaxCapacity,
  materialColor,
  setMaterialColor,

  // helpers
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

      {/* ✅ Title */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={labelStyle}>Title</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={fieldInputStyle}
          placeholder="Example: Silo #1"
        />
      </div>

      {/* ✅ Unit picker */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={labelStyle}>Unit</div>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} style={fieldSelectStyle}>
          {UNIT_OPTIONS.map((u) => (
            <option key={u.key} value={u.key}>
              {u.label}
            </option>
          ))}
        </select>
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
            {Number.isFinite(Number(liveValue))
              ? `${Number(liveValue).toFixed(2)}${unit ? ` ${unit}` : ""}`
              : "--"}
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
            {typeof outputValue === "string"
              ? `${outputValue || "--"}${unit ? ` ${unit}` : ""}`
              : Number.isFinite(Number(outputValue))
              ? `${Number(outputValue).toFixed(2)}${unit ? ` ${unit}` : ""}`
              : `0.00${unit ? ` ${unit}` : ""}`}
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Math</div>
        <textarea
          value={density}
          onChange={(e) => setDensity(e.target.value)}
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

      {/* ✅ Capacity + Material/Liquid Color */}
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
              value={materialColor}
              onChange={(e) => setMaterialColor(e.target.value)}
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
              onChange={(e) => setMaterialColor(e.target.value)}
              style={fieldInputStyle}
              placeholder="#00ff00"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
