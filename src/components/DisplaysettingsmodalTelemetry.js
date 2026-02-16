// src/components/DisplaysettingsmodalTelemetry.js
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

/* ===========================================
   MODEL META (LOCAL TO THIS TELEMETRY FILE)
=========================================== */

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

// ✅ Fixed polling interval (2 seconds)
const POLL_MS = 2000;

/* ===========================================
   AUTH + FETCH HELPERS
=========================================== */

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

/* ===========================================
   DEVICE LOADER (SAFE ENDPOINTS ONLY)
=========================================== */

function normalizeDeviceList(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];

  return arr
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
        _raw: r,
      };
    })
    .filter(Boolean);
}

// ✅ only endpoints that should be allowed for normal users (no /devices)
async function loadDevicesForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const candidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"];

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });
      const list = normalizeDeviceList(data);
      if (list.length) return list;
    } catch {
      // try next
    }
  }

  return [];
}

// ✅ Prefer list-scan for live value to avoid 404/405 noisy endpoints
async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const listCandidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"];

  for (const p of listCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeDeviceList(data);
      const hit = arr.find((d) => String(d.deviceId) === String(deviceId));
      if (hit?._raw) return hit._raw;
    } catch {
      // continue
    }
  }

  return null;
}

function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

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

  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];

  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

/* ===========================================
   HOOK: DEVICES LIST
=========================================== */

export function useDisplaySettingDevices({
  open,
  bindModel,
  bindDeviceId,
  setBindDeviceId,
}) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      try {
        const list = await loadDevicesForModel(bindModel, { signal: ctrl.signal });
        if (cancelled) return;

        setDevices(list);

        // keep selection if still exists
        if (
          bindDeviceId &&
          !list.find((d) => String(d.deviceId) === String(bindDeviceId))
        ) {
          setBindDeviceId?.("");
        }
      } catch {
        if (cancelled) return;
        setDevices([]);
      }
    };

    load();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [open, bindModel]); // keep tight dependencies

  const selectedDevice = useMemo(() => {
    return devices.find((d) => String(d.deviceId) === String(bindDeviceId)) || null;
  }, [devices, bindDeviceId]);

  return { devices, selectedDevice };
}

/* ===========================================
   HOOK: LIVE VALUE POLL (FIXED 2s)
=========================================== */

export function useDisplaySettingLiveValue({ open, bindModel, bindDeviceId, bindField }) {
  const [liveValue, setLiveValue] = useState(null);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (!bindModel || !bindDeviceId || !bindField) {
      setLiveValue(null);
      setPollError("");
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setPollError("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        const value = row ? readAiField(row, bindField) : null;

        const num =
          value === null || value === undefined || value === ""
            ? null
            : typeof value === "number"
            ? value
            : Number(value);

        const safeLive = Number.isFinite(num) ? num : null;

        if (cancelled) return;
        setLiveValue(safeLive);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setPollError("Could not read live value (check API endpoint / fields).");
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [open, bindModel, bindDeviceId, bindField]);

  return { liveValue, pollError, pollMs: POLL_MS };
}
