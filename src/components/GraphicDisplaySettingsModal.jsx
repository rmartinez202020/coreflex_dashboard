import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

// ✅ Updated sampling options (ms)
// 1s, 3s, 6s, 30s, 1min, 5min, 10min
const SAMPLE_OPTIONS = [1000, 3000, 6000, 30000, 60000, 300000, 600000];

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
  zhc1921: { label: "CF-2000 (ZHC1921)", base: "zhc1921" },
  zhc1661: { label: "CF-1600 (ZHC1661)", base: "zhc1661" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ add cache-buster so Vercel/CDN/browser never serves a cached JSON
function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

// ✅ resilient JSON fetch (NO-CACHE)
async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      // best-effort cache busting
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

// ✅ Try multiple endpoints because projects evolve.
// You can keep only the correct ones later.
async function loadDevicesForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;
  const candidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/devices", "/zhc1661/list", "/zhc1661"];

  let lastErr = null;

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });

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

// ✅ Live row poll (tries “single device” endpoints first, then falls back to list endpoint + find)
async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  // Try “single device row” style endpoints first (these are most likely to be live DB reads)
  const directCandidates =
    base === "zhc1921"
      ? [
          `/zhc1921/device/${deviceId}`,
          `/zhc1921/devices/${deviceId}`,
          `/zhc1921/${deviceId}`,
          `/zhc1921/one/${deviceId}`,
        ]
      : [
          `/zhc1661/device/${deviceId}`,
          `/zhc1661/devices/${deviceId}`,
          `/zhc1661/${deviceId}`,
          `/zhc1661/one/${deviceId}`,
        ];

  for (const p of directCandidates) {
    try {
      const r = await apiGet(p, { signal });
      // normalize to a row object
      return r?.row ?? r?.device ?? r;
    } catch (e) {
      // ignore and continue
    }
  }

  // Fallback: load list and find device (still no-cache)
  const list = await loadDevicesForModel(modelKey, { signal });
  const found = list.find((d) => String(d.deviceId) === String(deviceId));
  if (!found) return null;

  // Some list endpoints might also include AI fields; try returning raw match from list source:
  // (we can't get raw row here because list is normalized, so return null and let caller handle)
  return null;
}

// ✅ read AI field from row, accept multiple naming styles
function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  // possible keys:
  // ai1..ai4
  // AI1..AI4
  // a1..a4 (legacy)
  // analog1..analog4 (legacy)
  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "a"),
    f.replace("ai", "A"),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  // also try ai_1 / ai-1
  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

// ✅ label helper for the new sample options
function formatSampleLabel(ms) {
  const sec = ms / 1000;

  // exact labels requested
  if (ms === 1000) return "1s";
  if (ms === 3000) return "3s";
  if (ms === 6000) return "6s";
  if (ms === 30000) return "30s";
  if (ms === 60000) return "1 min";
  if (ms === 300000) return "5 min";
  if (ms === 600000) return "10 min";

  // fallback
  if (ms % 60000 === 0) return `${ms / 60000} min`;
  if (ms % 1000 === 0) return `${sec}s`;
  return `${ms} ms`;
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

  // ✅ default stays 1s
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

  // ✅ current value polling (uses sampleMs now)
  const [currentValue, setCurrentValue] = useState(null);
  const [currentUpdatedAt, setCurrentUpdatedAt] = useState("");
  const [valueErr, setValueErr] = useState("");

  // Load from tank when opening/editing
  useEffect(() => {
    if (!tank) return;

    setTitle(tank.title ?? "Graphic Display");
    setTimeUnit(tank.timeUnit ?? "seconds");
    setWindowSize(tank.window ?? 60);

    // ✅ accept old values, but if not in the list, fall back to 1s
    const incomingSample = Number(tank.sampleMs ?? 1000);
    setSampleMs(SAMPLE_OPTIONS.includes(incomingSample) ? incomingSample : 1000);

    setYMin(Number.isFinite(tank.yMin) ? tank.yMin : 0);
    setYMax(Number.isFinite(tank.yMax) ? tank.yMax : 100);
    setYUnits(tank.yUnits ?? "");
    setGraphStyle(tank.graphStyle ?? "line");

    // ✅ persisted binding
    setBindModel(tank.bindModel ?? "zhc1921");
    setBindDeviceId(tank.bindDeviceId ?? "");
    setBindField(tank.bindField ?? "ai1");

    // reset value preview
    setCurrentValue(null);
    setCurrentUpdatedAt("");
    setValueErr("");
  }, [tank]);

  // Load devices when model changes
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    async function run() {
      setLoadingDevices(true);
      setDeviceErr("");
      try {
        const list = await loadDevicesForModel(bindModel, { signal: ctrl.signal });
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
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindModel]);

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

  // ✅ Poll current value using the selected sampleMs
  useEffect(() => {
    if (!open) return;
    if (!bindDeviceId || !bindField || !bindModel) {
      setCurrentValue(null);
      setCurrentUpdatedAt("");
      setValueErr("");
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setValueErr("");

        // Try to fetch a live row for this device (best effort)
        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        // If we didn't get a direct row, fall back to calling the list endpoint RAW
        // (some APIs return AI fields inside the list rows)
        let value = null;
        let updatedAt = null;

        if (row) {
          value = readAiField(row, bindField);
          updatedAt =
            row.updatedAt ?? row.updated_at ?? row.lastSeen ?? row.last_seen;
        } else {
          // fallback: call the “devices” list endpoint raw and search by id
          const base = MODEL_META[bindModel]?.base || bindModel;
          const rawCandidates =
            base === "zhc1921"
              ? [
                  "/zhc1921/devices",
                  "/zhc1921/my-devices",
                  "/zhc1921/list",
                  "/zhc1921",
                ]
              : [
                  "/zhc1661/devices",
                  "/zhc1661/my-devices",
                  "/zhc1661/list",
                  "/zhc1661",
                ];

          let rawArr = [];
          for (const p of rawCandidates) {
            try {
              const data = await apiGet(p, { signal: ctrl.signal });
              rawArr = Array.isArray(data)
                ? data
                : Array.isArray(data?.devices)
                ? data.devices
                : Array.isArray(data?.rows)
                ? data.rows
                : [];
              if (rawArr.length) break;
            } catch (e) {
              // continue
            }
          }

          const rawRow =
            rawArr.find((r) => {
              const id =
                r.deviceId ??
                r.device_id ??
                r.id ??
                r.imei ??
                r.IMEI ??
                r.DEVICE_ID ??
                "";
              return String(id) === String(bindDeviceId);
            }) || null;

          if (rawRow) {
            value = readAiField(rawRow, bindField);
            updatedAt =
              rawRow.updatedAt ??
              rawRow.updated_at ??
              rawRow.lastSeen ??
              rawRow.last_seen;
          }
        }

        if (cancelled) return;

        // normalize numeric display
        const num =
          value === null || value === undefined || value === ""
            ? null
            : typeof value === "number"
            ? value
            : Number(value);

        setCurrentValue(Number.isFinite(num) ? num : value ?? null);

        // always update time so you can see polling working
        const ts =
          updatedAt && !Number.isNaN(new Date(updatedAt).getTime())
            ? new Date(updatedAt).toLocaleTimeString()
            : new Date().toLocaleTimeString();

        setCurrentUpdatedAt(ts);
      } catch (e) {
        if (cancelled) return;
        // If request aborted, ignore
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setValueErr("Could not read current value (check API endpoint / fields).");
        // still update time so you can see it polling
        setCurrentUpdatedAt(new Date().toLocaleTimeString());
      }
    };

    // run immediately, then every sampleMs
    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 1000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [open, bindModel, bindDeviceId, bindField, sampleMs]);

  const currentValueLabel = useMemo(() => {
    if (currentValue === null || currentValue === undefined) return "—";
    if (typeof currentValue === "number") return currentValue.toFixed(2);
    return String(currentValue);
  }, [currentValue]);

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

                {safeYMax <= safeYMin && (
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
                  setCurrentValue(null);
                  setCurrentUpdatedAt("");
                  setValueErr("");
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
                onChange={(e) => {
                  setBindDeviceId(e.target.value);
                  setCurrentValue(null);
                  setCurrentUpdatedAt("");
                  setValueErr("");
                }}
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
                onChange={(e) => {
                  setBindField(e.target.value);
                  setCurrentValue(null);
                  setCurrentUpdatedAt("");
                  setValueErr("");
                }}
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

              {/* ✅ Current Value (polls every sampleMs) */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                  Current Value
                </div>

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    Updated: {currentUpdatedAt || "—"}
                  </div>

                  <div
                    style={{
                      minWidth: 110,
                      textAlign: "center",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: 12,
                      border: "1px solid #c7e7d1",
                      background: "#dff7e6",
                      color: "#0b3b18",
                    }}
                    title={`Live value (polling every ${formatSampleLabel(sampleMs)})`}
                  >
                    {currentValueLabel}
                  </div>
                </div>

                {valueErr && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#b42318",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {valueErr}
                  </div>
                )}

                {deviceErr && (
                  <div
                    style={{
                      marginTop: 8,
                      color: "#b42318",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {deviceErr}
                  </div>
                )}
              </div>
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
