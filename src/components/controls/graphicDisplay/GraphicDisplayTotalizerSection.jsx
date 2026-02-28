// src/components/controls/graphicDisplay/GraphicDisplayTotalizerSection.jsx
import React, { useMemo } from "react";

/**
 * TOTALIZER — RATE ONLY (NO CUSTOM)
 * + SINGLE UNITS (mutually exclusive with totalizer)
 */

const RATE_UNIT_PRESETS = [
  { value: "", label: "Select rate unit..." },

  // 🇺🇸 US / Imperial — Liquid Flow
  { value: "GPM", label: "GPM — gallons per minute" },
  { value: "GPH", label: "GPH — gallons per hour" },
  { value: "BPD", label: "BPD — barrels per day" },
  { value: "BBL/h", label: "BBL/h — barrels per hour" },

  // 🇺🇸 Air / Gas
  { value: "CFM", label: "CFM — cubic feet per minute" },
  { value: "SCFM", label: "SCFM — standard cubic feet per minute" },
  { value: "ACFM", label: "ACFM — actual cubic feet per minute" },

  // 🌍 Metric Flow
  { value: "LPM", label: "LPM — liters per minute" },
  { value: "LPH", label: "LPH — liters per hour" },
  { value: "m³/h", label: "m³/h — cubic meters per hour" },
  { value: "m³/min", label: "m³/min — cubic meters per minute" },

  // 🌍 Metric Mass
  { value: "kg/h", label: "kg/h — kilograms per hour" },
  { value: "kg/min", label: "kg/min — kilograms per minute" },
  { value: "kg/s", label: "kg/s — kilograms per second" },

  // 🇺🇸 Mass
  { value: "lb/h", label: "lb/h — pounds per hour" },
  { value: "lb/min", label: "lb/min — pounds per minute" },
  { value: "ton/h", label: "ton/h — tons per hour" },

  // ⚡ Energy / Power
  { value: "kW", label: "kW — kilowatts (power)" },
  { value: "W", label: "W — watts (power)" },
  { value: "MW", label: "MW — megawatts (power)" },
  { value: "BTU/h", label: "BTU/h — BTU per hour" },
  { value: "MBTU/h", label: "MBTU/h — MBTU per hour" },
];

const RATE_TO_TOTAL_UNIT = {
  GPM: "gal",
  GPH: "gal",
  BPD: "bbl",
  "BBL/h": "bbl",

  CFM: "ft³",
  SCFM: "ft³",
  ACFM: "ft³",

  LPM: "L",
  LPH: "L",
  "m³/h": "m³",
  "m³/min": "m³",

  "kg/h": "kg",
  "kg/min": "kg",
  "kg/s": "kg",

  "lb/h": "lb",
  "lb/min": "lb",
  "ton/h": "ton",

  kW: "kWh",
  W: "Wh",
  MW: "MWh",
  "BTU/h": "BTU",
  "MBTU/h": "MBTU",
};

// ✅ Single Units (flat list like Rate Units)
const SINGLE_UNIT_PRESETS = [
  { value: "", label: "Select unit..." },

  // Pressure
  { value: "PSI", label: "PSI" },
  { value: "bar", label: "bar" },
  { value: "kPa", label: "kPa" },
  { value: "inH₂O", label: "inH₂O" },
  { value: "mbar", label: "mbar" },

  // Temperature
  { value: "°F", label: "°F" },
  { value: "°C", label: "°C" },
  { value: "K", label: "K" },

  // Level
  { value: "ft", label: "ft" },
  { value: "in", label: "in" },
  { value: "m", label: "m" },
  { value: "mm", label: "mm" },
  { value: "%", label: "%" },
];

export default function GraphicDisplayTotalizerSection({
  // TOTALIZER
  enabled = false,
  onToggleEnabled = () => {},
  totalizerUnit = "",
  onChangeUnit = () => {},

  // ✅ SINGLE UNITS (NEW)
  singleEnabled = false,
  onToggleSingleEnabled = () => {},
  singleUnit = "",
  onChangeSingleUnit = () => {},
}) {
  const selectedRateUnit = useMemo(() => {
    const t = String(totalizerUnit || "").trim();
    const hit = RATE_UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? t : "";
  }, [totalizerUnit]);

  const derivedTotalUnit = useMemo(() => {
    return RATE_TO_TOTAL_UNIT[selectedRateUnit] || "";
  }, [selectedRateUnit]);

  const selectedSingleUnit = useMemo(() => {
    const t = String(singleUnit || "").trim();
    const hit = SINGLE_UNIT_PRESETS.some((u) => u.value && u.value === t);
    return hit ? t : "";
  }, [singleUnit]);

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

  // ✅ Mutual exclusion helpers
  const enableTotalizer = () => {
    // if turning totalizer ON, force single OFF
    if (!enabled) {
      if (singleEnabled) onToggleSingleEnabled(false);
      onToggleEnabled(true);
    }
  };

  const disableTotalizer = () => {
    if (enabled) onToggleEnabled(false);
  };

  const enableSingle = () => {
    // if turning single ON, force totalizer OFF
    if (!singleEnabled) {
      if (enabled) onToggleEnabled(false);
      onToggleSingleEnabled(true);
    }
  };

  const disableSingle = () => {
    if (singleEnabled) onToggleSingleEnabled(false);
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
      {/* ====================== TOTALIZER ====================== */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900, color: "#111827" }}>Totalizer</div>

        <div style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          <button type="button" onClick={enableTotalizer} style={enabled ? btnOn : btnBase}>
            ✅ Enable
          </button>

          <button type="button" onClick={disableTotalizer} style={!enabled ? btnOff : btnBase}>
            ⛔ Disable
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: "#6b7280" }}>
        Use Totalizer when the trend is a <b>RATE</b> (ex: <b>GPM</b>) and you want an accumulated <b>TOTAL</b>.
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>Rate Units (input)</span>

          <select
            value={selectedRateUnit}
            onChange={(e) => onChangeUnit(e.target.value)}
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
            justifyContent: "space-between",
          }}
        >
          <span>Total accumulates in:</span>
          <span style={{ fontFamily: "monospace" }}>{derivedTotalUnit || "--"}</span>
        </div>
      </div>

      {/* ====================== SINGLE UNITS ====================== */}
      <div style={{ height: 1, background: "#e5e7eb", margin: "14px 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900, color: "#111827" }}>Single Units</div>

        <div style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          <button type="button" onClick={enableSingle} style={singleEnabled ? btnOn : btnBase}>
            ✅ Enable
          </button>

          <button type="button" onClick={disableSingle} style={!singleEnabled ? btnOff : btnBase}>
            ⛔ Disable
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: "#6b7280" }}>
        Use Single Units for <b>instant measurements</b> (Pressure, Temperature, Level). Enabling this will disable the Totalizer.
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>Unit</span>

          <select
            value={selectedSingleUnit}
            onChange={(e) => onChangeSingleUnit(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
              background: singleEnabled ? "#fff" : "#f9fafb",
              opacity: singleEnabled ? 1 : 0.75,
            }}
            disabled={!singleEnabled}
          >
            {SINGLE_UNIT_PRESETS.map((u) => (
              <option key={u.label} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}