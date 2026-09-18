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

export function isDIField(field) {
  return /^di[1-6]$/.test(String(field || "").trim().toLowerCase());
}

function normalizeInterlockType(value) {
  return String(value || "NO").trim().toUpperCase() === "NC" ? "NC" : "NO";
}

function normalizeInterlockMode(value) {
  return String(value || "block_when_active").trim() || "block_when_active";
}

// ===============================
// 📡 Get Used Control Fields
// ===============================
export async function fetchUsedControlFields({ deviceId, signal } = {}) {
  const q = qs({ deviceId });

  const res = await fetch(`${API_URL}/control-bindings/used?${q}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to load used control fields (${res.status})`);
  }

  const data = await res.json();
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
  scaleMin,
  scaleMax,
  aoScaleMin,
  aoScaleMax,

  // ✅ Interlock values
  // Backend only applies these to toggle / push_no / push_nc
  interlockEnabled,
  interlockDeviceId,
  interlockField,
  interlockType,
  interlockMode,

  // 🔐 Per-widget PIN protection
  pinRequired,
  pin,

  signal,
} = {}) {
  const safeField = String(field || "").trim().toLowerCase();

  if (!isSupportedControlField(safeField)) {
    throw new Error(`Unsupported control field: ${safeField || "(empty)"}`);
  }

  const safeInterlockField = String(interlockField || "")
    .trim()
    .toLowerCase();

  const body = {
    dashboardId,
    dashboardName,
    widgetId,
    widgetType,
    title,
    deviceId,
    field: safeField,

    ...(scaleMin !== undefined
      ? { scaleMin: Number(scaleMin) }
      : {}),

    ...(scaleMax !== undefined
      ? { scaleMax: Number(scaleMax) }
      : {}),

    ...(aoScaleMin !== undefined
      ? { aoScaleMin: Number(aoScaleMin) }
      : {}),

    ...(aoScaleMax !== undefined
      ? { aoScaleMax: Number(aoScaleMax) }
      : {}),

    // ===============================
    // 🔒 Interlock
    // ===============================

    ...(interlockEnabled !== undefined
      ? { interlockEnabled: Boolean(interlockEnabled) }
      : {}),

    ...(interlockDeviceId !== undefined
      ? {
          interlockDeviceId: String(
            interlockDeviceId || ""
          ).trim(),
        }
      : {}),

    ...(interlockField !== undefined
      ? {
          interlockField: safeInterlockField,
        }
      : {}),

    ...(interlockType !== undefined
      ? {
          interlockType: normalizeInterlockType(
            interlockType
          ),
        }
      : {}),

    ...(interlockMode !== undefined
      ? {
          interlockMode: normalizeInterlockMode(
            interlockMode
          ),
        }
      : {}),

    // ===============================
    // 🔐 PIN Protection
    // ===============================
    // PIN is only transported to the backend.
    // It is NOT stored by this frontend helper.

    ...(pinRequired !== undefined
      ? {
          pinRequired: Boolean(pinRequired),
        }
      : {}),

    ...(pin !== undefined &&
    String(pin).trim() !== ""
      ? {
          pin: String(pin).trim(),
        }
      : {}),
  };

  const res = await fetch(
    `${API_URL}/control-bindings/bind`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify(body),
      signal,
    }
  );

  if (res.ok) {
    try {
      const data = await res.json();
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;

  try {
    payload = await res.json();
  } catch {}

  if (res.status === 409) {
    const detail = payload?.detail || payload || {};

    const err = new Error(
      detail?.error || "Control field already used"
    );

    err.code = 409;
    err.detail = detail;

    throw err;
  }

  const msg =
    payload?.detail?.error ||
    payload?.detail ||
    payload?.error ||
    `Bind failed (${res.status})`;

  const err = new Error(
    typeof msg === "string"
      ? msg
      : JSON.stringify(msg)
  );

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
  const q = qs({
    dashboardId,
    widgetId,
  });

  const res = await fetch(
    `${API_URL}/control-bindings/?${q}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal,
    }
  );

  if (res.ok) {
    try {
      const data = await res.json();
      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;

  try {
    payload = await res.json();
  } catch {}

  const msg =
    payload?.detail ||
    payload?.error ||
    `Delete binding failed (${res.status})`;

  const err = new Error(
    typeof msg === "string"
      ? msg
      : JSON.stringify(msg)
  );

  err.code = res.status;
  err.detail = payload;

  throw err;
}

// ===============================
// 🕹️ Write Control Value
// ===============================
// ✅ DO => value01
// ✅ AO => value
// 🔐 PIN is forwarded only when supplied
// ===============================
export async function writeControlValue({
  dashboardId,
  widgetId,
  field,
  value,
  value01,
  pin,
  signal,
} = {}) {
  const safeField = String(field || "")
    .trim()
    .toLowerCase();

  if (!isSupportedControlField(safeField)) {
    throw new Error(
      `Unsupported control field: ${
        safeField || "(empty)"
      }`
    );
  }

  const body = {
    dashboardId,
    widgetId,
    field: safeField,

    ...(isDOField(safeField)
      ? {
          value01:
            Number(value01) === 1 ? 1 : 0,
        }
      : {
          value: Number(value),
        }),

    // ===============================
    // 🔐 PIN
    // ===============================
    // Never persist the PIN here.
    // It exists only in this API request.

    ...(pin !== undefined &&
    String(pin).trim() !== ""
      ? {
          pin: String(pin).trim(),
        }
      : {}),
  };

  const res = await fetch(
    `${API_URL}/control-bindings/write`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: JSON.stringify(body),
      signal,
    }
  );

  if (res.ok) {
    try {
      const data = await res.json();

      console.log(
        "🕹️ writeControlValue ← data:",
        data
      );

      return data;
    } catch {
      return { ok: true };
    }
  }

  let payload = null;

  try {
    payload = await res.json();
  } catch {}

  const msg =
    payload?.detail ||
    `Write failed (${res.status})`;

  const err = new Error(
    typeof msg === "string"
      ? msg
      : JSON.stringify(msg)
  );

  err.code = res.status;
  err.detail = payload;

  throw err;
}

// ===============================
// ✅ Generic AO writer
// ===============================
export async function writeControlAO({
  dashboardId,
  widgetId,
  field = "ao1",
  value,
  pin,
  signal,
} = {}) {
  const safeField = String(field || "")
    .trim()
    .toLowerCase();

  if (!isAOField(safeField)) {
    throw new Error(
      `Unsupported AO field: ${
        safeField || "(empty)"
      }`
    );
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(
      `Invalid AO value: ${value}`
    );
  }

  return writeControlValue({
    dashboardId,
    widgetId,
    field: safeField,
    value: numericValue,
    pin,
    signal,
  });
}

// ===============================
// ✅ DO writer
// Keep old name so toggle /
// push button code stays working
// ===============================
export async function writeControlDO({
  dashboardId,
  widgetId,
  value01,
  pin,
  signal,
} = {}) {
  return writeControlValue({
    dashboardId,
    widgetId,

    // Backend resolves the actual bound
    // DO from dashboardId + widgetId.
    field: "do1",

    value01,

    // 🔐 Forward operator PIN when supplied.
    pin,

    signal,
  });
}