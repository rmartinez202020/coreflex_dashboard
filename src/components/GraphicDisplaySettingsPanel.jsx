import React from "react";

// ✅ Updated sampling options (ms)
// 1s, 3s, 6s, 30s, 1min, 5min, 10min
const SAMPLE_OPTIONS = [1000, 3000, 6000, 30000, 60000, 300000, 600000];

const TIME_UNITS = ["seconds", "minutes", "hours", "days"];

// ✅ label helper for the new sample options
function formatSampleLabel(ms) {
  const sec = ms / 1000;

  if (ms === 1000) return "1s";
  if (ms === 3000) return "3s";
  if (ms === 6000) return "6s";
  if (ms === 30000) return "30s";
  if (ms === 60000) return "1 min";
  if (ms === 300000) return "5 min";
  if (ms === 600000) return "10 min";

  if (ms % 60000 === 0) return `${ms / 60000} min`;
  if (ms % 1000 === 0) return `${sec}s`;
  return `${ms} ms`;
}

// ✅ small helper: safe hex-ish default
function normalizeColor(c, fallback = "#0c5ac8") {
  const s = String(c || "").trim();
  if (!s) return fallback;
  // allow #RGB/#RRGGBB or any valid css color keyword
  return s;
}

export default function GraphicDisplaySettingsPanel({
  title,
  setTitle,
  timeUnit,
  setTimeUnit,
  windowSize,
  setWindowSize,
  sampleMs,
  setSampleMs,
  yMin,
  setYMin,
  yMax,
  setYMax,
  yUnits,
  setYUnits,

  // ✅ NEW (optional): line color
  // Pass these from parent: tank.lineColor + setter
  lineColor,
  setLineColor,
}) {
  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const canEditColor = typeof setLineColor === "function";
  const safeLineColor = normalizeColor(lineColor, "#0c5ac8");

  const COLOR_PRESETS = [
    { label: "Blue", value: "#0c5ac8" },
    { label: "Green", value: "#16a34a" },
    { label: "Red", value: "#dc2626" },
    { label: "Orange", value: "#f97316" },
    { label: "Purple", value: "#7c3aed" },
    { label: "Gray", value: "#374151" },
    { label: "Black", value: "#111827" },
  ];

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

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
            Sample time
          </span>
          <select
            value={sampleMs}
            onChange={(e) => setSampleMs(Number(e.target.value))}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 10px",
              fontSize: 14,
            }}
          >
            {SAMPLE_OPTIONS.map((ms) => (
              <option key={ms} value={ms}>
                {formatSampleLabel(ms)}
              </option>
            ))}
          </select>
        </label>

        {/* ✅ NEW: Line color */}
        {canEditColor ? (
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
              Line color
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}
                >
                  Color
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="color"
                    value={safeLineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    style={{
                      width: 44,
                      height: 42,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
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
              </label>

              <div
                style={{
                  width: 90,
                  height: 14,
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: safeLineColor,
                  boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                }}
                title="Preview"
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setLineColor(c.value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 999,
                    padding: "6px 10px",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                  title={c.value}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: c.value,
                      border: "1px solid rgba(0,0,0,0.12)",
                      display: "inline-block",
                    }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

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

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
              Units label (optional)
            </span>
            <input
              value={yUnits}
              onChange={(e) => setYUnits(e.target.value)}
              placeholder="e.g. %, PSI, °F"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 10,
                padding: "10px 10px",
                fontSize: 14,
              }}
            />
          </label>

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
