// src/components/controls/graphicDisplay/GraphicDisplayTotalizerSection.jsx
import React, { useMemo } from "react";

const UNIT_PRESETS = [
  { value: "", label: "Custom..." },

  // Flow totals
  { value: "gal", label: "gal (gallons)" },
  { value: "L", label: "L (liters)" },
  { value: "m³", label: "m³ (cubic meters)" },
  { value: "ft³", label: "ft³ (cubic feet)" },

  // Energy totals
  { value: "kWh", label: "kWh" },
  { value: "Wh", label: "Wh" },
  { value: "MJ", label: "MJ" },

  // Mass totals
  { value: "lb", label: "lb" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "ton" },
];

export default function GraphicDisplayTotalizerSection({
  enabled = false,
  onToggleEnabled = () => {},
  totalizerUnit = "",
  onChangeUnit = () => {},
}) {
  const presetValue = useMemo(() => {
    const t = String(totalizerUnit || "").trim();
    const hit = UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? t : "";
  }, [totalizerUnit]);

  const customUnit = useMemo(() => {
    const t = String(totalizerUnit || "").trim();
    if (!t) return "";
    const hit = UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? "" : t;
  }, [totalizerUnit]);

  const btnBase = {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    userSelect: "none",
  };

  const btnOn = {
    ...btnBase,
    border: "1px solid #86efac",
    background: "linear-gradient(180deg,#bbf7d0,#86efac)",
    color: "#064e3b",
  };

  const btnOff = {
    ...btnBase,
    border: "1px solid #fecaca",
    background: "linear-gradient(180deg,#fee2e2,#fecaca)",
    color: "#7f1d1d",
  };

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900, color: "#111827" }}>Totalizer</div>

        <div style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onToggleEnabled(true)}
            style={enabled ? btnOn : btnBase}
            title="Enable Totalizer"
          >
            ✅ Enable
          </button>

          <button
            type="button"
            onClick={() => onToggleEnabled(false)}
            style={!enabled ? btnOff : btnBase}
            title="Disable Totalizer"
          >
            ⛔ Disable
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: "#6b7280" }}>
        Use Totalizer when the trend is a <b>RATE</b> (ex: GPM) and you want an accumulated{" "}
        <b>TOTAL</b> (ex: gallons).
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
            Totalizer Units
          </span>

          <select
            value={presetValue}
            onChange={(e) => {
              const v = String(e.target.value || "");
              if (!v) {
                // Custom... keep current custom unit (or blank)
                onChangeUnit(customUnit || "");
              } else {
                onChangeUnit(v);
              }
            }}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
              background: enabled ? "#fff" : "#f9fafb",
              opacity: enabled ? 1 : 0.75,
            }}
            disabled={!enabled}
          >
            {UNIT_PRESETS.map((u) => (
              <option key={u.label} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
            Custom Unit (optional)
          </span>

          <input
            value={customUnit}
            onChange={(e) => onChangeUnit(e.target.value)}
            placeholder="e.g. PSI, gal, kWh"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
              background: enabled ? "#fff" : "#f9fafb",
              opacity: enabled ? 1 : 0.75,
            }}
            disabled={!enabled || presetValue !== ""}
          />
        </label>
      </div>
    </div>
  );
}