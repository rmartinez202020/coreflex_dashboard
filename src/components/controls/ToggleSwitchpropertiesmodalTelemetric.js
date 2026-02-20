// src/components/controls/ToggleSwitchpropertiesmodalTelemetric.js
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

// =========================
// ✅ AUTH HEADERS
// =========================
function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// =========================
// ✅ Convert anything to 0/1
// =========================
export function to01(v) {
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

// =========================
// ✅ Read DO value from backend device row
// supports do/out variants and clamps to do1..do4
// =========================
export function readDoFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field).toLowerCase().trim();
  if (!/^do[1-4]$/.test(f)) return undefined;

  if (row[f] !== undefined) return row[f];

  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  // do1..do4 -> out1..out4
  const n = f.replace("do", "");
  const alt = `out${n}`;
  if (row[alt] !== undefined) return row[alt];
  const altUp = `OUT${n}`;
  if (row[altUp] !== undefined) return row[altUp];

  return undefined;
}

// =========================
// ✅ Normalize status
// =========================
export function readStatusFromRow(row) {
  return String(row?.status ?? row?.Status ?? "").trim().toLowerCase(); // online|offline|""
}

// =========================
// ✅ Telemetry polling for ToggleSwitchPropertiesModal (EDIT ONLY)
// Pulls row from /zhc1921/my-devices and returns device status and row
// =========================
export default function ToggleSwitchpropertiesmodalTelemetric({
  open,
  isLaunched,
  deviceId,
  pollMs = 3000,
} = {}) {
  const [telemetryRow, setTelemetryRow] = React.useState(null);

  const loadingRef = React.useRef(false);

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();

    if (!open || isLaunched) return;

    if (!id) {
      setTelemetryRow(null);
      return;
    }

    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        setTelemetryRow(null);
        return;
      }

      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!res.ok) {
        setTelemetryRow(null);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const row =
        list.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === id) ||
        null;

      setTelemetryRow(row);
    } catch {
      setTelemetryRow(null);
    } finally {
      loadingRef.current = false;
    }
  }, [open, isLaunched, deviceId]);

  React.useEffect(() => {
    if (!open || isLaunched) return;

    fetchTelemetryRow();

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, Math.max(800, Number(pollMs) || 3000));

    return () => clearInterval(t);
  }, [open, isLaunched, pollMs, fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    if (!deviceId) return "";
    return readStatusFromRow(telemetryRow) || "";
  }, [telemetryRow, deviceId]);

  return {
    telemetryRow,
    backendDeviceStatus, // "online" | "offline" | ""
    refetchTelemetryRow: fetchTelemetryRow,
  };
}