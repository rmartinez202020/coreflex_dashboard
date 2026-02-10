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

function normalizeOnline(v) {
  if (v == null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["online", "on", "true", "1", "yes"].includes(s)) return true;
    if (["offline", "off", "false", "0", "no"].includes(s)) return false;
  }
  return null;
}

function hasAnyKeys(obj) {
  return obj && typeof obj === "object" && Object.keys(obj).length > 0;
}

export default function IndicatorLightSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData,
}) {
  if (!open || !tank) return null;

  // ✅ ALWAYS READ/WRITE FROM tank.properties
  const initialShapeStyle = tank?.properties?.shapeStyle ?? "circle";
  const initialOff = tank?.properties?.colorOff ?? "#9ca3af";
  const initialOn = tank?.properties?.colorOn ?? "#22c55e";

  const initialOffText = tank?.properties?.offText ?? "OFF";
  const initialOnText = tank?.properties?.onText ?? "ON";

  const initialDeviceId = tank?.properties?.tag?.deviceId ?? "";
  const initialField = tank?.properties?.tag?.field ?? "";

  const [shapeStyle, setShapeStyle] = React.useState(initialShapeStyle);
  const [offColor, setOffColor] = React.useState(initialOff);
  const [onColor, setOnColor] = React.useState(initialOn);

  const [offText, setOffText] = React.useState(initialOffText);
  const [onText, setOnText] = React.useState(initialOnText);

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);

  // ✅ devices list for dropdown (fallback to API if sensorsData has none)
  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  // --- helpers for UI preview
  const previewSize = 56;
  const borderRadius = shapeStyle === "square" ? 12 : 999;

  // =========================
  // ✅ DRAGGABLE MODAL WINDOW
  // =========================
  const MODAL_W = 980;
  const MODAL_H = 650;

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

      // 1) Try sensorsData.devices if present
      const sd = sensorsData?.devices;
      if (Array.isArray(sd) && sd.length > 0) {
        const mapped = sd
          .map((d) => ({
            id: String(d.id ?? d.deviceId ?? d.device_id ?? "").trim(),
            name:
              d.name ||
              d.label ||
              String(d.id ?? d.deviceId ?? d.device_id),
          }))
          .filter((x) => x.id);
        if (mapped.length > 0) {
          if (alive) setDevices(mapped);
          return;
        }
      }

      // 2) Fallback: infer from sensorsData.latest / values keys
      const inferredKeys = Object.keys(sensorsData?.latest || {});
      if (inferredKeys.length > 0) {
        const mapped = inferredKeys.map((k) => ({
          id: String(k),
          name: String(k),
        }));
        if (alive) setDevices(mapped);
        return;
      }

      const inferredKeys2 = Object.keys(sensorsData?.values || {});
      if (inferredKeys2.length > 0) {
        const mapped = inferredKeys2.map((k) => ({
          id: String(k),
          name: String(k),
        }));
        if (alive) setDevices(mapped);
        return;
      }

      // 3) BEST fallback: fetch claimed CF-2000 devices for this user
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
  }, [open, sensorsData]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  // =========================
  // ✅ DEVICE ONLINE/OFFLINE (separate from tag)
  // =========================
  const deviceOnline = React.useMemo(() => {
    if (!deviceId) return null;

    // If your backend ever provides a device-level status map, we’ll use it.
    const s1 =
      sensorsData?.deviceStatus?.[deviceId] ??
      sensorsData?.devicesStatus?.[deviceId] ??
      sensorsData?.status?.[deviceId];
    const normalized = normalizeOnline(s1);
    if (normalized !== null) return normalized;

    // Otherwise infer online if we have ANY telemetry object for the device.
    const obj =
      sensorsData?.latest?.[deviceId] ||
      sensorsData?.values?.[deviceId] ||
      sensorsData?.tags?.[deviceId];

    if (hasAnyKeys(obj)) return true;
    return false;
  }, [sensorsData, deviceId]);

  // =========================
  // ✅ TAG LIVE VALUE / STATUS (Online vs Offline + 0/1)
  // =========================
  const liveRawValue = React.useMemo(() => {
    if (!deviceId || !field) return undefined;

    const v1 = sensorsData?.latest?.[deviceId]?.[field];
    if (v1 !== undefined) return v1;

    const v2 = sensorsData?.values?.[deviceId]?.[field];
    if (v2 !== undefined) return v2;

    const v3 = sensorsData?.tags?.[deviceId]?.[field];
    if (v3 !== undefined) return v3;

    return undefined;
  }, [sensorsData, deviceId, field]);

  const tagOnline = liveRawValue !== undefined && liveRawValue !== null;

  const bool01 = React.useMemo(() => {
    if (!tagOnline) return null;

    const v = liveRawValue;

    if (typeof v === "number") return v > 0 ? 1 : 0;
    if (typeof v === "boolean") return v ? 1 : 0;

    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
      if (s === "0" || s === "false" || s === "off" || s === "no") return 0;

      const n = Number(s);
      if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
    }

    return v ? 1 : 0;
  }, [tagOnline, liveRawValue]);

  // ✅ When device changes, clear field
  React.useEffect(() => {
    setField("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

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
        tag: { deviceId, field },
      },
    });
  };

  const Pill = ({ ok, label }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
        background: ok ? "#ecfdf5" : "#fef2f2",
        color: ok ? "#166534" : "#991b1b",
        fontWeight: 900,
        fontSize: 12,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: ok ? "#22c55e" : "#ef4444",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );

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

        {/* Body (2 columns) */}
        <div
          style={{
            padding: 18,
            fontSize: 14,
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT: preview + settings */}
          <div>
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
                    background: offColor,
                    border: "2px solid rgba(0,0,0,0.25)",
                    margin: "0 auto",
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 10,
                    color: "#334155",
                    fontWeight: 800,
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
                    background: onColor,
                    border: "2px solid rgba(0,0,0,0.25)",
                    margin: "0 auto",
                  }}
                />
                <div
                  style={{
                    fontSize: 12,
                    marginTop: 10,
                    color: "#334155",
                    fontWeight: 800,
                  }}
                >
                  ON
                </div>
              </div>

              <div style={{ flex: 1, fontSize: 13, color: "#475569" }}>
                Configure shape, colors, text, and the tag that drives the state.
              </div>
            </div>

            {/* Shape */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                Shape
              </div>
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
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  OFF Text
                </div>
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
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  ON Text
                </div>
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
            <div style={{ display: "flex", gap: 12, marginBottom: 0 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  OFF Color
                </div>
                <input
                  type="color"
                  value={offColor}
                  onChange={(e) => setOffColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: 44,
                    border: "none",
                    cursor: "pointer",
                  }}
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
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  ON Color
                </div>
                <input
                  type="color"
                  value={onColor}
                  onChange={(e) => setOnColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: 44,
                    border: "none",
                    cursor: "pointer",
                  }}
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

          {/* RIGHT: Tag selector */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 14,
              background: "#f8fafc",
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
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                Device
              </div>
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
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill ok={deviceOnline === true} label={`Device: ${deviceOnline ? "Online" : "Offline"}`} />
                  {field ? (
                    <Pill ok={tagOnline} label={`Tag: ${tagOnline ? "Online" : "Offline"}`} />
                  ) : (
                    <Pill ok={false} label="Tag: Not selected" />
                  )}
                </div>
              )}
            </div>

            {/* ✅ DI TAG PICKER */}
            <div style={{ marginBottom: 12 }}>
              {deviceId ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {CF2000_DI_FIELDS.map((f) => {
                    const isSelected = String(field) === String(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => setField(f.key)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: isSelected
                            ? "2px solid #16a34a"
                            : "1px solid #e2e8f0",
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

            {/* ✅ Status panel (shows BOTH device + tag status + value) */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "#ffffff",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                  Status
                </div>

                <div style={{ marginTop: 6, fontSize: 13, color: "#334155" }}>
                  {deviceId ? (
                    <>
                      <div>
                        Device:{" "}
                        {deviceOnline === true ? (
                          <span style={{ fontWeight: 900, color: "#16a34a" }}>
                            Online
                          </span>
                        ) : (
                          <span style={{ fontWeight: 900, color: "#dc2626" }}>
                            Offline
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 4 }}>
                        Tag:{" "}
                        {field ? (
                          tagOnline ? (
                            <span style={{ fontWeight: 900, color: "#16a34a" }}>
                              Online
                            </span>
                          ) : (
                            <span style={{ fontWeight: 900, color: "#dc2626" }}>
                              Offline
                            </span>
                          )
                        ) : (
                          <span style={{ fontWeight: 900, color: "#64748b" }}>
                            Not selected
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#64748b" }}>Select a device</span>
                  )}
                </div>

                {deviceId && field && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                    Bound Tag: <b>{field}</b>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                  Value
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    marginTop: 8,
                    color: tagOnline ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {deviceId && field ? (tagOnline ? String(bool01) : "—") : "—"}
                </div>

                {/* Optional: show raw under it (helps debugging) */}
                <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                  {deviceId && field && tagOnline ? `raw: ${String(liveRawValue)}` : ""}
                </div>
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
