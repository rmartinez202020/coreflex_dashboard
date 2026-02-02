// InterlockSettingsModal.jsx
import React from "react";

export default function InterlockSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData,
}) {
  if (!open || !tank) return null;

  const p = tank.properties || {};

  // ✅ Modal sizing (same feel as Blinking Alarm)
  const MODAL_W = Math.min(980, window.innerWidth - 80);
  const MODAL_H = Math.min(640, window.innerHeight - 120);

  // Tag binding
  const initialDeviceId = p?.tag?.deviceId ?? "";
  const initialField = p?.tag?.field ?? "";

  // ✅ Professional style selection
  const initialStyle = p?.interlockStyle ?? "shield";

  // ✅ Tone (same pattern)
  const initialTone = p?.interlockTone ?? "critical";

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);

  // ✅ resolve from Search Tag (no dropdown / no text box)
  const [resolvedField, setResolvedField] = React.useState(initialField);

  const [tagSearch, setTagSearch] = React.useState("");
  const [interlockStyle, setInterlockStyle] = React.useState(initialStyle);
  const [interlockTone, setInterlockTone] = React.useState(initialTone);

  // ✅ IMPORTANT:
  // When opening modal for a different tank, refresh state from that tank.properties
  React.useEffect(() => {
    if (!tank) return;

    const nextP = tank.properties || {};
    const nextDeviceId = nextP?.tag?.deviceId ?? "";
    const nextField = nextP?.tag?.field ?? "";

    setDeviceId(nextDeviceId);
    setResolvedField(nextField);

    // keep search empty on open (clean UX), but if they already had a field, show it
    setTagSearch(nextField || "");

    setInterlockStyle(nextP?.interlockStyle ?? "shield");
    setInterlockTone(nextP?.interlockTone ?? "critical");
  }, [tank?.id]); // ✅ key: only when switching targets

  // =========================
  // DRAGGABLE WINDOW
  // =========================
  const modalRef = React.useRef(null);
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = React.useState(() => {
    const left = Math.max(20, Math.round((window.innerWidth - MODAL_W) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - MODAL_H) / 2));
    return { left, top };
  });

  React.useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      e.preventDefault();

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const nextLeft = dragRef.current.startLeft + dx;
      const nextTop = dragRef.current.startTop + dy;

      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? MODAL_W;
      const mh = rect?.height ?? MODAL_H;

      const clampedLeft = Math.min(
        window.innerWidth - 20,
        Math.max(20 - (mw - 60), nextLeft)
      );
      const clampedTop = Math.min(
        window.innerHeight - 20,
        Math.max(20, nextTop)
      );

      setPos({ left: clampedLeft, top: clampedTop });
    };

    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [MODAL_W, MODAL_H]);

  const startDrag = (e) => {
    if (e.button !== 0) return;

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  // =========================
  // DEVICES / FIELDS
  // =========================
  const devices = React.useMemo(() => {
    const d = sensorsData?.devices;
    return Array.isArray(d) ? d : [];
  }, [sensorsData]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  const availableFields = React.useMemo(() => {
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

  const filteredFields = React.useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return availableFields;
    return availableFields.filter(
      (f) =>
        f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [availableFields, tagSearch]);

  // ✅ Auto-resolve field from Search Tag (exact match first, else first partial)
  React.useEffect(() => {
    if (!deviceId) {
      setResolvedField("");
      return;
    }

    const q = tagSearch.trim().toLowerCase();
    if (!q) {
      // keep resolvedField (from saved config) if user hasn't typed
      return;
    }

    const exact =
      availableFields.find((f) => f.key.toLowerCase() === q) ||
      availableFields.find((f) => f.label.toLowerCase() === q);

    if (exact?.key) {
      setResolvedField(exact.key);
      return;
    }

    const first = filteredFields[0];
    if (first?.key) setResolvedField(first.key);
  }, [deviceId, tagSearch, availableFields, filteredFields]);

  // =========================
  // LIVE STATUS / VALUE (same defensive approach)
  // =========================
  const isDeviceOnline = React.useMemo(() => {
    if (!deviceId || !selectedDevice) return false;

    const v =
      selectedDevice.online ??
      selectedDevice.isOnline ??
      selectedDevice.connected ??
      selectedDevice.isConnected ??
      selectedDevice.status;

    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v > 0;
    if (typeof v === "string") return v.toLowerCase().includes("online");
    return false;
  }, [deviceId, selectedDevice]);

  const getTagValue = React.useCallback(() => {
    if (!deviceId || !resolvedField) return undefined;

    const did = String(deviceId);
    const f = String(resolvedField);

    const v1 = sensorsData?.values?.[did]?.[f];
    if (v1 !== undefined) return v1;

    const v2 = sensorsData?.tags?.[did]?.[f];
    if (v2 !== undefined) return v2;

    const v3 = selectedDevice?.values?.[f];
    if (v3 !== undefined) return v3;

    const v4 = sensorsData?.latest?.[did]?.[f];
    if (v4 !== undefined) return v4;

    const v5 = selectedDevice?.[f];
    if (v5 !== undefined) return v5;

    return undefined;
  }, [deviceId, resolvedField, sensorsData, selectedDevice]);

  const tagValue = getTagValue();

  const value01 = React.useMemo(() => {
    if (!isDeviceOnline) return undefined;
    if (tagValue === undefined || tagValue === null) return undefined;

    if (typeof tagValue === "boolean") return tagValue ? 1 : 0;
    if (typeof tagValue === "number") return tagValue > 0 ? 1 : 0;

    if (typeof tagValue === "string") {
      const s = tagValue.trim().toLowerCase();
      if (s === "1" || s === "true" || s === "on") return 1;
      if (s === "0" || s === "false" || s === "off") return 0;
      return s ? 1 : 0;
    }

    return 0;
  }, [isDeviceOnline, tagValue]);

  // =========================
  // ✅ TONE → COLORS
  // =========================
  const toneMap = {
    critical: { on: "#ef4444", glow: "rgba(239,68,68,0.55)" },
    warning: { on: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
    info: { on: "#3b82f6", glow: "rgba(59,130,246,0.45)" },
  };

  const tone = toneMap[interlockTone] || toneMap.critical;

  // "OFF" base (same pro dark)
  const OFF_COLOR = "#0b1220";

  // ✅ helpful: don't spam, only logs on Apply click
  const apply = () => {
    const payload = {
      id: tank.id,
      properties: {
        interlockStyle, // shield|gate|pill|minimal
        interlockTone, // critical|warning|info
        colorOn: tone.on,
        colorOff: OFF_COLOR,
        tag: {
          deviceId,
          field: resolvedField || "",
        },
        // ✅ optional convenience for canvas: lock state preview
        // (you can ignore this later and compute from tag)
        _debugValue01: value01,
      },
    };

    console.log("✅ INTERLOCK APPLY CLICKED:", {
      tankId: tank.id,
      interlockStyle,
      interlockTone,
      deviceId,
      resolvedField,
      value01,
    });

    // ✅ do NOT spread tank.properties here — AppModals merges them already
    onSave?.(payload);

    // ✅ close modal after apply (matches other modals)
    onClose?.();
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  // =========================
  // PROFESSIONAL STYLE PREVIEWS (4 styles)
  // =========================
  const styles = [
    { id: "shield", name: "Shield Lock (Industrial)" },
    { id: "gate", name: "Gate Bar (Modern)" },
    { id: "pill", name: "Pill Badge (UI)" },
    { id: "minimal", name: "Minimal Outline (Clean)" },
  ];

  const ProPreview = ({ styleId, isOn }) => {
    const onColor = tone.on;
    const bg = isOn ? onColor : OFF_COLOR;

    const cardBase = {
      width: "100%",
      height: 58,
      borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.22)",
      background: "#0b1220",
      boxShadow: isOn
        ? `0 10px 26px rgba(0,0,0,0.28), 0 0 18px ${tone.glow}`
        : "0 10px 26px rgba(0,0,0,0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 900,
      userSelect: "none",
      overflow: "hidden",
    };

    if (styleId === "shield") {
      return (
        <div
          style={{
            ...cardBase,
            justifyContent: "space-between",
            padding: "0 14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: 1 }}>
              INTERLOCK
            </div>
            <div style={{ fontSize: 14 }}>{isOn ? "LOCKED" : "CLEAR"}</div>
          </div>

          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 10,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
            title={isOn ? "Locked" : "Clear"}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: isOn ? bg : "rgba(148,163,184,0.35)",
                boxShadow: isOn ? `0 0 0 4px ${tone.glow}` : "none",
              }}
            />
          </div>
        </div>
      );
    }

    if (styleId === "gate") {
      const stripeColor = isOn ? bg : "rgba(148,163,184,0.18)";
      const stripe = isOn
        ? `linear-gradient(90deg, ${stripeColor}, rgba(0,0,0,0.25))`
        : stripeColor;

      return (
        <div style={cardBase}>
          <div style={{ width: "100%", height: "100%" }}>
            <div
              style={{
                height: 12,
                background: stripe,
                opacity: isOn ? 1 : 0.7,
              }}
            />
            <div
              style={{
                height: "calc(100% - 12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                fontSize: 13,
                opacity: isOn ? 1 : 0.85,
              }}
            >
              <span>{isOn ? "INTERLOCK" : "OFF"}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                {isOn ? "LOCKED" : "CLEAR"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (styleId === "pill") {
      return (
        <div
          style={{
            ...cardBase,
            justifyContent: "flex-start",
            padding: "0 14px",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: isOn
                ? "rgba(255,255,255,0.10)"
                : "rgba(148,163,184,0.12)",
              border: `1px solid ${
                isOn ? tone.glow : "rgba(148,163,184,0.18)"
              }`,
              color: isOn ? "#fff" : "rgba(226,232,240,0.80)",
              fontSize: 12,
              fontWeight: 1000,
              letterSpacing: 0.3,
            }}
          >
            {isOn ? "LOCKED" : "CLEAR"}
          </div>

          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: isOn ? bg : "rgba(148,163,184,0.25)",
              border: "2px solid rgba(255,255,255,0.10)",
              boxShadow: isOn ? `0 0 14px ${tone.glow}` : "none",
            }}
          />
        </div>
      );
    }

    // minimal
    return (
      <div
        style={{
          ...cardBase,
          background: "rgba(2,6,23,0.92)",
          border: `1px solid ${isOn ? tone.glow : "rgba(148,163,184,0.22)"}`,
          boxShadow: isOn
            ? `0 0 18px ${tone.glow}`
            : "0 10px 25px rgba(0,0,0,0.18)",
        }}
      >
        <span style={{ color: isOn ? bg : "rgba(226,232,240,0.75)" }}>
          {isOn ? "INTERLOCK" : "OFF"}
        </span>
      </div>
    );
  };

  const StyleCard = ({ s }) => {
    const selected = interlockStyle === s.id;
    return (
      <button
        type="button"
        onClick={() => setInterlockStyle(s.id)}
        style={{
          textAlign: "left",
          width: "100%",
          borderRadius: 14,
          padding: 12,
          border: selected ? "2px solid #22c55e" : "1px solid #e5e7eb",
          background: selected ? "#ecfdf5" : "white",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>
          {s.name}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              OFF
            </div>
            <ProPreview styleId={s.id} isOn={false} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              ON
            </div>
            <ProPreview styleId={s.id} isOn={true} />
          </div>
        </div>
      </button>
    );
  };

  const statusText = !deviceId
    ? "Select a device and tag"
    : !resolvedField
    ? "Type a tag name in Search Tag"
    : isDeviceOnline
    ? "Online"
    : "Offline";

  const valueText =
    isDeviceOnline && resolvedField
      ? value01 === undefined
        ? "—"
        : String(value01)
      : "—";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onMouseDown={onClose}
    >
      <div
        ref={modalRef}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: MODAL_W,
          maxWidth: "calc(100vw - 80px)",
          height: MODAL_H,
          maxHeight: "calc(100vh - 120px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onMouseDown={startDrag}
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
            flex: "0 0 auto",
          }}
          title="Drag to move"
        >
          <span>Interlock</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
            title="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflow: "auto", flex: "1 1 auto" }}>
          {/* TONE PICKER */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>
              Interlock Tone
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { id: "critical", name: "Critical (Red)" },
                { id: "warning", name: "Warning (Amber)" },
                { id: "info", name: "Info (Blue)" },
              ].map((t) => {
                const sel = interlockTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInterlockTone(t.id)}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 12,
                      border: sel ? "2px solid #22c55e" : "1px solid #e5e7eb",
                      background: sel ? "#ecfdf5" : "white",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              This affects the <b>ON</b> color/glow and will be saved into the
              widget.
            </div>
          </div>

          {/* STYLE PICKER */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>
              Choose Interlock Style
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {styles.map((s) => (
                <StyleCard key={s.id} s={s} />
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Pick <b>one</b> professional style. The interlock will show ON/OFF
              automatically based on your tag.
            </div>
          </div>

          {/* TAG BINDING */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
              Tag that drives interlock (ON / OFF)
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Label>Device</Label>
                <select
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setResolvedField("");
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
                <Label>Search Tag</Label>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ex: DI0, interlock, permit..."
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

            {/* ✅ STATUS BAR */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Status
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                  {resolvedField ? (
                    <>
                      <span style={{ fontWeight: 900, color: "#0f172a" }}>
                        {statusText}
                      </span>
                      <span style={{ marginLeft: 10, color: "#64748b" }}>
                        Tag: <b>{resolvedField}</b>
                      </span>
                    </>
                  ) : (
                    statusText
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Value
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 18,
                    fontWeight: 1000,
                    color: isDeviceOnline ? "#0f172a" : "#94a3b8",
                    fontFamily: "monospace",
                    minWidth: 22,
                  }}
                >
                  {valueText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              Tip: ON means <b>truthy</b> (or numeric <b>&gt; 0</b>). OFF means
              false / 0 / empty.
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
            flex: "0 0 auto",
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
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={apply}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
              opacity: !deviceId || !resolvedField ? 0.55 : 1,
            }}
            type="button"
            disabled={!deviceId || !resolvedField}
            title={
              !deviceId || !resolvedField
                ? "Select a device and type a tag"
                : "Apply"
            }
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
