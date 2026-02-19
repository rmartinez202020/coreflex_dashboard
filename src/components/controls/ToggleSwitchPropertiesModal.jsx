// src/components/ToggleSwitchPropertiesModal.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers
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

// ✅ IMPORTANT: avoid /devices. Use user-safe list endpoints.
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
          return { deviceId: String(id), status: status || "offline", raw: r };
        })
        .filter((x) => x.deviceId);

      if (out.length) return out;
    } catch {
      // keep trying other endpoints
    }
  }

  return [];
}

// ✅ optional: try to read the current DO state (best-effort)
function readDoFromRow(row, field) {
  if (!row || !field) return undefined;
  const f = String(field).toLowerCase();

  // direct
  if (row[f] !== undefined) return row[f];

  // uppercase
  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  // sometimes "do1" stored as "out1" or "DO_1" etc (best effort)
  if (/^do[1-9]\d*$/i.test(f)) {
    const n = f.replace("do", "");
    const alt = `out${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = alt.toUpperCase();
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

// ✅ center helper (prevents flash)
function computeCenteredPos({ panelW = 980, estH = 560 } = {}) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - estH) / 2));

  return { left, top };
}

export default function ToggleSwitchPropertiesModal({
  open = false,
  toggleSwitch, // the widget object
  onSave, // (nextWidget) => void
  onClose, // () => void
}) {
  if (!open || !toggleSwitch) return null;

  const props = toggleSwitch?.properties || {};

  // -------------------------
  // ✅ RIGHT: device binding (DO)
  // -------------------------
  const [bindModel, setBindModel] = useState(props.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "do1");

  const [devices, setDevices] = useState([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [devicesLoading, setDevicesLoading] = useState(false);

  // -------------------------
  // ✅ LIVE: status + current DO (best-effort polling)
  // -------------------------
  const [liveRow, setLiveRow] = useState(null);
  const [deviceIsOnline, setDeviceIsOnline] = useState(false);

  // ✅ Load device list when open/model changes
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

  // ✅ Poll a "live row" (uses same style as your other widgets: list/latest)
  useEffect(() => {
    if (!open) return;
    const dev = String(bindDeviceId || "").trim();
    const model = String(bindModel || "").trim();
    if (!dev || !model) {
      setLiveRow(null);
      setDeviceIsOnline(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    // NOTE:
    // I don’t know your exact telemetry endpoint name here, so this is BEST-EFFORT.
    // If you already have a known endpoint for live device row, replace candidates below.
    const candidates =
      model === "zhc1661"
        ? [
            `/zhc1661/telemetry/latest?device_id=${encodeURIComponent(dev)}`,
            `/zhc1661/telemetry?device_id=${encodeURIComponent(dev)}&limit=1`,
            `/zhc1661/latest?device_id=${encodeURIComponent(dev)}`,
          ]
        : [
            `/zhc1921/telemetry/latest?device_id=${encodeURIComponent(dev)}`,
            `/zhc1921/telemetry?device_id=${encodeURIComponent(dev)}&limit=1`,
            `/zhc1921/latest?device_id=${encodeURIComponent(dev)}`,
          ];

    async function loadOnce() {
      for (const p of candidates) {
        try {
          const data = await apiGet(p, { signal: ctrl.signal });
          const arr = normalizeList(data);
          const row = arr?.[0] || data?.row || data?.latest || data || null;
          if (row) {
            setLiveRow(row);

            const st = String(row.status || row.deviceStatus || row.state || "").toLowerCase();
            if (st) setDeviceIsOnline(st === "online");

            // if no explicit status, assume "online" if row exists
            if (!st) setDeviceIsOnline(true);

            return;
          }
        } catch {
          // try next
        }
      }

      // nothing worked
      setLiveRow(null);
      setDeviceIsOnline(false);
    }

    loadOnce();
    const t = window.setInterval(loadOnce, 2500);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [open, bindModel, bindDeviceId]);

  // ✅ filter devices by query
  const filteredDevices = useMemo(() => {
    const q = String(deviceQuery || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => String(d.deviceId || "").toLowerCase().includes(q));
  }, [devices, deviceQuery]);

  const canApply = useMemo(() => {
    return !!String(bindDeviceId || "").trim() && !!String(bindField || "").trim();
  }, [bindDeviceId, bindField]);

  const liveDoValue = useMemo(() => {
    const v = readDoFromRow(liveRow, bindField);
    if (v === undefined || v === null) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "number") return v ? 1 : 0;
    const s = String(v).trim().toLowerCase();
    if (s === "true" || s === "on") return 1;
    if (s === "false" || s === "off") return 0;
    const n = Number(s);
    return Number.isFinite(n) ? (n ? 1 : 0) : null;
  }, [liveRow, bindField]);

  // -------------------------
  // ✅ DRAG STATE (NO FLASH)
  // -------------------------
  const PANEL_W = 980;
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: 12, top: 12 };
    return computeCenteredPos({ panelW: PANEL_W, estH: 560 });
  });
  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setPos(computeCenteredPos({ panelW: PANEL_W, estH: 560 }));
  }, [open]);

  // load from widget whenever it changes
  useEffect(() => {
    if (!toggleSwitch) return;
    const p = toggleSwitch?.properties || {};

    setBindModel(p.bindModel ?? "zhc1921");
    setBindDeviceId(p.bindDeviceId ?? "");
    setBindField(p.bindField ?? "do1");
    setDeviceQuery("");
  }, [toggleSwitch]);

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
          <div>Toggle Switch Properties</div>
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
              gridTemplateColumns: "1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* ✅ BINDING PANEL ONLY */}
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
              <div style={sectionTitleStyle}>Device + Digital Output (DO)</div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Model</div>
                <select value={bindModel} onChange={(e) => setBindModel(e.target.value)} style={fieldSelectStyle}>
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
                <select value={bindDeviceId} onChange={(e) => setBindDeviceId(e.target.value)} style={fieldSelectStyle}>
                  <option value="">{devicesLoading ? "Loading..." : "Select device..."}</option>
                  {filteredDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Digital Output (DO)</div>
                <select value={bindField} onChange={(e) => setBindField(e.target.value)} style={fieldSelectStyle}>
                  <option value="do1">DO-1</option>
                  <option value="do2">DO-2</option>
                  <option value="do3">DO-3</option>
                  <option value="do4">DO-4</option>
                  <option value="do5">DO-5</option>
                  <option value="do6">DO-6</option>
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
                  {bindDeviceId ? (
                    deviceIsOnline ? (
                      <span style={{ color: "#16a34a" }}>ONLINE</span>
                    ) : (
                      <span style={{ color: "#dc2626" }}>OFFLINE</span>
                    )
                  ) : (
                    <span style={{ color: "#64748b" }}>—</span>
                  )}
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <div style={previewTextStyle}>Current DO</div>

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
                      fontWeight: 700,
                      color: "#0b3b18",
                    }}
                  >
                    {liveDoValue === null ? "--" : liveDoValue ? "ON (1)" : "OFF (0)"}
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
                    const nextProps = {
                      ...(toggleSwitch?.properties || {}),
                      bindModel,
                      bindDeviceId,
                      bindField,
                    };

                    const nextWidget = {
                      ...toggleSwitch,
                      properties: nextProps,
                    };

                    onSave?.(nextWidget);
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
            Tip: double-click the toggle switch to open this binding modal.
          </div>
        </div>
      </div>
    </div>
  );
}
