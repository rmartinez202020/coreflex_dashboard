// src/components/indicators/IndicatorLightSettingsModal.jsx
import React from "react";

export default function IndicatorLightSettingsModal({
  open,
  tank,
  onClose,
  onSave,

  // ✅ give the modal access to available devices/tags
  sensorsData,
}) {
  if (!open || !tank) return null;

  const initialStyle = tank.style || "circle";
  const initialOff = tank.colorOff || "#9ca3af";
  const initialOn = tank.colorOn || "#22c55e";

  const initialOffText = tank.offText ?? "OFF";
  const initialOnText = tank.onText ?? "ON";

  const initialDeviceId = tank?.tag?.deviceId ?? "";
  const initialField = tank?.tag?.field ?? "";

  const [style, setStyle] = React.useState(initialStyle);
  const [offColor, setOffColor] = React.useState(initialOff);
  const [onColor, setOnColor] = React.useState(initialOn);

  const [offText, setOffText] = React.useState(initialOffText);
  const [onText, setOnText] = React.useState(initialOnText);

  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);

  // ✅ optional: search/filter tags
  const [tagSearch, setTagSearch] = React.useState("");

  // --- helpers for UI preview
  const previewSize = 56; // ✅ bigger preview
  const borderRadius = style === "square" ? 10 : 999;

  const devices = React.useMemo(() => {
    // sensorsData can be whatever your hook returns; keep this defensive
    // Prefer: sensorsData.devices = [{ id, name, fields:[...] }]
    const d = sensorsData?.devices;
    return Array.isArray(d) ? d : [];
  }, [sensorsData]);

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  const availableFields = React.useMemo(() => {
    // Support multiple possible shapes:
    // 1) device.fields = ["di0","ai1"]
    // 2) device.fields = [{ key:"di0", label:"DI0" }]
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
      (f) => f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
    );
  }, [availableFields, tagSearch]);

  const apply = () => {
    onSave?.({
      id: tank.id,
      style,
      colorOff: offColor,
      colorOn: onColor,
      offText,
      onText,
      tag: { deviceId, field },
    });
  };

  // ✅ consistent UI sizing
  const sectionTitleStyle = {
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 8,
    color: "#0f172a",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
  };

  const selectStyle = {
    ...inputStyle,
    background: "white",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: 560, // ✅ bigger window
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 900,
          }}
        >
          <span style={{ fontSize: 18, letterSpacing: 0.4 }}>
            Indicator Light
          </span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 18,
            fontSize: 14,
            lineHeight: 1.4,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
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
              <div style={{ fontSize: 12, marginTop: 8, color: "#334155" }}>
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
              <div style={{ fontSize: 12, marginTop: 8, color: "#334155" }}>
                ON
              </div>
            </div>

            <div style={{ flex: 1, fontSize: 13, color: "#475569" }}>
              Configure shape, colors, text, and the tag that drives the state.
            </div>
          </div>

          {/* Shape */}
          <div style={{ marginBottom: 14 }}>
            <div style={sectionTitleStyle}>Shape</div>
            <label style={{ marginRight: 16, fontSize: 14 }}>
              <input
                type="radio"
                checked={style === "circle"}
                onChange={() => setStyle("circle")}
                style={{ marginRight: 6 }}
              />
              Circle
            </label>
            <label style={{ fontSize: 14 }}>
              <input
                type="radio"
                checked={style === "square"}
                onChange={() => setStyle("square")}
                style={{ marginRight: 6 }}
              />
              Square
            </label>
          </div>

          {/* Text ON/OFF */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>OFF Text</div>
              <input
                value={offText}
                onChange={(e) => setOffText(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>ON Text</div>
              <input
                value={onText}
                onChange={(e) => setOnText(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>OFF Color</div>
              <input
                type="color"
                value={offColor}
                onChange={(e) => setOffColor(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "white",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={sectionTitleStyle}>ON Color</div>
              <input
                type="color"
                value={onColor}
                onChange={(e) => setOnColor(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "white",
                }}
              />
            </div>
          </div>

          {/* TAG SELECTOR (the must important part) */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 14,
              marginTop: 6,
            }}
          >
            <div style={{ ...sectionTitleStyle, marginBottom: 10 }}>
              Tag that drives the LED (ON/OFF)
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {/* device */}
              <div style={{ flex: 1 }}>
                <div style={sectionTitleStyle}>Device</div>
                <select
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setField(""); // reset field when device changes
                  }}
                  style={selectStyle}
                >
                  <option value="">— Select device —</option>
                  {devices.map((d) => (
                    <option key={String(d.id)} value={String(d.id)}>
                      {d.name || d.label || d.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* tag search */}
              <div style={{ flex: 1 }}>
                <div style={sectionTitleStyle}>Search Tag</div>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ex: DI0, level, run..."
                  style={inputStyle}
                />
              </div>
            </div>

            {/* field */}
            <div>
              <div style={sectionTitleStyle}>Tag / Field</div>

              {/* If you don’t have device.fields yet, this still works:
                  it shows empty list and user can type manually. */}
              {filteredFields.length > 0 ? (
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  style={selectStyle}
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
                  style={inputStyle}
                />
              )}

              <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                Tip: ON means “truthy”. If your tag is numeric, anything &gt; 0
                will read as ON.
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
              padding: "10px 16px",
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
            style={{
              padding: "10px 16px",
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
