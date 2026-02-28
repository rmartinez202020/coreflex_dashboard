import React, { useMemo } from "react";

const DEFAULT_UNITS = [
  // Volume
  { value: "gal", label: "Gallons (gal)" },
  { value: "L", label: "Liters (L)" },
  { value: "m3", label: "Cubic meters (m³)" },
  { value: "ft3", label: "Cubic feet (ft³)" },

  // Energy
  { value: "kWh", label: "Kilowatt-hours (kWh)" },
  { value: "Wh", label: "Watt-hours (Wh)" },
  { value: "MJ", label: "Megajoules (MJ)" },

  // Mass
  { value: "lb", label: "Pounds (lb)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "ton", label: "Tons (ton)" },

  // Count / runtime
  { value: "count", label: "Count (count)" },
  { value: "cycles", label: "Cycles (cycles)" },
  { value: "hrs", label: "Hours (hrs)" },
  { value: "min", label: "Minutes (min)" },
];

export default function GraphicDisplayTotalizerSection({
  enabled = false,
  onToggleEnabled = () => {},

  // This becomes your “units label” but now under Totalizer
  totalizerUnit = "",
  onChangeUnit = () => {},

  // optional: allow injecting custom list later
  unitOptions = DEFAULT_UNITS,

  // allow “custom” unit entry
  allowCustomUnit = true,

  // optional helper text
  helperText = "Use Totalizer when the trend is a RATE (ex: GPM) and you want an accumulated TOTAL (ex: gallons).",
}) {
  const normalizedUnit = String(totalizerUnit || "").trim();

  const isPreset = useMemo(() => {
    return (unitOptions || []).some((u) => u.value === normalizedUnit);
  }, [unitOptions, normalizedUnit]);

  const containerStyle = {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  };

  const sectionTitleStyle = {
    fontWeight: 900,
    fontSize: 13,
    color: "#111",
    marginBottom: 10,
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 800,
    color: "#111",
    marginBottom: 6,
  };

  const selectStyle = {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "0 10px",
    fontWeight: 800,
    width: "100%",
  };

  const inputStyle = {
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "0 10px",
    fontWeight: 800,
    width: "100%",
  };

  const toggleBtnStyle = {
    height: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: enabled ? "1px solid rgba(22,163,74,0.35)" : "1px solid rgba(148,163,184,0.45)",
    background: enabled ? "rgba(187,247,208,0.65)" : "rgba(226,232,240,0.65)",
    color: enabled ? "#166534" : "#334155",
    fontWeight: 900,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <div style={sectionTitleStyle}>Totalizer</div>

        <div style={{ marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => onToggleEnabled(!enabled)}
            style={toggleBtnStyle}
            title={enabled ? "Disable totalizer" : "Enable totalizer"}
          >
            {enabled ? "✅ Enabled" : "⛔ Disabled"}
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, marginBottom: 10 }}>
        {helperText}
      </div>

      {/* Unit selector */}
      <div style={{ marginBottom: 10, opacity: enabled ? 1 : 0.55, pointerEvents: enabled ? "auto" : "none" }}>
        <div style={labelStyle}>Totalizer Units</div>

        <select
          value={isPreset ? normalizedUnit : "__custom__"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__custom__") {
              // keep current unit; user can type below
              if (!allowCustomUnit) onChangeUnit("");
              return;
            }
            onChangeUnit(v);
          }}
          style={selectStyle}
        >
          <option value="">Select units…</option>
          {(unitOptions || []).map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
          {allowCustomUnit && <option value="__custom__">Custom…</option>}
        </select>

        {allowCustomUnit && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#111", marginBottom: 6 }}>
              Custom Unit (optional)
            </div>
            <input
              value={normalizedUnit}
              onChange={(e) => onChangeUnit(e.target.value)}
              placeholder='Example: "gal", "kWh", "cycles"'
              style={inputStyle}
            />
          </div>
        )}
      </div>
    </div>
  );
}