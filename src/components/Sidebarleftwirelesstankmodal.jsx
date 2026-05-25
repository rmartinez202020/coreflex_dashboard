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

function computeCenteredPos({ panelW = 1180, estH = 500 } = {}) {
  const w = window.innerWidth || 1200;
  const h = window.innerHeight || 800;

  const width = Math.min(panelW, Math.floor(w * 0.96));
  const left = Math.max(12, Math.floor((w - width) / 2));
  const top = Math.max(12, Math.floor((h - estH) / 2));

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
        gridTemplateColumns: "46px 1fr",
        alignItems: "center",
        gap: 12,
        padding: "11px 12px",
        borderRadius: 12,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        minHeight: 68,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: accent,
          fontWeight: 900,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: accent,
            fontFamily: "monospace",
            lineHeight: 1.1,
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

  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [unitsError, setUnitsError] = useState("");

  const PANEL_W = 1180;

  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { left: 12, top: 12 };
    return computeCenteredPos({ panelW: PANEL_W, estH: 500 });
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

        return {
          unitId: imei,
          status: r.received_at ? "online" : "offline",
          height_mm: r.height_mm,
          height_in: mmToIn(r.height_mm),
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
    setPos(computeCenteredPos({ panelW: PANEL_W, estH: 500 }));
  }, [open]);

  useEffect(() => {
    if (!tank) return;
    const p = tank?.properties || {};

    setTitle(p.name || "Tank#1");
    setModel(p.bindModel || "cfr100");
    setUnitId(p.unitId || p.bindDeviceId || "");
    setUnitQuery("");
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

  const liveHeight = selectedUnit?.height_in || "--";
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
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  };

  const inputStyle = {
    height: 38,
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
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
          overflow: "hidden",
        }}
      >
        <div
          onMouseDown={startDrag}
          style={{
            padding: "12px 18px",
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
            Wireless Tank Properties
          </div>

          <button
            data-no-drag="true"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
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

        <div style={{ padding: 16, background: "#f8fafc" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 16,
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
                  height: 260,
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
                by IMEI.
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
                Device Binding
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>Title</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    placeholder="Tank#1"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
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
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={labelStyle}>IMEI Search</div>
                  <input
                    value={unitQuery}
                    onChange={(e) => setUnitQuery(e.target.value)}
                    style={inputStyle}
                    placeholder="Type to filter IMEI..."
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
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
              </div>

              {unitsError ? (
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "8px 10px",
                    fontSize: 12,
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
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  No CF-R100 sensors registered for this user.
                </div>
              ) : null}

              <div
                style={{
                  marginTop: 2,
                  border: "1px solid #dbeafe",
                  background: "linear-gradient(180deg,#f8fbff,#eef6ff)",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 14,
                    marginBottom: 12,
                    color: "#0f172a",
                  }}
                >
                  Wireless Telemetry
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <TelemetryCard
                    icon="↕"
                    label="Height"
                    value={`${liveHeight}${liveHeight !== "--" ? " in" : ""}`}
                    accent="#16a34a"
                    bg="rgba(187,247,208,0.65)"
                  />

                  <TelemetryCard
                    icon="📅"
                    label="Date"
                    value={liveDate}
                    accent="#2563eb"
                    bg="rgba(191,219,254,0.7)"
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
                  onClick={onClose}
                  style={{
                    padding: "10px 16px",
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
                      bindModel: model,
                      modelLabel: "CF-R100",
                      unitId: String(unitId || "").trim(),
                      bindDeviceId: String(unitId || "").trim(),
                      bindImei: String(unitId || "").trim(),

                      bindHeightField: "height_mm",
                      bindTemperatureField: "temperature_c",
                      bindBatteryField: "battery_v",
                      bindDateField: "received_at",

                      heightValue: selected.height_in || "--",
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
                    padding: "10px 16px",
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