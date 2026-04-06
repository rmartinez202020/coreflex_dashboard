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

// ✅ now supports DO + AO
export function isSupportedControlField(field) {
  const f = String(field || "").trim().toLowerCase();
  return /^(do[1-4]|ao[1-2])$/.test(f);
}

export function isAOField(field) {
  return /^ao[1-2]$/.test(String(field || "").trim().toLowerCase());
}

export function isDOField(field) {
  return /^do[1-4]$/.test(String(field || "").trim().toLowerCase());
}

// ===============================
// 📡 Get Used Control Fields
// ===============================
export async function fetchUsedControlFields({ deviceId, signal } = {}) {
  const q = qs({ deviceId });

  console.log("📡 fetchUsedControlFields →", {
    deviceId,
    url: `${API_URL}/control-bindings/used?${q}`,
  });

  const res = await fetch(`${API_URL}/control-bindings/used?${q}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    signal,
  });

  console.log("📡 fetchUsedControlFields ← status:", res.status);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("❌ fetchUsedControlFields ERROR:", txt);
    throw new Error(txt || `Failed to load used control fields (${res.status})`);
  }

  const data = await res.json();
  console.log("📡 fetchUsedControlFields ← data:", data);
  return data;
}

// ✅ keep old name so existing toggle/push button code does not break
export async function fetchUsedDOs(args = {}) {
  return fetchUsedControlFields(args);
}

// ===============================
// 🔒 Bind Control Field (DO or AO)
// ===============================
export async function bindControlField({
  dashboardId,
  dashboardName,
  widgetId,
  widgetType,
  title,
  deviceId,
  field,
  signal,
} = {}) {
  const safeField = String(field || "").trim().toLowerCase();

  if (!isSupportedControlField(safeField)) {
    throw new Error(`Unsupported control field: ${safeField || "(empty)"}`);
  }

  const body = {
    dashboardId,
    dashboardName,
    widgetId,
    widgetType,
    title,
    deviceId,
    field: safeField,
  };

  console.log("🔒 bindControlField →", body);

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

  console.log("🔒 bindControlField ← status:", res.status);

  if (res.ok) {
    try {
      const data = await res.json();
      console.log("🔒 bindControlField ← data:", data);
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  console.error("❌ bindControlField ERROR:", payload);

  if (res.status === 409) {
    const detail = payload?.detail || payload || {};
    const err = new Error(detail?.error || "Control field already used");
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

// ✅ keep old name so existing toggle/push button code does not break
export async function bindControlDO(args = {}) {
  return bindControlField(args);
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
// 🕹️ Write Control Value
// ✅ DO => value01
// ✅ AO => value
// ===============================
export async function writeControlValue({
  dashboardId,
  widgetId,
  field,
  value,
  value01,
  signal,
} = {}) {
  const safeField = String(field || "").trim().toLowerCase();

  if (!isSupportedControlField(safeField)) {
    throw new Error(`Unsupported control field: ${safeField || "(empty)"}`);
  }

  const body = {
    dashboardId,
    widgetId,
    field: safeField,
    ...(isDOField(safeField)
      ? { value01: Number(value01) === 1 ? 1 : 0 }
      : { value: Number(value) }),
  };

  console.log("🕹️ writeControlValue →", body);
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

  console.log("🕹️ writeControlValue ← status:", res.status);

  if (res.ok) {
    try {
      const data = await res.json();
      console.log("🕹️ writeControlValue ← data:", data);
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {}

  console.error("❌ writeControlValue ERROR:", {
    status: res.status,
    payload,
  });

  const msg = payload?.detail || `Write failed (${res.status})`;
  const err = new Error(msg);
  err.code = res.status;
  err.detail = payload;
  throw err;
}

// ✅ generic AO writer
export async function writeControlAO({
  dashboardId,
  widgetId,
  field = "ao1",
  value,
  signal,
} = {}) {
  const safeField = String(field || "").trim().toLowerCase();

  if (!isAOField(safeField)) {
    throw new Error(`Unsupported AO field: ${safeField || "(empty)"}`);
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid AO value: ${value}`);
  }

  console.log("🎛️ writeControlAO →", {
    dashboardId,
    widgetId,
    field: safeField,
    value: numericValue,
  });

  return writeControlValue({
    dashboardId,
    widgetId,
    field: safeField,
    value: numericValue,
    signal,
  });
}

// ✅ keep old name so toggle/push button stay working
export async function writeControlDO({
  dashboardId,
  widgetId,
  value01,
  signal,
} = {}) {
  return writeControlValue({
    dashboardId,
    widgetId,
    field: "do1", // not used by old backend if widget binding resolves server-side
    value01,
    signal,
  });
}