import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Model meta (same system as StatusTextSettingsModal)
const MODEL_META = {
  zhc1921: { label: "ZHC1921 (CF-2000)", base: "zhc1921" },
  zhc1661: { label: "ZHC1661 (CF-1600)", base: "zhc1661" },
  tp4000: { label: "TP-4000", base: "tp4000" },
};

// ✅ DI/DO options (same as StatusTextSettingsModal / Indicator Light)
const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
  { key: "do1", label: "DO-1" },
  { key: "do2", label: "DO-2" },
  { key: "do3", label: "DO-3" },
  { key: "do4", label: "DO-4" },
];

// ✅ Convert anything to 0/1
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

// ✅ Read tag from backend row (same as StatusTextSettingsModal)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // di1..di6 -> in1..in6
  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `IN${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  // do1..do4 -> out1..out4
  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    const alt = `out${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = `OUT${n}`;
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

export default function BlinkingAlarmSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData, // kept for compatibility (not used for binding anymore)
}) {
  // ✅ do NOT early return before hooks
  const p = tank?.properties || {};

  // ✅ Modal sizing (wider + clamped)
  const MODAL_W = Math.min(980, window.innerWidth - 80);
  const MODAL_H = Math.min(640, window.innerHeight - 120);

  // Tag binding (backward compatible)
  const initialDeviceModel = String(p?.tag?.model || "zhc1921").trim() || "zhc1921";
  const initialDeviceId = String(p?.tag?.deviceId ?? "");
  const initialField = String(p?.tag?.field ?? "");

  // Style selection
  const initialStyle = p?.alarmStyle ?? "annunciator";
  const initialTone = p?.alarmTone ?? "critical";

  const [deviceModel, setDeviceModel] = React.useState(
    MODEL_META[initialDeviceModel] ? initialDeviceModel : "zhc1921"
  );
  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);

  const [deviceSearch, setDeviceSearch] = React.useState("");
  const [alarmStyle, setAlarmStyle] = React.useState(initialStyle);
  const [alarmTone, setAlarmTone] = React.useState(initialTone);

  // =========================
  // REHYDRATE ON OPEN
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    const pp = tank?.properties || {};

    setAlarmStyle(pp?.alarmStyle ?? "annunciator");
    setAlarmTone(pp?.alarmTone ?? "critical");

    const m = String(pp?.tag?.model || "zhc1921").trim() || "zhc1921";
    setDeviceModel(MODEL_META[m] ? m : "zhc1921");
    setDeviceId(String(pp?.tag?.deviceId || ""));
    setField(String(pp?.tag?.field || ""));

    setDeviceSearch("");
  }, [open, tank?.id]);

  // =========================
  // DRAGGABLE WINDOW
  // =========================
  const modalRef = React.useRef(null);
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  });

  const [pos, setPos] = React.useState(() => {
    const left = Math.max(20, Math.round((window.innerWidth - MODAL_W) / 2));
    const top = Math.max(20, Math.round((window.innerHeight - MODAL_H) / 2));
    return { left, top };
  });

  React.useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      e.preventDefault();

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const nextLeft = dragRef.current.startLeft + dx;
      const nextTop = dragRef.current.startTop + dy;

      const rect = modalRef.current?.getBoundingClientRect();
      const mw = rect?.width ?? MODAL_W;

      const clampedLeft = Math.min(window.innerWidth - 20, Math.max(20 - (mw - 60), nextLeft));
      const clampedTop = Math.min(window.innerHeight - 20, Math.max(20, nextTop));

      setPos({ left: clampedLeft, top: clampedTop });
    };

    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [MODAL_W, MODAL_H]);

  const startDrag = (e) => {
    if (e.button !== 0) return;

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.startLeft = pos.left;
    dragRef.current.startTop = pos.top;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  // =========================
  // DEVICES (BACKEND, LIKE StatusTextSettingsModal)
  // =========================
  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    let alive = true;

    async function fetchModelDevices(modelKey) {
      const base = MODEL_META[modelKey]?.base;
      if (!base) return [];

      const res = await fetch(`${API_URL}/${base}/my-devices`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      return list
        .map((r) => {
          const id = String(r.deviceId ?? r.device_id ?? "").trim();
          return {
            id,
            name: id,
            model: modelKey,
            modelLabel: MODEL_META[modelKey]?.label || modelKey,
          };
        })
        .filter((x) => x.id);
    }

    async function loadDevices() {
      setDevicesErr("");
      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const [d1, d2, d3] = await Promise.all([
          fetchModelDevices("zhc1921"),
          fetchModelDevices("zhc1661"),
          fetchModelDevices("tp4000"),
        ]);

        const merged = [...d1, ...d2, ...d3];

        merged.sort((a, b) => {
          const ma = String(a.model || "");
          const mb = String(b.model || "");
          if (ma !== mb) return ma.localeCompare(mb);
          return String(a.id).localeCompare(String(b.id));
        });

        if (alive) setDevices(merged);
      } catch (e) {
        if (alive) {
          setDevices([]);
          setDevicesErr(e.message || "Failed to load devices");
        }
      }
    }

    loadDevices();
    return () => {
      alive = false;
    };
  }, [open]);

  const filteredDevices = React.useMemo(() => {
    const q = String(deviceSearch || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => {
      const id = String(d.id || "").toLowerCase();
      const model = String(d.modelLabel || d.model || "").toLowerCase();
      return id.includes(q) || model.includes(q);
    });
  }, [devices, deviceSearch]);

  // =========================
  // LIVE STATUS / VALUE (POLL BACKEND LIKE StatusText)
  // =========================
  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const telemetryRef = React.useRef({ loading: false });

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    const modelKey = String(deviceModel || "").trim();
    const base = MODEL_META[modelKey]?.base;

    if (!id || !base) {
      setTelemetryRow(null);
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/${base}/my-devices`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setTelemetryRow(null);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const row = list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;

      setTelemetryRow(row);
    } catch {
      setTelemetryRow(null);
    } finally {
      telemetryRef.current.loading = false;
    }
  }, [deviceId, deviceModel]);

  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, 3000);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    return s || "";
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const effectiveField = String(field || "").trim();

  const rawValue = React.useMemo(() => {
    if (!telemetryRow || !effectiveField) return undefined;
    return readTagFromRow(telemetryRow, effectiveField);
  }, [telemetryRow, effectiveField]);

  const isOnline = deviceIsOnline && rawValue !== undefined && rawValue !== null && !!effectiveField;
  const as01 = React.useMemo(() => (isOnline ? to01(rawValue) : null), [isOnline, rawValue]);

  // =========================
  // TONE → COLORS
  // =========================
  const toneMap = {
    critical: { on: "#ef4444", glow: "rgba(239,68,68,0.55)" },
    warning: { on: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
    info: { on: "#3b82f6", glow: "rgba(59,130,246,0.45)" },
  };
  const tone = toneMap[alarmTone] || toneMap.critical;
  const OFF_COLOR = "#0b1220";

  // =========================
  // APPLY SAVE
  // =========================
  const apply = () => {
    const nextProps = {
      ...(tank?.properties || {}),

      alarmStyle,
      alarmTone,
      colorOn: tone.on,
      colorOff: OFF_COLOR,
    };

    // ✅ Only save tag if user picked both
    const hasTagSelection = deviceId && effectiveField;
    if (hasTagSelection) {
      nextProps.tag = {
        model: String(deviceModel || "zhc1921"),
        deviceId: String(deviceId),
        field: String(effectiveField),
      };
    }

    onSave?.({
      id: tank.id,
      properties: nextProps,
    });

    // optional close
    // onClose?.();
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{children}</div>
  );

  // =========================
  // PROFESSIONAL STYLE PREVIEWS
  // =========================
  const styles = [
    { id: "annunciator", name: "Annunciator Tile (Industrial)" },
    { id: "banner", name: "Banner Strip (Modern)" },
    { id: "stackLight", name: "Stack Light (Lens + Label)" },
    { id: "minimal", name: "Minimal Outline (Clean)" },
  ];

  const ProPreview = ({ styleId, isOn }) => {
    const onBg = tone.on;
    const offBg = OFF_COLOR;
    const bg = isOn ? onBg : offBg;

    const card = {
      width: "100%",
      height: 58,
      borderRadius: 12,
      border: "1px solid rgba(148,163,184,0.22)",
      background: "#0b1220",
      boxShadow: isOn
        ? `0 10px 26px rgba(0,0,0,0.28), 0 0 18px ${tone.glow}`
        : "0 10px 26px rgba(0,0,0,0.22)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 900,
      userSelect: "none",
      overflow: "hidden",
    };

    if (styleId === "annunciator") {
      return (
        <div style={{ ...card, justifyContent: "space-between", padding: "0 14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: 1 }}>ALARM</div>
            <div style={{ fontSize: 14 }}>{isOn ? "ACTIVE" : "NORMAL"}</div>
          </div>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: isOn ? bg : "rgba(148,163,184,0.35)",
              boxShadow: isOn ? `0 0 0 4px ${tone.glow}` : "none",
              transition: "all 150ms ease",
            }}
          />
        </div>
      );
    }

    if (styleId === "banner") {
      const stripeColor = isOn ? bg : "rgba(148,163,184,0.25)";
      const stripe = `repeating-linear-gradient(
        45deg,
        ${stripeColor},
        ${stripeColor} 10px,
        rgba(0,0,0,0.35) 10px,
        rgba(0,0,0,0.35) 20px
      )`;

      return (
        <div style={card}>
          <div style={{ width: "100%", height: "100%" }}>
            <div style={{ height: 12, background: stripe, opacity: isOn ? 1 : 0.7 }} />
            <div
              style={{
                height: "calc(100% - 12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                fontSize: 13,
                opacity: isOn ? 1 : 0.85,
              }}
            >
              <span>{isOn ? "ALARM" : "OFF"}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{isOn ? "ACTIVE" : "NORMAL"}</span>
            </div>
          </div>
        </div>
      );
    }

    if (styleId === "stackLight") {
      return (
        <div style={{ ...card, justifyContent: "flex-start", gap: 12, padding: "0 14px" }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: isOn ? bg : "rgba(148,163,184,0.25)",
              border: "2px solid rgba(255,255,255,0.10)",
              boxShadow: isOn ? `0 0 14px ${tone.glow}` : "none",
            }}
          />
          <div style={{ fontSize: 13, opacity: isOn ? 1 : 0.8 }}>
            {isOn ? "ALARM ACTIVE" : "NORMAL"}
          </div>
        </div>
      );
    }

    // minimal
    return (
      <div
        style={{
          ...card,
          background: "rgba(2,6,23,0.92)",
          border: `1px solid ${isOn ? tone.glow : "rgba(148,163,184,0.22)"}`,
          boxShadow: isOn ? `0 0 18px ${tone.glow}` : "0 10px 25px rgba(0,0,0,0.18)",
        }}
      >
        <span style={{ color: isOn ? bg : "rgba(226,232,240,0.75)" }}>{isOn ? "ALARM" : "OFF"}</span>
      </div>
    );
  };

  const StyleCard = ({ s }) => {
    const selected = alarmStyle === s.id;
    return (
      <button
        type="button"
        onClick={() => setAlarmStyle(s.id)}
        style={{
          textAlign: "left",
          width: "100%",
          borderRadius: 14,
          padding: 12,
          border: selected ? "2px solid #22c55e" : "1px solid #e5e7eb",
          background: selected ? "#ecfdf5" : "white",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>{s.name}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>
              OFF
            </div>
            <ProPreview styleId={s.id} isOn={false} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>
              ON
            </div>
            <ProPreview styleId={s.id} isOn={true} />
          </div>
        </div>
      </button>
    );
  };

  const statusText = !deviceId
    ? "Select a device and tag"
    : !effectiveField
    ? "Select a DI/DO tag"
    : isOnline
    ? "Online"
    : deviceId && deviceIsOnline
    ? "No data for tag"
    : "Offline";

  const valueText = isOnline ? String(as01 ?? 0) : "—";

  if (!open || !tank) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
      onMouseDown={onClose}
    >
      <div
        ref={modalRef}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          width: MODAL_W,
          maxWidth: "calc(100vw - 80px)",
          height: MODAL_H,
          maxHeight: "calc(100vh - 120px)",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          onMouseDown={startDrag}
          style={{
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 900,
            fontSize: 16,
            letterSpacing: 0.2,
            cursor: "grab",
            flex: "0 0 auto",
          }}
          title="Drag to move"
        >
          <span>Blinking Alarm</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "white",
              fontSize: 22,
              cursor: "pointer",
            }}
            title="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, overflow: "auto", flex: "1 1 auto" }}>
          {/* TONE PICKER */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>Alarm Tone</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { id: "critical", name: "Critical (Red)" },
                { id: "warning", name: "Warning (Amber)" },
                { id: "info", name: "Info (Blue)" },
              ].map((t) => {
                const sel = alarmTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAlarmTone(t.id)}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 12,
                      border: sel ? "2px solid #22c55e" : "1px solid #e5e7eb",
                      background: sel ? "#ecfdf5" : "white",
                      cursor: "pointer",
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
              This affects the <b>ON</b> color/glow and will be saved into the widget.
            </div>
          </div>

          {/* STYLE PICKER */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 10 }}>
              Choose Alarm Style
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {styles.map((s) => (
                <StyleCard key={s.id} s={s} />
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Pick <b>one</b> professional style. The alarm will show ON/OFF automatically based on
              your tag.
            </div>
          </div>

          {/* TAG BINDING */}
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 1000, marginBottom: 12 }}>
              Tag that drives alarm (ON / OFF)
            </div>

            {devicesErr && (
              <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>{devicesErr}</div>
            )}

            {/* Search Device */}
            <div style={{ marginBottom: 10 }}>
              <Label>Search Device</Label>
              <input
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Type device id or model..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                Showing <b>{filteredDevices.length}</b> device(s)
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {/* Device */}
              <div style={{ flex: 1 }}>
                <Label>Device</Label>
                <select
                  value={deviceId ? `${deviceModel}::${deviceId}` : ""}
                  onChange={(e) => {
                    const v = String(e.target.value || "");
                    if (!v || !v.includes("::")) {
                      setDeviceModel("zhc1921");
                      setDeviceId("");
                      setField("");
                      return;
                    }
                    const [m, id] = v.split("::");
                    setDeviceModel(MODEL_META[m] ? m : "zhc1921");
                    setDeviceId(String(id || ""));
                    setField("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                  }}
                >
                  <option value="">— Select device —</option>
                  {filteredDevices.map((d) => (
                    <option key={`${d.model}::${d.id}`} value={`${d.model}::${d.id}`}>
                      {d.id /* ✅ ID ONLY */}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag */}
              <div style={{ flex: 1 }}>
                <Label>Select Tag</Label>
                <select
                  value={field}
                  onChange={(e) => setField(String(e.target.value || ""))}
                  disabled={!deviceId}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    background: "white",
                    opacity: deviceId ? 1 : 0.6,
                    cursor: deviceId ? "pointer" : "not-allowed",
                  }}
                >
                  <option value="">— Select DI/DO —</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STATUS BAR */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Status</div>
                <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                  {deviceId && effectiveField ? (
                    <>
                      <span style={{ fontWeight: 900, color: "#0f172a" }}>{statusText}</span>
                      <span style={{ marginLeft: 10, color: "#64748b" }}>
                        Bound: <b>{deviceId}</b> / <b>{effectiveField}</b>
                      </span>
                    </>
                  ) : (
                    statusText
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Value</div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 18,
                    fontWeight: 1000,
                    color: isOnline ? "#0f172a" : "#94a3b8",
                    fontFamily: "monospace",
                    minWidth: 22,
                  }}
                >
                  {valueText}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
              Tip: ON means <b>truthy</b> (or numeric <b>&gt; 0</b>). OFF means false / 0 / empty.
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
            flex: "0 0 auto",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              background: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={apply}
            style={{
              padding: "9px 14px",
              borderRadius: 10,
              border: "1px solid #16a34a",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 14,
            }}
            type="button"
            title="Apply"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
