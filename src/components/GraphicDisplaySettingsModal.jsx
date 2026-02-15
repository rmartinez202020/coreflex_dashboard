import React, { useEffect, useMemo, useState } from "react";
import GraphicDisplaySettingsPanel from "./GraphicDisplaySettingsPanel";
import GraphicDisplayBindingPanel from "./GraphicDisplayBindingPanel";

// ✅ Updated sampling options (ms)
const SAMPLE_OPTIONS = [1000, 3000, 6000, 30000, 60000, 300000, 600000];

// ✅ Graph style is FIXED to LINE (no UI)
const FIXED_GRAPH_STYLE = "line";

export default function GraphicDisplaySettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open) return null;

  // -------------------------
  // LEFT: chart settings
  // -------------------------
  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);
  const [sampleMs, setSampleMs] = useState(1000);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [yUnits, setYUnits] = useState("");

  // -------------------------
  // RIGHT: tag binding (kept in parent for saving)
  // -------------------------
  const [bindModel, setBindModel] = useState("zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [bindField, setBindField] = useState("ai1");

  // Load from tank when opening/editing
  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);

    const incomingSample = Number(tank.sampleMs ?? 1000);
    setSampleMs(SAMPLE_OPTIONS.includes(incomingSample) ? incomingSample : 1000);

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");

    setBindModel(tank.bindModel ?? "zhc1921");
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");
  }, [tank]);

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;

  const yRangeValid = safeYMax > safeYMin;

  const canApply = useMemo(() => {
    return yRangeValid && !!bindDeviceId && !!bindField;
  }, [yRangeValid, bindDeviceId, bindField]);

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
      {/* MAIN PANEL */}
      <div
        style={{
          width: 980,
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* HEADER BAR */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg,#0b1b33,#0a1730)",
            color: "#fff",
          }}
        >
          <div>Graphic Display</div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY: 2 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 14,
            padding: 14,
            background: "#f8fafc",
          }}
        >
          {/* LEFT: EXTRACTED DISPLAY SETTINGS */}
          <GraphicDisplaySettingsPanel
            title={title}
            setTitle={setTitle}
            timeUnit={timeUnit}
            setTimeUnit={setTimeUnit}
            windowSize={windowSize}
            setWindowSize={setWindowSize}
            sampleMs={sampleMs}
            setSampleMs={setSampleMs}
            yMin={safeYMin}
            setYMin={setYMin}
            yMax={safeYMax}
            setYMax={setYMax}
            yUnits={yUnits}
            setYUnits={setYUnits}
          />

          {/* RIGHT: EXTRACTED BINDING PANEL + ACTIONS */}
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <GraphicDisplayBindingPanel
              bindModel={bindModel}
              setBindModel={setBindModel}
              bindDeviceId={bindDeviceId}
              setBindDeviceId={setBindDeviceId}
              bindField={bindField}
              setBindField={setBindField}
              sampleMs={sampleMs}
              // keep label text inside child tooltip
              formatSampleLabel={(ms) => {
                if (ms === 1000) return "1s";
                if (ms === 3000) return "3s";
                if (ms === 6000) return "6s";
                if (ms === 30000) return "30s";
                if (ms === 60000) return "1 min";
                if (ms === 300000) return "5 min";
                if (ms === 600000) return "10 min";
                if (ms % 60000 === 0) return `${ms / 60000} min`;
                if (ms % 1000 === 0) return `${ms / 1000}s`;
                return `${ms} ms`;
              }}
            />

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!canApply}
                onClick={() =>
                  onSave({
                    ...tank,
                    // chart settings
                    title,
                    timeUnit,
                    window: safeWindow,
                    sampleMs,
                    yMin: safeYMin,
                    yMax: safeYMax,
                    yUnits,
                    graphStyle: FIXED_GRAPH_STYLE, // ✅ always LINE

                    // binding for trend source
                    bindModel,
                    bindDeviceId,
                    bindField,
                  })
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bfe6c8",
                  background: canApply
                    ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                    : "#e5e7eb",
                  color: "#0b3b18",
                  fontWeight: 900,
                  cursor: canApply ? "pointer" : "not-allowed",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
