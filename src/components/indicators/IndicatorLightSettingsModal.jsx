// src/components/indicators/IndicatorLightSettingsModal.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Tag options (DI + DO)
const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

// ✅ Safe date formatter
function formatDateMMDDYYYY_hmma(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}-${h}:${min}${ampm}`;
}

// ✅ Convert anything to 0/1
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

// ✅ Read tag value from backend row (tries a few common variants)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  // direct
  if (row[field] !== undefined) return row[field];

  // upper-case key
  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // legacy mappings
  // di1..di6 -> in1..in6
  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `IN${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  // do1..do4 -> out1..out4 (common)
  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    const alt = `out${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `OUT${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

export default function IndicatorLightSettingsModal({ open, tank, onClose, onSave }) {
  // ✅ do NOT early return before hooks

  // =========================
  // ✅ STATE (shape/colors/text + tag)
  // =========================
  const [shapeStyle, setShapeStyle] = React.useState("circle");
  const [offColor, setOffColor] = React.useState("#9ca3af");
  const [onColor, setOnColor] = React.useState("#22c55e");
  const [offText, setOffText] = React.useState("OFF");
  const [onText, setOnText] = React.useState("ON");

  const [deviceId, setDeviceId] = React.useState("");
  const [field, setField] = React.useState("");

  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const telemetryRef = React.useRef({ loading: false });

  // =========================
  // ✅ DRAGGABLE MODAL STATE
  // =========================
  const modalRef = React.useRef(null);
  const [pos, setPos] = React.useState(null); // {x,y} once measured
  const [isDragging, setIsDragging] = React.useState(false);

  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    pointerId: null,
  });

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  const centerModal = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el = modalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const margin = 10;
      const x = clamp((vw - rect.width) / 2, margin, Math.max(margin, vw - rect.width - margin));
      const y = clamp((vh - rect.height) / 2, margin, Math.max(margin, vh - rect.height - margin));
      setPos({ x, y });
    });
  }, []);

  const onHeaderPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const el = modalRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const current = pos ?? { x: rect.left, y: rect.top };

    dragRef.current.dragging = true;
    setIsDragging(true);

    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.originX = current.x;
    dragRef.current.originY = current.y;
    dragRef.current.pointerId = e.pointerId;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onHeaderPointerMove = (e) => {
    if (!dragRef.current.dragging) return;

    const el = modalRef.current;
    if (!el) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;

    const maxX = Math.max(margin, vw - rect.width - margin);
    const maxY = Math.max(margin, vh - rect.height - margin);

    const nextX = clamp(dragRef.current.originX + dx, margin, maxX);
    const nextY = clamp(dragRef.current.originY + dy, margin, maxY);

    setPos({ x: nextX, y: nextY });
  };

  const onHeaderPointerUp = (e) => {
    if (!dragRef.current.dragging) return;

    dragRef.current.dragging = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    } catch {}
    dragRef.current.pointerId = null;
  };

  // =========================
  // ✅ REHYDRATE ON OPEN
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    setShapeStyle(String(tank?.properties?.shapeStyle || "circle"));
    setOffColor(String(tank?.properties?.colorOff || "#9ca3af"));
    setOnColor(String(tank?.properties?.colorOn || "#22c55e"));
    setOffText(String(tank?.properties?.offText || "OFF"));
    setOnText(String(tank?.properties?.onText || "ON"));

    setDeviceId(String(tank?.properties?.tag?.deviceId || ""));
    setField(String(tank?.properties?.tag?.field || ""));

    setTelemetryRow(null);

    // reset position so it recenters each open (optional)
    setPos(null);
    setIsDragging(false);
  }, [open, tank?.id]);

  // --- helpers for preview
  const previewSize = 56;
  const borderRadius = shapeStyle === "square" ? 12 : 999;

  // when open, center after first paint + clamp on resize
  React.useEffect(() => {
    if (!open) return;
    centerModal();

    const onResize = () => {
      requestAnimationFrame(() => {
        const el = modalRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 10;

        setPos((p) => {
          const cur = p ?? { x: rect.left, y: rect.top };
          const maxX = Math.max(margin, vw - rect.width - margin);
          const maxY = Math.max(margin, vh - rect.height - margin);
          return { x: clamp(cur.x, margin, maxX), y: clamp(cur.y, margin, maxY) };
        });
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, centerModal]);

  // =========================
  // ✅ LOAD DEVICES
  // =========================
  React.useEffect(() => {
    if (!open) return;

    let alive = true;

    async function loadDevices() {
      setDevicesErr("");
      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.detail || `Failed to load devices (${res.status})`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const mapped = list
          .map((r) => ({
            id: String(r.deviceId ?? r.device_id ?? "").trim(),
            name: String(r.deviceId ?? r.device_id ?? "").trim(),
          }))
          .filter((x) => x.id);

        if (alive) setDevices(mapped);
      } catch (e) {
        if (alive) {
          setDevices([]);
          setDevicesErr(e.message || "Failed to load devices");
        }
      }
    }

    loadDevices();
    return () => {
      alive = false;
    };
  }, [open]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  // =========================
  // ✅ POLL TELEMETRY
  // =========================
  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    if (!id) {
      setTelemetryRow(null);
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setTelemetryRow(null);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const row = list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;
      setTelemetryRow(row);
    } catch {
      setTelemetryRow(null);
    } finally {
      telemetryRef.current.loading = false;
    }
  }, [deviceId]);

  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, 3000);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    return s || "";
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const backendTagValue = React.useMemo(() => {
    if (!telemetryRow || !field) return undefined;
    return readTagFromRow(telemetryRow, field);
  }, [telemetryRow, field]);

  const tag01 = React.useMemo(() => to01(backendTagValue), [backendTagValue]);

  const tagIsOnline = deviceIsOnline && backendTagValue !== undefined && backendTagValue !== null;

  const lastSeenText = React.useMemo(() => {
    const ts = telemetryRow?.lastSeen || telemetryRow?.last_seen || "";
    return formatDateMMDDYYYY_hmma(ts);
  }, [telemetryRow]);

  // ✅ live preview state (ON when selected tag is 1)
  const previewState = React.useMemo(() => {
    if (!deviceId || !field) return "unknown";
    if (!deviceIsOnline) return "offline";
    if (tag01 === 1) return "on";
    if (tag01 === 0) return "off";
    return "unknown";
  }, [deviceId, field, deviceIsOnline, tag01]);

  const previewIsOn = previewState === "on";
  const previewIsOff = previewState === "off";
  const previewUnknown = previewState === "unknown" || previewState === "offline";

  const previewOffFill = previewUnknown ? offColor : previewIsOff ? offColor : "#e5e7eb";
  const previewOnFill = previewUnknown ? onColor : previewIsOn ? onColor : "#e5e7eb";

  const deviceDot = deviceId ? (deviceIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";
  const tagDot = deviceId && field ? (tagIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";

  const apply = () => {
    const nextDeviceId = String(deviceId || "").trim();
    const nextField = String(field || "").trim();

    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        shapeStyle,
        colorOff: offColor,
        colorOn: onColor,
        offText,
        onText,
        tag: { deviceId: nextDeviceId, field: nextField },
      },
    });

    onClose?.();
  };

  if (!open || !tank) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      <div
        ref={modalRef}
        style={{
          position: "absolute",
          left: pos ? pos.x : "50%",
          top: pos ? pos.y : "50%",
          transform: pos ? "none" : "translate(-50%, -50%)",
          width: 1040,
          maxWidth: "calc(100vw - 60px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header (DRAG HANDLE) */}
        <div
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            userSelect: "none",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          title="Drag to move"
        >
          <span>Indicator Light</span>

          <button
            onPointerDown={(e) => e.stopPropagation()} // ✅ prevent drag
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, fontSize: 14 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* LEFT SIDE (shape/colors/text/preview) */}
            <div style={{ flex: 1, minWidth: 420 }}>
              {/* Preview */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 14,
                  background: "#f8fafc",
                  marginBottom: 14,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: previewSize,
                      height: previewSize,
                      borderRadius,
                      background: previewOffFill,
                      border: previewIsOff
                        ? "3px solid rgba(0,0,0,0.35)"
                        : "2px solid rgba(0,0,0,0.20)",
                      margin: "0 auto",
                      boxShadow: previewIsOff ? "0 0 0 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 160ms ease",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 10,
                      color: "#334155",
                      fontWeight: previewIsOff ? 900 : 700,
                      opacity: previewIsOff ? 1 : 0.75,
                    }}
                  >
                    {offText || "OFF"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: previewSize,
                      height: previewSize,
                      borderRadius,
                      background: previewOnFill,
                      border: previewIsOn
                        ? "3px solid rgba(0,0,0,0.35)"
                        : "2px solid rgba(0,0,0,0.20)",
                      margin: "0 auto",
                      boxShadow: previewIsOn ? "0 0 0 4px rgba(0,0,0,0.06)" : "none",
                      transition: "all 160ms ease",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 10,
                      color: "#334155",
                      fontWeight: previewIsOn ? 900 : 700,
                      opacity: previewIsOn ? 1 : 0.75,
                    }}
                  >
                    {onText || "ON"}
                  </div>
                </div>

                <div style={{ flex: 1, fontSize: 13, color: "#475569" }}>
                  {deviceId && field ? (
                    previewState === "offline" ? (
                      <span>
                        Device is <b style={{ color: "#dc2626" }}>OFFLINE</b>. Preview is not live.
                      </span>
                    ) : previewState === "unknown" ? (
                      <span>Waiting for tag value…</span>
                    ) : previewIsOn ? (
                      <span>
                        Tag is <b style={{ color: "#16a34a" }}>ON (1)</b>
                      </span>
                    ) : (
                      <span>
                        Tag is <b style={{ color: "#475569" }}>OFF (0)</b>
                      </span>
                    )
                  ) : (
                    "Configure shape, colors, text, and the tag that drives the state."
                  )}
                </div>
              </div>

              {/* Shape */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Shape</div>
                <label style={{ marginRight: 18, fontSize: 14 }}>
                  <input
                    type="radio"
                    checked={shapeStyle === "circle"}
                    onChange={() => setShapeStyle("circle")}
                  />{" "}
                  Circle
                </label>
                <label style={{ fontSize: 14 }}>
                  <input
                    type="radio"
                    checked={shapeStyle === "square"}
                    onChange={() => setShapeStyle("square")}
                  />{" "}
                  Square
                </label>
              </div>

              {/* Text ON/OFF */}
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>OFF Text</div>
                  <input
                    value={offText}
                    onChange={(e) => setOffText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>ON Text</div>
                  <input
                    value={onText}
                    onChange={(e) => setOnText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              {/* Colors */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>OFF Color</div>
                  <input
                    type="color"
                    value={offColor}
                    onChange={(e) => setOffColor(e.target.value)}
                    style={{ width: "100%", height: 44, border: "none", cursor: "pointer" }}
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#475569",
                      userSelect: "none",
                    }}
                  >
                    Click to select the color
                  </div>
                </div>

                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>ON Color</div>
                  <input
                    type="color"
                    value={onColor}
                    onChange={(e) => setOnColor(e.target.value)}
                    style={{ width: "100%", height: 44, border: "none", cursor: "pointer" }}
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#475569",
                      userSelect: "none",
                    }}
                  >
                    Click to select the color
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (device + tag dropdown + status) */}
            <div
              style={{
                width: 420,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#ffffff",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
                Tag that drives the LED (ON/OFF)
              </div>

              {devicesErr && (
                <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>
                  {devicesErr}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Device</div>
                <select
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                  }}
                >
                  <option value="">— Select device —</option>
                  {devices.map((d) => (
                    <option key={String(d.id)} value={String(d.id)}>
                      {d.name || d.id}
                    </option>
                  ))}
                </select>

                {deviceId && selectedDevice && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                    Selected: <b>{selectedDevice.id}</b> {"  "}•{"  "}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: deviceDot,
                          display: "inline-block",
                        }}
                      />
                      <b style={{ color: deviceIsOnline ? "#16a34a" : "#dc2626" }}>
                        {backendDeviceStatus ? backendDeviceStatus.toUpperCase() : "—"}
                      </b>
                    </span>
                  </div>
                )}

                {deviceId && (
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                    Last seen: <b>{lastSeenText}</b>
                  </div>
                )}
              </div>

              {/* ✅ New: Tag dropdown (DI + DO) */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Select Tag</div>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  disabled={!deviceId}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                    opacity: deviceId ? 1 : 0.6,
                    cursor: deviceId ? "pointer" : "not-allowed",
                  }}
                >
                  <option value="">— Select DI/DO —</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                      Device Status
                    </div>
                    <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>
                      {deviceId ? (
                        backendDeviceStatus ? (
                          <span
                            style={{
                              fontWeight: 900,
                              color: deviceIsOnline ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {deviceIsOnline ? "Online" : "Offline"}
                          </span>
                        ) : (
                          <span style={{ color: "#64748b" }}>—</span>
                        )
                      ) : (
                        <span style={{ color: "#64748b" }}>Select a device</span>
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                      Selected Tag
                    </div>

                    <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>
                      {deviceId && field ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 99,
                              background: tagDot,
                              display: "inline-block",
                            }}
                          />
                          <b>{String(field).toUpperCase()}</b>
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>Select tag</span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>
                      {deviceId && field ? (
                        tagIsOnline ? (
                          <span style={{ fontWeight: 900 }}>
                            Value: <span style={{ color: "#0f172a" }}>{String(tag01 ?? "—")}</span>
                          </span>
                        ) : (
                          <span style={{ fontWeight: 900, color: "#dc2626" }}>Offline / No data</span>
                        )
                      ) : (
                        <span style={{ color: "#64748b" }}>—</span>
                      )}
                    </div>
                  </div>
                </div>

                {deviceId && field && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Bound Tag: <b>{field}</b>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: 14,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            Cancel
          </button>

          <button
            onClick={apply}
            disabled={!deviceId || !field}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
              opacity: !deviceId || !field ? 0.5 : 1,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
