// src/components/gauge/utils.js

export function clamp(value, min, max) {
  const n = Number(value);
  const lo = Number(min);
  const hi = Number(max);

  if (!Number.isFinite(n)) return Number.isFinite(lo) ? lo : 0;
  if (!Number.isFinite(lo) && !Number.isFinite(hi)) return n;
  if (!Number.isFinite(lo)) return Math.min(n, hi);
  if (!Number.isFinite(hi)) return Math.max(n, lo);

  return Math.max(lo, Math.min(hi, n));
}

export function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeRange(min, max) {
  let lo = normalizeNumber(min, 0);
  let hi = normalizeNumber(max, 100);

  if (hi === lo) hi = lo + 1;

  if (hi < lo) {
    const tmp = lo;
    lo = hi;
    hi = tmp;
  }

  return { min: lo, max: hi };
}

export function normalizeValue(value, min = 0, max = 100) {
  const { min: lo, max: hi } = normalizeRange(min, max);
  const raw = normalizeNumber(value, lo);
  const clamped = clamp(raw, lo, hi);
  const ratio = (clamped - lo) / (hi - lo);

  return {
    raw,
    clamped,
    ratio: Number.isFinite(ratio) ? ratio : 0,
    min: lo,
    max: hi,
  };
}

export function valueToAngle(
  value,
  min = 0,
  max = 100,
  startAngle = -130,
  endAngle = 130
) {
  const { ratio } = normalizeValue(value, min, max);
  return startAngle + ratio * (endAngle - startAngle);
}

export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function getNeedleLine({
  cx,
  cy,
  radius,
  angleDeg,
  tailLength = 14,
  tipOffset = 10,
}) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;

  const x1 = cx - tailLength * Math.cos(rad);
  const y1 = cy - tailLength * Math.sin(rad);
  const x2 = cx + Math.max(0, radius - tipOffset) * Math.cos(rad);
  const y2 = cy + Math.max(0, radius - tipOffset) * Math.sin(rad);

  return { x1, y1, x2, y2 };
}

export function getTickValues(min = 0, max = 100, count = 6) {
  const { min: lo, max: hi } = normalizeRange(min, max);
  const safeCount = Math.max(2, Number(count) || 6);
  const step = (hi - lo) / (safeCount - 1);

  return Array.from({ length: safeCount }, (_, i) => lo + i * step);
}

export function formatGaugeValue(value, decimals = 0) {
  const n = Number(value);
  const d = Math.max(0, Number(decimals) || 0);

  if (!Number.isFinite(n)) return "--";
  return n.toFixed(d);
}

export function formatCompactValue(value, decimals = 0) {
  const n = Number(value);
  const d = Math.max(0, Number(decimals) || 0);

  if (!Number.isFinite(n)) return "--";

  return n.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function getZoneColor(value, settings = {}) {
  const raw = Number(value);

  const lowWarn = Number(settings.lowWarn);
  const highWarn = Number(settings.highWarn);

  const normalColor = settings.normalColor || "#22c55e";
  const warningColor = settings.warningColor || "#f59e0b";
  const alarmColor = settings.alarmColor || "#ef4444";

  if (!Number.isFinite(raw)) return normalColor;

  if (Number.isFinite(lowWarn) && raw <= lowWarn) return warningColor;
  if (Number.isFinite(highWarn) && raw >= highWarn) return alarmColor;

  return normalColor;
}

export function getGaugePalette(settings = {}) {
  return {
    background: settings.backgroundColor || "#f8fafc",
    face: settings.faceColor || "#ffffff",
    border: settings.borderColor || "#d1d5db",
    tick: settings.tickColor || "#6b7280",
    label: settings.labelColor || "#374151",
    needle: settings.needleColor || "#ea580c",
    centerCap: settings.centerCapColor || "#e5e7eb",
    valueBox: settings.valueBoxColor || "#e5e7eb",
    valueText: settings.valueTextColor || "#111827",
    normal: settings.normalColor || "#22c55e",
    warning: settings.warningColor || "#f59e0b",
    alarm: settings.alarmColor || "#ef4444",
  };
}

/* =========================================================
   MATH / FORMULA SUPPORT
   - Same idea as your Display Output modal
   - Formula uses VALUE as the raw analog input
   - Examples:
     VALUE
     VALUE * 1.5
     (VALUE / 4095) * 100
     (VALUE / 4095) * 20 - 4
========================================================= */

export function sanitizeFormula(formula) {
  return String(formula || "").trim();
}

export function hasFormula(formula) {
  return sanitizeFormula(formula).length > 0;
}

export function isSafeMathFormula(formula) {
  const expr = sanitizeFormula(formula);
  if (!expr) return true;

  // allow only digits, spaces, VALUE, decimal points, parentheses and math ops
  return /^[0-9+\-*/%().\sVALUEvalue]*$/.test(expr);
}

export function evaluateMathFormula(formula, rawValue) {
  const expr = sanitizeFormula(formula);
  const valueNum = Number(rawValue);

  if (!expr) {
    return {
      ok: true,
      value: Number.isFinite(valueNum) ? valueNum : 0,
      error: null,
      usedFormula: false,
    };
  }

  if (!Number.isFinite(valueNum)) {
    return {
      ok: false,
      value: 0,
      error: "Invalid VALUE",
      usedFormula: true,
    };
  }

  if (!isSafeMathFormula(expr)) {
    return {
      ok: false,
      value: 0,
      error: "Unsafe or unsupported formula",
      usedFormula: true,
    };
  }

  try {
    const replaced = expr.replace(/\bVALUE\b/gi, `(${valueNum})`);
    const fn = new Function(`return (${replaced});`);
    const result = Number(fn());

    if (!Number.isFinite(result)) {
      return {
        ok: false,
        value: 0,
        error: "Formula result is not finite",
        usedFormula: true,
      };
    }

    return {
      ok: true,
      value: result,
      error: null,
      usedFormula: true,
    };
  } catch (err) {
    return {
      ok: false,
      value: 0,
      error: err?.message || "Formula evaluation failed",
      usedFormula: true,
    };
  }
}

export function computeGaugeValue(rawValue, settings = {}) {
  const raw = Number(rawValue);
  const formula = sanitizeFormula(settings.formula || settings.mathFormula || "");

  const evalResult = evaluateMathFormula(formula, raw);

  const computed = evalResult.ok
    ? evalResult.value
    : Number.isFinite(raw)
    ? raw
    : 0;

  const { min, max } = normalizeRange(
    settings.minValue ?? settings.min ?? 0,
    settings.maxValue ?? settings.max ?? 100
  );

  const clamped = clamp(computed, min, max);
  const ratio = (clamped - min) / (max - min);

  return {
    rawValue: Number.isFinite(raw) ? raw : 0,
    computedValue: computed,
    displayValue: computed,
    clampedValue: clamped,
    ratio: Number.isFinite(ratio) ? ratio : 0,
    min,
    max,
    formula,
    formulaOk: evalResult.ok,
    formulaError: evalResult.error,
    usedFormula: evalResult.usedFormula,
  };
}

export function buildGaugeDefaults(widget = {}) {
  return {
    // ✅ allow blank title ("") to remain blank; only default to "Gauge" for null/undefined
    title:
      widget.title === null || widget.title === undefined
        ? "Gauge"
        : String(widget.title),
    units: widget.units || "",
    gaugeStyle: widget.gaugeStyle || "classic",

    // range
    minValue: normalizeNumber(widget.minValue ?? widget.min, 0),
    maxValue: normalizeNumber(widget.maxValue ?? widget.max, 100),

    // display
    decimals: Math.max(0, Number(widget.decimals) || 0),
    showValue: widget.showValue !== false,
    showTicks: widget.showTicks !== false,
    showLabels: widget.showLabels !== false,
    showZones: widget.showZones !== false,

    // math
    formula: String(widget.formula || widget.mathFormula || "").trim(),

    // thresholds
    lowWarn: Number.isFinite(Number(widget.lowWarn))
      ? Number(widget.lowWarn)
      : null,
    highWarn: Number.isFinite(Number(widget.highWarn))
      ? Number(widget.highWarn)
      : null,

    // colors
    normalColor: widget.normalColor || "#22c55e",
    warningColor: widget.warningColor || "#f59e0b",
    alarmColor: widget.alarmColor || "#ef4444",
    needleColor: widget.needleColor || "#ea580c",
    tickColor: widget.tickColor || "#6b7280",
    labelColor: widget.labelColor || "#374151",
    borderColor: widget.borderColor || "#d1d5db",
    faceColor: widget.faceColor || "#ffffff",
    backgroundColor: widget.backgroundColor || "#f8fafc",
    valueBoxColor: widget.valueBoxColor || "#e5e7eb",
    valueTextColor: widget.valueTextColor || "#111827",
    centerCapColor: widget.centerCapColor || "#e5e7eb",
  };
}

/* =========================================================
   STYLE CARD PREVIEW DATA
   Useful for the GaugeDisplaySettingsModal cards
========================================================= */

export const GAUGE_STYLE_OPTIONS = [
  {
    value: "classic",
    label: "Classic Round",
    description: "Industrial round needle gauge.",
  },
  {
    value: "semi",
    label: "Semi Circle",
    description: "Compact half-dial gauge.",
  },
  {
    value: "arc",
    label: "Modern Arc",
    description: "Modern arc with centered value.",
  },
  {
    value: "radial",
    label: "Radial Bar",
    description: "Segmented radial bar gauge.",
  },
];

export function getGaugeStyleMeta(style) {
  const key = String(style || "classic").trim().toLowerCase();
  return (
    GAUGE_STYLE_OPTIONS.find((s) => s.value === key) || GAUGE_STYLE_OPTIONS[0]
  );
}