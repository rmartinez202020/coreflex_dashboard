import React from "react";

export default function BlinkingAlarmSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData,
}) {
  if (!open || !tank) return null;

  const p = tank.properties || {};

  // ✅ Modal sizing (wider + clamped)
  const MODAL_W = Math.min(980, window.innerWidth - 80);
  const MODAL_H = Math.min(640, window.innerHeight - 120);

  // Tag binding
  const initialDeviceId = p?.tag?.deviceId ?? "";
  const initialField = p?.tag?.field ?? "";

  // ✅ Style selection
  const initialStyle = p?.alarmStyle ?? "style1";

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);
  const [tagSearch, setTagSearch] = React.useState("");
  const [alarmStyle, setAlarmStyle] = React.useState(initialStyle);

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

  const apply = () => {
    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),
        alarmStyle, // ✅ selected style
        tag: { deviceId, field }, // ✅ binding
      },
    });
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  // =========================
  // STYLE PREVIEWS (OFF/ON)
  // =========================
  const styles = [
    { id: "style1", name: "Classic Pill Alarm" },
    { id: "style2", name: "Triangle Warning" },
    { id: "style3", name: "Beacon Light" },
    { id: "style4", name: "Siren Badge" },
  ];

  const ShapePreview = ({ styleId, isOn }) => {
    const onBg = "#ef4444";
    const offBg = "#0f172a";
    const onGlow = "0 0 18px rgba(239,68,68,0.75)";
    const offGlow = "none";
    const bg = isOn ? onBg : offBg;

    const commonBox = {
      width: "100%",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 900,
      boxShadow: isOn ? onGlow : offGlow,
      border: "1px solid rgba(255,255,255,0.15)",
      userSelect: "none",
    };

    // STYLE 1: rounded pill with ALARM
    if (styleId === "style1") {
      return (
        <div
          style={{
            ...commonBox,
            borderRadius: 14,
            background: bg,
            letterSpacing: 1,
          }}
        >
          {isOn ? "ALARM" : "OFF"}
        </div>
      );
    }

    // STYLE 2: triangle warning with !
    if (styleId === "style2") {
      return (
        <div style={{ width: "100%", height: 56, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "28px solid transparent",
                borderRight: "28px solid transparent",
                borderBottom: `56px solid ${bg}`,
                filter: isOn ? "drop-shadow(0 0 10px rgba(239,68,68,0.7))" : "none",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 1000,
              fontSize: 22,
              color: "white",
              transform: "translateY(6px)",
            }}
          >
            !
          </div>
        </div>
      );
    }

    // STYLE 3: beacon light (circle on a base)
    if (styleId === "style3") {
      return (
        <div
          style={{
            width: "100%",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: bg,
              boxShadow: isOn ? "0 0 18px rgba(239,68,68,0.85)" : "none",
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          />
          <div
            style={{
              width: 46,
              height: 14,
              borderRadius: 999,
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          />
        </div>
      );
    }

    // STYLE 4: siren badge with waves
    return (
      <div
        style={{
          ...commonBox,
          borderRadius: 12,
          background: bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span style={{ zIndex: 2 }}>{isOn ? "SIREN" : "OFF"}</span>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: isOn ? 0.25 : 0.12,
            background:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.9) 0, transparent 55%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.9) 0, transparent 55%)",
          }}
        />
      </div>
    );
  };

  const StyleCard = ({ s }) => {
    const selected = alarmStyle === s.id;
    return (
      <button
        type="button"
        onClick={() => setAlarmStyle(s.id)}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>
              OFF
            </div>
            <ShapePreview styleId={s.id} isOn={false} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>
              ON
            </div>
            <ShapePreview styleId={s.id} isOn={true} />
          </div>
        </div>
      </button>
    );
  };

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
          <span>Blinking Alarm</span>
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
          {/* STYLE PICKER */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>
              Choose Alarm Style
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {styles.map((s) => (
                <StyleCard key={s.id} s={s} />
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Pick <b>one</b> style. The alarm will show OFF/ON automatically based on your tag.
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
              Tag that drives alarm (ON / OFF)
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Label>Device</Label>
                <select
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setField("");
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
                  placeholder="ex: DI0, alarm, fault..."
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

            <div style={{ marginBottom: 10 }}>
              <Label>Tag / Field</Label>

              {filteredFields.length > 0 ? (
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                  }}
                >
                  <option value="">— Select tag —</option>
                  {filteredFields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Type tag field (ex: di0, fault, alarm_active)"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                  }}
                />
              )}
            </div>

            <div style={{ fontSize: 12, color: "#64748b" }}>
              Tip: ON means <b>truthy</b> (or numeric <b>&gt; 0</b>). OFF means false / 0 / empty.
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
            }}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
