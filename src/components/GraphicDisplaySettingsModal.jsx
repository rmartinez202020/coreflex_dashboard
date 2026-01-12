import React, { useEffect, useState } from "react";

const SAMPLE_OPTIONS = [200, 500, 700, 1000, 2000, 5000];
const TIME_UNITS = ["seconds", "minutes", "hours", "days"];

const GRAPH_STYLES = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "bar", label: "Bar" },
  { value: "step", label: "Step" },
];

export default function GraphicDisplaySettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open) return null;

  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);
  const [sampleMs, setSampleMs] = useState(1000);

  // ✅ NEW: vertical axis manual values
  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [yUnits, setYUnits] = useState("");

  // ✅ NEW: graph style
  const [graphStyle, setGraphStyle] = useState("line");

  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);
    setSampleMs(tank.sampleMs ?? 1000);

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");

    setGraphStyle(tank.graphStyle ?? "line");
  }, [tank]);

  const formatSampleLabel = (ms) => {
    if (ms === 1000) return "1s (1000 ms)";
    if (ms === 2000) return "2s (2000 ms)";
    if (ms === 5000) return "5s (5000 ms)";
    return `${ms} ms`;
  };

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;

  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const yRangeValid = safeYMax > safeYMin;

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
    >
      <div
        style={{
          width: 460,
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #eee",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.3,
          }}
        >
          Graphic Display Settings
        </div>

        <div style={{ padding: 14, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                padding: "10px 10px",
                fontSize: 14,
              }}
            />
          </label>

          {/* time + window */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                Time projection
              </span>
              <select
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                style={{
                  border: "1px solid #d0d0d0",
                  borderRadius: 8,
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
              <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                Window
              </span>
              <input
                type="number"
                value={safeWindow}
                onChange={(e) => setWindowSize(Number(e.target.value || 0))}
                min={1}
                style={{
                  border: "1px solid #d0d0d0",
                  borderRadius: 8,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              />
            </label>
          </div>

          {/* sample */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
              Sample time
            </span>
            <select
              value={sampleMs}
              onChange={(e) => setSampleMs(Number(e.target.value))}
              style={{
                border: "1px solid #d0d0d0",
                borderRadius: 8,
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

          {/* ✅ NEW: graph style */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
              Graph style
            </span>
            <select
              value={graphStyle}
              onChange={(e) => setGraphStyle(e.target.value)}
              style={{
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                padding: "10px 10px",
                fontSize: 14,
              }}
            >
              {GRAPH_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* ✅ NEW: vertical axis */}
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: 10,
              padding: 12,
              display: "grid",
              gap: 10,
              background: "#fafafa",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 13, color: "#333" }}>
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
                <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                  Y Min
                </span>
                <input
                  type="number"
                  value={safeYMin}
                  onChange={(e) => setYMin(Number(e.target.value || 0))}
                  style={{
                    border: "1px solid #d0d0d0",
                    borderRadius: 8,
                    padding: "10px 10px",
                    fontSize: 14,
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                  Y Max
                </span>
                <input
                  type="number"
                  value={safeYMax}
                  onChange={(e) => setYMax(Number(e.target.value || 0))}
                  style={{
                    border: "1px solid #d0d0d0",
                    borderRadius: 8,
                    padding: "10px 10px",
                    fontSize: 14,
                  }}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>
                Units label (optional)
              </span>
              <input
                value={yUnits}
                onChange={(e) => setYUnits(e.target.value)}
                placeholder="e.g. %, PSI, °F"
                style={{
                  border: "1px solid #d0d0d0",
                  borderRadius: 8,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              />
            </label>

            {!yRangeValid && (
              <div style={{ color: "#b42318", fontWeight: 800, fontSize: 12 }}>
                Y Max must be greater than Y Min.
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#f3f3f3",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            disabled={!yRangeValid}
            onClick={() =>
              onSave({
                ...tank,
                title,
                timeUnit,
                window: safeWindow,
                sampleMs,
                yMin: safeYMin,
                yMax: safeYMax,
                yUnits,
                graphStyle,
              })
            }
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #bfe6c8",
              background: yRangeValid
                ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                : "#ddd",
              fontWeight: 900,
              cursor: yRangeValid ? "pointer" : "not-allowed",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
