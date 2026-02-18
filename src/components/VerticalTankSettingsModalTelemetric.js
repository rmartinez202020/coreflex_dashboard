// src/components/VerticalTankSettingsModalTelemetric.js
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

function readAiField(row, field) {
  if (!row || !field) return undefined;

  const k = String(field);
  if (row[k] !== undefined) return row[k];

  const low = k.toLowerCase();
  if (row[low] !== undefined) return row[low];

  const up = k.toUpperCase();
  if (row[up] !== undefined) return row[up];

  // try ai1..ai8 mapping variants
  const m = low.match(/^ai(\d)$/);
  if (m) {
    const n = m[1];
    const candidates = [
      `ai${n}`,
      `AI${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ain${n}`,
      `AIN${n}`,
      `a${n}`,
      `A${n}`,
    ];
    for (const c of candidates) {
      if (row[c] !== undefined) return row[c];
    }
  }

  return undefined;
}

function normalizeRow(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === "object") {
    if (data.row && typeof data.row === "object") return data.row;
    if (data.data && typeof data.data === "object") return data.data;
    if (data.latest && typeof data.latest === "object") return data.latest;
    if (data.telemetry && typeof data.telemetry === "object") return data.telemetry;
    return data;
  }
  return null;
}

// Best-effort: try multiple live endpoints to avoid hard dependency on a single route.
async function loadLiveRowForDevice({ base, deviceId, signal }) {
  const id = encodeURIComponent(String(deviceId || "").trim());
  if (!id) return null;

  const candidates = [
    `/${base}/telemetry/live/${id}`,
    `/${base}/telemetry/latest/${id}`,
    `/${base}/telemetry/latest?device_id=${id}`,
    `/${base}/telemetry?device_id=${id}`,
    `/${base}/live/${id}`,
    `/${base}/latest/${id}`,
    `/${base}/latest?device_id=${id}`,
  ];

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });
      const row = normalizeRow(data);
      if (row) return row;
    } catch {
      // continue
    }
  }

  return null;
}

export default function useVerticalTankSettingsModalTelemetric({
  open,
  bindModel,
  bindDeviceId,
  bindField,
  pollMs = 3000,
} = {}) {
  const [liveValue, setLiveValue] = useState(null);
  const [deviceIsOnline, setDeviceIsOnline] = useState(false);

  const args = useMemo(() => {
    return {
      open: !!open,
      base: MODEL_META[bindModel]?.base || bindModel || "zhc1921",
      deviceId: String(bindDeviceId || "").trim(),
      field: String(bindField || "").trim(),
      pollMs: Math.max(500, Number(pollMs) || 3000),
    };
  }, [open, bindModel, bindDeviceId, bindField, pollMs]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!args.open) return;

    // if no device chosen, clear state like Silo does (no ONLINE/OFFLINE)
    if (!args.deviceId || !args.field) {
      setLiveValue(null);
      setDeviceIsOnline(false);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    async function tick() {
      try {
        const row = await loadLiveRowForDevice({
          base: args.base,
          deviceId: args.deviceId,
          signal: ctrl.signal,
        });

        if (cancelled) return;

        if (!row) {
          setDeviceIsOnline(false);
          setLiveValue(null);
          return;
        }

        // online heuristic
        const status = String(row.status || row.deviceStatus || row.state || "").toLowerCase();
        const online =
          status === "online" ||
          status === "connected" ||
          status === "active" ||
          row.online === true ||
          row.is_online === true;

        setDeviceIsOnline(!!online);

        const v = readAiField(row, args.field);
        if (v === undefined || v === null || v === "") {
          setLiveValue(null);
        } else {
          const n = Number(v);
          setLiveValue(Number.isFinite(n) ? n : v);
        }
      } catch {
        if (cancelled) return;
        setDeviceIsOnline(false);
        setLiveValue(null);
      }
    }

    // immediate first tick
    tick();

    timerRef.current = window.setInterval(tick, args.pollMs);

    return () => {
      cancelled = true;
      ctrl.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [args.open, args.base, args.deviceId, args.field, args.pollMs]);

  return { liveValue, deviceIsOnline };
}
