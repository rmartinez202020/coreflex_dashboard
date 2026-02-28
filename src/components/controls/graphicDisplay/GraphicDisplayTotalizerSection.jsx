// src/components/controls/graphicDisplay/GraphicDisplayTotalizerSection.jsx
import React, { useMemo } from "react";

/**
 * ✅ TOTALIZER SHOULD ONLY USE RATE UNITS (NOT TOTAL UNITS)
 * - user selects RATE unit (ex: GPM)
 * - CoreFlex totalizer will integrate over time to produce TOTAL (ex: gal)
 *
 * We also show the auto-derived TOTAL unit to the user (read-only).
 */

const RATE_UNIT_PRESETS = [
  { value: "", label: "Select rate unit..." },

  // 🇺🇸 US / Imperial — Liquid Flow
  { value: "GPM", label: "GPM — gallons per minute" },
  { value: "GPH", label: "GPH — gallons per hour" },
  { value: "BPD", label: "BPD — barrels per day" },
  { value: "BBL/h", label: "BBL/h — barrels per hour" },

  // 🇺🇸 US / Imperial — Air / Gas
  { value: "CFM", label: "CFM — cubic feet per minute" },
  { value: "SCFM", label: "SCFM — standard cubic feet per minute" },
  { value: "ACFM", label: "ACFM — actual cubic feet per minute" },

  // 🌍 Metric — Flow
  { value: "LPM", label: "LPM — liters per minute" },
  { value: "LPH", label: "LPH — liters per hour" },
  { value: "m³/h", label: "m³/h — cubic meters per hour" },
  { value: "m³/min", label: "m³/min — cubic meters per minute" },

  // 🌍 Metric — Mass Flow
  { value: "kg/h", label: "kg/h — kilograms per hour" },
  { value: "kg/min", label: "kg/min — kilograms per minute" },
  { value: "kg/s", label: "kg/s — kilograms per second" },

  // 🇺🇸 Mass Flow
  { value: "lb/h", label: "lb/h — pounds per hour" },
  { value: "lb/min", label: "lb/min — pounds per minute" },
  { value: "ton/h", label: "ton/h — tons per hour" },

  // ⚡ Energy / Power (rate)
  { value: "kW", label: "kW — kilowatts (power)" },
  { value: "W", label: "W — watts (power)" },
  { value: "MW", label: "MW — megawatts (power)" },
  { value: "BTU/h", label: "BTU/h — BTU per hour" },
  { value: "MBTU/h", label: "MBTU/h — MBTU per hour" },
];

// ✅ Rate → Total mapping (shown to user, and later used by the integrator)
const RATE_TO_TOTAL_UNIT = {
  // Liquid
  GPM: "gal",
  GPH: "gal",
  BPD: "bbl",
  "BBL/h": "bbl",

  // Air/Gas
  CFM: "ft³",
  SCFM: "ft³",
  ACFM: "ft³",

  // Metric flow
  LPM: "L",
  LPH: "L",
  "m³/h": "m³",
  "m³/min": "m³",

  // Mass
  "kg/h": "kg",
  "kg/min": "kg",
  "kg/s": "kg",
  "lb/h": "lb",
  "lb/min": "lb",
  "ton/h": "ton",

  // Power → Energy
  kW: "kWh",
  W: "Wh",
  MW: "MWh",
  "BTU/h": "BTU",
  "MBTU/h": "MBTU",
};

function inferTotalUnitFromRate(rateUnit) {
  const k = String(rateUnit || "").trim();
  return RATE_TO_TOTAL_UNIT[k] || "";
}

export default function GraphicDisplayTotalizerSection({
  enabled = false,
  onToggleEnabled = () => {},

  // ✅ IMPORTANT: this prop is now the RATE unit (ex: "GPM")
  totalizerUnit = "",
  onChangeUnit = () => {},
}) {
  const selectedRateUnit = useMemo(() => {
    const t = String(totalizerUnit || "").trim();
    const hit = RATE_UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? t : "";
  }, [totalizerUnit]);

  const customRateUnit = useMemo(() => {
    const t = String(totalizerUnit || "").trim();
    if (!t) return "";
    const hit = RATE_UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? "" : t;
  }, [totalizerUnit]);

  const derivedTotalUnit = useMemo(() => {
    // If user picked from preset, show mapped total unit.
    if (selectedRateUnit) return inferTotalUnitFromRate(selectedRateUnit);

    // If custom rate unit typed, we cannot infer reliably.
    // We'll show blank and let future UI support custom mapping if needed.
    return "";
  }, [selectedRateUnit]);

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
        Use Totalizer when the trend is a <b>RATE</b> (ex: <b>GPM</b>) and you want an
        accumulated <b>TOTAL</b> (ex: <b>gallons</b>).
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
            Rate Units (input)
          </span>

          <select
            value={selectedRateUnit}
            onChange={(e) => {
              const v = String(e.target.value || "");
              if (!v) {
                // "Select..." keeps current custom unit (or blank)
                onChangeUnit(customRateUnit || "");
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
            {RATE_UNIT_PRESETS.map((u) => (
              <option key={u.label} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
            Custom Rate Unit (optional)
          </span>

          <input
            value={customRateUnit}
            onChange={(e) => onChangeUnit(e.target.value)}
            placeholder="e.g. g/s, ACFH, Nm³/h"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
              background: enabled ? "#fff" : "#f9fafb",
              opacity: enabled ? 1 : 0.75,
            }}
            disabled={!enabled || selectedRateUnit !== ""}
          />
        </label>

        <div
          style={{
            border: "1px dashed rgba(0,0,0,0.12)",
            background: "rgba(248,250,252,0.9)",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 900,
            color: "#111827",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
          title="This is the accumulated total unit CoreFlex will compute from the selected rate."
        >
          <span style={{ color: "#374151" }}>Total accumulates in:</span>
          <span style={{ fontFamily: "monospace", color: derivedTotalUnit ? "#0b3b18" : "#6b7280" }}>
            {derivedTotalUnit || "--"}
          </span>
        </div>

        {enabled && selectedRateUnit && !derivedTotalUnit ? (
          <div style={{ color: "#b42318", fontWeight: 900, fontSize: 12 }}>
            Total unit mapping not found for this rate unit.
          </div>
        ) : null}
      </div>
    </div>
  );
}