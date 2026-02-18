// src/components/VerticalTankSettingsModalTelemetric.js
import React from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// -------------------------
// ✅ auth + no-cache fetch helpers (same idea as DisplayBox)
// -------------------------
function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

// -------------------------
// ✅ CounterModal-style telemetry helpers
// -------------------------
function modelMyDevicesEndpoint(modelKey) {
  const base = MODEL_META[modelKey]?.base || modelKey;
  return base === "zhc1661" ? "/zhc1661/my-devices" : "/zhc1921/my-devices";
}

// ✅ Same as Silo: handles ai1 / AI1 / ai_1 / AI_1 / ai-1 / AI-1
export function readAiFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field || "").trim().toLowerCase(); // ai1..ai8
  if (!/^ai[1-8]$/.test(f)) return undefined;

  const n = f.replace("ai", ""); // "1"
  const candidates = [f, f.toUpperCase(), `ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];

  for (const k of candidates) {
    const v = row?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }

  return undefined;
}

/**
 * Hook that polls the user's "my-devices" endpoint to fetch a telemetry row for a selected device,
 * then derives a numeric liveValue from a selected AI field.
 *
 * Mirrors SiloPropertiesModalTelemetric exactly.
 */
export default function useVerticalTankSettingsModalTelemetric({
  open,
  bindModel,
  bindDeviceId,
  bindField,
  pollMs = 3000,
} = {}) {
  const [telemetryRow, setTelemetryRow] = React.useState(null);
  const [liveValue, setLiveValue] = React.useState(null);

  const telemetryRef = React.useRef({ loading: false });

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(bindDeviceId || "").trim();
    if (!id) {
      setTelemetryRow(null);
      return;
    }
    if (telemetryRef.current.loading) return;

    telemetryRef.current.loading = true;
    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const endpoint = modelMyDevicesEndpoint(bindModel);

      const res = await fetch(`${API_URL}${withNoCache(endpoint)}`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
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
  }, [bindDeviceId, bindModel]);

  // ✅ Poll telemetry like Silo (preview only)
  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, pollMs);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow, pollMs]);

  // ✅ compute live value from telemetryRow + bindField
  React.useEffect(() => {
    if (!telemetryRow || !bindField) {
      setLiveValue(null);
      return;
    }
    const v = readAiFromRow(telemetryRow, bindField);
    const num = Number(v);
    setLiveValue(Number.isFinite(num) ? num : null);
  }, [telemetryRow, bindField]);

  // ✅ prefer backend status from telemetryRow
  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!bindDeviceId) return "";
    return s || "";
  }, [telemetryRow, bindDeviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  return {
    telemetryRow,
    liveValue,
    backendDeviceStatus,
    deviceIsOnline,
    refetch: fetchTelemetryRow,
    setTelemetryRow,
    setLiveValue,
  };
}
