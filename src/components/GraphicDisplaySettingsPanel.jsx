// src/components/GraphicDisplaySettingsPanel.jsx
import React from "react";

const TIME_UNITS = ["seconds", "minutes", "hours", "days"];

// ✅ normalize to hex-ish default
function normalizeHexColor(v, fallback = "#0c5ac8") {
  const s = String(v || "").trim();
  if (!s) return fallback;

  // allow #RGB / #RRGGBB
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;

  // allow bare hex "0c5ac8"
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;

  return fallback;
}

export default function GraphicDisplaySettingsPanel({
  title,
  setTitle,
  timeUnit,
  setTimeUnit,
  windowSize,
  setWindowSize,
  yMin,
  setYMin,
  yMax,
  setYMax,

  // ✅ REMOVED from this panel (moved to Totalizer section)
  // yUnits,
  // setYUnits,

  // ✅ Line color
  lineColor,
  setLineColor,
}) {
  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const safeLineColor = normalizeHexColor(lineColor);

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10, color: "#111827" }}>
        Display Settings
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
            }}
          />
        </label>

        {/* ✅ Line Color */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            background: "#f9fafb",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
            Line color
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              type="color"
              value={safeLineColor}
              onChange={(e) => setLineColor(e.target.value)}
              style={{
                width: 56,
                height: 40,
                borderRadius: 10,
                border: "1px solid #d1d5db",
                padding: 0,
                background: "#fff",
                cursor: "pointer",
              }}
              title="Pick line color"
            />

            <input
              value={safeLineColor}
              onChange={(e) => setLineColor(e.target.value)}
              placeholder="#0c5ac8"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 10px",
                fontSize: 14,
                fontFamily: "monospace",
              }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280" }}>
            Tip: use HEX like{" "}
            <span style={{ fontFamily: "monospace" }}>#ff0000</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
              Time projection
            </span>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 10px",
                fontSize: 14,
              }}
            >
              {TIME_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
              Window
            </span>
            <input
              type="number"
              value={safeWindow}
              onChange={(e) => setWindowSize(Number(e.target.value || 0))}
              min={1}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 10px",
                fontSize: 14,
              }}
            />
          </label>
        </div>

        {/* Vertical axis */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 10,
            background: "#f9fafb",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
            Vertical axis (manual)
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                Y Min
              </span>
              <input
                type="number"
                value={safeYMin}
                onChange={(e) => setYMin(Number(e.target.value || 0))}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                Y Max
              </span>
              <input
                type="number"
                value={safeYMax}
                onChange={(e) => setYMax(Number(e.target.value || 0))}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              />
            </label>
          </div>

          {safeYMax <= safeYMin && (
            <div style={{ color: "#b42318", fontWeight: 800, fontSize: 12 }}>
              Y Max must be greater than Y Min.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}