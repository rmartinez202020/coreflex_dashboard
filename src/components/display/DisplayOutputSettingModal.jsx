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
      document.activeElement?.blur?.();
    } catch {}

    await Promise.resolve();
    await handleApply();
  }

  function renderScaleCard(
    title,
    displayValue,
    inputValue,
    setInputValue,
    placeholder,
    fallbackDisplay = null // ✅ NEW
  ) {
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
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {displayValue === "" || displayValue === null
            ? fallbackDisplay ?? "--"
            : displayValue}
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Set Value
        </div>

        <input
          value={inputValue}
          onChange={(e) =>
            setInputValue(sanitizeDecimalInput(e.target.value))
          }
          inputMode="decimal"
          placeholder={placeholder}
          style={{
            height: 34,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            textAlign: "center",
            fontWeight: 700,
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
      >
        {/* HEADER */}
        <div
          onMouseDown={startDrag}
          style={{
            padding: "14px 18px",
            background: "linear-gradient(180deg,#0b1b33,#0a1730)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <div>Display Output</div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* BODY */}
        <div style={{ padding: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 12,
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

                {/* ✅ FIXED DEFAULTS HERE */}
                {renderScaleCard(
                  "AO Scale Min",
                  numericAoScaleMin,
                  aoScaleMin,
                  setAoScaleMin,
                  "4000",
                  4000
                )}

                {renderScaleCard(
                  "AO Scale Max",
                  numericAoScaleMax,
                  aoScaleMax,
                  setAoScaleMax,
                  "20000",
                  20000
                )}
              </div>
            </div>

            {/* RIGHT SIDE unchanged */}
            <div>
              <div style={sectionTitleStyle}>
                Tag that drives the Output (AO)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}