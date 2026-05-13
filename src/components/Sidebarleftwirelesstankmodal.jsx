// src/components/Sidebarleftwirelesstankmodal.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import wl3000TankPreview from "../assets/wl3000-tank-preview.png";

const MODEL_OPTIONS = [{ key: "wl3000", label: "WL-3000" }];

function computeCenteredPos({ panelW = 1180, estH = 520 } = {}) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - estH) / 2));

  return { left, top };
}

function TelemetryCard({
  icon,
  label,
  value,
  accent = "#0f172a",
  bg = "#f8fafc",
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "46px 1fr",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        minHeight: 68,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: accent,
          fontWeight: 900,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: accent,
            fontFamily: "monospace",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Sidebarleftwirelesstankmodal({
  open = true,
  tank,
  onSave,
  onClose,
}) {
  if (!open || !tank) return null;

  const props = tank?.properties || {};

  const [title, setTitle] = useState(props.name || "Tank#1");
  const [model, setModel] = useState(props.bindModel || "wl3000");
  const [unitId, setUnitId] = useState(props.unitId || props.bindDeviceId || "");
  const [unitQuery, setUnitQuery] = useState("");

  const [units] = useState([
    {
      unitId: "860549070088252",
      status: "online",
      height_in: "17.83",
      temperature_F: "37.4",
      battery_V: "3.62",
      received_at: "05/12/2026 09:21:40 PM",
    },
    {
      unitId: "WL3000-000002",
      status: "offline",
      height_in: "--",
      temperature_F: "--",
      battery_V: "--",
      received_at: "--",
    },
    {
      unitId: "WL3000-000003",
      status: "offline",
      height_in: "--",
      temperature_F: "--",
      battery_V: "--",
      received_at: "--",
    },
  ]);

  const PANEL_W = 1180;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: 12, top: 12 };
    return computeCenteredPos({ panelW: PANEL_W, estH: 520 });
  });

  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setPos(computeCenteredPos({ panelW: PANEL_W, estH: 520 }));
  }, [open]);

  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};

    setTitle(p.name || "Tank#1");
    setModel(p.bindModel || "wl3000");
    setUnitId(p.unitId || p.bindDeviceId || "");
    setUnitQuery("");
  }, [tank]);

  const filteredUnits = useMemo(() => {
    const q = String(unitQuery || "").trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => String(u.unitId || "").toLowerCase().includes(q));
  }, [units, unitQuery]);

  const selectedUnit = useMemo(() => {
    return units.find((u) => String(u.unitId) === String(unitId)) || null;
  }, [units, unitId]);

  const liveHeight = selectedUnit?.height_in || "--";
  const liveTemperature = selectedUnit?.temperature_F || "--";
  const liveBattery = selectedUnit?.battery_V || "--";
  const liveDate = selectedUnit?.received_at || "--";

  const canApply = !!String(unitId || "").trim();

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    setPos({
      left: Math.min(Math.max(margin, nextLeft), Math.max(margin, w - margin - 260)),
      top: Math.min(Math.max(margin, nextTop), Math.max(margin, h - margin - 140)),
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")) return;

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", endDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  };

  const inputStyle = {
    height: 38,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontWeight: 600,
    background: "#fff",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.42)",
        zIndex: 999999,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W,
          maxWidth: "96vw",
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
          overflow: "hidden",
        }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg,#0b1b33,#071327)",
            color: "#fff",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          title="Drag to move"
        >
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.2 }}>
            Wireless Tank Properties
          </div>

          <button
            data-no-drag="true"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
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

        <div style={{ padding: 16, background: "#f8fafc" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 14,
                minHeight: 0,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", marginBottom: 10 }}>
                Preview
              </div>

              <div
                style={{
                  height: 260,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={wl3000TankPreview}
                  alt="WL-3000 Tank Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  borderRadius: 12,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: 12,
                  fontSize: 12,
                  color: "#334155",
                  lineHeight: 1.45,
                }}
              >
                This wireless tank uses the WL-3000 model and binds by IMEI.
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
                Device Binding
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>Title</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    placeholder="Tank#1"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>Model</div>
                  <select value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle}>
                    {MODEL_OPTIONS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>IMEI Search</div>
                  <input
                    value={unitQuery}
                    onChange={(e) => setUnitQuery(e.target.value)}
                    style={inputStyle}
                    placeholder="Type to filter IMEI..."
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>IMEI</div>
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={inputStyle}>
                    <option value="">Select IMEI...</option>
                    {filteredUnits.map((u) => (
                      <option key={u.unitId} value={u.unitId}>
                        {u.unitId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: 2,
                  border: "1px solid #dbeafe",
                  background: "linear-gradient(180deg,#f8fbff,#eef6ff)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12, color: "#0f172a" }}>
                  Wireless Telemetry
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <TelemetryCard
                    icon="↕"
                    label="Height"
                    value={`${liveHeight}${liveHeight !== "--" ? " in" : ""}`}
                    accent="#16a34a"
                    bg="rgba(187,247,208,0.65)"
                  />

                  <TelemetryCard
                    icon="📅"
                    label="Date"
                    value={liveDate}
                    accent="#2563eb"
                    bg="rgba(191,219,254,0.7)"
                  />

                  <TelemetryCard
                    icon="♨"
                    label="Temperature"
                    value={`${liveTemperature}${liveTemperature !== "--" ? " °F" : ""}`}
                    accent="#ea580c"
                    bg="rgba(254,215,170,0.7)"
                  />

                  <TelemetryCard
                    icon="🔋"
                    label="Battery"
                    value={`${liveBattery}${liveBattery !== "--" ? " V" : ""}`}
                    accent="#15803d"
                    bg="rgba(187,247,208,0.65)"
                  />

                  <TelemetryCard
                    icon="▣"
                    label="IMEI"
                    value={unitId || "--"}
                    accent="#7c3aed"
                    bg="rgba(221,214,254,0.75)"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!canApply}
                  onClick={() => {
                    const nextProps = {
                      ...(tank?.properties || {}),
                      name: String(title || "").trim() || "Tank#1",
                      bindModel: model,
                      modelLabel: "WL-3000",
                      unitId: String(unitId || "").trim(),
                      bindDeviceId: String(unitId || "").trim(),
                      bindHeightField: "height_in",
                      bindTemperatureField: "temperature_F",
                      bindBatteryField: "battery_V",
                      bindDateField: "received_at",
                    };

                    onSave?.({
                      ...tank,
                      properties: nextProps,
                    });

                    onClose?.();
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: "1px solid #9ae6b4",
                    background: canApply ? "linear-gradient(180deg,#bbf7d0,#6ee78f)" : "#e5e7eb",
                    color: "#052e16",
                    fontWeight: 900,
                    cursor: canApply ? "pointer" : "not-allowed",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
            Backend polling route will be connected later. For now, this modal is focused on the final layout and saved properties.
          </div>
        </div>
      </div>
    </div>
  );
}