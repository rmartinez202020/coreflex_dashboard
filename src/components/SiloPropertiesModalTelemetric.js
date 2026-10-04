// src/components/SiloPropertiesModalTelemetric.js
import React from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
  weight_scale: { label: "Scale / MOXA", base: "weight-scale-systems" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

function modelMyDevicesEndpoint(modelKey) {
  const base = MODEL_META[modelKey]?.base || modelKey;
  return base === "zhc1661" ? "/zhc1661/my-devices" : "/zhc1921/my-devices";
}

function parseScaleDeviceId(deviceId) {
  const raw = String(deviceId || "").trim();
  const splitAt = raw.lastIndexOf(":");
  if (splitAt <= 0) return null;

  const deviceIp = raw.slice(0, splitAt).trim();
  const devicePort = Number(raw.slice(splitAt + 1));

  if (!deviceIp || !Number.isInteger(devicePort) || devicePort < 1 || devicePort > 65535) {
    return null;
  }

  return { deviceIp, devicePort };
}

export function readAiFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field || "").trim().toLowerCase();
  if (!/^ai[1-8]$/.test(f)) return undefined;

  const n = f.replace("ai", "");
  const candidates = [f, f.toUpperCase(), `ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];

  for (const k of candidates) {
    const v = row?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }

  return undefined;
}

export function readScaleFromRow(row, field) {
  if (!row || !field) return undefined;

  const allowed = new Set(["weight", "weight_2", "weight_3", "weight_4", "weight_5"]);
  const f = String(field || "").trim().toLowerCase();
  if (!allowed.has(f)) return undefined;

  const v = row?.[f];
  return v !== undefined && v !== null && v !== "" ? v : undefined;
}

export default function useSiloPropertiesModalTelemetric({
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

      if (bindModel === "weight_scale") {
        const scale = parseScaleDeviceId(id);
        if (!scale) {
          setTelemetryRow(null);
          return;
        }

        const endpoint =
          `/weight-scale-systems/latest?device_ip=${encodeURIComponent(scale.deviceIp)}` +
          `&device_port=${encodeURIComponent(scale.devicePort)}`;

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
        setTelemetryRow(data?.reading || null);
        return;
      }

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

  React.useEffect(() => {
    if (!open) return;

    fetchTelemetryRow();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, pollMs);

    return () => clearInterval(t);
  }, [open, fetchTelemetryRow, pollMs]);

  React.useEffect(() => {
    if (!telemetryRow || !bindField) {
      setLiveValue(null);
      return;
    }

    const v =
      bindModel === "weight_scale"
        ? readScaleFromRow(telemetryRow, bindField)
        : readAiFromRow(telemetryRow, bindField);

    const num = Number(v);
    setLiveValue(Number.isFinite(num) ? num : null);
  }, [telemetryRow, bindField, bindModel]);

  const backendDeviceStatus = React.useMemo(() => {
    if (!bindDeviceId || !telemetryRow) return "";
    if (bindModel === "weight_scale") return "online";
    return String(telemetryRow?.status || "").trim().toLowerCase();
  }, [telemetryRow, bindDeviceId, bindModel]);

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