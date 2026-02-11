import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Model meta (matches Indicator Light approach)
const MODEL_META = {
  zhc1921: { label: "ZHC1921 (CF-2000)", base: "zhc1921" },
  zhc1661: { label: "ZHC1661 (CF-1600)", base: "zhc1661" },
  tp4000: { label: "TP-4000", base: "tp4000" },
};

// ✅ DI/DO options (same as Indicator Light)
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

// ✅ Convert anything to 0/1 (same logic)
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

// ✅ Read tag value from backend row (same as Indicator Light)
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

export default function StatusTextSettingsModal({
  open,
  tank,
  onClose,
  onSave,
  sensorsData, // kept for compatibility, but we now prefer backend polling (like indicator)
}) {
  // ✅ do NOT early return before hooks

  const p = tank?.properties || {};

  // ✅ Responsive modal size (wider + clamped to viewport)
  const MODAL_W = Math.min(1080, window.innerWidth - 80);
  const MODAL_H = Math.min(680, window.innerHeight - 120);

  // Tag binding (backward compatible)
  const initialDeviceModel = String(p?.tag?.model || "zhc1921").trim() || "zhc1921";
  const initialDeviceId = String(p?.tag?.deviceId ?? "");
  const initialField = String(p?.tag?.field ?? "");

  // OFF/ON texts
  const legacyText = p?.text ?? "STATUS";
  const initialOffText = p?.offText ?? legacyText ?? "OFF";
  const initialOnText = p?.onText ?? legacyText ?? "ON";

  // Shared style
  const initialFontSize = p?.fontSize ?? 18;
  const initialFontWeight = p?.fontWeight ?? 800;
  const initialTextColor = p?.textColor ?? "#0f172a";
  const initialBg = p?.bgColor ?? "#ffffff";
  const initialBorderColor = p?.borderColor ?? "#cbd5e1";
  const initialBorderWidth = p?.borderWidth ?? 1;
  const initialPaddingY = p?.paddingY ?? 10;
  const initialPaddingX = p?.paddingX ?? 14;
  const initialTextAlign = p?.textAlign ?? "center";
  const initialTransform = p?.textTransform ?? "none";

  const [deviceModel, setDeviceModel] = React.useState(
    MODEL_META[initialDeviceModel] ? initialDeviceModel : "zhc1921"
  );
  const [deviceId, setDeviceId] = React.useState(initialDeviceId);
  const [field, setField] = React.useState(initialField);

  // ✅ Device search (same idea as Indicator Light)
  const [deviceSearch, setDeviceSearch] = React.useState("");

  // ✅ Tag search (same idea; filters TAG_OPTIONS)
  const [tagSearch, setTagSearch] = React.useState(initialField || "");

  const [offText, setOffText] = React.useState(initialOffText);
  const [onText, setOnText] = React.useState(initialOnText);

  const [fontSize, setFontSize] = React.useState(initialFontSize);
  const [fontWeight, setFontWeight] = React.useState(initialFontWeight);
  const [textColor, setTextColor] = React.useState(initialTextColor);
  const [bgColor, setBgColor] = React.useState(initialBg);
  const [borderColor, setBorderColor] = React.useState(initialBorderColor);
  const [borderWidth, setBorderWidth] = React.useState(initialBorderWidth);
  const [paddingY, setPaddingY] = React.useState(initialPaddingY);
  const [paddingX, setPaddingX] = React.useState(initialPaddingX);
  const [textAlign, setTextAlign] = React.useState(initialTextAlign);
  const [textTransform, setTextTransform] = React.useState(initialTransform);

  // =========================
  // REHYDRATE ON OPEN
  // =========================
  React.useEffect(() => {
    if (!open || !tank) return;

    const pp = tank?.properties || {};

    setOffText(String(pp?.offText ?? (pp?.text ?? "STATUS") ?? "OFF"));
    setOnText(String(pp?.onText ?? (pp?.text ?? "STATUS") ?? "ON"));

    setFontSize(pp?.fontSize ?? 18);
    setFontWeight(pp?.fontWeight ?? 800);
    setTextColor(pp?.textColor ?? "#0f172a");
    setBgColor(pp?.bgColor ?? "#ffffff");
    setBorderColor(pp?.borderColor ?? "#cbd5e1");
    setBorderWidth(pp?.borderWidth ?? 1);
    setPaddingY(pp?.paddingY ?? 10);
    setPaddingX(pp?.paddingX ?? 14);
    setTextAlign(pp?.textAlign ?? "center");
    setTextTransform(pp?.textTransform ?? "none");

    const m = String(pp?.tag?.model || "zhc1921").trim() || "zhc1921";
    setDeviceModel(MODEL_META[m] ? m : "zhc1921");
    setDeviceId(String(pp?.tag?.deviceId || ""));
    setField(String(pp?.tag?.field || ""));

    setDeviceSearch("");
    setTagSearch(String(pp?.tag?.field || ""));
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
      const mh = rect?.height ?? MODAL_H;

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
  // DEVICES (LIKE INDICATOR LIGHT)
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

  const selectedDevice = React.useMemo(() => {
    return (
      devices.find(
        (d) => String(d.id) === String(deviceId) && String(d.model) === String(deviceModel)
      ) || null
    );
  }, [devices, deviceId, deviceModel]);

  // =========================
  // TAGS (SEARCH LIKE INDICATOR LIGHT)
  // =========================
  const filteredTags = React.useMemo(() => {
    const q = String(tagSearch || "").trim().toLowerCase();
    if (!q) return TAG_OPTIONS;
    return TAG_OPTIONS.filter(
      (t) => t.key.toLowerCase().includes(q) || t.label.toLowerCase().includes(q)
    );
  }, [tagSearch]);

  // If user types exactly "DI-1" style, map it to key
  const normalizedTypedField = React.useMemo(() => {
    const s = String(tagSearch || "").trim().toLowerCase();
    if (!s) return "";
    const m = s.replace("-", "");
    const hit =
      TAG_OPTIONS.find((t) => t.key.toLowerCase() === m) ||
      TAG_OPTIONS.find((t) => t.label.toLowerCase().replace("-", "") === m);
    return hit ? hit.key : String(tagSearch || "").trim();
  }, [tagSearch]);

  // =========================
  // ✅ LIVE STATUS/VALUE (POLL TELEMETRY LIKE INDICATOR LIGHT)
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
      const row =
        list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) || null;

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

  const isOnline =
    deviceIsOnline && rawValue !== undefined && rawValue !== null && !!effectiveField;
  const as01 = React.useMemo(() => (isOnline ? to01(rawValue) : null), [isOnline, rawValue]);

  // =========================
  // APPLY SAVE
  // =========================
  const apply = () => {
    const safeOff = (offText ?? "").trim() || legacyText || "OFF";
    const safeOn = (onText ?? "").trim() || legacyText || "ON";

    onSave?.({
      id: tank.id,
      properties: {
        ...(tank.properties || {}),

        offText: safeOff,
        onText: safeOn,

        // legacy "text" default = OFF
        text: safeOff,

        fontSize: Number(fontSize) || 18,
        fontWeight: Number(fontWeight) || 800,
        textColor,
        bgColor,
        borderColor,
        borderWidth: Number(borderWidth) || 1,
        paddingY: Number(paddingY) || 10,
        paddingX: Number(paddingX) || 14,
        textAlign,
        textTransform,

        borderRadius: undefined,
        letterSpacing: undefined,

        // ✅ save model too (hidden from UI)
        tag: { model: String(deviceModel || "zhc1921"), deviceId, field: effectiveField },
      },
    });

    onClose?.();
  };

  // ✅ fixed safe radius for preview
  const basePreviewStyle = {
    width: "100%",
    background: bgColor,
    color: textColor,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: 10,
    padding: `${paddingY}px ${paddingX}px`,
    fontSize,
    fontWeight,
    textAlign,
    textTransform,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  };

  const Label = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{children}</div>
  );

  const Num = ({ value, onChange, min = 0, max = 200, step = 1 }) => (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        fontSize: 14,
      }}
    />
  );

  const MiniState = ({ label, dotColor, text, active }) => (
    <div
      style={{
        flex: 1,
        borderRadius: 12,
        padding: 10,
        background: active ? "#ecfdf5" : "#ffffff",
        border: active ? "2px solid #22c55e" : "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 900,
          fontSize: 12,
          marginBottom: 8,
          color: "#0f172a",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: dotColor,
            border: "1px solid #94a3b8",
          }}
        />
        {label}
      </div>
      <div style={basePreviewStyle}>{text}</div>
    </div>
  );

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
        {/* Header (draggable) */}
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
          <span>Status Text Box</span>
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
        <div style={{ padding: 18, fontSize: 14, overflow: "auto", flex: "1 1 auto" }}>
          {/* Preview */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
              background: "#f8fafc",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10 }}>Preview</div>

            <div style={{ display: "flex", gap: 10 }}>
              <MiniState label="OFF" dotColor="#94a3b8" text={offText || "OFF"} active={true} />
              <MiniState label="ON" dotColor="#22c55e" text={onText || "ON"} active={false} />
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Tip: <b>ON</b> means “truthy”. If your tag is numeric, any value <b>&gt; 0</b> will be
              read as ON.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* STYLE */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                State Text (OFF / ON)
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>OFF Text</Label>
                  <input
                    value={offText}
                    onChange={(e) => setOffText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <Label>ON Text</Label>
                  <input
                    value={onText}
                    onChange={(e) => setOnText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>Shared Style</div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Font Size</Label>
                  <Num value={fontSize} onChange={setFontSize} min={8} max={60} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Font Weight</Label>
                  <Num value={fontWeight} onChange={setFontWeight} min={100} max={900} step={100} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Text Color</Label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Background</Label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Border Color</Label>
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    style={{ width: "100%", height: 42, border: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Border Width</Label>
                  <Num value={borderWidth} onChange={setBorderWidth} min={0} max={12} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Padding Y</Label>
                  <Num value={paddingY} onChange={setPaddingY} min={0} max={60} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Padding X</Label>
                  <Num value={paddingX} onChange={setPaddingX} min={0} max={80} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Align</Label>
                  <select
                    value={textAlign}
                    onChange={(e) => setTextAlign(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <Label>Transform</Label>
                  <select
                    value={textTransform}
                    onChange={(e) => setTextTransform(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      background: "white",
                    }}
                  >
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TAG (updated) */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 12 }}>
                Tag that drives status (ON / OFF)
              </div>

              {devicesErr && (
                <div style={{ marginBottom: 10, color: "#dc2626", fontSize: 12 }}>{devicesErr}</div>
              )}

              {/* ✅ Search Device */}
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
                        setTagSearch("");
                        return;
                      }
                      const [m, id] = v.split("::");
                      setDeviceModel(MODEL_META[m] ? m : "zhc1921");
                      setDeviceId(String(id || ""));
                      setField("");
                      setTagSearch("");
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

                    {/* ✅ SHOW ONLY THE ID (no model text) */}
                    {filteredDevices.map((d) => (
                      <option key={`${d.model}::${d.id}`} value={`${d.model}::${d.id}`}>
                        {d.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <Label>Search Tag</Label>
                  <input
                    value={tagSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTagSearch(v);

                      const norm = String(v || "").trim();
                      if (!norm) {
                        setField("");
                        return;
                      }

                      const hit =
                        TAG_OPTIONS.find((t) => t.key.toLowerCase() === norm.toLowerCase()) ||
                        TAG_OPTIONS.find((t) => t.label.toLowerCase() === norm.toLowerCase()) ||
                        null;

                      if (hit) setField(hit.key);
                    }}
                    placeholder="ex: di1, do3..."
                    list="statusTextTagList"
                    disabled={!deviceId}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      opacity: deviceId ? 1 : 0.6,
                    }}
                  />
                  <datalist id="statusTextTagList">
                    {filteredTags.slice(0, 60).map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </datalist>

                  {/* ✅ Quick select dropdown */}
                  <select
                    value={field}
                    onChange={(e) => {
                      const v = String(e.target.value || "");
                      setField(v);
                      setTagSearch(v);
                    }}
                    disabled={!deviceId}
                    style={{
                      width: "100%",
                      marginTop: 8,
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
                    {filteredTags.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ STATUS / VALUE PANEL */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Status</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {!deviceId || !effectiveField
                      ? "Select a device and tag"
                      : isOnline
                      ? "Online"
                      : deviceId && deviceIsOnline
                      ? "No data for tag"
                      : "Offline"}
                  </div>

                  {/* ✅ Bound line: ONLY show ID + tag (no model) */}
                  {deviceId && effectiveField && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                      Bound: <b>{deviceId}</b> / <b>{effectiveField}</b>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Value</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 18,
                      fontWeight: 1000,
                      color: isOnline ? "#0f172a" : "#94a3b8",
                    }}
                  >
                    {isOnline ? String(as01 ?? 0) : "—"}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
                Offline means there is no current value for that tag. When Online, the value is shown
                as <b>0</b> or <b>1</b>.
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
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
