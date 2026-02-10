// src/components/indicators/IndicatorLightSettingsModal.jsx
import React from "react";

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

  // ✅ optional: search/filter tags
  const [tagSearch, setTagSearch] = React.useState("");

  // --- helpers for UI preview
  const previewSize = 56; // ✅ bigger
  const borderRadius = shapeStyle === "square" ? 12 : 999;

  // =========================
  // ✅ DRAGGABLE MODAL WINDOW
  // =========================
  const MODAL_W = 620;
  const MODAL_H = 650; // estimate for initial clamping

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
  // ✅ DATA HELPERS
  // =========================
  const devices = React.useMemo(() => {
    const d = sensorsData?.devices;
    return Array.isArray(d) ? d : [];
  }, [sensorsData]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  // normalize available fields (same logic you used before)
  const allFieldsForSelected = React.useMemo(() => {
    const raw = selectedDevice?.fields;
    if (!raw) return [];

    if (Array.isArray(raw) && typeof raw[0] === "string") {
      return raw.map((k) => ({ key: k, label: k }));
    }
    if (Array.isArray(raw) && typeof raw[0] === "object") {
      return raw
        .map((x) => ({
          key: x.key ?? x.field ?? x.name ?? "",
          label: x.label ?? x.name ?? x.field ?? x.key ?? "",
        }))
        .filter((x) => x.key);
    }
    return [];
  }, [selectedDevice]);

  // Helper: determine if a field key refers to a digital input (DI/IN)
  const isDigitalFieldKey = React.useCallback((k) => {
    if (!k || typeof k !== "string") return false;
    const s = k.trim().toLowerCase();
    // Accept patterns: di1, di-1, di_1, in1, in-1, in_1 (robust)
    return /^((di|in)[-_]?\d+)$/i.test(s) || /^d i[-_]?(\d+)$/i.test(s) === false; // fallback prevented
  }, []);

  // produce only DI fields (digital inputs) for the selected device
  const digitalFields = React.useMemo(() => {
    return allFieldsForSelected.filter((f) => {
      const k = String(f.key || "").trim();
      // normalized key (remove whitespace)
      const nk = k.replace(/\s+/g, "").toLowerCase();
      return /^((di|in)[-_]?\d+)$/i.test(nk);
    });
  }, [allFieldsForSelected]);

  // filtered by tagSearch (applies only to digital fields)
  const filteredFields = React.useMemo(() => {
    const q = (tagSearch || "").trim().toLowerCase();
    if (!q) return digitalFields;
    return digitalFields.filter(
      (f) =>
        (f.key || "").toLowerCase().includes(q) ||
        (f.label || "").toLowerCase().includes(q)
    );
  }, [digitalFields, tagSearch]);

  // =========================
  // ✅ LIVE VALUE / STATUS (Offline vs Online + 0/1)
  // =========================
  const liveRawValue = React.useMemo(() => {
    if (!deviceId || !field) return undefined;

    const v1 = sensorsData?.latest?.[deviceId]?.[field];
    if (v1 !== undefined) return v1;

    const v2 = sensorsData?.values?.[deviceId]?.[field];
    if (v2 !== undefined) return v2;

    const v3 = sensorsData?.tags?.[deviceId]?.[field];
    if (v3 !== undefined) return v3;

    const v4 = selectedDevice?.values?.[field];
    if (v4 !== undefined) return v4;

    const v5 = selectedDevice?.tags?.[field];
    if (v5 !== undefined) return v5;

    const v6 = selectedDevice?.last?.[field];
    if (v6 !== undefined) return v6;

    return undefined;
  }, [sensorsData, selectedDevice, deviceId, field]);

  const isOnline = liveRawValue !== undefined && liveRawValue !== null;

  const bool01 = React.useMemo(() => {
    if (!isOnline) return null;

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
  }, [isOnline, liveRawValue]);

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

  // If user selects a different device, clear field if it's not part of the new digital fields
  React.useEffect(() => {
    if (!deviceId) return;
    const exists = digitalFields.some((f) => String(f.key) === String(field));
    if (!exists) setField("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, digitalFields]);

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
        {/* Header (DRAG HANDLE) */}
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
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
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

          {/* TAG SELECTOR */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 14,
              marginTop: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
              Tag that drives the LED (ON/OFF)
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  Device
                </div>
                <select
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    // when device changes, clear field to avoid binding to wrong device
                    setField("");
                    setTagSearch("");
                  }}
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
                      {d.name || d.label || d.id}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
                  Search Tag (digital inputs only)
                </div>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ex: DI1, DI-2, in3..."
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

            {/* clickable list of matching DI fields */}
            <div style={{ marginBottom: 12 }}>
              {deviceId ? (
                filteredFields.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {filteredFields.map((f) => {
                      const k = String(f.key || "");
                      const isSelected = String(field || "") === k;
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            setField(k);
                            setTagSearch(String(k));
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: isSelected
                              ? "2px solid #16a34a"
                              : "1px solid #e2e8f0",
                            background: isSelected ? "#ecfdf5" : "white",
                            cursor: "pointer",
                            fontWeight: isSelected ? 900 : 600,
                            fontSize: 13,
                          }}
                        >
                          {f.label || f.key}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    No digital input tags found for this device.
                  </div>
                )
              ) : (
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Select a device to list digital inputs.
                </div>
              )}
            </div>

            {/* ✅ Status panel only */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                  Status
                </div>
                <div style={{ fontSize: 13, marginTop: 4, color: "#334155" }}>
                  {deviceId && field ? (
                    isOnline ? (
                      <span style={{ fontWeight: 900, color: "#16a34a" }}>
                        Online
                      </span>
                    ) : (
                      <span style={{ fontWeight: 900, color: "#dc2626" }}>
                        Offline
                      </span>
                    )
                  ) : (
                    <span style={{ color: "#64748b" }}>
                      Select a device and tag
                    </span>
                  )}
                </div>

                {/* ✅ Optional: show which tag is currently bound (helps user) */}
                {deviceId && field && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
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
                    fontSize: 16,
                    fontWeight: 900,
                    marginTop: 4,
                    color: isOnline ? "#0f172a" : "#94a3b8",
                  }}
                >
                  {deviceId && field ? (isOnline ? String(bool01) : "—") : "—"}
                </div>
              </div>
            </div>

            {/* ✅ (hidden) If you still want search to affect what tag is bound,
                we can auto-pick the first matching field.
                For now, we do NOT auto-change "field" to avoid surprising behavior. */}
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
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
