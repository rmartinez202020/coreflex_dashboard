import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const SAMPLE_OPTIONS = [200, 500, 700, 1000, 2000, 5000];
const TIME_UNITS = ["seconds", "minutes", "hours", "days"];

const GRAPH_STYLES = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "bar", label: "Bar" },
  { value: "step", label: "Step" },
];

// ✅ Only analog inputs for CF-2000 + CF-1600
const AI_OPTIONS = [
  { key: "ai1", label: "AI-1" },
  { key: "ai2", label: "AI-2" },
  { key: "ai3", label: "AI-3" },
  { key: "ai4", label: "AI-4" },
];

// ✅ Models allowed for this widget
const MODEL_META = {
  zhc1921: { label: "CF-2000 (ZHC1921)" },
  zhc1661: { label: "CF-1600 (ZHC1661)" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ resilient JSON fetch
async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

// ✅ Try multiple endpoints because projects evolve.
// You can keep only the correct ones later.
async function loadDevicesForModel(modelKey) {
  const candidates =
    modelKey === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/devices", "/zhc1661/list", "/zhc1661"];

  let lastErr = null;

  for (const p of candidates) {
    try {
      const data = await apiGet(p);

      // Accept common shapes:
      // - array
      // - { devices: [...] }
      // - { rows: [...] }
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      // normalize to { deviceId, status, lastSeen }
      const out = arr
        .map((r) => {
          const deviceId =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";

          if (!deviceId) return null;

          return {
            deviceId: String(deviceId),
            status: String(r.status ?? r.online ?? "").toLowerCase(),
            lastSeen: r.lastSeen ?? r.last_seen ?? r.updatedAt ?? r.updated_at,
          };
        })
        .filter(Boolean);

      return out; // ✅ endpoint worked
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("No device endpoint matched");
}

export default function GraphicDisplaySettingsModal({
  open,
  tank,
  onClose,
  onSave,
}) {
  if (!open) return null;

  // -------------------------
  // LEFT: chart settings
  // -------------------------
  const [title, setTitle] = useState("Graphic Display");
  const [timeUnit, setTimeUnit] = useState("seconds");
  const [windowSize, setWindowSize] = useState(60);
  const [sampleMs, setSampleMs] = useState(1000);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(100);
  const [yUnits, setYUnits] = useState("");
  const [graphStyle, setGraphStyle] = useState("line");

  // -------------------------
  // RIGHT: tag binding
  // -------------------------
  const [bindModel, setBindModel] = useState("zhc1921");
  const [devices, setDevices] = useState([]);
  const [bindDeviceId, setBindDeviceId] = useState("");
  const [bindField, setBindField] = useState("ai1");

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceErr, setDeviceErr] = useState("");

  // Load from tank when opening/editing
  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);
    setSampleMs(tank.sampleMs ?? 1000);

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");
    setGraphStyle(tank.graphStyle ?? "line");

    // ✅ persisted binding
    setBindModel(tank.bindModel ?? "zhc1921");
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");
  }, [tank]);

  // Load devices when model changes
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingDevices(true);
      setDeviceErr("");
      try {
        const list = await loadDevicesForModel(bindModel);
        if (cancelled) return;
        setDevices(list);

        // auto-pick first device if empty
        if (!bindDeviceId && list.length > 0) {
          setBindDeviceId(list[0].deviceId);
        }
      } catch (e) {
        if (cancelled) return;
        setDevices([]);
        setDeviceErr(
          "Could not load devices. Make sure your API has a user devices endpoint for this model."
        );
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindModel]);

  const formatSampleLabel = (ms) => {
    if (ms === 1000) return "1s (1000 ms)";
    if (ms === 2000) return "2s (2000 ms)";
    if (ms === 5000) return "5s (5000 ms)";
    return `${ms} ms`;
  };

  const safeWindow = Number.isFinite(windowSize) ? windowSize : 0;
  const safeYMin = Number.isFinite(yMin) ? yMin : 0;
  const safeYMax = Number.isFinite(yMax) ? yMax : 0;
  const yRangeValid = safeYMax > safeYMin;

  const canApply = yRangeValid && !!bindDeviceId && !!bindField;

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.deviceId === bindDeviceId) || null;
  }, [devices, bindDeviceId]);

  const deviceStatusLabel = useMemo(() => {
    const s = String(selectedDevice?.status || "");
    if (!s) return "—";
    if (s === "online" || s === "true" || s === "1") return "Online";
    if (s === "offline" || s === "false" || s === "0") return "Offline";
    return s;
  }, [selectedDevice]);

  const deviceStatusColor = useMemo(() => {
    const s = String(deviceStatusLabel).toLowerCase();
    if (s.includes("online")) return "#16a34a";
    if (s.includes("offline")) return "#b42318";
    return "#6b7280";
  }, [deviceStatusLabel]);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
    >
      {/* MAIN PANEL (same vibe as Indicator Light modal) */}
      <div
        style={{
          width: 980,
          maxWidth: "96vw",
          borderRadius: 12,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* HEADER BAR */}
        <div
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
          }}
        >
          <div>Graphic Display</div>
          <button
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

        {/* BODY: 2 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: 14,
            padding: 14,
            background: "#f8fafc",
          }}
        >
          {/* LEFT: DISPLAY SETTINGS */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: 14,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10, color: "#111827" }}>
              Display Settings
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                  Title
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 10px",
                    fontSize: 14,
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                    Time projection
                  </span>
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value)}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 10px",
                      fontSize: 14,
                    }}
                  >
                    {TIME_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                    Window
                  </span>
                  <input
                    type="number"
                    value={safeWindow}
                    onChange={(e) => setWindowSize(Number(e.target.value || 0))}
                    min={1}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 10px",
                      fontSize: 14,
                    }}
                  />
                </label>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                  Sample time
                </span>
                <select
                  value={sampleMs}
                  onChange={(e) => setSampleMs(Number(e.target.value))}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 10px",
                    fontSize: 14,
                  }}
                >
                  {SAMPLE_OPTIONS.map((ms) => (
                    <option key={ms} value={ms}>
                      {formatSampleLabel(ms)}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                  Graph style
                </span>
                <select
                  value={graphStyle}
                  onChange={(e) => setGraphStyle(e.target.value)}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    padding: "10px 10px",
                    fontSize: 14,
                  }}
                >
                  {GRAPH_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Vertical axis */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 10,
                  background: "#f9fafb",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
                  Vertical axis (manual)
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                      Y Min
                    </span>
                    <input
                      type="number"
                      value={safeYMin}
                      onChange={(e) => setYMin(Number(e.target.value || 0))}
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: "10px 10px",
                        fontSize: 14,
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                      Y Max
                    </span>
                    <input
                      type="number"
                      value={safeYMax}
                      onChange={(e) => setYMax(Number(e.target.value || 0))}
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: "10px 10px",
                        fontSize: 14,
                      }}
                    />
                  </label>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                    Units label (optional)
                  </span>
                  <input
                    value={yUnits}
                    onChange={(e) => setYUnits(e.target.value)}
                    placeholder="e.g. %, PSI, °F"
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "10px 10px",
                      fontSize: 14,
                    }}
                  />
                </label>

                {!yRangeValid && (
                  <div style={{ color: "#b42318", fontWeight: 800, fontSize: 12 }}>
                    Y Max must be greater than Y Min.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: TAG BINDING */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: 14,
              display: "grid",
              gap: 12,
              alignContent: "start",
            }}
          >
            <div style={{ fontWeight: 900, color: "#111827" }}>
              Tag that drives the Trend (AI)
            </div>

            {/* Model */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                Model
              </span>
              <select
                value={bindModel}
                onChange={(e) => {
                  setBindModel(e.target.value);
                  setBindDeviceId("");
                }}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              >
                {Object.keys(MODEL_META).map((k) => (
                  <option key={k} value={k}>
                    {MODEL_META[k].label}
                  </option>
                ))}
              </select>
            </label>

            {/* Device */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                Device
              </span>
              <select
                value={bindDeviceId}
                onChange={(e) => setBindDeviceId(e.target.value)}
                disabled={loadingDevices}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "10px 10px",
                  fontSize: 14,
                  background: loadingDevices ? "#f3f4f6" : "#fff",
                }}
              >
                <option value="">
                  {loadingDevices ? "Loading devices..." : "Select a device…"}
                </option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceId}
                  </option>
                ))}
              </select>
            </label>

            {/* Tag (AI only) */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
                Analog Input (AI)
              </span>
              <select
                value={bindField}
                onChange={(e) => setBindField(e.target.value)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "10px 10px",
                  fontSize: 14,
                }}
              >
                {AI_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Status panel */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                background: "#f9fafb",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8, color: "#111827" }}>
                Binding Preview
              </div>

              <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
                Selected: <b>{bindDeviceId || "—"}</b>{" "}
                <span style={{ color: deviceStatusColor, fontWeight: 900 }}>
                  {bindDeviceId ? `• ${deviceStatusLabel.toUpperCase()}` : ""}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                    Model
                  </div>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    {MODEL_META[bindModel]?.label || bindModel}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                    Selected AI
                  </div>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    {AI_OPTIONS.find((x) => x.key === bindField)?.label || bindField}
                  </div>
                </div>
              </div>

              {deviceErr && (
                <div
                  style={{
                    marginTop: 10,
                    color: "#b42318",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {deviceErr}
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!canApply}
                onClick={() =>
                  onSave({
                    ...tank,
                    // chart settings
                    title,
                    timeUnit,
                    window: safeWindow,
                    sampleMs,
                    yMin: safeYMin,
                    yMax: safeYMax,
                    yUnits,
                    graphStyle,

                    // ✅ binding for trend source
                    bindModel,
                    bindDeviceId,
                    bindField,
                  })
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bfe6c8",
                  background: canApply
                    ? "linear-gradient(180deg,#bff2c7,#6fdc89)"
                    : "#e5e7eb",
                  color: "#0b3b18",
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
  );
}
