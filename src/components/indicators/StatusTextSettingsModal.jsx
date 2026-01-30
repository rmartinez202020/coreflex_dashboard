import React from "react";

export default function StatusTextSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData,
}) {
  if (!open || !tank) return null;

  // ✅ ALWAYS read/write from tank.properties
  const p = tank.properties || {};

  // Tag binding
  const initialDeviceId = p?.tag?.deviceId ?? "";
  const initialField = p?.tag?.field ?? "";

  // ✅ OFF/ON texts (fallback to old single "text" if present)
  const legacyText = p?.text ?? "STATUS";
  const initialOffText = p?.offText ?? legacyText ?? "OFF";
  const initialOnText = p?.onText ?? legacyText ?? "ON";

  // Shared style
  const initialFontSize = p?.fontSize ?? 18;
  const initialFontWeight = p?.fontWeight ?? 800;
  const initialTextColor = p?.textColor ?? "#0f172a";
  const initialBg = p?.bgColor ?? "#ffffff";
  const initialBorderColor = p?.borderColor ?? "#cbd5e1";
  const initialBorderWidth = p?.borderWidth ?? 1;
  const initialBorderRadius = p?.borderRadius ?? 10;
  const initialPaddingY = p?.paddingY ?? 10;
  const initialPaddingX = p?.paddingX ?? 14;
  const initialTextAlign = p?.textAlign ?? "center";
  const initialTransform = p?.textTransform ?? "none";
  const initialLetterSpacing = p?.letterSpacing ?? 0;

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);
  const [tagSearch, setTagSearch] = React.useState("");

  const [offText, setOffText] = React.useState(initialOffText);
  const [onText, setOnText] = React.useState(initialOnText);

  const [fontSize, setFontSize] = React.useState(initialFontSize);
  const [fontWeight, setFontWeight] = React.useState(initialFontWeight);
  const [textColor, setTextColor] = React.useState(initialTextColor);
  const [bgColor, setBgColor] = React.useState(initialBg);
  const [borderColor, setBorderColor] = React.useState(initialBorderColor);
  const [borderWidth, setBorderWidth] = React.useState(initialBorderWidth);
  const [borderRadius, setBorderRadius] = React.useState(initialBorderRadius);
  const [paddingY, setPaddingY] = React.useState(initialPaddingY);
  const [paddingX, setPaddingX] = React.useState(initialPaddingX);
  const [textAlign, setTextAlign] = React.useState(initialTextAlign);
  const [textTransform, setTextTransform] = React.useState(initialTransform);
  const [letterSpacing, setLetterSpacing] = React.useState(initialLetterSpacing);

  // =========================
  // ✅ DRAGGABLE WINDOW
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
    // Start centered-ish
    const w = 760;
    const h = 640;
    const left = Math.max(20, Math.round((window.innerWidth - w) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - h) / 2));
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

      // Clamp inside viewport a bit
      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? 760;
      const mh = rect?.height ?? 640;

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
  }, []);

  const startDrag = (e) => {
    // Only left-click
    if (e.button !== 0) return;

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    // Prevent text select while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  // =========================
  // ✅ DEVICES / FIELDS
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
        offText,
        onText,

        // keep legacy field for compatibility
        text: onText || legacyText || "STATUS",

        fontSize: Number(fontSize) || 18,
        fontWeight: Number(fontWeight) || 800,
        textColor,
        bgColor,
        borderColor,
        borderWidth: Number(borderWidth) || 1,
        borderRadius: Number(borderRadius) || 10,
        paddingY: Number(paddingY) || 10,
        paddingX: Number(paddingX) || 14,
        textAlign,
        textTransform,
        letterSpacing: Number(letterSpacing) || 0,
        tag: { deviceId, field },
      },
    });
  };

  const basePreviewStyle = {
    width: "100%",
    background: bgColor,
    color: textColor,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius,
    padding: `${paddingY}px ${paddingX}px`,
    fontSize,
    fontWeight,
    textAlign,
    textTransform,
    letterSpacing,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
      {children}
    </div>
  );

  const Num = ({ value, onChange, min = 0, max = 200, step = 1 }) => (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        fontSize: 14,
      }}
    />
  );

  const MiniState = ({ label, dotColor, text }) => (
    <div
      style={{
        flex: 1,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 10,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 900,
          fontSize: 12,
          marginBottom: 8,
          color: "#0f172a",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: dotColor,
            border: "1px solid #94a3b8",
          }}
        />
        {label}
      </div>
      <div style={basePreviewStyle}>{text}</div>
    </div>
  );

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
          width: 760,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header (✅ draggable) */}
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
          }}
          title="Drag to move"
        >
          <span>Status Text Box</span>
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
        <div style={{ padding: 18, fontSize: 14 }}>
          {/* ✅ Static preview (no ON/OFF toggle buttons) */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
              background: "#f8fafc",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>
              Preview
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <MiniState
                label="OFF"
                dotColor="#94a3b8"
                text={offText || "OFF"}
              />
              <MiniState
                label="ON"
                dotColor="#22c55e"
                text={onText || "ON"}
              />
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Tip: <b>ON</b> means “truthy”. If your tag is numeric, any value{" "}
              <b>&gt; 0</b> will be read as ON.
            </div>
          </div>

          {/* Layout: left style, right tag */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {/* STYLE */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                State Text (OFF / ON)
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>OFF Text</Label>
                  <input
                    value={offText}
                    onChange={(e) => setOffText(e.target.value)}
                    placeholder="ex: STOPPED / OFF / IDLE"
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
                  <Label>ON Text</Label>
                  <input
                    value={onText}
                    onChange={(e) => setOnText(e.target.value)}
                    placeholder="ex: RUNNING / ON / ACTIVE"
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

              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Shared Style
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Font Size</Label>
                  <Num value={fontSize} onChange={setFontSize} min={8} max={60} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Font Weight</Label>
                  <Num
                    value={fontWeight}
                    onChange={setFontWeight}
                    min={100}
                    max={900}
                    step={100}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Text Color</Label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Background</Label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Border Color</Label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Border Width</Label>
                  <Num
                    value={borderWidth}
                    onChange={setBorderWidth}
                    min={0}
                    max={12}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Radius</Label>
                  <Num
                    value={borderRadius}
                    onChange={setBorderRadius}
                    min={0}
                    max={40}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Letter Spacing</Label>
                  <Num
                    value={letterSpacing}
                    onChange={setLetterSpacing}
                    min={0}
                    max={8}
                    step={0.5}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Padding Y</Label>
                  <Num value={paddingY} onChange={setPaddingY} min={0} max={60} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Padding X</Label>
                  <Num value={paddingX} onChange={setPaddingX} min={0} max={80} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Align</Label>
                  <select
                    value={textAlign}
                    onChange={(e) => setTextAlign(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <Label>Transform</Label>
                  <select
                    value={textTransform}
                    onChange={(e) => setTextTransform(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAG */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Tag that drives status (ON / OFF)
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
                    placeholder="ex: DI0, level, run..."
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
                    placeholder="Type tag field (ex: di0, run_status, level_percent)"
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
                Tip: When the tag value is <b>truthy</b> (or numeric <b>&gt; 0</b>),
                this widget will display <b>ON Text</b>. Otherwise it displays{" "}
                <b>OFF Text</b>.
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
