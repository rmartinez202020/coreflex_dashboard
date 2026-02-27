import { API_URL } from "../../../config/api";
import { getToken } from "../../../utils/authToken";

export const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" },
};

// ===============================
// ✅ DEBUG ENABLE (NO CONSOLE TYPING)
// Enable by ANY of these:
// 1) URL: ?gddebug=1   (recommended)
// 2) localStorage: coreflex:gd:debug = "1"
// 3) window.__CF_GD_DEBUG__ = true
// ===============================
function gdDebugEnabled() {
  try {
    if (typeof window !== "undefined") {
      const qs = window.location?.search || "";
      const hp = window.location?.hash || "";
      const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
      const v = String(params.get("gddebug") || "").trim();
      if (v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes") return true;
      if (hp && hp.includes("gddebug=1")) return true;
    }
  } catch {}

  try {
    if (localStorage.getItem("coreflex:gd:debug") === "1") return true;
  } catch {}

  if (typeof window !== "undefined" && window.__CF_GD_DEBUG__ === true) return true;

  return false;
}

function dbg(...args) {
  if (!gdDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.warn("[GD.loader]", ...args);
}

function dbgErr(...args) {
  if (!gdDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.error("[GD.loader]", ...args);
}

function safeKeys(obj) {
  try {
    return obj && typeof obj === "object" ? Object.keys(obj) : [];
  } catch {
    return [];
  }
}

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

export async function apiGet(path, { signal } = {}) {
  const url = `${API_URL}${withNoCache(path)}`;
  dbg("apiGet ->", { path, url });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    dbgErr("apiGet FAILED", { path, status: res.status });
    throw new Error(`GET ${path} failed (${res.status})`);
  }

  const json = await res.json();
  dbg("apiGet OK", { path, type: typeof json, keys: safeKeys(json).slice(0, 20) });
  return json;
}

export function readAiField(row, bindField) {
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

function normalizeArray(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

function readDeviceId(row) {
  return (
    row?.deviceId ??
    row?.device_id ??
    row?.id ??
    row?.imei ??
    row?.IMEI ??
    row?.DEVICE_ID ??
    ""
  );
}

function listCandidatesForBase(base) {
  if (base === "zhc1921") return ["/zhc1921/my-devices"];
  if (base === "zhc1661") return ["/zhc1661/my-devices"];
  if (base === "tp4000") return ["/tp4000/my-devices"];
  return [`/${base}/my-devices`];
}

/**
 * ✅ COMMON POLLER READER
 * telemetryMap shape: telemetryMap[modelKey][deviceId] = row
 */
export function getRowFromTelemetryMap(telemetryMap, modelKey, deviceId) {
  if (!telemetryMap || !modelKey || !deviceId) return null;

  const mk = String(modelKey).trim();
  const id = String(deviceId).trim();
  if (!mk || !id) return null;

  const direct = telemetryMap?.[mk]?.[id];
  if (direct) return direct;

  const base = MODEL_META?.[mk]?.base || mk;
  const byBase = telemetryMap?.[base]?.[id];
  if (byBase) return byBase;

  return null;
}

/**
 * ✅ loadLiveRowForDevice now supports:
 * loadLiveRowForDevice(modelKey, deviceId, { telemetryMap, signal })
 *
 * ✅ IMPORTANT FIX:
 * If telemetryMap is provided, we DO NOT fallback to API endpoints.
 * We only read from the common poller. No 404/403 spam.
 */
export async function loadLiveRowForDevice(modelKey, deviceId, { telemetryMap, signal } = {}) {
  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();

  const hasTelemetryMap = telemetryMap !== null && telemetryMap !== undefined;

  // 1) Try common poller
  const fromCommon = getRowFromTelemetryMap(telemetryMap, mk, id);
  if (fromCommon) return fromCommon;

  // ✅ If we're in "common poller mode" (telemetryMap was provided),
  // do NOT do any API fallback. Just return null and wait for poller.
  if (hasTelemetryMap) {
    dbg("loadLiveRowForDevice: telemetryMap provided but row not found yet -> no API fallback", {
      mk,
      id,
    });
    return null;
  }

  // 2) Fallback API (only when telemetryMap is NOT provided)
  const base = MODEL_META[mk]?.base || mk;
  const candidates = listCandidatesForBase(base);

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeArray(data);

      const found = arr.find((r) => String(readDeviceId(r)).trim() === id) || null;
      if (found) return found;
    } catch (e) {
      dbgErr("API path failed, continuing", { path: p, err: String(e?.message || e) });
    }
  }

  return null;
}