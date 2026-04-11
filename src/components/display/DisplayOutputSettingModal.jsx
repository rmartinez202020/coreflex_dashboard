// src/components/display/DisplayOutputSettingModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import {
  bindControlDO,
  deleteControlBinding,
} from "../controls/controlBindings";
import {
  resolveDeviceId,
  readRowStatus,
  isRowOnline,
  getLastSeen,
  readAOValue,
  computeMathOutput,
} from "./displayOutputModalTelemetry";

const FIXED_MODEL = "zhc1661"; // CF-1600
const POLL_MS = 2000;

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveWidgetId(widget) {
  return String(
    widget?.id ??
      widget?.widgetId ??
      widget?.widget_id ??
      widget?._id ??
      widget?.uuid ??
      widget?.properties?.widgetId ??
      widget?.properties?.widget_id ??
      ""
  ).trim();
}

function resolveDashboardId({ dashboardId, widget }) {
  return String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.dashboard_id ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();
}

function resolveDashboardName({ dashboardName, widget }) {
  return String(
    dashboardName ??
      widget?.dashboardName ??
      widget?.dashboard_name ??
      widget?.properties?.dashboardName ??
      widget?.properties?.dashboard_name ??
      ""
  ).trim();
}

function parseMaybeNumber(v, fallback = "") {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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

  const props = tank?.properties || {};

  const [label, setLabel] = useState(props.label ?? "");
  const [formula, setFormula] = useState(props.formula ?? "");
  const [bindModel, setBindModel] = useState(props.bindModel || FIXED_MODEL);
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "ao1");
  const [isApplying, setIsApplying] = useState(false);

  // ✅ NEW SCALE FEATURE
  const [scaleMin, setScaleMin] = useState(
    props.scaleMin ?? props.aoScaleMin ?? 0
  );
  const [scaleMax, setScaleMax] = useState(
    props.scaleMax ?? props.aoScaleMax ?? 100
  );

  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};
    setLabel(p.label ?? "");
    setFormula(p.formula ?? "");
    setBindModel(FIXED_MODEL);
    setBindDeviceId(p.bindDeviceId ?? "");
    setBindField(p.bindField === "ao2" ? "ao2" : "ao1");

    // ✅ NEW SCALE FEATURE
    setScaleMin(p.scaleMin ?? p.aoScaleMin ?? 0);
    setScaleMax(p.scaleMax ?? p.aoScaleMax ?? 100);
  }, [tank]);

  useEffect(() => {
    setBindModel(FIXED_MODEL);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let timer = null;

    async function loadDevices(isFirst = false) {
      try {
        if (isFirst) setDevicesLoading(true);

        const res = await fetch(`${API_URL}/zhc1661/my-devices`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          throw new Error(
            data?.detail || `Failed to load CF-1600 devices (${res.status})`
          );
        }

        const rows = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setDevices(rows);
          setPollError("");
        }
      } catch (err) {
        if (!cancelled) {
          setPollError(err?.message || "Failed to load device data");
        }
      } finally {
        if (!cancelled) setDevicesLoading(false);
      }
    }

    loadDevices(true);
    timer = window.setInterval(() => loadDevices(false), POLL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [open]);

  const selectedDevice = useMemo(() => {
    const wanted = String(bindDeviceId || "").trim();
    if (!wanted) return null;
    return devices.find((d) => resolveDeviceId(d) === wanted) || null;
  }, [devices, bindDeviceId]);

  const hasSelectedDevice = !!String(bindDeviceId || "").trim();
  const selectedDeviceStatus = readRowStatus(selectedDevice);
  const selectedDeviceIsOnline =
    hasSelectedDevice && isRowOnline(selectedDevice);

  const rawLiveValue = useMemo(() => {
    return readAOValue(selectedDevice, bindField);
  }, [selectedDevice, bindField]);

  const effectiveLiveValue = selectedDeviceIsOnline ? rawLiveValue : null;

  // ✅ NEW SCALE FEATURE
  const numericScaleMin = useMemo(() => parseMaybeNumber(scaleMin, ""), [scaleMin]);
  const numericScaleMax = useMemo(() => parseMaybeNumber(scaleMax, ""), [scaleMax]);

  const scaleError = useMemo(() => {
    if (numericScaleMin === "" || numericScaleMax === "") {
      return "Both set values are required.";
    }

    if (
      !Number.isFinite(Number(numericScaleMin)) ||
      !Number.isFinite(Number(numericScaleMax))
    ) {
      return "Set values must be valid numbers.";
    }

    if (Number(numericScaleMin) >= Number(numericScaleMax)) {
      return "Set 0 must be lower than Set 100.";
    }

    return "";
  }, [numericScaleMin, numericScaleMax]);

  const effectiveOutputValue = useMemo(() => {
    if (!selectedDeviceIsOnline) return null;
    return computeMathOutput(
      rawLiveValue,
      formula,
      Number(numericScaleMin),
      Number(numericScaleMax)
    );
  }, [
    selectedDeviceIsOnline,
    rawLiveValue,
    formula,
    numericScaleMin,
    numericScaleMax,
  ]);

  useEffect(() => {}, [
    bindDeviceId,
    bindField,
    devices,
    selectedDevice,
    selectedDeviceStatus,
    selectedDeviceIsOnline,
    rawLiveValue,
    effectiveLiveValue,
    effectiveOutputValue,
    numericScaleMin,
    numericScaleMax,
    scaleError,
  ]);

  const liveErr = pollError;

  const PANEL_W = 920;
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [didInitPos, setDidInitPos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDidInitPos(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (didInitPos) return;

    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const width = Math.min(PANEL_W, Math.floor(w * 0.96));
    const estHeight = 640;

    const left = Math.max(12, Math.floor((w - width) / 2));
    const top = Math.max(12, Math.floor((h - estHeight) / 2));

    setPos({ left, top });
    setDidInitPos(true);
  }, [open, didInitPos]);

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const maxLeft = Math.max(margin, w - margin - 260);
    const maxTop = Math.max(margin, h - margin - 140);

    setPos({
      left: Math.min(Math.max(margin, nextLeft), maxLeft),
      top: Math.min(Math.max(margin, nextTop), maxTop),
    });
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    setIsDragging(false);
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const startDrag = (e) => {
    if (e.button !== 0) return;

    const t = e.target;
    if (
      t?.closest?.("button, input, select, textarea, a, [data-no-drag='true']")
    ) {
      return;
    }

    e.preventDefault();

    dragRef.current.dragging = true;
    setIsDragging(true);
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", endDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", endDrag);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canApply = useMemo(() => {
    return (
      !!bindDeviceId &&
      (bindField === "ao1" || bindField === "ao2") &&
      !scaleError
    );
  }, [bindDeviceId, bindField, scaleError]);

  useEffect(() => {}, [bindDeviceId, bindField, canApply, isApplying, scaleError]);

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

  async function handleApply() {
    if (!canApply || isApplying) {
      return;
    }

    const cleanLabel = String(label || "").trim();

    const nextProps = {
      ...(tank?.properties || {}),
      label: cleanLabel,
      bindModel: FIXED_MODEL,
      bindDeviceId,
      bindField,
      formula,

      // ✅ NEW SCALE FEATURE
      scaleMin: Number(numericScaleMin),
      scaleMax: Number(numericScaleMax),
      aoScaleMin: Number(numericScaleMin),
      aoScaleMax: Number(numericScaleMax),
    };

    delete nextProps.title;
    delete nextProps.displayTitle;

    const nextTank = {
      ...tank,
      label: cleanLabel,
      bindModel: FIXED_MODEL,
      bindDeviceId,
      bindField,
      formula,

      // ✅ NEW SCALE FEATURE
      scaleMin: Number(numericScaleMin),
      scaleMax: Number(numericScaleMax),

      properties: nextProps,
    };

    delete nextTank.title;
    delete nextTank.displayTitle;

    try {
      setIsApplying(true);

      const resolvedDashboardId = resolveDashboardId({
        dashboardId,
        widget: tank,
      });

      const resolvedDashboardName = resolveDashboardName({
        dashboardName,
        widget: tank,
      });

      const widgetId = resolveWidgetId(tank);

      const deviceId = String(bindDeviceId || "").trim();
      const field = String(bindField || "").trim().toLowerCase();

      if (
        resolvedDashboardId &&
        widgetId &&
        deviceId &&
        /^ao[1-2]$/.test(field)
      ) {
        await bindControlDO({
          dashboardId,
          dashboardName,
          widgetId,
          widgetType: "display_output",
          title: "Display Output",
          deviceId,
          field,
        });
      } else if (dashboardId && widgetId) {
        await deleteControlBinding({
          dashboardId,
          widgetId,
        });
      } else {
        alert("Missing dashboardId or widgetId for Display Output binding");
        return;
      }

      onSave?.(nextTank);

      if (typeof onSaveProject === "function") {
        await onSaveProject();
      }

      onClose?.();
    } catch (err) {
      alert(err?.message || "Display Output apply failed");
    } finally {
      setIsApplying(false);
    }
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
          maxWidth: "96vw",
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
              gridTemplateColumns: "1fr 1fr",
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
                    }}
                  >
                    Scaling Reference
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: 14,
                    gap: 12,
                    background: "transparent",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #dbe3ee",
                      borderRadius: 12,
                      background: "#ffffff",
                      padding: "12px 10px",
                      display: "grid",
                      gap: 8,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: 0.2,
                        textTransform: "uppercase",
                      }}
                    >
                      4000m Amp
                    </div>

                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1,
                      }}
                    >
                      {numericScaleMin === "" ? "--" : numericScaleMin}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: 0.2,
                        textTransform: "uppercase",
                      }}
                    >
                      Set Value
                    </div>

                    <input
                      value={scaleMin}
                      onChange={(e) => {
                        setScaleMin(e.target.value);
                      }}
                      inputMode="decimal"
                      placeholder="0"
                      style={{
                        height: 34,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        padding: "0 10px",
                        fontWeight: 700,
                        textAlign: "center",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      border: "1px solid #dbe3ee",
                      borderRadius: 12,
                      background: "#ffffff",
                      padding: "12px 10px",
                      display: "grid",
                      gap: 8,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: 0.2,
                        textTransform: "uppercase",
                      }}
                    >
                      20000m Amp
                    </div>

                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1,
                      }}
                    >
                      {numericScaleMax === "" ? "--" : numericScaleMax}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        letterSpacing: 0.2,
                        textTransform: "uppercase",
                      }}
                    >
                      Set Value
                    </div>

                    <input
                      value={scaleMax}
                      onChange={(e) => {
                        setScaleMax(e.target.value);
                      }}
                      inputMode="decimal"
                      placeholder="100"
                      style={{
                        height: 34,
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        padding: "0 10px",
                        fontWeight: 700,
                        textAlign: "center",
                        background: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              {scaleError ? (
                <div
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fff1f2",
                    color: "#991b1b",
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                    fontWeight: 700,
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
                  CF-1600
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
                  onClick={() => {
                    handleApply();
                  }}
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