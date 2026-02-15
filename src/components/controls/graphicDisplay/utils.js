// src/components/controls/graphicDisplay/utils.js

// ✅ compute math output safely (VALUE or value)
export function computeMathOutput(liveValue, formula) {
  const v =
    liveValue === null || liveValue === undefined || liveValue === ""
      ? null
      : typeof liveValue === "number"
      ? liveValue
      : Number(liveValue);

  if (!Number.isFinite(v)) return null;

  const f = String(formula || "").trim();
  if (!f) return v; // no formula => output = live value

  // allow VALUE / value
  const expr = f.replace(/\bVALUE\b/g, "value");

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function("value", `"use strict"; return (${expr});`);
    const out = fn(v);
    const num = typeof out === "number" ? out : Number(out);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

export function msPerUnit(timeUnit) {
  const u = String(timeUnit || "").toLowerCase();
  if (u === "minutes" || u === "minute" || u === "min") return 60000;
  if (u === "hours" || u === "hour" || u === "hr") return 3600000;
  return 1000; // seconds default
}

export function fmtTimeWithDate(ts) {
  if (!Number.isFinite(ts)) return "";
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}
