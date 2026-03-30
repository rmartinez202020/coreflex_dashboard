// src/components/controls/controlBindings.js

import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      u.set(k, String(v));
    }
  });
  return u.toString();
}

// ===============================
// 📡 Get Used DOs
// ===============================
export async function fetchUsedDOs({ deviceId, signal } = {}) {
  const q = qs({ deviceId });

  console.log("📡 fetchUsedDOs →", { deviceId, url: `${API_URL}/control-bindings/used?${q}` });

  const res = await fetch(`${API_URL}/control-bindings/used?${q}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    signal,
  });

  console.log("📡 fetchUsedDOs ← status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("❌ fetchUsedDOs ERROR:", txt);
    throw new Error(txt || `Failed to load used DOs (${res.status})`);
  }

  const data = await res.json();
  console.log("📡 fetchUsedDOs ← data:", data);

  return data;
}

// ===============================
// 🔒 Bind DO
// ===============================
export async function bindControlDO({
  dashboardId,
  dashboardName,
  widgetId,
  widgetType,
  title,
  deviceId,
  field,
  signal,
} = {}) {

  const body = {
    dashboardId,
    dashboardName,
    widgetId,
    widgetType,
    title,
    deviceId,
    field,
  };

  console.log("🔒 bindControlDO →", body);

  const res = await fetch(`${API_URL}/control-bindings/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: JSON.stringify(body),
    signal,
  });

  console.log("🔒 bindControlDO ← status:", res.status);

  if (res.ok) {
    try {
      const data = await res.json();
      console.log("🔒 bindControlDO ← data:", data);
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  console.error("❌ bindControlDO ERROR:", payload);

  if (res.status === 409) {
    const detail = payload?.detail || payload || {};
    const err = new Error(detail?.error || "DO already used");
    err.code = 409;
    err.detail = detail;
    throw err;
  }

  const msg =
    payload?.detail?.error ||
    payload?.detail ||
    payload?.error ||
    `Bind failed (${res.status})`;

  const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  err.code = res.status;
  err.detail = payload;
  throw err;
}

// ===============================
// 🗑️ Delete Binding
// ===============================
export async function deleteControlBinding({
  dashboardId,
  widgetId,
  signal,
} = {}) {
  const q = qs({ dashboardId, widgetId });

  console.log("🗑️ deleteControlBinding →", { dashboardId, widgetId });

  const res = await fetch(`${API_URL}/control-bindings/?${q}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    signal,
  });

  console.log("🗑️ deleteControlBinding ← status:", res.status);

  if (res.ok) {
    try {
      const data = await res.json();
      console.log("🗑️ deleteControlBinding ← data:", data);
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  console.error("❌ deleteControlBinding ERROR:", payload);

  const msg =
    payload?.detail ||
    payload?.error ||
    `Delete binding failed (${res.status})`;

  const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  err.code = res.status;
  err.detail = payload;
  throw err;
}

// ===============================
// 🕹️ Write DO (IMPORTANT)
// ===============================
export async function writeControlDO({
  dashboardId,
  widgetId,
  value01,
  signal,
} = {}) {

  const body = {
    dashboardId,
    widgetId,
    value01: Number(value01) === 1 ? 1 : 0,
  };

  console.log("🕹️ writeControlDO →", body);
  console.log("🕹️ URL →", `${API_URL}/control-bindings/write`);

  const res = await fetch(`${API_URL}/control-bindings/write`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: JSON.stringify(body),
    signal,
  });

  console.log("🕹️ writeControlDO ← status:", res.status);

  if (res.ok) {
    try {
      const data = await res.json();
      console.log("🕹️ writeControlDO ← data:", data);
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  console.error("❌ writeControlDO ERROR:", {
    status: res.status,
    payload,
  });

  const msg = payload?.detail || `Write failed (${res.status})`;
  const err = new Error(msg);
  err.code = res.status;
  err.detail = payload;
  throw err;
}