import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Same mapping used in the modal(s)
const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" },
};

// ✅ Convert anything to 0/1 (same as modal)
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

// ✅ Read tag from backend row (same logic as modal)
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

/**
 * DraggableStateImage
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar)
 * 2) Canvas mode (Dashboard)
 *
 * ✅ State behavior:
 * - Default is OFF (shows OFF image)
 * - When tag becomes ON, shows ON image
 *
 * ✅ IMPORTANT:
 * - DashboardCanvas handles double-click to open settings modal.
 */
export default function DraggableStateImage({
  // Canvas mode
  tank,
  sensorsData, // optional fallback

  // Palette mode
  label = "State Image",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "stateImage",
    w: 160,
    h: 160,

    // default state
    isOn: false,

    // images saved in properties
    offImage: "",
    onImage: "",
    imageFit: "contain", // contain|cover

    // ✅ tag binding now includes model too (same system as others)
    tag: { model: "zhc1921", deviceId: "", field: "" },
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ images (prefer properties)
    const offImage = tank.properties?.offImage ?? tank.offImage ?? payload.offImage;
    const onImage = tank.properties?.onImage ?? tank.onImage ?? payload.onImage;

    const imageFit = tank.properties?.imageFit ?? tank.imageFit ?? payload.imageFit;

    // ✅ tag binding (model/device/field)
    const tag = tank?.properties?.tag || tank?.tag || {};
    const tagModel = String(tag?.model || "").trim();
    const tagDeviceId = String(tag?.deviceId || "").trim();
    const tagField = String(tag?.field || "").trim();

    // =========================
    // ✅ BACKEND POLL (SAME PATTERN AS BLINKING ALARM)
    // =========================
    const [telemetryRow, setTelemetryRow] = React.useState(null);
    const telemetryRef = React.useRef({ loading: false });

    const fetchTelemetryRow = React.useCallback(async () => {
      const modelKey = String(tagModel || "").trim();
      const id = String(tagDeviceId || "").trim();
      const base = MODEL_META[modelKey]?.base;

      if (!modelKey || !id || !base) {
        setTelemetryRow(null);
        return;
      }
      if (telemetryRef.current.loading) return;

      telemetryRef.current.loading = true;
      try {
        const token = String(getToken() || "").trim();
        if (!token) {
          setTelemetryRow(null);
          return;
        }

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
    }, [tagModel, tagDeviceId]);

    React.useEffect(() => {
      fetchTelemetryRow();

      const t = setInterval(() => {
        if (document.hidden) return;
        fetchTelemetryRow();
      }, 3000);

      return () => clearInterval(t);
    }, [fetchTelemetryRow]);

    // ✅ read from backend row (reliable)
    const backendStatus = String(telemetryRow?.status || "").trim().toLowerCase();
    const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

    const rawValueFromBackend =
      telemetryRow && tagField ? readTagFromRow(telemetryRow, tagField) : undefined;

    // ✅ optional fallback: sensorsData
    const rawValue =
      rawValueFromBackend !== undefined
        ? rawValueFromBackend
        : sensorsData?.values?.[tagDeviceId]?.[tagField];

    const v01 = deviceIsOnline ? to01(rawValue) : null;

    // ✅ Determine ON/OFF from live tag (same rules as other widgets)
    const tagReady = !!(tagModel && tagDeviceId && tagField);
    const isOn = !!(tagReady && deviceIsOnline && v01 === 1);

    // ✅ choose image (OFF is default)
    const imgSrc = isOn ? onImage : offImage;

    const title = `StateImage | ${isOn ? "ON" : "OFF"} | ${tagModel}:${tagDeviceId}/${tagField} | status=${
      backendStatus || "—"
    } | v=${String(rawValue)}`;

    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 12,
          border: "1px dashed rgba(148,163,184,0.6)",
          background: "rgba(2,6,23,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          overflow: "hidden",
          pointerEvents: "none", // ✅ let DraggableDroppedTank handle clicks/doubleclick
        }}
        title={title}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={isOn ? "ON" : "OFF"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageFit,
              display: "block",
            }}
            draggable={false}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div
              style={{
                width: Math.max(20, Math.round(Math.min(w, h) * 0.12)),
                height: Math.max(20, Math.round(Math.min(w, h) * 0.12)),
                borderRadius: 999,
                background: "rgba(148,163,184,0.35)",
                margin: "0 auto 10px auto",
                boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
              }}
            />
            <div style={{ fontWeight: 1000, letterSpacing: 1 }}>STATE IMAGE</div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>{isOn ? "ON" : "OFF"}</div>
          </div>
        )}
      </div>
    );
  }

  // =========================
  // ✅ PALETTE MODE
  // =========================
  return (
    <div
      className="cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("shape", "stateImage");
        e.dataTransfer.setData("text/plain", "stateImage");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag State Image"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        userSelect: "none",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: "rgba(148,163,184,0.35)",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 0 10px rgba(148,163,184,0.25)",
          flex: "0 0 14px",
        }}
      />
      <span>{label}</span>
    </div>
  );
}
