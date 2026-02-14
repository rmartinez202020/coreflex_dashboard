// src/components/indicators/counterModal/counterHelpers.js

// ✅ Counter should ONLY count inputs (DI)
export const TAG_OPTIONS = [
  { key: "di1", label: "DI-1" },
  { key: "di2", label: "DI-2" },
  { key: "di3", label: "DI-3" },
  { key: "di4", label: "DI-4" },
  { key: "di5", label: "DI-5" },
  { key: "di6", label: "DI-6" },
];

// ✅ Safe date formatter
export function formatDateMMDDYYYY_hmma(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}-${h}:${min}${ampm}`;
}

// ✅ Convert anything to 0/1
export function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

// ✅ Read tag value from backend row (tries a few common variants)
export function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  // direct
  if (row[field] !== undefined) return row[field];

  // upper-case key
  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // legacy mappings: di1..di6 -> in1..in6
  if (/^di[1-6]$/i.test(field)) {
    const n = String(field).toLowerCase().replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = alt.toUpperCase();
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

// ✅ backend field normalization (must end up di1..di6)
export function normalizeDiField(field) {
  const f = String(field || "").trim().toLowerCase();
  if (!f) return "";
  if (f.startsWith("in") && f.length === 3 && /\d/.test(f[2])) return `di${f[2]}`;
  if (/^di[1-6]$/.test(f)) return f;
  return "";
}

// ✅ best-effort dashboard id getter (no guessing, just safe fallbacks)
export function resolveDashboardIdFromProps({ dashboardId, tank }) {
  const a = String(dashboardId || "").trim();
  if (a) return a;

  const b = String(tank?.dashboard_id || tank?.dashboardId || "").trim();
  if (b) return b;

  const c = String(tank?.properties?.dashboard_id || tank?.properties?.dashboardId || "").trim();
  if (c) return c;

  return null; // backend supports null dashboard_id
}
