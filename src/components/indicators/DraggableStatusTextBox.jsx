import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

/**
 * DraggableStatusTextBox
 * ✅ Dual mode:
 * 1) Palette mode (Sidebar)
 * 2) Canvas mode (Dashboard)
 *
 * ✅ PC-189 OFFLINE FIX:
 * - Shows Offline when device is offline
 * - Works in edit / launch / public link / play
 * - If widget is bound and telemetry row is missing, it treats that as Offline
 * - Keeps OFF/ON behavior only when device is online
 */

// ✅ Model meta (must match backend routers)
const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

// ✅ Read tag value from backend row (same mapping used elsewhere)
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  // direct
  if (row[field] !== undefined) return row[field];

  // upper-case key
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

// ✅ Normalize online/offline status
function normalizeDeviceStatus(row) {
  if (!row || typeof row !== "object") return "offline";

  const raw =
    row?.status ??
    row?.deviceStatus ??
    row?.telemetryStatus ??
    row?.onlineStatus ??
    row?.connectionStatus ??
    row?.state ??
    row?.online ??
    "";

  if (typeof raw === "boolean") return raw ? "online" : "offline";
  if (typeof raw === "number") return raw > 0 ? "online" : "offline";

  const s = String(raw || "").trim().toLowerCase();

  if (
    s === "online" ||
    s === "true" ||
    s === "1" ||
    s === "up" ||
    s === "running" ||
    s === "connected"
  ) {
    return "online";
  }

  if (
    s === "offline" ||
    s === "false" ||
    s === "0" ||
    s === "down" ||
    s === "disconnected" ||
    s === "not_running" ||
    s === "not running"
  ) {
    return "offline";
  }

  return "offline";
}

export default function DraggableStatusTextBox({
  // Canvas mode
  tank,

  // ✅ mode from dashboard (edit/play/launch/launched)
  dashboardMode = "edit",

  // Palette mode
  label = "Status Text Box",
  onDragStart,
  onClick,
}) {
  const payload = {
    shape: "statusTextBox",
    w: 220,
    h: 60,
    text: "STATUS",
    value: "",
    bg: "#ffffff",
    border: "#d1d5db",
  };

  // =========================
  // ✅ CANVAS MODE
  // =========================
  if (tank) {
    const w = tank.w ?? tank.width ?? payload.w;
    const h = tank.h ?? tank.height ?? payload.h;

    // ✅ Runtime modes
    const isRuntime =
      dashboardMode === "play" ||
      dashboardMode === "launch" ||
      dashboardMode === "launched";

    // OFF/ON/OFFLINE text logic
    const offText = String(tank.properties?.offText ?? "");
    const onText = String(tank.properties?.onText ?? "");
    const offlineText = String(tank.properties?.offlineText ?? "Offline");

    const legacyText =
      tank.text ??
      tank.properties?.text ??
      tank.properties?.label ??
      payload.text;

    // Tag binding
    const tagModelRaw =
      String(tank.properties?.tag?.model || "zhc1921").trim() || "zhc1921";
    const tagModel = MODEL_META[tagModelRaw] ? tagModelRaw : "zhc1921";
    const deviceId = String(tank.properties?.tag?.deviceId || "").trim();
    const field = String(tank.properties?.tag?.field || "").trim();
    const hasBinding = !!deviceId && !!field;

    // Styles from settings modal
    const bg = tank.properties?.bgColor ?? payload.bg;
    const border = tank.properties?.borderColor ?? payload.border;
    const borderWidth = tank.properties?.borderWidth ?? 1;
    const fontSize = tank.properties?.fontSize ?? 18;
    const fontWeight = tank.properties?.fontWeight ?? 800;
    const textColor = tank.properties?.textColor ?? "#0f172a";
    const paddingY = tank.properties?.paddingY ?? 10;
    const paddingX = tank.properties?.paddingX ?? 14;
    const textAlign = tank.properties?.textAlign ?? "center";
    const textTransform = tank.properties?.textTransform ?? "none";

    // ✅ Telemetry state
    // IMPORTANT:
    // - runtime: poll every 3s
    // - edit: do one fetch too, so Offline can appear there as well
    const [telemetryRow, setTelemetryRow] = React.useState(null);
    const telemetryRef = React.useRef({ loading: false });

    const fetchTelemetryRow = React.useCallback(async () => {
      if (!deviceId) {
        setTelemetryRow(null);
        return;
      }

      const base = MODEL_META[tagModel]?.base || "zhc1921";
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
          list.find(
            (r) => String(r.deviceId ?? r.device_id ?? "").trim() === deviceId
          ) || null;

        setTelemetryRow(row);
      } catch {
        setTelemetryRow(null);
      } finally {
        telemetryRef.current.loading = false;
      }
    }, [deviceId, tagModel]);

    React.useEffect(() => {
      if (!hasBinding) {
        setTelemetryRow(null);
        return;
      }

      // ✅ always do at least one read so EDIT can show Offline too
      fetchTelemetryRow();

      // ✅ poll only in runtime
      if (!isRuntime) return;

      const t = setInterval(() => {
        if (document.hidden) return;
        fetchTelemetryRow();
      }, 3000);

      return () => clearInterval(t);
    }, [fetchTelemetryRow, isRuntime, hasBinding]);

    const normalizedStatus = React.useMemo(() => {
      return hasBinding ? normalizeDeviceStatus(telemetryRow) : "unbound";
    }, [telemetryRow, hasBinding]);

    const deviceIsOnline = hasBinding && normalizedStatus === "online";
    const deviceIsOffline = hasBinding && normalizedStatus === "offline";

    const backendTagValue = React.useMemo(() => {
      if (!telemetryRow || !field) return undefined;
      return readTagFromRow(telemetryRow, field);
    }, [telemetryRow, field]);

    const tag01 = React.useMemo(() => to01(backendTagValue), [backendTagValue]);

    // ✅ Decide which text to show
    const displayText = React.useMemo(() => {
      const safeOff = (offText || legacyText || "OFF").toString();
      const safeOn = (onText || legacyText || "ON").toString();
      const safeOffline = (offlineText || "Offline").toString();

      // unbound widget
      if (!hasBinding) return safeOff;

      // bound but offline / missing row
      if (deviceIsOffline) return safeOffline;

      // bound and online but no value yet
      if (backendTagValue === undefined || backendTagValue === null) {
        return safeOff;
      }

      if (tag01 === 1) return safeOn;
      return safeOff;
    }, [
      offText,
      onText,
      offlineText,
      legacyText,
      hasBinding,
      deviceIsOffline,
      backendTagValue,
      tag01,
    ]);

    const resolvedTextColor = deviceIsOffline ? "#dc2626" : textColor;

    const titleText = React.useMemo(() => {
      if (!deviceId || !field) return displayText;

      const base = MODEL_META[tagModel]?.base || "zhc1921";
      const v = backendTagValue === undefined ? "—" : String(backendTagValue);

      return `${displayText} • ${base}/${deviceId}/${field} • status=${
        normalizedStatus || "—"
      } • v=${v} • mode=${dashboardMode}`;
    }, [
      displayText,
      deviceId,
      field,
      tagModel,
      backendTagValue,
      normalizedStatus,
      dashboardMode,
    ]);

    return (
      <div
        style={{
          width: w,
          height: h,
          background: bg,
          border: `${borderWidth}px solid ${border}`,
          borderRadius: 10,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${paddingY}px ${paddingX}px`,
          userSelect: "none",
        }}
        title={titleText}
      >
        <div
          style={{
            fontSize,
            fontWeight,
            color: resolvedTextColor,
            textAlign,
            textTransform,
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {displayText}
        </div>
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
        e.dataTransfer.setData("shape", "statusTextBox");
        e.dataTransfer.setData("text/plain", "statusTextBox");
        onDragStart?.(payload, e);
      }}
      onClick={() => onClick?.(payload)}
      title="Drag Status Text Box"
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
          width: 16,
          height: 16,
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.25)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          flex: "0 0 16px",
        }}
      >
        📝
      </span>
      <span>{label}</span>
    </div>
  );
}