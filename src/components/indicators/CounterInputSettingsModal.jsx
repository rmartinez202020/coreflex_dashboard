// src/components/indicators/CounterInputSettingsModal.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Counter should ONLY count inputs (DI)
const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
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

  // legacy mappings: di1..di6 -> in1..in6
  if (/^di[1-6]$/i.test(field)) {
    const n = String(field).toLowerCase().replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = alt.toUpperCase();
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

// ✅ backend field normalization (must end up di1..di6)
function normalizeDiField(field) {
  const f = String(field || "").trim().toLowerCase();
  if (!f) return "";
  if (f.startsWith("in") && f.length === 3 && /\d/.test(f[2])) return `di${f[2]}`;
  if (/^di[1-6]$/.test(f)) return f;
  return "";
}

// ✅ best-effort dashboard id getter (no guessing, just safe fallbacks)
function resolveDashboardIdFromProps({ dashboardId, tank }) {
  const a = String(dashboardId || "").trim();
  if (a) return a;

  const b = String(tank?.dashboard_id || tank?.dashboardId || "").trim();
  if (b) return b;

  const c = String(tank?.properties?.dashboard_id || tank?.properties?.dashboardId || "").trim();
  if (c) return c;

  return null; // backend supports null dashboard_id
}

export default function CounterInputSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  // ✅ optional, if your canvas passes it
  dashboardId,
}) {
  // ✅ do NOT early return before hooks

  // =========================
  // ✅ STATE (title/digits + tag)
  // =========================
  const [title, setTitle] = React.useState("Counter");
  const [digits, setDigits] = React.useState(4);

  const [deviceId, setDeviceId] = React.useState("");
  const [field, setField] = React.useState("");

  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const telemetryRef = React.useRef({ loading: false });

  // ✅ backend counter state (server is source of truth)
  const [serverCounter, setServerCounter] = React.useState(null);
  const [serverErr, setServerErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loadingCounter, setLoadingCounter] = React.useState(false);

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
    // measure and center after render
    requestAnimationFrame(() => {
      const el = modalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const margin = 10;
      const x = clamp(
        (vw - rect.width) / 2,
        margin,
        Math.max(margin, vw - rect.width - margin)
      );
      const y = clamp(
        (vh - rect.height) / 2,
        margin,
        Math.max(margin, vh - rect.height - margin)
      );
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
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    }
    dragRef.current.pointerId = null;
  };

  // =========================
  // ✅ BACKEND: fetch counter by widget_id (optional dashboard_id)
  // =========================
  const fetchCounter = React.useCallback(async () => {
    const wid = String(tank?.id || "").trim();
    if (!wid) return;

    const did = resolveDashboardIdFromProps({ dashboardId, tank });
    const qs = did ? `?dashboard_id=${encodeURIComponent(did)}` : "";

    setServerErr("");
    setLoadingCounter(true);
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/device-counters/by-widget/${encodeURIComponent(wid)}${qs}`, {
        headers: getAuthHeaders(),
      });

      if (res.status === 404) {
        setServerCounter(null);
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Failed to load counter (${res.status})`);
      }

      const data = await res.json();
      setServerCounter(data || null);

      // if server has config, prefer it
      const srvDevice = String(data?.device_id || "").trim();
      const srvField = String(data?.field || "").trim();
      if (srvDevice) setDeviceId(srvDevice);
      if (srvField) setField(srvField);
    } catch (e) {
      setServerCounter(null);
      setServerErr(e?.message || "Failed to load counter");
    } finally {
      setLoadingCounter(false);
    }
  }, [tank?.id, dashboardId, tank]);

  // =========================
  // ✅ REHYDRATE ON OPEN
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    setTitle(String(tank?.properties?.title ?? "Counter"));

    const safeDigits = Number(tank?.properties?.digits ?? 4);
    setDigits(Number.isFinite(safeDigits) ? Math.max(1, Math.min(10, safeDigits)) : 4);

    setDeviceId(String(tank?.properties?.tag?.deviceId || ""));
    setField(String(tank?.properties?.tag?.field || ""));

    setTelemetryRow(null);
    setServerCounter(null);
    setServerErr("");

    // reset position so it recenters each open (optional)
    setPos(null);
    setIsDragging(false);
  }, [open, tank?.id]);

  // load server-side counter config on open
  React.useEffect(() => {
    if (!open || !tank?.id) return;
    fetchCounter();
  }, [open, tank?.id, fetchCounter]);

  // when open, center after first paint
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
  // ✅ LOAD DEVICES (claimed devices for this user)
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
  // ✅ POLL TELEMETRY (preview only)
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

  const previewState = React.useMemo(() => {
    if (!deviceId || !field) return "unconfigured";
    if (!deviceIsOnline) return "offline";
    if (tag01 === 1) return "on";
    if (tag01 === 0) return "off";
    return "unknown";
  }, [deviceId, field, deviceIsOnline, tag01]);

  const deviceDot = deviceId ? (deviceIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";
  const tagDot = deviceId && field ? (tagIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";

  // =========================
  // ✅ BACKEND: upsert counter (THIS makes counting work)
  // =========================
  async function upsertCounterOnBackend({ widgetId, deviceId: did, field: fld }) {
    const dashboard_id = resolveDashboardIdFromProps({ dashboardId, tank });

    const body = {
      widget_id: String(widgetId || "").trim(),
      device_id: String(did || "").trim(),
      field: normalizeDiField(fld),
      dashboard_id: dashboard_id || null,
      enabled: true,
    };

    if (!body.widget_id || !body.device_id || !body.field) {
      throw new Error("widget_id, device_id, and field are required");
    }

    const token = String(getToken() || "").trim();
    if (!token) throw new Error("Missing auth token. Please logout and login again.");

    const res = await fetch(`${API_URL}/device-counters/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(body),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(j?.detail || `Upsert failed (${res.status})`);
    }
    return j;
  }

  const apply = async () => {
    const nextDeviceId = String(deviceId || "").trim();
    const nextField = normalizeDiField(field);

    const nextDigits = Number.isFinite(Number(digits))
      ? Math.max(1, Math.min(10, Number(digits)))
      : 4;

    setServerErr("");

    // 1) Save widget properties (client side)
    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        title: String(title || "Counter").slice(0, 32),
        digits: nextDigits,
        tag: { deviceId: nextDeviceId, field: nextField },
      },
    });

    // 2) Upsert on backend so PLAY mode counts
    try {
      setSaving(true);
      const up = await upsertCounterOnBackend({
        widgetId: tank.id,
        deviceId: nextDeviceId,
        field: nextField,
      });
      setServerCounter(up || null);
      onClose?.();
    } catch (e) {
      // keep modal open so user sees error
      setServerErr(e?.message || "Failed to save counter on backend");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !tank) return null;

  const previewDigits = Number.isFinite(Number(digits))
    ? Math.max(1, Math.min(10, Number(digits)))
    : 4;

  // ✅ preview in modal should reflect server count when available (backend is source of truth)
  const serverCount = Number(serverCounter?.count ?? NaN);
  const localCount = Number(tank?.properties?.count ?? NaN);
  const previewCount = Number.isFinite(serverCount)
    ? serverCount
    : Number.isFinite(localCount)
    ? localCount
    : 0;

  const previewDisplay = String(Math.max(0, previewCount)).padStart(previewDigits, "0");

  const canApply = !!String(deviceId || "").trim() && !!normalizeDiField(field) && !saving;

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
          <span>Counter Input (DI)</span>

          <button
            onPointerDown={(e) => e.stopPropagation()}
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
          {!!serverErr && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {serverErr}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* LEFT SIDE (preview + title/digits) */}
            <div style={{ flex: 1, minWidth: 420 }}>
              {/* Preview */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 14,
                  background: "#f8fafc",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div style={{ width: 220 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 14,
                      color: "#0f172a",
                      textAlign: "center",
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "8px 10px",
                      marginBottom: 10,
                    }}
                  >
                    {title || "Counter"}
                  </div>

                  <div
                    style={{
                      height: 44,
                      borderRadius: 10,
                      border: "2px solid #8f8f8f",
                      background: "#f2f2f2",
                      boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: 22,
                      letterSpacing: 2,
                      color: "#111",
                    }}
                  >
                    {previewDisplay}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      height: 34,
                      borderRadius: 10,
                      background: "#cbd5e1",
                      color: "#334155",
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      userSelect: "none",
                      border: "1px solid #94a3b8",
                    }}
                    title="Reset is available only in PLAY mode (on the dashboard)"
                  >
                    Reset (Play mode)
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                    {loadingCounter ? (
                      <span>Loading backend counter…</span>
                    ) : serverCounter ? (
                      <span>
                        Backend: <b>count={serverCounter.count}</b>, <b>prev01={serverCounter.prev01}</b>
                      </span>
                    ) : (
                      <span>Backend: not created yet (will create on Apply)</span>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, fontSize: 13, color: "#475569" }}>
                  {deviceId && field ? (
                    previewState === "offline" ? (
                      <span>
                        Device is <b style={{ color: "#dc2626" }}>OFFLINE</b>. Preview is not live.
                      </span>
                    ) : previewState === "unknown" ? (
                      <span>Waiting for DI value…</span>
                    ) : previewState === "on" ? (
                      <span>
                        DI is <b style={{ color: "#16a34a" }}>ON (1)</b> — next rising edge will count.
                      </span>
                    ) : (
                      <span>
                        DI is <b style={{ color: "#475569" }}>OFF (0)</b> — ready for next pulse.
                      </span>
                    )
                  ) : (
                    "Set the title, digits, and the DI that will be counted (rising edge 0 → 1)."
                  )}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Counter"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Digits */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Digits</div>
                <input
                  type="number"
                  value={digits}
                  onChange={(e) => setDigits(e.target.value)}
                  min={1}
                  max={10}
                  style={{
                    width: 160,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  Display will be zero-padded (example: {String(0).padStart(previewDigits, "0")}).
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (device + DI dropdown + status) */}
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
                DI tag to count (pulse counter)
              </div>

              {devicesErr && (
                <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>{devicesErr}</div>
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

              {/* ✅ DI dropdown */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Select DI</div>
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
                  <option value="">— Select DI —</option>
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
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Device Status</div>
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
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Selected DI</div>

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
                          <b>{String(normalizeDiField(field) || field).toUpperCase()}</b>
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>Select DI</span>
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
                    Bound DI: <b>{normalizeDiField(field) || field}</b>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                Counting rule: increments when DI goes <b>0 → 1</b> (rising edge).
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
            disabled={saving}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
              opacity: saving ? 0.6 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={apply}
            disabled={!canApply}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: canApply ? "pointer" : "not-allowed",
              fontWeight: 900,
              fontSize: 14,
              opacity: canApply ? 1 : 0.5,
            }}
          >
            {saving ? "Saving…" : "Apply (saves backend)"}
          </button>
        </div>
      </div>
    </div>
  );
}
