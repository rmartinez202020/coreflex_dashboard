// src/components/display/DisplayOutputSettingModal.jsx
import React from "react";
import useDisplayOutputSettingModal from "./useDisplayOutputSettingModal";

export default function DisplayOutputSettingModal({
  open = true,
  tank,
  dashboardId,
  dashboardName,
  onClose,
  onSave,
  onSaveProject = null,
}) {
  if (!open) return null;

  const {
    FIXED_MODEL,
    PANEL_W,

    label,
    setLabel,
    formula,
    setFormula,
    bindDeviceId,
    setBindDeviceId,
    bindField,
    setBindField,
    isApplying,

    scaleMin,
    setScaleMin,
    scaleMax,
    setScaleMax,
    aoScaleMin,
    setAoScaleMin,
    aoScaleMax,
    setAoScaleMax,

    devices,
    devicesLoading,
    selectedDeviceIsOnline,
    effectiveLiveValue,

    numericScaleMin,
    numericScaleMax,
    numericAoScaleMin,
    numericAoScaleMax,
    scaleError,
    effectiveOutputValue,
    liveErr,

    pos,
    isDragging,
    startDrag,

    canApply,
    handleApply,

    sanitizeDecimalInput,
    getLastSeen,
    resolveDeviceId,
    selectedDevice,
  } = useDisplayOutputSettingModal({
    open,
    tank,
    dashboardId,
    dashboardName,
    onClose,
    onSave,
    onSaveProject,
  });

  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#111827" };
  const sectionTitleStyle = { fontWeight: 600, fontSize: 16 };
  const fieldSelectStyle = {
    height: 38,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    padding: "0 10px",
    fontWeight: 400,
    background: "#fff",
    outline: "none",
  };
  const previewTitleStyle = { fontWeight: 600, marginBottom: 8, fontSize: 13 };
  const previewTextStyle = { fontSize: 12, fontWeight: 400, color: "#111827" };

  async function handleApplyClick() {
    try {
      if (
        document.activeElement &&
        typeof document.activeElement.blur === "function"
      ) {
        document.activeElement.blur();
      }
    } catch {}

    await Promise.resolve();
    await handleApply();
  }

  function renderScaleCard(title, displayValue, inputValue, setInputValue, placeholder) {
    return (
      <div
        style={{
          border: "1px solid #dbe3ee",
          borderRadius: 12,
          background: "#ffffff",
          padding: "12px 10px",
          display: "grid",
          gap: 8,
          textAlign: "center",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#475569",
            letterSpacing: 0.2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {displayValue === "" ? "--" : displayValue}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: 0.2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Set Value
        </div>

        <input
          value={inputValue}
          onChange={(e) => {
            setInputValue(sanitizeDecimalInput(e.target.value));
          }}
          inputMode="decimal"
          placeholder={placeholder}
          style={{
            height: 34,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            padding: "0 10px",
            fontWeight: 700,
            textAlign: "center",
            background: "#fff",
            outline: "none",
            minWidth: 0,
            width: "100%",
          }}
        />
      </div>
    );
  }

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      <div
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W,
          maxWidth: "98vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          onMouseDown={startDrag}
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg,#0b1b33,#0a1730)",
            color: "#fff",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
          title="Drag to move"
        >
          <div>Display Output</div>
          <button
            data-no-drag="true"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 18, background: "#f8fafc" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(520px, 1fr) minmax(360px, 1fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  border: "1px solid #d7dee8",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow:
                    "0 6px 18px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e5e7eb",
                    background:
                      "linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#0f172a",
                      letterSpacing: 0.2,
                    }}
                  >
                    Analog Output Setup
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#475569",
                      background: "#ffffff",
                      border: "1px solid #dbe3ee",
                      borderRadius: 999,
                      padding: "4px 10px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Scaling Reference
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(210px, 1fr))",
                    padding: 14,
                    gap: 12,
                    background: "transparent",
                  }}
                >
                  {renderScaleCard(
                    "Scale Min",
                    numericScaleMin,
                    scaleMin,
                    setScaleMin,
                    "0"
                  )}

                  {renderScaleCard(
                    "Scale Max",
                    numericScaleMax,
                    scaleMax,
                    setScaleMax,
                    "100"
                  )}

                  {renderScaleCard(
                    "AO Scale Min",
                    numericAoScaleMin,
                    aoScaleMin,
                    setAoScaleMin,
                    "4"
                  )}

                  {renderScaleCard(
                    "AO Scale Max",
                    numericAoScaleMax,
                    aoScaleMax,
                    setAoScaleMax,
                    "20"
                  )}
                </div>
              </div>

              {scaleError ? (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "0 2px",
                  }}
                >
                  {scaleError}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Bottom Label</div>
                <input
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                  }}
                  placeholder="Example: SETPOINT"
                  style={{
                    height: 38,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    padding: "0 10px",
                    fontWeight: 600,
                    background: "#fff",
                    outline: "none",
                  }}
                />
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  This shows below the widget, like SETPOINT.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#ffffff",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: 0.2,
                  }}
                >
                  Actual Value Math
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      Live VALUE
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 120,
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        background: "rgba(187,247,208,0.55)",
                        border: "1px solid rgba(22,163,74,0.25)",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#0b3b18",
                      }}
                    >
                      {Number.isFinite(effectiveLiveValue)
                        ? effectiveLiveValue.toFixed(2)
                        : "--"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      Output
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 120,
                        height: 34,
                        padding: "0 14px",
                        borderRadius: 999,
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {typeof effectiveOutputValue === "string"
                        ? effectiveOutputValue || "--"
                        : Number.isFinite(Number(effectiveOutputValue))
                        ? Number(effectiveOutputValue).toFixed(2)
                        : "--"}
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Formula
                  </div>
                  <textarea
                    value={formula}
                    onChange={(e) => {
                      setFormula(e.target.value);
                    }}
                    rows={4}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      padding: 10,
                      fontFamily: "monospace",
                      fontSize: 12,
                      outline: "none",
                      background: "#fff",
                    }}
                    placeholder='Example: VALUE*1.5  or  CONCAT("AO=", VALUE)'
                  />
                </div>
              </div>

              {liveErr ? (
                <div
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#991b1b",
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {liveErr}
                </div>
              ) : null}
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                display: "grid",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div style={sectionTitleStyle}>Tag that drives the Output (AO)</div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Model</div>
                <div
                  style={{
                    ...fieldSelectStyle,
                    display: "flex",
                    alignItems: "center",
                    background: "#f8fafc",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {FIXED_MODEL === "zhc1661" ? "CF-1600" : FIXED_MODEL}
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Device</div>
                <select
                  value={bindDeviceId}
                  onChange={(e) => {
                    setBindDeviceId(e.target.value);
                  }}
                  style={fieldSelectStyle}
                >
                  <option value="">
                    {devicesLoading ? "Loading devices..." : "Select device..."}
                  </option>
                  {devices.map((d) => {
                    const deviceId = resolveDeviceId(d);
                    return (
                      <option key={deviceId} value={deviceId}>
                        {deviceId}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Analog Output (AO)</div>
                <select
                  value={bindField}
                  onChange={(e) => {
                    setBindField(e.target.value);
                  }}
                  style={fieldSelectStyle}
                >
                  <option value="ao1">AO-1</option>
                  <option value="ao2">AO-2</option>
                </select>
              </div>

              <div
                style={{
                  marginTop: 4,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={previewTitleStyle}>Binding Preview</div>

                <div style={previewTextStyle}>
                  Selected:{" "}
                  <span style={{ fontFamily: "monospace" }}>
                    {bindDeviceId || "--"}
                  </span>{" "}
                  ·{" "}
                  {!bindDeviceId ? (
                    <span style={{ color: "#64748b" }}>--</span>
                  ) : selectedDeviceIsOnline ? (
                    <span style={{ color: "#16a34a" }}>ONLINE</span>
                  ) : (
                    <span style={{ color: "#dc2626" }}>OFFLINE</span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  Last Seen: {getLastSeen(selectedDevice)}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={previewTextStyle}>Current Value</div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 120,
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 999,
                      background: "rgba(187,247,208,0.55)",
                      border: "1px solid rgba(22,163,74,0.25)",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: "#0b3b18",
                    }}
                  >
                    {Number.isFinite(effectiveLiveValue)
                      ? effectiveLiveValue.toFixed(2)
                      : "--"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <button
                  onClick={() => {
                    onClose?.();
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!canApply || isApplying}
                  onClick={handleApplyClick}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #bfe6c8",
                    background:
                      canApply && !isApplying
                        ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                        : "#e5e7eb",
                    color: "#0b3b18",
                    fontWeight: 700,
                    cursor:
                      canApply && !isApplying ? "pointer" : "not-allowed",
                  }}
                >
                  {isApplying ? "Applying..." : "Apply"}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            Fixed to CF-1600 devices and AO-1 / AO-2 only.
          </div>
        </div>
      </div>
    </div>
  );
}