// src/components/Sidebarleftwirelesstankmodal.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import wl3000TankPreview from "../assets/wl3000-tank-preview.png";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_OPTIONS = [{ key: "cfr100", label: "CF-R100" }];

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function mmToIn(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return (n / 25.4).toFixed(2);
}

function cToF(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return ((n * 9) / 5 + 32).toFixed(1);
}

function formatDateTime(value) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function normalizeImei(value) {
  return String(value || "").trim().replace(/\D/g, "");
}

function normalizeNumberInput(value) {
  return String(value || "").replace(/[^\d.-]/g, "");
}

function evaluateHeightFormula(formula, value, realTankHeight) {
  const liveValue = Number(value);
  if (!Number.isFinite(liveValue)) return "--";

  const tankHeight = Number(realTankHeight);
  const cleanFormula = String(formula || "").trim();

  if (!cleanFormula) return liveValue.toFixed(2);

  try {
    const expression = cleanFormula
      .replace(
        /\bREAL_TANK_HEIGHT\b/g,
        Number.isFinite(tankHeight) ? String(tankHeight) : "0"
      )
      .replace(
        /\bTANK_HEIGHT\b/g,
        Number.isFinite(tankHeight) ? String(tankHeight) : "0"
      )
      .replace(/\bVALUE\b/g, String(liveValue))
      .replace(/\bvalue\b/g, String(liveValue));

    if (!/^[0-9+\-*/%().\s]+$/.test(expression)) return "--";

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression});`)();

    if (!Number.isFinite(Number(result))) return "--";
    return Number(result).toFixed(2);
  } catch {
    return "--";
  }
}

function computeCenteredPos({ panelW = 1460, estH = 630 } = {}) {
  const w = window.innerWidth || 1600;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(8, Math.floor((h - estH) / 2));

  return { left, top };
}

function TelemetryCard({
  icon,
  label,
  value,
  accent = "#0f172a",
  bg = "#f8fafc",
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "34px 1fr",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        minHeight: 54,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 17,
          color: accent,
          fontWeight: 900,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 2,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: accent,
            fontFamily: "monospace",
            lineHeight: 1.05,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function Sidebarleftwirelesstankmodal({
  open = true,
  tank,
  onSave,
  onClose,
}) {
  if (!open || !tank) return null;

  const props = tank?.properties || {};

  const [title, setTitle] = useState(props.name || "Tank#1");
  const [model, setModel] = useState(props.bindModel || "cfr100");
  const [unitId, setUnitId] = useState(props.unitId || props.bindDeviceId || "");
  const [unitQuery, setUnitQuery] = useState("");

  const [realTankHeight, setRealTankHeight] = useState(
    props.realTankHeight === undefined || props.realTankHeight === null
      ? ""
      : String(props.realTankHeight)
  );

  const [heightFormula, setHeightFormula] = useState(
    props.heightFormula === undefined || props.heightFormula === null
      ? ""
      : String(props.heightFormula)
  );

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState("");

  const PANEL_W = 1460;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: 12, top: 12 };
    return computeCenteredPos({ panelW: PANEL_W, estH: 630 });
  });

  const [isDragging, setIsDragging] = useState(false);

  async function loadUserWirelessSensors() {
    setLoadingUnits(true);
    setUnitsError("");

    try {
      const res = await fetch(`${API_URL}/radar-level/my-sensors`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.detail || `Failed to load sensors (${res.status})`);
      }

      const list = Array.isArray(data) ? data : [];

      const normalized = list.map((r) => {
        const imei = normalizeImei(
          r.raw_imei_bytes || r.rawImeiBytes || r.imei || ""
        );

        const heightIn = mmToIn(r.height_mm);

        return {
          unitId: imei,
          status: r.received_at ? "online" : "offline",
          height_mm: r.height_mm,
          height_in: heightIn,
          temperature_c: r.temperature_c,
          temperature_F: cToF(r.temperature_c),
          battery_V:
            r.battery_v === null || r.battery_v === undefined
              ? "--"
              : String(r.battery_v),
          received_at: formatDateTime(r.received_at),
          raw: r,
        };
      });

      setUnits(normalized);
    } catch (e) {
      setUnits([]);
      setUnitsError(e.message || "Failed to load wireless sensors.");
    } finally {
      setLoadingUnits(false);
    }
  }

  useLayoutEffect(() => {
    if (!open) return;
    setPos(computeCenteredPos({ panelW: PANEL_W, estH: 630 }));
  }, [open]);

  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};

    setTitle(p.name || "Tank#1");
    setModel(p.bindModel || "cfr100");
    setUnitId(p.unitId || p.bindDeviceId || "");
    setUnitQuery("");
    setRealTankHeight(
      p.realTankHeight === undefined || p.realTankHeight === null
        ? ""
        : String(p.realTankHeight)
    );
    setHeightFormula(
      p.heightFormula === undefined || p.heightFormula === null
        ? ""
        : String(p.heightFormula)
    );
  }, [tank]);

  useEffect(() => {
    if (!open) return;

    loadUserWirelessSensors();

    const intervalId = setInterval(() => {
      if (document.hidden) return;
      loadUserWirelessSensors();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [open]);

  const filteredUnits = useMemo(() => {
    const q = String(unitQuery || "").trim().toLowerCase();
    if (!q) return units;

    return units.filter((u) =>
      String(u.unitId || "").toLowerCase().includes(q)
    );
  }, [units, unitQuery]);

  const selectedUnit = useMemo(() => {
    return units.find((u) => String(u.unitId) === String(unitId)) || null;
  }, [units, unitId]);

  const liveRawHeight = selectedUnit?.height_in || "--";
  const liveMathOutput = evaluateHeightFormula(
    heightFormula,
    liveRawHeight,
    realTankHeight
  );

  const liveTemperature = selectedUnit?.temperature_F || "--";
  const liveBattery = selectedUnit?.battery_V || "--";
  const liveDate = selectedUnit?.received_at || "--";

  const canApply = !!String(unitId || "").trim();

  const onDragMove = (e) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const margin = 8;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    const nextLeft = dragRef.current.startLeft + dx;
    const nextTop = dragRef.current.startTop + dy;

    setPos({
      left: Math.min(
        Math.max(margin, nextLeft),
        Math.max(margin, w - margin - 260)
      ),
      top: Math.min(
        Math.max(margin, nextTop),
        Math.max(margin, h - margin - 140)
      ),
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
    if (
      e.target?.closest?.(
        "button, input, select, textarea, a, [data-no-drag='true']"
      )
    )
      return;

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

  const labelStyle = {
    fontSize: 11,
    fontWeight: 800,
    color: "#0f172a",
  };

  const inputStyle = {
    height: 36,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 10px",
    fontWeight: 600,
    background: "#fff",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.42)",
        zIndex: 999999,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: PANEL_W,
          maxWidth: "96vw",
          maxHeight: "90vh",
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
          overflow: "hidden",
        }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(180deg,#0b1b33,#071327)",
            color: "#fff",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          title="Drag to move"
        >
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.2 }}>
            CF-R100 Wireless Tank Properties
          </div>

          <button
            data-no-drag="true"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
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

        <div
          style={{
            padding: 14,
            background: "#f8fafc",
            maxHeight: "calc(90vh - 54px)",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px minmax(520px, 1fr) 310px",
              gap: 14,
              alignItems: "start",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 16,
                  color: "#0f172a",
                  marginBottom: 10,
                }}
              >
                Preview
              </div>

              <div
                style={{
                  height: 255,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={wl3000TankPreview}
                  alt="CF-R100 Tank Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  borderRadius: 12,
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  padding: 12,
                  fontSize: 12,
                  color: "#334155",
                  lineHeight: 1.45,
                }}
              >
                This wireless tank binds to the user’s registered CF-R100 sensor
                by IMEI. Live VALUE uses the same Raw Height shown in telemetry.
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
                Math
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Title (Top of Display)</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={inputStyle}
                  placeholder="Tank#1"
                />
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  This shows above the label on the widget.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 190px 1fr",
                  gap: 12,
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <div>
                  <div style={labelStyle}>Live VALUE</div>
                  <div
                    style={{
                      marginTop: 6,
                      width: 150,
                      borderRadius: 999,
                      background: "#dcfce7",
                      border: "1px solid #86efac",
                      color: "#166534",
                      padding: "8px 12px",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      textAlign: "center",
                    }}
                  >
                    {liveRawHeight}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 6,
                    padding: 10,
                    borderRadius: 12,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ ...labelStyle, textAlign: "center" }}>
                    Tank Height
                  </div>

                  <input
                    value={realTankHeight}
                    onChange={(e) =>
                      setRealTankHeight(normalizeNumberInput(e.target.value))
                    }
                    style={{
                      ...inputStyle,
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontWeight: 900,
                    }}
                    placeholder="ex: 48"
                  />
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={labelStyle}>Output</div>
                  <div
                    style={{
                      marginTop: 6,
                      marginLeft: "auto",
                      width: 150,
                      borderRadius: 999,
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#0f172a",
                      padding: "8px 12px",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      textAlign: "center",
                    }}
                  >
                    {liveMathOutput}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={labelStyle}>Formula</div>
                <textarea
                  value={heightFormula}
                  onChange={(e) => setHeightFormula(e.target.value)}
                  placeholder="Example: REAL_TANK_HEIGHT - VALUE"
                  style={{
                    minHeight: 74,
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    padding: "10px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    background: "#fff",
                    outline: "none",
                    width: "100%",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 6,
                  borderRadius: 12,
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 16,
                  fontSize: 12,
                  color: "#0f172a",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 7 }}>
                    Supported Operators
                  </div>
                  <div>VALUE + 10 → add</div>
                  <div>VALUE - 3 → subtract</div>
                  <div>VALUE * 2 → multiply</div>
                  <div>VALUE / 5 → divide</div>
                  <div>VALUE % 60 → modulo</div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 7 }}>
                    Combined Examples
                  </div>
                  <div>REAL_TANK_HEIGHT - VALUE</div>
                  <div>(VALUE * 1.5) + 5</div>
                  <div>(VALUE / 4095) * 20 - 4</div>
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 7 }}>
                    Current Output
                  </div>
                  <div>VALUE = Raw Height</div>
                  <div>REAL_TANK_HEIGHT = existing tank height</div>
                  <div>Sent to widget as heightValue</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
                Device Binding
              </div>

              <div style={{ display: "grid", gap: 5 }}>
                <div style={labelStyle}>Model</div>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={inputStyle}
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 5 }}>
                <div style={labelStyle}>IMEI Search</div>
                <input
                  value={unitQuery}
                  onChange={(e) => setUnitQuery(e.target.value)}
                  style={inputStyle}
                  placeholder="Type to filter IMEI..."
                />
              </div>

              <div style={{ display: "grid", gap: 5 }}>
                <div style={labelStyle}>Registered IMEI</div>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">
                    {loadingUnits ? "Loading sensors..." : "Select IMEI..."}
                  </option>

                  {filteredUnits.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.unitId}
                    </option>
                  ))}
                </select>
              </div>

              {unitsError ? (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "7px 9px",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {unitsError}
                </div>
              ) : null}

              {!loadingUnits && units.length === 0 ? (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #fde68a",
                    background: "#fffbeb",
                    color: "#92400e",
                    padding: "7px 9px",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  No CF-R100 sensors registered for this user.
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 0,
                  border: "1px solid #dbeafe",
                  background: "linear-gradient(180deg,#f8fbff,#eef6ff)",
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 13,
                    marginBottom: 8,
                    color: "#0f172a",
                  }}
                >
                  Wireless Telemetry
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 8,
                  }}
                >
                  <TelemetryCard
                    icon="↕"
                    label="Raw Height"
                    value={`${liveRawHeight}${
                      liveRawHeight !== "--" ? " in" : ""
                    }`}
                    accent="#2563eb"
                    bg="rgba(191,219,254,0.7)"
                  />

                  <TelemetryCard
                    icon="📐"
                    label="Math Output"
                    value={liveMathOutput}
                    accent="#16a34a"
                    bg="rgba(187,247,208,0.65)"
                  />

                  <TelemetryCard
                    icon="♨"
                    label="Temperature"
                    value={`${
                      liveTemperature
                    }${liveTemperature !== "--" ? " °F" : ""}`}
                    accent="#ea580c"
                    bg="rgba(254,215,170,0.7)"
                  />

                  <TelemetryCard
                    icon="🔋"
                    label="Battery"
                    value={`${liveBattery}${liveBattery !== "--" ? " V" : ""}`}
                    accent="#15803d"
                    bg="rgba(187,247,208,0.65)"
                  />

                  <TelemetryCard
                    icon="📅"
                    label="Date"
                    value={liveDate}
                    accent="#2563eb"
                    bg="rgba(191,219,254,0.7)"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 2,
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={!canApply}
                  onClick={() => {
                    const selected = selectedUnit || {};

                    const nextProps = {
                      ...(tank?.properties || {}),
                      name: String(title || "").trim() || "Tank#1",
                      bindModel: "cfr100",
                      modelLabel: "CF-R100",
                      unitId: String(unitId || "").trim(),
                      bindDeviceId: String(unitId || "").trim(),
                      bindImei: String(unitId || "").trim(),

                      bindHeightField: "height_mm",
                      bindTemperatureField: "temperature_c",
                      bindBatteryField: "battery_v",
                      bindDateField: "received_at",

                      realTankHeight,
                      heightFormula,
                      rawHeightValue: selected.height_in || "--",
                      rawHeightMmValue:
                        selected.height_mm === undefined ||
                        selected.height_mm === null
                          ? "--"
                          : String(selected.height_mm),
                      heightValue: liveMathOutput || "--",
                      heightOutputValue: liveMathOutput || "--",
                      temperatureValue: selected.temperature_F || "--",
                      batteryValue: selected.battery_V || "--",
                      dateValue: selected.received_at || "--",
                    };

                    onSave?.({
                      ...tank,
                      properties: nextProps,
                    });

                    onClose?.();
                  }}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1px solid #9ae6b4",
                    background: canApply
                      ? "linear-gradient(180deg,#bbf7d0,#6ee78f)"
                      : "#e5e7eb",
                    color: "#052e16",
                    fontWeight: 900,
                    cursor: canApply ? "pointer" : "not-allowed",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}