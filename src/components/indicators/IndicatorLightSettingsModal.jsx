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
  const previewSize = 44;
  const borderRadius = style === "square" ? 8 : 999;

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
      (f) =>
        f.key.toLowerCase().includes(q) || f.label.toLowerCase().includes(q)
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
          width: 420,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 800,
          }}
        >
          <span>Indicator Light</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 18,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 14 }}>
          {/* Preview */}
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 12,
              background: "#f8fafc",
              marginBottom: 12,
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
              <div style={{ fontSize: 11, marginTop: 6, color: "#334155" }}>
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
              <div style={{ fontSize: 11, marginTop: 6, color: "#334155" }}>
                ON
              </div>
            </div>

            <div style={{ flex: 1, fontSize: 12, color: "#64748b" }}>
              Configure shape, colors, text, and the tag that drives the state.
            </div>
          </div>

          {/* Shape */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              Shape
            </div>
            <label style={{ marginRight: 12, fontSize: 13 }}>
              <input
                type="radio"
                checked={style === "circle"}
                onChange={() => setStyle("circle")}
              />{" "}
              Circle
            </label>
            <label style={{ fontSize: 13 }}>
              <input
                type="radio"
                checked={style === "square"}
                onChange={() => setStyle("square")}
              />{" "}
              Square
            </label>
          </div>

          {/* Text ON/OFF */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                OFF Text
              </div>
              <input
                value={offText}
                onChange={(e) => setOffText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                ON Text
              </div>
              <input
                value={onText}
                onChange={(e) => setOnText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                OFF Color
              </div>
              <input
                type="color"
                value={offColor}
                onChange={(e) => setOffColor(e.target.value)}
                style={{ width: "100%", height: 36, border: "none" }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                ON Color
              </div>
              <input
                type="color"
                value={onColor}
                onChange={(e) => setOnColor(e.target.value)}
                style={{ width: "100%", height: 36, border: "none" }}
              />
            </div>
          </div>

          {/* TAG SELECTOR (the must important part) */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 12,
              marginTop: 6,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
              Tag that drives the LED (ON/OFF)
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              {/* device */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                  Device
                </div>
                <select
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setField(""); // reset field when device changes
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
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

              {/* tag search */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                  Search Tag
                </div>
                <input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="ex: DI0, level, run..."
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {/* field */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                Tag / Field
              </div>

              {/* If you don’t have device.fields yet, this still works:
                  it shows empty list and user can type manually. */}
              {filteredFields.length > 0 ? (
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
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
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                  }}
                />
              )}

              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
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
            padding: 12,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Cancel
          </button>

          <button
            onClick={apply}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
