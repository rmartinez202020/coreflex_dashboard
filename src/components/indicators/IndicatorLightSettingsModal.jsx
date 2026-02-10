// src/components/indicators/IndicatorLightSettingsModal.jsx
import React from "react";
import { API_URL } from "../../config/api";

// ✅ per-tab token
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ CF-2000 digital inputs are fixed
const CF2000_DI_FIELDS = [
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

// ✅ Normalize anything into "di1".."di6" so button highlight ALWAYS works
function normalizeDiKey(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) return "";

  // accept: "di1", "di-1", "di 1", "DI1", etc.
  const m = s.match(/^di[\s\-]?([1-6])$/);
  if (m) return `di${m[1]}`;

  // fallback: find first di + digit anywhere (older saved formats)
  const m2 = s.match(/di[\s\-]?([1-6])/);
  if (m2) return `di${m2[1]}`;

  return s;
}

// ✅ Read DI values from backend rows (supports multiple legacy keys)
function readDiFromRow(row, diKey) {
  if (!row) return undefined;

  const k = normalizeDiKey(diKey);

  if (row[k] !== undefined) return row[k];

  const map = { di1: "in1", di2: "in2", di3: "in3", di4: "in4", di5: "in5", di6: "in6" };
  const alt = map[k];
  if (alt && row[alt] !== undefined) return row[alt];

  const map2 = { di1: "DI1", di2: "DI2", di3: "DI3", di4: "DI4", di5: "DI5", di6: "DI6" };
  const alt2 = map2[k];
  if (alt2 && row[alt2] !== undefined) return row[alt2];

  return undefined;
}

export default function IndicatorLightSettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open || !tank) return null;

  // =========================
  // ✅ STATE
  // =========================
  const [shapeStyle, setShapeStyle] = React.useState("circle");
  const [offColor, setOffColor] = React.useState("#9ca3af");
  const [onColor, setOnColor] = React.useState("#22c55e");

  const [offText, setOffText] = React.useState("OFF");
  const [onText, setOnText] = React.useState("ON");

  const [deviceId, setDeviceId] = React.useState("");
  const [field, setField] = React.useState("");

  const [tagSearch, setTagSearch] = React.useState("");

  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const [telemetryErr, setTelemetryErr] = React.useState("");
  const telemetryRef = React.useRef({ loading: false });

  // ✅ track previous deviceId so we ONLY clear field when user changes device
  const prevDeviceIdRef = React.useRef("");

  // =========================
  // ✅ REHYDRATE FROM SAVED tank.properties (when opening)
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    const nextShapeStyle = tank?.properties?.shapeStyle ?? "circle";
    const nextOff = tank?.properties?.colorOff ?? "#9ca3af";
    const nextOn = tank?.properties?.colorOn ?? "#22c55e";
    const nextOffText = tank?.properties?.offText ?? "OFF";
    const nextOnText = tank?.properties?.onText ?? "ON";
    const nextDeviceId = tank?.properties?.tag?.deviceId ?? "";
    const nextField = tank?.properties?.tag?.field ?? "";

    setShapeStyle(nextShapeStyle);
    setOffColor(nextOff);
    setOnColor(nextOn);
    setOffText(nextOffText);
    setOnText(nextOnText);

    setDeviceId(String(nextDeviceId || "").trim());
    setField(normalizeDiKey(nextField)); // ✅ normalize saved field so button highlights

    setTagSearch("");
    setTelemetryRow(null);
    setTelemetryErr("");

    // ✅ set prevDeviceId to the saved one, so we don't clear field on open
    prevDeviceIdRef.current = String(nextDeviceId || "").trim();
  }, [open, tank?.id]);

  // --- helpers for UI preview
  const previewSize = 56;
  const borderRadius = shapeStyle === "square" ? 12 : 999;

  // =========================
  // ✅ DRAGGABLE MODAL WINDOW
  // =========================
  const MODAL_W = Math.min(1040, window.innerWidth - 60);
  const MODAL_H = 560;

  const clampRaw = (x, y) => {
    const pad = 10;
    const maxX = Math.max(pad, window.innerWidth - MODAL_W - pad);
    const maxY = Math.max(pad, window.innerHeight - MODAL_H - pad);
    return {
      x: Math.min(Math.max(x, pad), maxX),
      y: Math.min(Math.max(y, pad), maxY),
    };
  };

  const [pos, setPos] = React.useState(() => {
    const cx = Math.round((window.innerWidth - MODAL_W) / 2);
    const cy = Math.round((window.innerHeight - MODAL_H) / 2);
    return clampRaw(cx, cy);
  });

  const clamp = React.useCallback((x, y) => clampRaw(x, y), []);

  const draggingRef = React.useRef(false);
  const dragOffsetRef = React.useRef({ dx: 0, dy: 0 });

  React.useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;

      const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? 0);
      const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? 0);

      const nx = clientX - dragOffsetRef.current.dx;
      const ny = clientY - dragOffsetRef.current.dy;
      setPos(clamp(nx, ny));
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("blur", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onUp);
    };
  }, [clamp]);

  const startDrag = (e) => {
    if (e.button != null && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    draggingRef.current = true;

    const clientX = e.clientX ?? 0;
    const clientY = e.clientY ?? 0;

    dragOffsetRef.current = {
      dx: clientX - pos.x,
      dy: clientY - pos.y,
    };
  };

  const stopDrag = () => {
    draggingRef.current = false;
  };

  // =========================
  // ✅ LOAD DEVICES FOR DROPDOWN
  // =========================
  React.useEffect(() => {
    let alive = true;

    async function loadDevices() {
      setDevicesErr("");

      try {
        const token = String(getToken() || "").trim();
        if (!token) {
          if (alive) {
            setDevices([]);
            setDevicesErr("Missing auth token. Please logout and login again.");
          }
          return;
        }

        const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
          headers: { ...getAuthHeaders() },
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
          setDevicesErr(e.message || "Failed to load devices for this user.");
        }
      }
    }

    if (open) loadDevices();

    return () => {
      alive = false;
    };
  }, [open]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  const filteredFields = React.useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return CF2000_DI_FIELDS;
    return CF2000_DI_FIELDS.filter(
      (f) => f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [tagSearch]);

  // =========================
  // ✅ ONLY CLEAR FIELD WHEN USER CHANGES DEVICE (not on open)
  // =========================
  React.useEffect(() => {
    const prev = String(prevDeviceIdRef.current || "").trim();
    const cur = String(deviceId || "").trim();

    if (!cur) {
      // user cleared device
      prevDeviceIdRef.current = cur;
      setField("");
      setTagSearch("");
      setTelemetryRow(null);
      setTelemetryErr("");
      return;
    }

    if (prev && prev !== cur) {
      // ✅ user picked a different device
      setField("");
      setTagSearch("");
      setTelemetryRow(null);
      setTelemetryErr("");
    }

    prevDeviceIdRef.current = cur;
  }, [deviceId]);

  // =========================
  // ✅ PULL REAL STATUS/DI VALUES (backend polling)
  // =========================
  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    if (!id) {
      setTelemetryRow(null);
      setTelemetryErr("");
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    setTelemetryErr("");

    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        headers: { ...getAuthHeaders() },
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Failed to load device telemetry (${res.status})`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const row =
        list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;

      setTelemetryRow(row);
    } catch (e) {
      setTelemetryRow(null);
      setTelemetryErr(e.message || "Failed to load device telemetry.");
    } finally {
      telemetryRef.current.loading = false;
    }
  }, [deviceId]);

  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();

    const POLL_MS = 3000;
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, POLL_MS);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    if (!s) return "";
    return s;
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const backendDiValue = React.useMemo(() => {
    if (!telemetryRow || !field) return undefined;
    return readDiFromRow(telemetryRow, field);
  }, [telemetryRow, field]);

  const tag01 = React.useMemo(() => to01(backendDiValue), [backendDiValue]);

  const tagIsOnline =
    deviceIsOnline && backendDiValue !== undefined && backendDiValue !== null;

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

  const apply = () => {
    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        shapeStyle,
        colorOff: offColor,
        colorOn: onColor,
        offText,
        onText,
        tag: { deviceId: String(deviceId || "").trim(), field: normalizeDiKey(field) }, // ✅ normalize on save
      },
    });
  };

  const deviceDot = deviceId ? (deviceIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";
  const tagDot = deviceId && field ? (tagIsOnline ? "#16a34a" : "#dc2626") : "#94a3b8";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onMouseDown={() => {
        if (draggingRef.current) return;
        onClose?.();
      }}
      onPointerDown={() => {
        if (draggingRef.current) return;
        onClose?.();
      }}
    >
      <div
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: MODAL_W,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onPointerDown={startDrag}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const cx = Math.round((window.innerWidth - MODAL_W) / 2);
            const cy = Math.round((window.innerHeight - MODAL_H) / 2);
            setPos(clamp(cx, cy));
          }}
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
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <span>Indicator Light</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              stopDrag();
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
            {/* LEFT SIDE */}
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
                    OFF
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
                    ON
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

            {/* RIGHT SIDE */}
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
              {telemetryErr && (
                <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>
                  {telemetryErr}
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

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Search DI</div>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ex: di1, di5..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                {deviceId ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {filteredFields.map((f) => {
                      const isSelected = normalizeDiKey(field) === normalizeDiKey(f.key); // ✅ normalize for highlight
                      return (
                        <button
                          key={f.key}
                          onClick={() => setField(normalizeDiKey(f.key))} // ✅ normalize on select
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: isSelected ? "2px solid #16a34a" : "1px solid #e2e8f0",
                            background: isSelected ? "#ecfdf5" : "white",
                            cursor: "pointer",
                            fontWeight: isSelected ? 900 : 700,
                            fontSize: 13,
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    Select a device to choose a DI tag.
                  </div>
                )}
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
                          <b>{normalizeDiKey(field).toUpperCase()}</b>
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>Select DI tag</span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, marginTop: 6, color: "#334155" }}>
                      {deviceId && field ? (
                        tagIsOnline ? (
                          <span style={{ fontWeight: 900 }}>
                            Value:{" "}
                            <span style={{ color: "#0f172a" }}>{String(tag01 ?? "—")}</span>
                          </span>
                        ) : (
                          <span style={{ fontWeight: 900, color: "#dc2626" }}>
                            Offline / No data
                          </span>
                        )
                      ) : (
                        <span style={{ color: "#64748b" }}>—</span>
                      )}
                    </div>
                  </div>
                </div>

                {deviceId && field && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                    Bound Tag: <b>{normalizeDiKey(field)}</b>
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
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              apply();
            }}
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
