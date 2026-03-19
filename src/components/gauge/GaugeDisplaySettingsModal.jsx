// src/components/gauge/GaugeDisplaySettingsModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildGaugeDefaults, GAUGE_STYLE_OPTIONS } from "./utils";
import GaugeBindingTelemetrySection from "./settings/GaugeBindingTelemetrySection";
import GaugeRangeMathSection from "./settings/GaugeRangeMathSection";

function StyleCard({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.value)}
      style={{
        border: selected ? "2px solid #2563eb" : "1px solid #d1d5db",
        background: selected ? "#eff6ff" : "#fff",
        borderRadius: 12,
        padding: 10,
        cursor: "pointer",
        textAlign: "left",
        minHeight: 98,
        boxShadow: selected ? "0 0 0 2px rgba(37,99,235,0.08)" : "none",
      }}
    >
      <div
        style={{
          height: 42,
          marginBottom: 8,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {item.value === "classic" && (
          <svg width="66" height="34" viewBox="0 0 66 34">
            <path
              d="M8 28 A25 25 0 0 1 58 28"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
            />
            <line
              x1="33"
              y1="28"
              x2="45"
              y2="14"
              stroke="#ea580c"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="33" cy="28" r="3.5" fill="#94a3b8" />
          </svg>
        )}

        {item.value === "semi" && (
          <svg width="66" height="34" viewBox="0 0 66 34">
            <path
              d="M8 28 A25 25 0 0 0 58 28"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
            />
            <line
              x1="33"
              y1="28"
              x2="33"
              y2="10"
              stroke="#ea580c"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="33" cy="28" r="3.5" fill="#94a3b8" />
          </svg>
        )}

        {item.value === "arc" && (
          <svg width="66" height="34" viewBox="0 0 66 34">
            <path
              d="M8 28 A25 25 0 0 1 58 28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="7"
            />
            <path
              d="M8 28 A25 25 0 0 1 42 8"
              fill="none"
              stroke="#22c55e"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        )}

        {item.value === "radial" && (
          <svg width="66" height="34" viewBox="0 0 66 34">
            <rect x="10" y="10" width="6" height="14" rx="2" fill="#22c55e" />
            <rect x="19" y="7" width="6" height="17" rx="2" fill="#22c55e" />
            <rect x="28" y="5" width="6" height="19" rx="2" fill="#22c55e" />
            <rect x="37" y="7" width="6" height="17" rx="2" fill="#e5e7eb" />
            <rect x="46" y="10" width="6" height="14" rx="2" fill="#e5e7eb" />
          </svg>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
        {item.label}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
        {item.description}
      </div>
    </button>
  );
}

function formatLastSeen(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function normalizeDeviceStatus(device) {
  if (!device || typeof device !== "object") {
    return { online: null, text: "--" };
  }

  const raw =
    device.status ??
    device.deviceStatus ??
    device.onlineStatus ??
    device.connectionStatus ??
    device.state ??
    "";

  const s = String(raw || "").trim().toLowerCase();

  if (["online", "connected", "up", "active", "running"].includes(s)) {
    return { online: true, text: "ONLINE" };
  }

  if (
    [
      "offline",
      "disconnected",
      "down",
      "inactive",
      "not running",
      "not_running",
    ].includes(s)
  ) {
    return { online: false, text: "OFFLINE" };
  }

  if (typeof device.online === "boolean") {
    return { online: device.online, text: device.online ? "ONLINE" : "OFFLINE" };
  }

  if (typeof device.isOnline === "boolean") {
    return {
      online: device.isOnline,
      text: device.isOnline ? "ONLINE" : "OFFLINE",
    };
  }

  const lastSeenRaw =
    device.lastSeen ??
    device.last_seen ??
    device.lastTelemetryAt ??
    device.last_telemetry_at ??
    device.updatedAt ??
    device.updated_at ??
    null;

  if (lastSeenRaw) {
    const ts = new Date(lastSeenRaw).getTime();
    if (Number.isFinite(ts)) {
      const ageMs = Date.now() - ts;
      if (ageMs > 15000) {
        return { online: false, text: "OFFLINE" };
      }
      return { online: true, text: "ONLINE" };
    }
  }

  return { online: null, text: "--" };
}

export default function GaugeDisplaySettingsModal({
  open,
  onClose,
  onSave,
  widget = {},
}) {
  const defaults = useMemo(() => buildGaugeDefaults(widget), [widget]);

  // ✅ allow blank title; only use "Gauge" when title is truly null/undefined
  const [title, setTitle] = useState(
    defaults.title === null || defaults.title === undefined
      ? "Gauge"
      : String(defaults.title)
  );
  const [units, setUnits] = useState(defaults.units || "");
  const [gaugeStyle, setGaugeStyle] = useState(defaults.gaugeStyle || "classic");

  const [bindModel, setBindModel] = useState(widget.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(widget.bindDeviceId || "");
  const [bindField, setBindField] = useState(widget.bindField || "ai1");

  const [minValue, setMinValue] = useState(defaults.minValue ?? 0);
  const [maxValue, setMaxValue] = useState(defaults.maxValue ?? 100);
  const [decimals, setDecimals] = useState(defaults.decimals ?? 0);
  const [formula, setFormula] = useState(defaults.formula || "");

  const [showValue, setShowValue] = useState(defaults.showValue !== false);
  const [showTicks, setShowTicks] = useState(defaults.showTicks !== false);
  const [showLabels, setShowLabels] = useState(defaults.showLabels !== false);
  const [showZones, setShowZones] = useState(defaults.showZones !== false);

  const [lowWarn, setLowWarn] = useState(
    defaults.lowWarn === null || defaults.lowWarn === undefined
      ? ""
      : defaults.lowWarn
  );
  const [highWarn, setHighWarn] = useState(
    defaults.highWarn === null || defaults.highWarn === undefined
      ? ""
      : defaults.highWarn
  );

  const [telemetryLiveValue, setTelemetryLiveValue] = useState(null);
  const [telemetryPollError, setTelemetryPollError] = useState("");
  const [telemetryPollMs, setTelemetryPollMs] = useState(2000);
  const [telemetrySelectedDevice, setTelemetrySelectedDevice] = useState(null);

  // ✅ draggable modal state
  const [modalPos, setModalPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    originLeft: 0,
    originTop: 0,
  });

  useEffect(() => {
    const d = buildGaugeDefaults(widget);

    // ✅ keep blank blank
    setTitle(
      d.title === null || d.title === undefined ? "Gauge" : String(d.title)
    );
    setUnits(d.units || "");
    setGaugeStyle(d.gaugeStyle || "classic");

    setBindModel(widget.bindModel || "zhc1921");
    setBindDeviceId(widget.bindDeviceId || "");
    setBindField(widget.bindField || "ai1");

    setMinValue(d.minValue ?? 0);
    setMaxValue(d.maxValue ?? 100);
    setDecimals(d.decimals ?? 0);
    setFormula(d.formula || "");

    setShowValue(d.showValue !== false);
    setShowTicks(d.showTicks !== false);
    setShowLabels(d.showLabels !== false);
    setShowZones(d.showZones !== false);

    setLowWarn(d.lowWarn === null || d.lowWarn === undefined ? "" : d.lowWarn);
    setHighWarn(
      d.highWarn === null || d.highWarn === undefined ? "" : d.highWarn
    );

    setTelemetryLiveValue(null);
    setTelemetryPollError("");
    setTelemetryPollMs(2000);
    setTelemetrySelectedDevice(null);

    // ✅ reset modal position when opening a new modal
    if (open) {
      setModalPos(null);
      setIsDragging(false);
      dragRef.current.dragging = false;
    }
  }, [widget, open]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current.dragging) return;

      const nextLeft =
        dragRef.current.originLeft + (e.clientX - dragRef.current.startX);
      const nextTop =
        dragRef.current.originTop + (e.clientY - dragRef.current.startY);

      setModalPos({
        left: Math.max(8, nextLeft),
        top: Math.max(8, nextTop),
      });
    };

    const handleUp = () => {
      dragRef.current.dragging = false;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const normalizedDeviceStatus = useMemo(
    () => normalizeDeviceStatus(telemetrySelectedDevice),
    [telemetrySelectedDevice]
  );

  const statusCard = useMemo(() => {
    const hasBinding = !!String(bindDeviceId || "").trim();

    if (!hasBinding) {
      return {
        text: "Select a device",
        subtext: "Choose a device and tag to preview live telemetry.",
        color: "#64748b",
        bg: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.28)",
        fontWeight: 800,
      };
    }

    if (telemetryPollError) {
      return {
        text: "OFFLINE",
        subtext: telemetryPollError,
        color: "#dc2626",
        bg: "rgba(254,226,226,0.70)",
        border: "rgba(220,38,38,0.24)",
        fontWeight: 900,
      };
    }

    if (normalizedDeviceStatus.online === false) {
      const lastSeen =
        telemetrySelectedDevice?.lastSeen ??
        telemetrySelectedDevice?.last_seen ??
        telemetrySelectedDevice?.lastTelemetryAt ??
        telemetrySelectedDevice?.last_telemetry_at ??
        telemetrySelectedDevice?.updatedAt ??
        telemetrySelectedDevice?.updated_at ??
        "";

      return {
        text: "OFFLINE",
        subtext: lastSeen
          ? `Last seen: ${formatLastSeen(lastSeen)}`
          : "Device is not reporting live telemetry.",
        color: "#dc2626",
        bg: "rgba(254,226,226,0.70)",
        border: "rgba(220,38,38,0.24)",
        fontWeight: 900,
      };
    }

    if (normalizedDeviceStatus.online === true) {
      return {
        text: "ONLINE",
        subtext:
          telemetryLiveValue === null || telemetryLiveValue === undefined
            ? "Connected. Waiting for live value..."
            : `Live telemetry is updating every ${Math.max(
                250,
                Number(telemetryPollMs) || 2000
              )} ms.`,
        color: "#16a34a",
        bg: "rgba(220,252,231,0.85)",
        border: "rgba(22,163,74,0.24)",
        fontWeight: 900,
      };
    }

    return {
      text: "CHECKING...",
      subtext: "Reading device status from telemetry.",
      color: "#64748b",
      bg: "rgba(148,163,184,0.10)",
      border: "rgba(148,163,184,0.28)",
      fontWeight: 800,
    };
  }, [
    bindDeviceId,
    telemetryPollError,
    telemetrySelectedDevice,
    telemetryLiveValue,
    telemetryPollMs,
    normalizedDeviceStatus.online,
  ]);

  if (!open) return null;

  const savePayload = {
    ...widget,
    type: "gaugeDisplay",
    // ✅ allow blank title to remain blank
    title: String(title ?? ""),
    units: String(units || "").trim(),
    gaugeStyle: gaugeStyle || "classic",

    bindModel: String(bindModel || "zhc1921").trim(),
    bindDeviceId: String(bindDeviceId || "").trim(),
    bindField: String(bindField || "ai1").trim(),

    minValue: Number(minValue),
    maxValue: Number(maxValue),
    decimals: Math.max(0, Number(decimals) || 0),
    formula: String(formula || "").trim(),

    showValue,
    showTicks,
    showLabels,
    showZones,

    lowWarn: String(lowWarn).trim() === "" ? null : Number(lowWarn),
    highWarn: String(highWarn).trim() === "" ? null : Number(highWarn),
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    setIsDragging(true);

    if (modalPos) {
      dragRef.current.originLeft = modalPos.left;
      dragRef.current.originTop = modalPos.top;
    } else {
      const modalEl = e.currentTarget.parentElement;
      const rect = modalEl?.getBoundingClientRect();
      dragRef.current.originLeft = rect?.left ?? 80;
      dragRef.current.originTop = rect?.top ?? 80;
      setModalPos({
        left: rect?.left ?? 80,
        top: rect?.top ?? 80,
      });
    }
  };

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        zIndex: 3000,
        padding: 18,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(1380px, 98vw)",
          maxHeight: "94vh",
          overflow: "hidden",
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: modalPos ? modalPos.left : "50%",
          top: modalPos ? modalPos.top : "50%",
          transform: modalPos ? "none" : "translate(-50%, -50%)",
        }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
              Gauge Display Settings
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Configure gauge style, AI binding, live telemetry, math formula,
              and display range.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            padding: 18,
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: 18,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "grid", gap: 18 }}>
            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 16,
                background: "#fcfcfd",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111827",
                }}
              >
                Gauge Style
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {GAUGE_STYLE_OPTIONS.map((item) => (
                  <StyleCard
                    key={item.value}
                    item={item}
                    selected={gaugeStyle === item.value}
                    onClick={setGaugeStyle}
                  />
                ))}
              </div>
            </section>

            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 16,
                background: "#fcfcfd",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111827",
                }}
              >
                Basic
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr 0.8fr",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                  >
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Gauge"
                    style={{
                      height: 38,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "0 12px",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                  >
                    Units
                  </span>
                  <input
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="PSI"
                    style={{
                      height: 38,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "0 12px",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                  >
                    Decimals
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={decimals}
                    onChange={(e) => setDecimals(e.target.value)}
                    style={{
                      height: 38,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "0 12px",
                    }}
                  />
                </label>
              </div>
            </section>

            <GaugeBindingTelemetrySection
              open={open}
              bindModel={bindModel}
              setBindModel={setBindModel}
              bindDeviceId={bindDeviceId}
              setBindDeviceId={setBindDeviceId}
              bindField={bindField}
              setBindField={setBindField}
              onLiveValueChange={setTelemetryLiveValue}
              onPollErrorChange={setTelemetryPollError}
              onPollMsChange={setTelemetryPollMs}
              onSelectedDeviceChange={setTelemetrySelectedDevice}
            />

            <section
              style={{
                border: `1px solid ${statusCard.border}`,
                borderRadius: 14,
                padding: 16,
                background: statusCard.bg,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                Device Status
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: statusCard.fontWeight,
                  color: statusCard.color,
                  lineHeight: 1,
                  letterSpacing: 0.25,
                }}
              >
                {statusCard.text}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color:
                    statusCard.text === "OFFLINE" ? "#991b1b" : "#475569",
                  fontWeight: statusCard.text === "OFFLINE" ? 700 : 500,
                }}
              >
                {statusCard.subtext}
              </div>

              {bindDeviceId ? (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  Bound Device: <b>{bindDeviceId}</b>
                  {bindField ? (
                    <>
                      {" "}
                      • Tag: <b>{bindField}</b>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
            <GaugeRangeMathSection
              minValue={minValue}
              setMinValue={setMinValue}
              maxValue={maxValue}
              setMaxValue={setMaxValue}
              formula={formula}
              setFormula={setFormula}
              lowWarn={lowWarn}
              highWarn={highWarn}
              telemetryLiveValue={telemetryLiveValue}
              telemetryPollError={telemetryPollError}
              telemetryPollMs={telemetryPollMs}
              telemetrySelectedDevice={telemetrySelectedDevice}
            />

            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 16,
                background: "#fcfcfd",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 12,
                  color: "#111827",
                }}
              >
                Thresholds and Options
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                  >
                    Low Warning
                  </span>
                  <input
                    type="number"
                    value={lowWarn}
                    onChange={(e) => setLowWarn(e.target.value)}
                    placeholder="Optional"
                    style={{
                      height: 38,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "0 12px",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}
                  >
                    High Warning
                  </span>
                  <input
                    type="number"
                    value={highWarn}
                    onChange={(e) => setHighWarn(e.target.value)}
                    placeholder="Optional"
                    style={{
                      height: 38,
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "0 12px",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showValue}
                    onChange={(e) => setShowValue(e.target.checked)}
                  />
                  Show value
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showZones}
                    onChange={(e) => setShowZones(e.target.checked)}
                  />
                  Show zones
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showTicks}
                    onChange={(e) => setShowTicks(e.target.checked)}
                  />
                  Show ticks
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  Show labels
                </label>
              </div>
            </section>
          </div>
        </div>

        <div
          style={{
            padding: 18,
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSave?.(savePayload)}
            style={{
              border: "none",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}