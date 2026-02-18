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

/**
 * ✅ FIX: match DraggableSiloTank readAiField behavior
 * supports:
 *  - ai1 / AI1
 *  - a1 / A1
 *  - analog1 / ANALOG1
 *  - ai_1 / AI_1
 *  - ai-1 / AI-1
 * also tolerates bindField like "AI-1" (from some UIs)
 */
function readAiField(row, bindField) {
  if (!row || !bindField) return undefined;

  const raw = String(bindField || "").trim();
  if (!raw) return undefined;

  // normalize: accept ai1, ai-1, ai_1, AI-1, etc
  const f = raw.toLowerCase();

  const directCandidates = [
    raw,
    f,
    raw.toUpperCase(),
  ];

  // If bindField already exists as a key, return it fast
  for (const k of directCandidates) {
    if (row[k] !== undefined) return row[k];
  }

  // detect AI index (1..8) from many formats
  // ai1, ai-1, ai_1, AI1, AI-1, etc
  const m = f.match(/^ai[-_]?(\d+)$/i);
  const n = m ? m[1] : null;

  // build same candidates used by DraggableSiloTank
  const candidates = [];

  if (n) {
    const baseForms = [
      `ai${n}`,
      `AI${n}`,
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
    ];

    const extra = [
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
    ];

    candidates.push(...baseForms, ...extra);
  } else {
    // if it wasn't aiN format, still try common transforms
    candidates.push(
      f,
      f.toUpperCase(),
      f.replace("ai", "a"),
      f.replace("ai", "A"),
      f.replace("ai", "analog"),
      f.replace("ai", "ANALOG")
    );
  }

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  return undefined;
}

function normalizeRow(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;

  if (typeof data === "object") {
    // common wrappers
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

        // online heuristic (keep yours, plus a safe fallback)
        const status = String(row.status || row.deviceStatus || row.state || "").toLowerCase();
        const online =
          status === "online" ||
          status === "connected" ||
          status === "active" ||
          row.online === true ||
          row.is_online === true ||
          // fallback: if we got a row with telemetry fields, treat as online
          row.last_seen !== undefined ||
          row.lastSeen !== undefined;

        setDeviceIsOnline(!!online);

        const v = readAiField(row, args.field);

        if (v === undefined || v === null || v === "") {
          setLiveValue(null);
        } else {
          const n = Number(v);
          setLiveValue(Number.isFinite(n) ? n : v);
        }
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setDeviceIsOnline(false);
        setLiveValue(null);
      }
    }

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
