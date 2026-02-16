import React, { useEffect, useMemo, useRef, useState } from "react";

const TAB_GENERAL = "General";
const TAB_UNITS = "Units";
const TAB_DIMENSIONS = "Dimensions";
const TAB_ALARM = "Alarm";

const DEFAULT_PROPERTIES = {
  general: {
    name: "",
    contents: "",
    density: 0,
    displayDefault: "Weight",
    fullColor: "#00ff00",
    alarmColor: "#ff0000",
  },
  units: {
    linear: "feet",
    volume: "Cubic Feet",
    density: "lbs/ft³",
    weight: "Pounds",
  },
  dimensions: {
    type: "Cylindrical",
    vesselHeight: 0,
    vesselDiameter: 0,
    coneHeight: 0,
    coneOutletDiameter: 0,
  },
  alarm: {
    enabled: false,
    highLevel: 0,
    lowLevel: 0,
    resetMode: "Automatic (based on level)",
  },
};

export default function SiloPropertiesModal({ open = true, silo, onSave, onClose }) {
  if (!open || !silo) return null;

  const [activeTab, setActiveTab] = useState(TAB_GENERAL);
  const [localProps, setLocalProps] = useState(DEFAULT_PROPERTIES);

  // -------------------------
  // ✅ DisplaySettingModal-style drag state
  // -------------------------
  const PANEL_W = 980;
  const EST_H = 620;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [didInitPos, setDidInitPos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - EST_H) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const maxLeft = Math.max(margin, w - margin - 260);
    const maxTop = Math.max(margin, h - margin - 140);

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

  const startDrag = (e) => {
    if (e.button !== 0) return;

    const t = e.target;
    if (t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")) return;

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

  // -------------------------
  // ✅ Load saved props
  // -------------------------
  useEffect(() => {
    if (!silo) return;

    const propsFromSilo = silo.properties || {};
    setLocalProps({
      general: { ...DEFAULT_PROPERTIES.general, ...(propsFromSilo.general || {}) },
      units: { ...DEFAULT_PROPERTIES.units, ...(propsFromSilo.units || {}) },
      dimensions: { ...DEFAULT_PROPERTIES.dimensions, ...(propsFromSilo.dimensions || {}) },
      alarm: { ...DEFAULT_PROPERTIES.alarm, ...(propsFromSilo.alarm || {}) },
    });
    setActiveTab(TAB_GENERAL);
  }, [silo]);

  // -------------------------
  // ✅ Mutators
  // -------------------------
  const updateSection = (section, field, value) => {
    setLocalProps((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleApply = () => {
    onSave?.({
      ...silo,
      properties: { ...localProps },
    });
  };

  const handleOk = () => {
    handleApply();
    onClose?.();
  };

  const handleCancel = () => onClose?.();

  // -------------------------
  // ✅ UI styles (match your new modal system)
  // -------------------------
  const tabBtn = (isActive) => ({
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid " + (isActive ? "#cbd5e1" : "#e5e7eb"),
    background: isActive ? "#ffffff" : "#f8fafc",
    fontWeight: isActive ? 700 : 600,
    color: isActive ? "#0f172a" : "#334155",
    cursor: "pointer",
  });

  const panelCard = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
  };

  const titleText = useMemo(() => {
    const name = String(localProps?.general?.name || "").trim();
    return name ? `Silo Properties — ${name}` : `Silo Properties — ${silo?.id || ""}`;
  }, [localProps?.general?.name, silo?.id]);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 100000,
      }}
    >
      <div
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W,
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER (DRAG HANDLE) */}
        <div
          onMouseDown={startDrag}
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
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
          <div>{titleText}</div>
          <button
            data-no-drag="true"
            onClick={handleCancel}
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

        {/* BODY */}
        <div style={{ padding: 18, background: "#f8fafc" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {[TAB_GENERAL, TAB_UNITS, TAB_DIMENSIONS, TAB_ALARM].map((tab) => {
              const isActive = tab === activeTab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(isActive)}>
                  {tab}
                </button>
              );
            })}
          </div>

          <div style={panelCard}>
            {activeTab === TAB_GENERAL && (
              <GeneralTab localProps={localProps} updateSection={updateSection} />
            )}
            {activeTab === TAB_UNITS && (
              <UnitsTab localProps={localProps} updateSection={updateSection} />
            )}
            {activeTab === TAB_DIMENSIONS && (
              <DimensionsTab localProps={localProps} updateSection={updateSection} />
            )}
            {activeTab === TAB_ALARM && (
              <AlarmTab localProps={localProps} updateSection={updateSection} />
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#f3f4f6",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply
            </button>

            <button
              onClick={handleOk}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #bfe6c8",
                background: "linear-gradient(180deg,#bff2c7,#6fdc89)",
                color: "#0b3b18",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== TABS ================== */

function GeneralTab({ localProps, updateSection }) {
  const g = localProps.general;

  const row = { display: "flex", alignItems: "center", gap: 10 };
  const label = { width: 120, fontSize: 12, fontWeight: 600, color: "#0f172a" };
  const input = {
    height: 36,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: 12,
    outline: "none",
    background: "#fff",
    flex: 1,
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={row}>
        <div style={label}>Name</div>
        <input
          type="text"
          value={g.name}
          onChange={(e) => updateSection("general", "name", e.target.value)}
          style={input}
        />
      </div>

      <div style={row}>
        <div style={label}>Contents</div>
        <input
          type="text"
          value={g.contents}
          onChange={(e) => updateSection("general", "contents", e.target.value)}
          style={input}
        />
      </div>

      <div style={row}>
        <div style={label}>Density</div>
        <input
          type="number"
          value={g.density}
          onChange={(e) =>
            updateSection(
              "general",
              "density",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          style={{ ...input, flex: "unset", width: 180 }}
        />
        <div style={{ fontSize: 11, color: "#64748b" }}>(Units tab)</div>
      </div>

      <div style={row}>
        <div style={label}>Display Default</div>
        <select
          value={g.displayDefault}
          onChange={(e) => updateSection("general", "displayDefault", e.target.value)}
          style={{ ...input, flex: "unset", width: 220 }}
        >
          <option value="Weight">Weight</option>
          <option value="Volume">Volume</option>
          <option value="Level">Level</option>
        </select>
      </div>

      <div
        style={{
          marginTop: 4,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#f8fafc",
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", marginBottom: 10 }}>
          Internal Colors of Material
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
              Full Color
            </div>
            <input
              type="color"
              value={g.fullColor}
              onChange={(e) => updateSection("general", "fullColor", e.target.value)}
              style={{ width: 36, height: 28, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
              Alarm Color
            </div>
            <input
              type="color"
              value={g.alarmColor}
              onChange={(e) => updateSection("general", "alarmColor", e.target.value)}
              style={{ width: 36, height: 28, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitsTab({ localProps, updateSection }) {
  const u = localProps.units;

  const row = { display: "flex", alignItems: "center", gap: 10 };
  const label = { width: 120, fontSize: 12, fontWeight: 600, color: "#0f172a" };
  const select = {
    height: 36,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: 12,
    outline: "none",
    background: "#fff",
    width: 260,
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={row}>
        <div style={label}>Linear</div>
        <select value={u.linear} onChange={(e) => updateSection("units", "linear", e.target.value)} style={select}>
          <option value="feet">feet</option>
          <option value="meters">meters</option>
        </select>
      </div>

      <div style={row}>
        <div style={label}>Volume</div>
        <select value={u.volume} onChange={(e) => updateSection("units", "volume", e.target.value)} style={select}>
          <option value="Cubic Feet">Cubic Feet</option>
          <option value="US Bushels">US Bushels</option>
          <option value="US Gallons">US Gallons</option>
          <option value="Cubic Meters">Cubic Meters</option>
          <option value="Litres">Litres</option>
          <option value="British Bushels">British Bushels</option>
          <option value="Imperial Gallons">Imperial Gallons</option>
        </select>
      </div>

      <div style={row}>
        <div style={label}>Density</div>
        <select value={u.density} onChange={(e) => updateSection("units", "density", e.target.value)} style={select}>
          <option value="lbs/ft³">lbs/ft³</option>
          <option value="kg/m³">kg/m³</option>
          <option value="g/cm³">g/cm³</option>
        </select>
      </div>

      <div style={row}>
        <div style={label}>Weight</div>
        <select value={u.weight} onChange={(e) => updateSection("units", "weight", e.target.value)} style={select}>
          <option value="Pounds">Pounds</option>
          <option value="Short Tons">Short Tons</option>
          <option value="Kilograms">Kilograms</option>
          <option value="Metric Tons">Metric Tons</option>
        </select>
      </div>
    </div>
  );
}

function DimensionsTab({ localProps, updateSection }) {
  const d = localProps.dimensions;

  const row = { display: "flex", alignItems: "center", gap: 10 };
  const label = { width: 140, fontSize: 12, fontWeight: 600, color: "#0f172a" };
  const input = {
    height: 36,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: 12,
    outline: "none",
    background: "#fff",
    width: 180,
  };

  const numChange = (field) => (e) =>
    updateSection("dimensions", field, e.target.value === "" ? "" : Number(e.target.value));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={row}>
        <div style={label}>Type</div>
        <select
          value={d.type}
          onChange={(e) => updateSection("dimensions", "type", e.target.value)}
          style={{ ...input, width: 320 }}
        >
          <option value="Cylindrical">Cylindrical</option>
          <option value="Cylindrical + Cone">Cylindrical + Cone</option>
          <option value="Conical">Conical</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            background: "#ffffff",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", marginBottom: 10 }}>
            Vessel
          </div>

          <div style={row}>
            <div style={label}>Height</div>
            <input type="number" value={d.vesselHeight} onChange={numChange("vesselHeight")} style={input} />
          </div>

          <div style={{ ...row, marginTop: 10 }}>
            <div style={label}>Diameter</div>
            <input type="number" value={d.vesselDiameter} onChange={numChange("vesselDiameter")} style={input} />
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 12,
            background: "#ffffff",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a", marginBottom: 10 }}>
            Cone
          </div>

          <div style={row}>
            <div style={label}>Height</div>
            <input type="number" value={d.coneHeight} onChange={numChange("coneHeight")} style={input} />
          </div>

          <div style={{ ...row, marginTop: 10 }}>
            <div style={label}>Outlet Dia.</div>
            <input
              type="number"
              value={d.coneOutletDiameter}
              onChange={numChange("coneOutletDiameter")}
              style={input}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlarmTab({ localProps, updateSection }) {
  const a = localProps.alarm;

  const row = { display: "flex", alignItems: "center", gap: 10 };
  const label = { width: 140, fontSize: 12, fontWeight: 600, color: "#0f172a" };
  const input = {
    height: 36,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontSize: 12,
    outline: "none",
    background: "#fff",
    width: 220,
  };

  const numChange = (field) => (e) =>
    updateSection("alarm", field, e.target.value === "" ? "" : Number(e.target.value));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={row}>
        <div style={label}>Enabled</div>
        <input
          type="checkbox"
          checked={!!a.enabled}
          onChange={(e) => updateSection("alarm", "enabled", e.target.checked)}
        />
      </div>

      <div style={row}>
        <div style={label}>High Level</div>
        <input type="number" value={a.highLevel} onChange={numChange("highLevel")} style={input} />
      </div>

      <div style={row}>
        <div style={label}>Low Level</div>
        <input type="number" value={a.lowLevel} onChange={numChange("lowLevel")} style={input} />
      </div>

      <div style={row}>
        <div style={label}>Reset Mode</div>
        <input
          type="text"
          readOnly
          value={a.resetMode}
          style={{
            ...input,
            width: 380,
            background: "#f8fafc",
            color: "#64748b",
            border: "1px solid #e5e7eb",
          }}
        />
      </div>
    </div>
  );
}
