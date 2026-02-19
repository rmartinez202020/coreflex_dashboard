// src/components/controls/ToggleSwitchPropertiesModal.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

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

// ✅ center helper (same approach as your other modals)
function computeCenteredPos({ panelW = 560, panelH = 520 } = {}) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - panelH) / 2));

  return { left, top };
}

export default function ToggleSwitchPropertiesModal({
  open = false,
  toggleSwitch,
  onSave,
  onClose,
}) {
  // ✅ DO NOT early-return before hooks (fixes stuck modal / unclickable X)
  const props = toggleSwitch?.properties || {};

  // -------------------------
  // ✅ binding state
  // -------------------------
  const [bindModel, setBindModel] = useState(props.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "do1");

  const [devices, setDevices] = useState([]);
  const [deviceQuery, setDeviceQuery] = useState("");
  const [devicesLoading, setDevicesLoading] = useState(false);

  // Load from widget whenever it changes
  useEffect(() => {
    const p = toggleSwitch?.properties || {};
    setBindModel(p.bindModel || "zhc1921");
    setBindDeviceId(p.bindDeviceId || "");
    setBindField(p.bindField || "do1");
    setDeviceQuery("");
  }, [toggleSwitch?.id]); // ✅ stable key

  // Load device list on open/model changes
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
    const id = String(bindDeviceId || "").trim();
    if (!id) return null;
    return devices.find((d) => String(d.deviceId) === id) || null;
  }, [devices, bindDeviceId]);

  const deviceIsOnline = useMemo(() => {
    const s = String(selectedDevice?.status || "").toLowerCase();
    if (!s) return false;
    return s.includes("online") || s === "on" || s === "active";
  }, [selectedDevice]);

  const canApply = useMemo(() => {
    return !!String(bindDeviceId || "").trim() && !!String(bindField || "").trim();
  }, [bindDeviceId, bindField]);

  // -------------------------
  // ✅ DRAG STATE + CENTER ON OPEN
  // -------------------------
  const PANEL_W = 560;
  const PANEL_H_EST = 520;

  const modalRef = useRef(null);

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => computeCenteredPos({ panelW: PANEL_W, panelH: PANEL_H_EST }));
  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    // If we can measure, use real height for better centering
    const rect = modalRef.current?.getBoundingClientRect();
    const h = rect?.height ? Math.min(rect.height, window.innerHeight - 24) : PANEL_H_EST;
    setPos(computeCenteredPos({ panelW: PANEL_W, panelH: h }));
  }, [open]);

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const rect = modalRef.current?.getBoundingClientRect();
    const mw = rect?.width ?? PANEL_W;
    const mh = rect?.height ?? PANEL_H_EST;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const minLeft = margin - (mw - 60);
    const maxLeft = w - margin;
    const minTop = margin;
    const maxTop = h - margin - 40;

    setPos({
      left: Math.min(Math.max(minLeft, nextLeft), maxLeft),
      top: Math.min(Math.max(minTop, nextTop), maxTop),
    });
  };

  const endDrag = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
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

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

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
  const sectionTitleStyle = { fontWeight: 700, fontSize: 16 };
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

  const previewTitleStyle = { fontWeight: 700, marginBottom: 8, fontSize: 13 };
  const previewTextStyle = { fontSize: 12, fontWeight: 500, color: "#111827" };

  // ✅ Render decision AFTER hooks
  if (!open || !toggleSwitch) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onMouseDown={(e) => {
        // optional: click outside closes
        // onClose?.();
        e.stopPropagation();
      }}
    >
      <div
        ref={modalRef}
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
            type="button"
            data-no-drag="true"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose?.();
            }}
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
              <div style={labelStyle}>Digital Output (DO)</div>
              <select
                value={bindField}
                onChange={(e) => setBindField(e.target.value)}
                style={fieldSelectStyle}
              >
                <option value="do1">DO-1</option>
                <option value="do2">DO-2</option>
                <option value="do3">DO-3</option>
                <option value="do4">DO-4</option>
                <option value="do5">DO-5</option>
                <option value="do6">DO-6</option>
              </select>
            </div>

            {/* Preview */}
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

              <div style={{ marginTop: 10, fontSize: 12, color: "#334155" }}>
                Output: <b>{String(bindField || "").toUpperCase()}</b>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose?.();
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!canApply}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const nextProps = {
                    ...(toggleSwitch?.properties || {}),
                    bindModel,
                    bindDeviceId,
                    bindField,
                  };

                  const next = { ...toggleSwitch, properties: nextProps };
                  onSave?.(next);
                  onClose?.();
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bfe6c8",
                  background: canApply ? "linear-gradient(180deg,#bff2c7,#6fdc89)" : "#e5e7eb",
                  color: "#0b3b18",
                  fontWeight: 800,
                  cursor: canApply ? "pointer" : "not-allowed",
                }}
              >
                Apply
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            Tip: Double-click the toggle on the canvas to open this binding window.
          </div>
        </div>
      </div>
    </div>
  );
}
