// src/components/Sidebarleftwirelesstankmodal.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const MODEL_OPTIONS = [{ key: "wl3000", label: "WL-3000" }];

function computeCenteredPos({ panelW = 980, estH = 560 } = {}) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - estH) / 2));

  return { left, top };
}

function WirelessTankPreview({ size = 300, liquidColor = "rgba(237, 220, 82, 0.55)" }) {
  const w = size;
  const h = Math.round(size * 0.86);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 500 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", maxWidth: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="wlLiquid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff7a8" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#d7c82f" stopOpacity="0.48" />
        </linearGradient>

        <linearGradient id="wlMetal" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#d7dce3" />
        </linearGradient>

        <filter id="wlSoftShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.16" />
        </filter>
      </defs>

      <g filter="url(#wlSoftShadow)">
        {/* liquid volume */}
        <path
          d="M28 198 L132 226 L360 198 L492 232 L492 384 L132 422 L28 360 Z"
          fill="url(#wlLiquid)"
        />
        <path
          d="M28 198 L132 226 L360 198 L492 232"
          stroke="#b9ab23"
          strokeWidth="1.4"
          strokeDasharray="6 6"
          opacity="0.72"
        />

        {/* main tank faces */}
        <path d="M28 82 L132 108 L492 82 L492 384 L132 422 L28 360 Z" fill="rgba(255,255,255,0.2)" />
        <path d="M28 82 L132 108 L132 422 L28 360 Z" fill="rgba(255,255,255,0.28)" />
        <path d="M132 108 L492 82 L492 384 L132 422 Z" fill="rgba(255,255,255,0.1)" />

        {/* outer tank lines */}
        <g stroke="#111827" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 82 L132 108 L492 82" />
          <path d="M28 82 L28 360 L132 422 L492 384 L492 82" />
          <path d="M132 108 L132 422" />
          <path d="M28 360 L132 422" />
          <path d="M132 422 L492 384" />
        </g>

        {/* internal dashed lines */}
        <g stroke="#374151" strokeWidth="1.4" strokeDasharray="7 7" opacity="0.48" strokeLinecap="round">
          <path d="M132 226 L360 198 L492 232" />
          <path d="M132 338 L360 318 L492 384" />
          <path d="M360 82 L360 318" />
          <path d="M132 226 L132 338 L360 318 L360 198" />
        </g>

        {/* top wireless/filter box */}
        <g fill="url(#wlMetal)" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M64 38 L176 25 L266 44 L150 58 Z" />
          <path d="M64 38 L150 58 L150 112 L64 94 Z" />
          <path d="M150 58 L266 44 L266 96 L150 112 Z" />
          <path d="M58 32 L176 18 L274 40" fill="none" />
          <path d="M58 40 L146 60 L274 47" fill="none" />
          <path d="M64 94 L150 112 L266 96" fill="none" />
        </g>

        {/* top round port */}
        <g stroke="#111827" strokeWidth="2" fill="none">
          <ellipse cx="96" cy="72" rx="13" ry="24" />
          <ellipse cx="101" cy="73" rx="9" ry="20" />
          <ellipse cx="105" cy="74" rx="5" ry="14" />
        </g>

        {/* side latches */}
        <g stroke="#111827" strokeWidth="2" fill="url(#wlMetal)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M25 138 L44 145 L44 170 L25 164 Z" />
          <path d="M29 137 L38 126 L44 145" fill="none" />
          <path d="M31 151 L41 154" fill="none" />
          <path d="M31 164 L41 167" fill="none" />

          <path d="M104 169 L126 177 L126 204 L104 197 Z" />
          <path d="M108 168 L118 156 L126 177" fill="none" />
          <path d="M110 183 L123 187" fill="none" />
          <path d="M110 197 L123 201" fill="none" />
        </g>

        {/* lower ports */}
        <g stroke="#111827" strokeWidth="2" fill="none">
          <ellipse cx="46" cy="334" rx="11" ry="24" />
          <ellipse cx="51" cy="334" rx="8" ry="20" />
          <ellipse cx="56" cy="334" rx="5" ry="15" />

          <ellipse cx="112" cy="370" rx="13" ry="25" />
          <ellipse cx="117" cy="370" rx="9" ry="21" />
          <ellipse cx="122" cy="370" rx="5" ry="16" />
        </g>

        {/* feet */}
        <g stroke="#111827" strokeWidth="2" fill="url(#wlMetal)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M140 421 L140 435 L178 430 L178 416" />
          <path d="M432 391 L432 406 L468 401 L468 387" />
        </g>
      </g>
    </svg>
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
    { unitId: "WL3000-000001", status: "offline" },
    { unitId: "WL3000-000002", status: "offline" },
    { unitId: "WL3000-000003", status: "offline" },
  ]);

  const PANEL_W = 980;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: 12, top: 12 };
    return computeCenteredPos({ panelW: PANEL_W, estH: 560 });
  });

  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setPos(computeCenteredPos({ panelW: PANEL_W, estH: 560 }));
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
            padding: "14px 18px",
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

        <div style={{ padding: 18, background: "#f8fafc" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 16,
                minHeight: 390,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a", marginBottom: 12 }}>
                Preview
              </div>

              <div
                style={{
                  height: 285,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "linear-gradient(180deg,#f8fafc,#eef2f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <WirelessTankPreview size={315} />
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: 12,
                  fontSize: 12,
                  color: "#334155",
                  lineHeight: 1.45,
                }}
              >
                This wireless tank uses the WL-3000 model and binds by Unit ID / serial number.
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 16,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
                Device Binding
              </div>

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

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Unit Search</div>
                <input
                  value={unitQuery}
                  onChange={(e) => setUnitQuery(e.target.value)}
                  style={inputStyle}
                  placeholder="Type to filter Unit ID / serial number..."
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Unit ID / Serial Number</div>
                <select value={unitId} onChange={(e) => setUnitId(e.target.value)} style={inputStyle}>
                  <option value="">Select Unit ID...</option>
                  {filteredUnits.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.unitId}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  marginTop: 4,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 10 }}>
                  Binding Preview
                </div>

                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.8 }}>
                  <div>
                    Model:{" "}
                    <span style={{ fontFamily: "monospace", fontWeight: 800 }}>
                      WL-3000
                    </span>
                  </div>

                  <div>
                    Unit ID:{" "}
                    <span style={{ fontFamily: "monospace", fontWeight: 800 }}>
                      {unitId || "--"}
                    </span>
                  </div>

                  <div>
                    Status:{" "}
                    {unitId ? (
                      selectedUnit?.status === "online" ? (
                        <span style={{ color: "#16a34a", fontWeight: 900 }}>ONLINE</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: 900 }}>OFFLINE</span>
                      )
                    ) : (
                      <span style={{ color: "#64748b", fontWeight: 900 }}>—</span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
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

          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            Backend polling route will be connected later. For now, this modal is focused on the final layout and saved properties.
          </div>
        </div>
      </div>
    </div>
  );
}