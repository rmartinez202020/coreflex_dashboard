// src/components/controls/graphicDisplay/loader.js
import { API_URL } from "../../../config/api";
import { getToken } from "../../../utils/authToken";

export const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" }, // safe if you later add
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

export async function apiGet(path, { signal } = {}) {
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
  // ✅ Use only tenant-safe endpoints (no /devices, no /device/:id, no /one/:id)
  if (base === "zhc1921") return ["/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"];
  if (base === "zhc1661") return ["/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"];
  if (base === "tp4000") return ["/tp4000/my-devices", "/tp4000/list", "/tp4000"];
  return [`/${base}/my-devices`, `/${base}/list`, `/${base}`];
}

export async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;
  const candidates = listCandidatesForBase(base);

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeArray(data);

      const found =
        arr.find((r) => String(readDeviceId(r)) === String(deviceId)) || null;

      if (found) return found;
    } catch {
      // continue
    }
  }

  return null;
}
