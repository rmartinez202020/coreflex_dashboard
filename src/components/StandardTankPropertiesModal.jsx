// src/components/StandardTankPropertiesModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers (same idea as DisplayBox)
// -------------------------
function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

function normalizeList(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

// ✅ IMPORTANT: avoid /devices (can be 403/405). Use user-safe list endpoints.
async function loadDeviceListForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const listCandidates =
    base === "zhc1661"
      ? ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"]
      : ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"];

  for (const p of listCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeList(data);

      const out = arr
        .map((r) => {
          const id =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";
          const status = String(r.status || r.deviceStatus || r.state || "").toLowerCase();
          return {
            deviceId: String(id),
            status: status || "offline",
            raw: r,
          };
        })
        .filter((x) => x.deviceId);

      if (out.length) return out;
    } catch {
      // continue
    }
  }

  return [];
}

function toNum(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

/**
 * ✅ SAME STYLE AS SiloPropertiesModal.jsx
 *
 * Props:
 *  - open (bool)
 *  - tank (standard tank widget object)
 *  - onSave(updatedTank)
 *  - onClose()
 */
export default function StandardTankPropertiesModal({ open = true, tank, onSave, onClose }) {
  if (!open || !tank) return null;

  const props = tank?.properties || {};

  // -------------------------
  // ✅ LEFT: helper card (math helper)
  // -------------------------
  const helperCard = (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Math Helper</div>

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
    </div>
  );

  // -------------------------
  // ✅ MIDDLE: “Math” card
  // -------------------------
  const [name, setName] = useState(props.name ?? "");

  // ✅ IMPORTANT:
  // DraggableStandardTank currently reads: props.formula || props.math
  // We will store:
  //  - mathExpr (new canonical)
  //  - formula (compat)
  //  - math (compat)
  const initialMath =
    props.mathExpr !== undefined && props.mathExpr !== null
      ? String(props.mathExpr)
      : props.formula !== undefined && props.formula !== null
      ? String(props.formula)
      : props.math !== undefined && props.math !== null
      ? String(props.math)
      : "";

  const [mathExpr, setMathExpr] = useState(initialMath);

  // ✅ Capacity + Material/Liquid Color
  const [maxCapacity, setMaxCapacity] = useState(
    props.maxCapacity === undefined || props.maxCapacity === null ? "" : Number(props.maxCapacity)
  );
  const [materialColor, setMaterialColor] = useState(props.materialColor || "#00ff00");

  // placeholder (UI only)
  const [liveValue] = useState(0);

  // preview only: if number typed, show it, otherwise 0.00
  const outputValue = useMemo(() => {
    const n = Number(String(mathExpr || "").trim());
    return Number.isFinite(n) ? n : 0;
  }, [mathExpr]);

  // -------------------------
  // ✅ RIGHT: device binding with SEARCH
  // -------------------------
  const [bindModel, setBindModel] = useState(props.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "ai1");

  const [devices, setDevices] = useState([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [devicesLoading, setDevicesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setDevicesLoading(true);
        const list = await loadDeviceListForModel(bindModel, { signal: ctrl.signal });
        if (cancelled) return;
        setDevices(list || []);
      } catch {
        if (cancelled) return;
        setDevices([]);
      } finally {
        if (cancelled) return;
        setDevicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [open, bindModel]);

  const filteredDevices = useMemo(() => {
    const q = String(deviceQuery || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => String(d.deviceId || "").toLowerCase().includes(q));
  }, [devices, deviceQuery]);

  const selectedDevice = useMemo(() => {
    const hit = devices.find((d) => String(d.deviceId) === String(bindDeviceId));
    return hit || null;
  }, [devices, bindDeviceId]);

  const canApply = useMemo(() => {
    return !!String(bindDeviceId || "").trim() && !!String(bindField || "").trim();
  }, [bindDeviceId, bindField]);

  // -------------------------
  // ✅ DRAG STATE (same as silo modal)
  // -------------------------
  const PANEL_W = 1240;
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
    const estHeight = 640;

    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - estHeight) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

  // Load from tank whenever it changes
  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};

    setName(p.name ?? "");

    const m =
      p.mathExpr !== undefined && p.mathExpr !== null
        ? String(p.mathExpr)
        : p.formula !== undefined && p.formula !== null
        ? String(p.formula)
        : p.math !== undefined && p.math !== null
        ? String(p.math)
        : "";
    setMathExpr(m);

    setMaxCapacity(p.maxCapacity === undefined || p.maxCapacity === null ? "" : Number(p.maxCapacity));
    setMaterialColor(p.materialColor || "#00ff00");

    setBindModel(p.bindModel ?? "zhc1921");
    setBindDeviceId(p.bindDeviceId ?? "");
    setBindField(p.bindField ?? "ai1");

    setDeviceQuery("");
  }, [tank]);

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
  // ✅ UI styles (same)
  // -------------------------
  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#111827" };
  const sectionTitleStyle = { fontWeight: 600, fontSize: 16 };
  const fieldInputStyle = {
    height: 38,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontWeight: 400,
    background: "#fff",
    outline: "none",
    width: "100%",
  };
  const fieldSelectStyle = fieldInputStyle;

  const previewTitleStyle = { fontWeight: 600, marginBottom: 8, fontSize: 13 };
  const previewTextStyle = { fontSize: 12, fontWeight: 400, color: "#111827" };

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
          <div>Standard Tank Properties</div>
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

        {/* BODY */}
        <div style={{ padding: 18, background: "#f8fafc" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px 1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* LEFT: MATH HELPER */}
            {helperCard}

            {/* MIDDLE: MATH CARD + CAPACITY/COLOR */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={sectionTitleStyle}>Math</div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={fieldInputStyle}
                  placeholder="Example: Tank #1"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Live VALUE</div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 120,
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 999,
                      background: "rgba(187,247,208,0.55)",
                      border: "1px solid rgba(22,163,74,0.25)",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#0b3b18",
                    }}
                  >
                    {Number.isFinite(liveValue) ? liveValue.toFixed(2) : "--"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Output</div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 120,
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 999,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {Number.isFinite(Number(outputValue)) ? Number(outputValue).toFixed(2) : "0.00"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Math</div>
                <textarea
                  value={mathExpr}
                  onChange={(e) => setMathExpr(String(e.target.value))}
                  rows={4}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    padding: 10,
                    fontFamily: "monospace",
                    fontSize: 12,
                    outline: "none",
                    background: "#fff",
                  }}
                  placeholder='Example: VALUE*1.5  or  CONCAT("Temp=", VALUE)'
                />
              </div>

              {/* Capacity + Material/Liquid Color */}
              <div
                style={{
                  borderTop: "1px dashed #e5e7eb",
                  paddingTop: 12,
                  marginTop: 4,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={sectionTitleStyle}>Capacity &amp; Color</div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>Max Capacity</div>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(toNum(e.target.value))}
                    style={fieldInputStyle}
                    placeholder="Example: 5000"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>Material / Liquid Color</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="color"
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      style={{
                        width: 44,
                        height: 38,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        padding: 4,
                        cursor: "pointer",
                      }}
                    />
                    <input
                      value={materialColor}
                      onChange={(e) => setMaterialColor(e.target.value)}
                      style={fieldInputStyle}
                      placeholder="#00ff00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: BINDING + SEARCH */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={sectionTitleStyle}>Tag that drives the Trend (AI)</div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Model</div>
                <select
                  value={bindModel}
                  onChange={(e) => setBindModel(e.target.value)}
                  style={fieldSelectStyle}
                >
                  {Object.entries(MODEL_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Device Search</div>
                <input
                  value={deviceQuery}
                  onChange={(e) => setDeviceQuery(e.target.value)}
                  style={fieldInputStyle}
                  placeholder={devicesLoading ? "Loading devices..." : "Type to filter devices..."}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Device</div>
                <select
                  value={bindDeviceId}
                  onChange={(e) => setBindDeviceId(e.target.value)}
                  style={fieldSelectStyle}
                >
                  <option value="">{devicesLoading ? "Loading..." : "Select device..."}</option>
                  {filteredDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Analog Input (AI)</div>
                <select value={bindField} onChange={(e) => setBindField(e.target.value)} style={fieldSelectStyle}>
                  <option value="ai1">AI-1</option>
                  <option value="ai2">AI-2</option>
                  <option value="ai3">AI-3</option>
                  <option value="ai4">AI-4</option>
                  <option value="ai5">AI-5</option>
                  <option value="ai6">AI-6</option>
                  <option value="ai7">AI-7</option>
                  <option value="ai8">AI-8</option>
                </select>
              </div>

              <div
                style={{
                  marginTop: 4,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={previewTitleStyle}>Binding Preview</div>

                <div style={previewTextStyle}>
                  Selected: <span style={{ fontFamily: "monospace" }}>{bindDeviceId || "--"}</span> ·{" "}
                  {String(selectedDevice?.status || "").toLowerCase() === "online" ? (
                    <span style={{ color: "#16a34a" }}>ONLINE</span>
                  ) : (
                    <span style={{ color: "#dc2626" }}>OFFLINE</span>
                  )}
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <div style={previewTextStyle}>Current Value</div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 120,
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 999,
                      background: "rgba(187,247,208,0.55)",
                      border: "1px solid rgba(22,163,74,0.25)",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: "#0b3b18",
                    }}
                  >
                    {Number.isFinite(liveValue) ? liveValue.toFixed(2) : "--"}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
                <button
                  onClick={onClose}
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
                  disabled={!canApply}
                  onClick={() => {
                    const cleanMath = String(mathExpr || "").trim();

                    const nextProps = {
                      ...(tank?.properties || {}),
                      name: String(name || "").trim(),

                      // ✅ canonical + compatibility keys (so DraggableStandardTank works right now)
                      mathExpr: cleanMath,
                      formula: cleanMath,
                      math: cleanMath,

                      maxCapacity: maxCapacity === "" ? "" : Number(maxCapacity),
                      materialColor: String(materialColor || "#00ff00"),

                      bindModel,
                      bindDeviceId,
                      bindField,
                    };

                    const nextTank = { ...tank, properties: nextProps };
                    onSave?.(nextTank);
                    onClose?.();
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #bfe6c8",
                    background: canApply ? "linear-gradient(180deg,#bff2c7,#6fdc89)" : "#e5e7eb",
                    color: "#0b3b18",
                    fontWeight: 700,
                    cursor: canApply ? "pointer" : "not-allowed",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            Tip: if it feels tight on smaller screens, we can auto-switch to stacked layout.
          </div>
        </div>
      </div>
    </div>
  );
}
