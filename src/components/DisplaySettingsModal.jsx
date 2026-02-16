// src/components/DisplaySettingModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

/* ===========================================
   MODELS
=========================================== */

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// ✅ Sampling options (same spirit as GraphicDisplaySettingsModal)
const SAMPLE_OPTIONS = [1000, 3000, 6000, 30000, 60000, 300000, 600000];

function formatSampleLabel(ms) {
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
}

/* ===========================================
   AUTH HELPERS (same as GraphicDisplay)
=========================================== */

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

/* ===========================================
   DEVICE LOADER (standalone in this file)
   ✅ IMPORTANT: avoid endpoints that cause 403/405 in your screenshots
=========================================== */

function normalizeDeviceList(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];

  return arr
    .map((r) => {
      const deviceId =
        r.deviceId ??
        r.device_id ??
        r.id ??
        r.imei ??
        r.IMEI ??
        r.DEVICE_ID ??
        "";
      if (!deviceId) return null;

      return {
        deviceId: String(deviceId),
        status: String(r.status ?? r.online ?? "").toLowerCase(),
        lastSeen: r.lastSeen ?? r.last_seen ?? r.updatedAt ?? r.updated_at,
        _raw: r,
      };
    })
    .filter(Boolean);
}

// ✅ only endpoints that should be allowed for normal users (no /devices)
async function loadDevicesForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const candidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"];

  let lastErr = null;

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });
      const list = normalizeDeviceList(data);
      if (list.length) return list;
      // if endpoint works but returns empty, continue trying others
    } catch (e) {
      lastErr = e;
    }
  }

  // if all failed, return empty (UI will show no devices)
  if (lastErr) {
    // optional: console.debug for you
    // console.debug("loadDevicesForModel failed:", lastErr);
  }
  return [];
}

// ✅ Prefer list-scan for live value to avoid 404/405 noisy endpoints
async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const listCandidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"];

  for (const p of listCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeDeviceList(data);
      const hit = arr.find((d) => String(d.deviceId) === String(deviceId));
      if (hit?._raw) return hit._raw;
    } catch {
      // continue
    }
  }

  return null;
}

function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "a"),
    f.replace("ai", "A"),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

/* ===========================================
   MATH
=========================================== */

function computeMathOutput(liveValue, formula) {
  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = liveValue;

  const upper = f.toUpperCase();
  if (upper.startsWith("CONCAT(") && f.endsWith(")")) {
    const inner = f.slice(7, -1);
    const parts = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && inner[i - 1] !== "\\") inQ = !inQ;

      if (ch === "," && !inQ) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur.trim());

    return parts
      .map((p) => {
        if (!p) return "";
        if (p === "VALUE" || p === "value") return VALUE ?? "";
        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);

        try {
          const expr = p.replace(/\bVALUE\b/gi, "VALUE");
          // eslint-disable-next-line no-new-func
          const fn = new Function("VALUE", `return (${expr});`);
          const r = fn(VALUE);
          return r ?? "";
        } catch {
          return "";
        }
      })
      .join("");
  }

  try {
    const expr = f.replace(/\bVALUE\b/gi, "VALUE");
    // eslint-disable-next-line no-new-func
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

/* ===========================================
   COMPONENT
=========================================== */

export default function DisplaySettingModal({ open = true, tank, onClose, onSave }) {
  if (!open) return null;

  const props = tank?.properties || {};

  // ✅ math
  const [formula, setFormula] = useState(props.formula ?? "");

  // ✅ binding
  const [bindModel, setBindModel] = useState(props.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "ai1");

  // ✅ poll / sampling
  const [sampleMs, setSampleMs] = useState(
    SAMPLE_OPTIONS.includes(Number(props.sampleMs)) ? Number(props.sampleMs) : 3000
  );

  const [devices, setDevices] = useState([]);
  const [liveValue, setLiveValue] = useState(null);
  const [outputValue, setOutputValue] = useState(null);
  const [liveErr, setLiveErr] = useState("");

  // -------------------------
  // ✅ DRAG STATE
  // -------------------------
  const PANEL_W = 1000;
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

  // ✅ Load from tank whenever tank changes
  useEffect(() => {
    if (!tank) return;

    const p = tank?.properties || {};
    setFormula(p.formula ?? "");
    setBindModel(p.bindModel ?? "zhc1921");
    setBindDeviceId(p.bindDeviceId ?? "");
    setBindField(p.bindField ?? "ai1");

    const incomingSample = Number(p.sampleMs ?? 3000);
    setSampleMs(SAMPLE_OPTIONS.includes(incomingSample) ? incomingSample : 3000);
  }, [tank]);

  // -------------------------
  // ✅ LOAD DEVICES
  // -------------------------
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      try {
        const list = await loadDevicesForModel(bindModel, { signal: ctrl.signal });
        if (cancelled) return;
        setDevices(list);

        // keep selection if still exists
        if (bindDeviceId && !list.find((d) => String(d.deviceId) === String(bindDeviceId))) {
          setBindDeviceId("");
        }
      } catch {
        if (cancelled) return;
        setDevices([]);
      }
    };

    load();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bindModel]);

  // -------------------------
  // ✅ LIVE VALUE POLL (for Math + Preview)
  // -------------------------
  useEffect(() => {
    if (!open) return;

    if (!bindModel || !bindDeviceId || !bindField) {
      setLiveValue(null);
      setOutputValue(null);
      setLiveErr("");
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setLiveErr("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        const value = row ? readAiField(row, bindField) : null;

        if (cancelled) return;

        const num =
          value === null || value === undefined || value === ""
            ? null
            : typeof value === "number"
            ? value
            : Number(value);

        const safeLive = Number.isFinite(num) ? num : null;
        setLiveValue(safeLive);

        const out = computeMathOutput(safeLive, formula);
        setOutputValue(out);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setLiveErr("Could not read live value (check API endpoint / fields).");
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 3000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [open, bindModel, bindDeviceId, bindField, sampleMs, formula]);

  const selectedDevice = useMemo(() => {
    return devices.find((d) => String(d.deviceId) === String(bindDeviceId)) || null;
  }, [devices, bindDeviceId]);

  // -------------------------
  // ✅ DRAG handlers
  // -------------------------
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
  // ✅ can apply
  // -------------------------
  const canApply = useMemo(() => {
    return !!bindDeviceId && !!bindField;
  }, [bindDeviceId, bindField]);

  // -------------------------
  // ✅ UI (remove bold on the right section)
  // -------------------------
  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#111827" };
  const sectionTitleStyle = { fontWeight: 600, fontSize: 16 };
  const fieldSelectStyle = {
    height: 38,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontWeight: 400,
    background: "#fff",
    outline: "none",
  };

  const previewTitleStyle = { fontWeight: 600, marginBottom: 8, fontSize: 13 };
  const previewTextStyle = { fontSize: 12, fontWeight: 400, color: "#111827" };
  const previewMutedStyle = { color: "#6b7280", fontWeight: 400, fontSize: 12 };

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
          <div>Display Output</div>
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
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* LEFT: MATH */}
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                    Live VALUE
                  </div>
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
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                    Output
                  </div>
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
                    {typeof outputValue === "string"
                      ? outputValue
                      : Number.isFinite(Number(outputValue))
                      ? Number(outputValue).toFixed(2)
                      : "0.00"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                  Formula
                </div>
                <textarea
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
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

                <div style={{ fontWeight: 600, margin: "10px 0 6px" }}>
                  String Output Examples
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>CONCAT("Temp=", VALUE)</div>
                  <div>CONCAT("Level=", VALUE, " %")</div>
                  <div>CONCAT("Vol=", VALUE * 2, " Gal")</div>
                </div>
              </div>

              {liveErr ? (
                <div
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#991b1b",
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {liveErr}
                </div>
              ) : null}
            </div>

            {/* RIGHT: BINDING */}
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
                <div style={labelStyle}>Device</div>
                <select
                  value={bindDeviceId}
                  onChange={(e) => setBindDeviceId(e.target.value)}
                  style={fieldSelectStyle}
                >
                  <option value="">Select device...</option>
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Analog Input (AI)</div>
                <select
                  value={bindField}
                  onChange={(e) => setBindField(e.target.value)}
                  style={fieldSelectStyle}
                >
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

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Sample</div>
                <select
                  value={sampleMs}
                  onChange={(e) => setSampleMs(Number(e.target.value))}
                  style={fieldSelectStyle}
                >
                  {SAMPLE_OPTIONS.map((ms) => (
                    <option key={ms} value={ms}>
                      {formatSampleLabel(ms)}
                    </option>
                  ))}
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
                  Selected:{" "}
                  <span style={{ fontFamily: "monospace" }}>{bindDeviceId || "--"}</span> ·{" "}
                  {selectedDevice?.status === "online" ? (
                    <span style={{ color: "#16a34a" }}>ONLINE</span>
                  ) : (
                    <span style={{ color: "#dc2626" }}>OFFLINE</span>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 10,
                    fontSize: 12,
                    fontWeight: 400,
                  }}
                >
                  <div>
                    <div style={previewMutedStyle}>Model</div>
                    <div style={{ marginTop: 2, fontWeight: 400 }}>
                      {MODEL_META[bindModel]?.label || "—"}
                    </div>
                  </div>

                  <div>
                    <div style={previewMutedStyle}>Selected AI</div>
                    <div style={{ marginTop: 2, fontWeight: 400 }}>
                      {String(bindField || "").toUpperCase().replace("AI", "AI-")}
                    </div>
                  </div>
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
                    // ✅ SAVE BULLETPROOF:
                    // 1) Save into tank.properties (what the widget reads)
                    // 2) Mirror at top-level too, in case parent merge drops properties
                    const nextProps = {
                      ...(tank?.properties || {}),
                      bindModel,
                      bindDeviceId,
                      bindField,
                      formula,
                      sampleMs,
                    };

                    const nextTank = {
                      ...tank,
                      // mirror (fallback)
                      bindModel,
                      bindDeviceId,
                      bindField,
                      formula,
                      sampleMs,
                      // source of truth for widget
                      properties: nextProps,
                    };

                    onSave?.(nextTank);
                    onClose?.();
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #bfe6c8",
                    background: canApply
                      ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                      : "#e5e7eb",
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
        </div>
      </div>
    </div>
  );
}
