import React, { useEffect, useMemo, useRef, useState } from "react";
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

  // -------------------------
  // ✅ DRAG STATE
  // -------------------------
  const PANEL_W = 980;
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [didInitPos, setDidInitPos] = useState(false);

  // ✅ for grab/grabbing cursor
  const [isDragging, setIsDragging] = useState(false);

  // ✅ center on open (only once per open)
  useEffect(() => {
    if (!open) return;
    setDidInitPos(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (didInitPos) return;

    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const width = Math.min(PANEL_W, Math.floor(w * 0.96));
    const estHeight = 640; // good enough for centering; real height varies

    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - estHeight) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

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

  // ✅ DRAG handlers
  const startDrag = (e) => {
    // only left click
    if (e.button !== 0) return;

    // don't start drag if click is on interactive elements
    const t = e.target;
    if (
      t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")
    ) {
      return;
    }

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);

    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    // add global listeners so dragging still works even if cursor leaves header
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", endDrag);
  };

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    // keep it inside viewport with a small margin
    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const maxLeft = Math.max(margin, w - margin - 200); // keep some part visible
    const maxTop = Math.max(margin, h - margin - 120);

    setPos({
      left: Math.min(Math.max(margin, nextLeft), maxLeft),
      top: Math.min(Math.max(margin, nextTop), maxTop),
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);

    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      {/* MAIN PANEL (now draggable via left/top) */}
      <div
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: 980,
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* HEADER BAR (DRAG HANDLE) */}
        <div
          onMouseDown={startDrag}
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
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
          title="Drag to move"
        >
          <div>Graphic Display</div>
          <button
            data-no-drag="true"
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
