// src/components/DisplaysettingsmodalMathHelp.jsx
import React from "react";

export default function DisplaysettingsmodalMathHelp() {
  return (
    <div
      style={{
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 12,
        fontSize: 11,
        color: "#1e293b",
        lineHeight: 1.35,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Supported Operators</div>
      <div style={{ display: "grid", gap: 4 }}>
        <div>VALUE + 10 → add</div>
        <div>VALUE - 3 → subtract</div>
        <div>VALUE * 2 → multiply</div>
        <div>VALUE / 5 → divide</div>
        <div>VALUE % 60 → modulo</div>
      </div>

      <div style={{ fontWeight: 600, margin: "10px 0 6px" }}>Combined Examples</div>
      <div style={{ display: "grid", gap: 4 }}>
        <div>(VALUE * 1.5) + 5 → scale &amp; offset</div>
        <div>(VALUE / 4095) * 20 - 4 → ADC → 4–20 mA</div>
      </div>

      <div style={{ fontWeight: 600, margin: "10px 0 6px" }}>String Output Examples</div>
      <div style={{ display: "grid", gap: 4 }}>
        <div>CONCAT("Temp=", VALUE)</div>
        <div>CONCAT("Level=", VALUE, " %")</div>
        <div>CONCAT("Vol=", VALUE * 2, " Gal")</div>
      </div>
    </div>
  );
}
