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
export async function fetchUsedDOs({ dashboardId, deviceId, signal } = {}) {
  const q = qs({ dashboardId, deviceId });

  const res = await fetch(`${API_URL}/control-bindings/used?${q}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
    },
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to load used DOs (${res.status})`);
  }

  return res.json(); 
  // returns:
  // [{ field: "do1", widgetId: "...", title: "...", widgetType: "toggle" }]
}

// ===============================
// 🔒 Bind DO to Control
// ===============================
export async function bindControlDO({
  dashboardId,
  widgetId,
  widgetType,
  title,
  deviceId,
  field,
  signal,
} = {}) {
  const res = await fetch(`${API_URL}/control-bindings/bind`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      dashboardId,
      widgetId,
      widgetType,
      title,
      deviceId,
      field,
    }),
    signal,
  });

  if (res.ok) return { ok: true };

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  if (res.status === 409) {
    const detail = payload?.detail || payload || {};
    const err = new Error(detail?.error || "DO already used");
    err.code = 409;
    err.detail = detail;
    throw err;
  }

  const err = new Error(payload?.detail || `Bind failed (${res.status})`);
  err.code = res.status;
  err.detail = payload;
  throw err;
}

// ===============================
// 🗑️ Delete Binding (release DO)
// ===============================
export async function deleteControlBinding({
  dashboardId,
  widgetId,
  signal,
} = {}) {
  const q = qs({ dashboardId, widgetId });

  const res = await fetch(`${API_URL}/control-bindings?${q}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
    },
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Delete binding failed (${res.status})`);
  }

  return res.json();
}