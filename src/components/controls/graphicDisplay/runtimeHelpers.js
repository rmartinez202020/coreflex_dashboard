const DEFAULT_LINE_COLOR = "#0c5ac8";

/**
 * ✅ map RATE unit -> TOTAL unit
 * totalizerUnit = RATE unit (ex: GPM, kW, kg/s)
 * We integrate rate over time to get TOTAL.
 */
export const RATE_TO_TOTAL_UNIT = {
  GPM: "gal",
  GPH: "gal",
  BPD: "bbl",
  "BBL/h": "bbl",

  CFM: "ft³",
  SCFM: "ft³",
  ACFM: "ft³",

  LPM: "L",
  LPH: "L",
  "m³/h": "m³",
  "m³/min": "m³",

  "kg/h": "kg",
  "kg/min": "kg",
  "kg/s": "kg",

  "lb/h": "lb",
  "lb/min": "lb",
  "ton/h": "ton",

  kW: "kWh",
  W: "Wh",
  MW: "MWh",
  "BTU/h": "BTU",
  "MBTU/h": "MBTU",
};

export function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
}

export function normalizeOnlineStatusFromRow(row) {
  if (!row) return { online: null, label: "--" };

  const raw =
    row.status ??
    row.deviceStatus ??
    row.state ??
    row.online ??
    row.isOnline ??
    row.connected ??
    row.connection ??
    row.connectionStatus ??
    row.aws_status ??
    row.awsStatus ??
    row.clientStatus ??
    null;

  const s = String(raw ?? "").trim().toLowerCase();

  if (raw === true || raw === 1) {
    return { online: true, label: "ONLINE" };
  }

  if (raw === false || raw === 0) {
    return { online: false, label: "OFFLINE" };
  }

  if (
    ["online", "connected", "ok", "active", "up", "true", "yes", "1"].includes(
      s
    )
  ) {
    return { online: true, label: "ONLINE" };
  }

  if (
    [
      "offline",
      "disconnected",
      "down",
      "inactive",
      "false",
      "no",
      "0",
    ].includes(s)
  ) {
    return { online: false, label: "OFFLINE" };
  }

  return { online: null, label: "--" };
}

// ✅ Detect Launch mode robustly (query, path, hash)
export function detectLaunchMode() {
  if (typeof window === "undefined") return false;

  const href = String(window.location.href || "").toLowerCase();
  const path = String(window.location.pathname || "").toLowerCase();
  const hash = String(window.location.hash || "").toLowerCase();

  try {
    const url = new URL(window.location.href);
    const mode = String(url.searchParams.get("mode") || "").toLowerCase();
    const launch =
      url.searchParams.get("launch") === "1" ||
      url.searchParams.get("launch") === "true";

    if (mode === "launch" || launch) return true;
  } catch {
    // ignore
  }

  if (path.includes("launch")) return true;
  if (hash.includes("launch")) return true;

  if (href.includes("mode=launch")) return true;
  if (href.includes("launch=1") || href.includes("launch=true")) return true;

  return false;
}

export function rateUnitToTimeBase(rateUnit) {
  const u = String(rateUnit || "").trim();

  if (
    ["GPM", "CFM", "SCFM", "ACFM", "LPM", "m³/min", "kg/min", "lb/min"].includes(
      u
    )
  ) {
    return "minute";
  }

  if (
    [
      "GPH",
      "BBL/h",
      "LPH",
      "m³/h",
      "kg/h",
      "lb/h",
      "ton/h",
      "kW",
      "BTU/h",
      "MBTU/h",
    ].includes(u)
  ) {
    return "hour";
  }

  if (["kg/s", "W"].includes(u)) return "second";
  if (["BPD"].includes(u)) return "day";

  return "";
}

export function integrateRateToTotal(points, rateUnit) {
  const base = rateUnitToTimeBase(rateUnit);
  if (!base) return null;

  const arr = Array.isArray(points) ? points : [];
  const clean = arr
    .filter((p) => !p?.gap)
    .map((p) => ({ t: Number(p?.t), y: Number(p?.y) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y))
    .sort((a, b) => a.t - b.t);

  if (clean.length < 2) return 0;

  let total = 0;

  for (let i = 1; i < clean.length; i++) {
    const p1 = clean[i - 1];
    const p2 = clean[i];

    const dtMs = p2.t - p1.t;
    if (!Number.isFinite(dtMs) || dtMs <= 0) continue;

    let dtBase = 0;
    if (base === "minute") dtBase = dtMs / 60000;
    else if (base === "hour") dtBase = dtMs / 3600000;
    else if (base === "second") dtBase = dtMs / 1000;
    else if (base === "day") dtBase = dtMs / 86400000;

    if (!Number.isFinite(dtBase) || dtBase <= 0) continue;

    const avgRate = (p1.y + p2.y) / 2;
    total += avgRate * dtBase;
  }

  return total;
}

export function exportPointsCsv({
  title = "Graphic Display",
  points = [],
  fmt = (t) => new Date(t).toISOString(),
  filePrefix = "graphic-display",
  totalizerEnabled = false,
  totalizerRateUnit = "",
} = {}) {
  const safeTitle =
    String(title || "Graphic Display")
      .replace(/[^\w\- ]+/g, "")
      .trim() || "Graphic Display";

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${filePrefix}-${safeTitle}-${stamp}.csv`;

  const header = "timestamp_iso,epoch_ms,totalizer,Value\n";

  const base = rateUnitToTimeBase(totalizerRateUnit);

  let runningTotal = 0;
  let prev = null;

  const rows = (points || []).map((p) => {
    const t = Number(p?.t);
    const y = Number(p?.y);
    const gap = !!p?.gap;

    if (
      totalizerEnabled &&
      base &&
      prev &&
      !prev.gap &&
      !gap &&
      Number.isFinite(prev.t) &&
      Number.isFinite(prev.y) &&
      Number.isFinite(t) &&
      Number.isFinite(y) &&
      t > prev.t
    ) {
      const dtMs = t - prev.t;

      let dtBase = 0;
      if (base === "minute") dtBase = dtMs / 60000;
      else if (base === "hour") dtBase = dtMs / 3600000;
      else if (base === "second") dtBase = dtMs / 1000;
      else if (base === "day") dtBase = dtMs / 86400000;

      if (Number.isFinite(dtBase) && dtBase > 0) {
        const avgRate = (prev.y + y) / 2;
        runningTotal += avgRate * dtBase;
      }
    }

    const iso = Number.isFinite(t) ? fmt(t) : "";
    const epoch = Number.isFinite(t) ? t : "";
    const yy = Number.isFinite(y) ? y : "";
    const totalizerText =
      totalizerEnabled && Number.isFinite(runningTotal)
        ? runningTotal.toFixed(6)
        : "";

    if (!gap && Number.isFinite(t) && Number.isFinite(y)) {
      prev = { t, y, gap: false };
    } else if (gap) {
      prev = null;
    }

    return `${iso},${epoch},${totalizerText},${yy}`;
  });

  const csv = header + rows.join("\n") + (rows.length ? "\n" : "");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseHistorianTs(value) {
  if (value === null || value === undefined) return NaN;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const s = String(value || "").trim();
  if (!s) return NaN;

  const direct = Date.parse(s);
  if (Number.isFinite(direct)) return direct;

  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );

  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    const year = Number(m[3]);
    let hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = Number(m[6] || 0);
    const ampm = String(m[7] || "").toUpperCase();

    if (ampm === "PM" && hour < 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    const dt = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second,
      0
    ).getTime();

    return Number.isFinite(dt) ? dt : NaN;
  }

  return NaN;
}

export function normalizeHistorianPoints(rows) {
  const src = Array.isArray(rows) ? rows : [];

  return src
    .map((row) => {
      const t = parseHistorianTs(
        row?.ts ??
          row?.timestamp ??
          row?.time ??
          row?.t ??
          row?.created_at ??
          null
      );

      const preferredValue =
        row?.mathOutput ??
        row?.value ??
        row?.y ??
        row?.output ??
        row?.raw ??
        null;

      const y = Number(preferredValue);

      return {
        t,
        y: Number.isFinite(y) ? y : null,
        gap: !!row?.gap,
      };
    })
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
}