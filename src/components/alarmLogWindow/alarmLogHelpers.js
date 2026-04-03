// src/components/alarmLogWindow/alarmLogHelpers.js
import { getToken } from "../../utils/authToken";

// =========================
// AUTH
// =========================
export function getAuthHeaders({
  isPublic = false,
  dashboardSlug = "",
  publicLaunchId = "",
  tenantEmail = "",
} = {}) {
  if (isPublic) {
    const headers = {};

    const email = String(tenantEmail || "").trim();
    const slug = String(dashboardSlug || "").trim();
    const launchId = String(publicLaunchId || "").trim();

    if (email) headers["x-tenant-email"] = email;
    if (slug) headers["x-dashboard-slug"] = slug;
    if (launchId) headers["x-public-launch-id"] = launchId;

    return headers;
  }

  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// =========================
// TIME HELPERS
// =========================
function pad2(v) {
  return String(v).padStart(2, "0");
}

export function formatAlarmTime(value) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = pad2(d.getMinutes());
  const seconds = pad2(d.getSeconds());

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${month}/${day}/${year}-${pad2(hours)}:${minutes}:${seconds} ${ampm}`;
}

// =========================
// STATE NORMALIZATION
// =========================
export function normalizeState(row) {
  const stateRaw = String(
    row?.state ?? row?.alarmState ?? row?.status ?? ""
  )
    .trim()
    .toUpperCase();

  if (stateRaw === "RETURNED") return "RETURNED";
  if (stateRaw === "ACTIVE") return "ACTIVE";
  if (stateRaw === "ACKED") return "ACKED";
  if (stateRaw === "DISABLED") return "DISABLED";

  return stateRaw || "—";
}

// =========================
// UNIQUE KEY BUILDER
// =========================
export function buildAlarmUniqueKey(row) {
  const alarmDefinitionId = String(row?.alarm_definition_id ?? "").trim();
  if (alarmDefinitionId) return `alarm_definition_id:${alarmDefinitionId}`;

  const device = String(row?.device_id ?? row?.deviceId ?? "").trim() || "—";
  const tag =
    String(row?.tag ?? row?.tagName ?? row?.tag_name ?? "").trim() || "—";
  const message =
    String(row?.message ?? row?.alarm_text ?? row?.alarmText ?? "").trim() ||
    "—";
  const group =
    String(row?.group_name ?? row?.group ?? "General").trim() || "General";

  return `fallback:${device}|${tag}|${message}|${group}`;
}

// =========================
// NORMALIZE RAW HISTORY ROW
// =========================
export function normalizeHistoryRow(row, idx = 0) {
  const ts = row?.ts || row?.timestamp || row?.time || null;
  const state = normalizeState(row);
  const uniqueAlarmKey = buildAlarmUniqueKey(row);

  return {
    id: row?.id || `${uniqueAlarmKey}-${ts || "ts"}-${idx}-${state}`,
    uniqueAlarmKey,
    alarmDefinitionId: row?.alarm_definition_id ?? null,
    ts,
    time: formatAlarmTime(ts),
    state,
    alarmText: String(
      row?.message || row?.alarm_text || row?.alarmText || ""
    ).trim(),
    ack: row?.acknowledged ? "Yes" : "No",
    acknowledged: row?.acknowledged === true,
    device: String(row?.device_id || row?.deviceId || "").trim(),
    tag: String(row?.tag || row?.tagName || row?.tag_name || "").trim(),
    value:
      row?.computed_value ??
      row?.raw_value ??
      row?.value ??
      row?.threshold ??
      "",
    group: String(row?.group_name || row?.group || "General").trim(),
    severity: String(row?.severity || "").trim(),
    enabled: row?.enabled !== false,
    occurrences: 1,
    raw: row,
  };
}

// =========================
// SUMMARIZE (GROUP BY ALARM)
// =========================
export function summarizeAlarmRows(rows) {
  const source = Array.isArray(rows) ? rows : [];
  const map = new Map();

  for (const row of source) {
    const key = String(row?.uniqueAlarmKey || row?.id || "").trim();
    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...row,
        occurrences: 1,
      });
      continue;
    }

    const prevTs = existing?.ts ? new Date(existing.ts).getTime() : -Infinity;
    const nextTs = row?.ts ? new Date(row.ts).getTime() : -Infinity;
    const nextOccurrences = Number(existing.occurrences || 1) + 1;

    if (nextTs >= prevTs) {
      map.set(key, {
        ...row,
        occurrences: nextOccurrences,
      });
    } else {
      map.set(key, {
        ...existing,
        occurrences: nextOccurrences,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const ta = a?.ts ? new Date(a.ts).getTime() : 0;
    const tb = b?.ts ? new Date(b.ts).getTime() : 0;
    return tb - ta;
  });
}

// =========================
// APPLY DEFINITIONS (SEVERITY SYNC)
// =========================
function buildDefinitionSeverityMap(definitions = []) {
  const byDefinitionId = new Map();
  const byFallbackKey = new Map();

  for (const alarm of definitions) {
    const alarmDefinitionId = String(alarm?.id ?? "").trim();
    const severity = String(alarm?.severity || "warning").trim();

    if (alarmDefinitionId) {
      byDefinitionId.set(alarmDefinitionId, severity);
    }

    const fallbackKey = buildAlarmUniqueKey({
      alarm_definition_id: "",
      device_id: alarm?.device_id,
      tag: alarm?.tag,
      message: alarm?.message,
      group_name: alarm?.group_name,
    });

    byFallbackKey.set(fallbackKey, severity);
  }

  return { byDefinitionId, byFallbackKey };
}

export function applyLatestDefinitionFields(rows, definitions = []) {
  const { byDefinitionId, byFallbackKey } =
    buildDefinitionSeverityMap(definitions);

  return rows.map((row) => {
    const definitionId = String(row?.alarmDefinitionId ?? "").trim();
    let nextSeverity = row?.severity || "";

    if (definitionId && byDefinitionId.has(definitionId)) {
      nextSeverity = byDefinitionId.get(definitionId);
    } else if (byFallbackKey.has(row.uniqueAlarmKey)) {
      nextSeverity = byFallbackKey.get(row.uniqueAlarmKey);
    }

    return {
      ...row,
      severity: String(nextSeverity || "").trim(),
    };
  });
}

// =========================
// SORT HELPERS
// =========================
export function sortAlarmRowsNewestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const ta = a?.ts ? new Date(a.ts).getTime() : 0;
    const tb = b?.ts ? new Date(b.ts).getTime() : 0;
    return tb - ta;
  });
}