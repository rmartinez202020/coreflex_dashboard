import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DEFAULT_BAR_COLOR = "#facc15";
const MAX_CONTINUOUS_GAP_MS = 60 * 60 * 1000; // 1 hour

function rateUnitToTimeBase(rateUnit) {
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

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizePoints(points) {
  return (Array.isArray(points) ? points : [])
    .filter((p) => !p?.gap)
    .map((p) => ({
      t: toNumber(p?.t),
      y: toNumber(p?.y),
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y))
    .sort((a, b) => a.t - b.t);
}

function dtMsToBaseUnits(dtMs, base) {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return 0;

  if (base === "minute") return dtMs / 60000;
  if (base === "hour") return dtMs / 3600000;
  if (base === "second") return dtMs / 1000;
  if (base === "day") return dtMs / 86400000;

  return 0;
}

function accumulateStepSegment(y, dtMs, base) {
  if (!Number.isFinite(y) || !Number.isFinite(dtMs) || dtMs <= 0) return 0;
  if (!base) return 0;

  const dtBase = dtMsToBaseUnits(dtMs, base);
  if (!Number.isFinite(dtBase) || dtBase <= 0) return 0;

  // ✅ keep same behavior as live totalizer: non-positive rates do not accumulate
  if (y <= 0) return 0;

  return y * dtBase;
}

function accumulateWithinMonth(points, startT, endT, rateUnit) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  if (!Number.isFinite(startT) || !Number.isFinite(endT) || endT <= startT) {
    return 0;
  }

  const base = rateUnitToTimeBase(rateUnit);
  if (!base) return 0;

  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const t1 = Number(p1?.t);
    const t2 = Number(p2?.t);
    const y1 = Number(p1?.y);

    if (
      !Number.isFinite(t1) ||
      !Number.isFinite(t2) ||
      !Number.isFinite(y1) ||
      t2 <= t1
    ) {
      continue;
    }

    const rawGapMs = t2 - t1;

    // ✅ if gap between consecutive points is more than 1 hour,
    // do not treat it as continuous data
    if (rawGapMs > MAX_CONTINUOUS_GAP_MS) {
      continue;
    }

    // ✅ simple month clipping without interpolation:
    // hold p1.y constant until p2, but only for the interval that lies in this month
    const segStart = Math.max(startT, t1);
    const segEnd = Math.min(endT, t2);

    if (segEnd <= segStart) continue;

    total += accumulateStepSegment(y1, segEnd - segStart, base);
  }

  return total;
}

function collectAvailableYears(points) {
  const years = new Set();
  for (const p of points) {
    const t = Number(p?.t);
    if (!Number.isFinite(t)) continue;
    years.add(new Date(t).getFullYear());
  }
  return [...years].sort((a, b) => a - b);
}

function buildMonthlyTotals(points, year, rateUnit) {
  const base = rateUnitToTimeBase(rateUnit);

  if (!base) {
    return MONTH_LABELS.map((label, idx) => ({
      monthIndex: idx,
      label,
      total: 0,
      start: new Date(year, idx, 1).getTime(),
      end: new Date(year, idx + 1, 1).getTime(),
    }));
  }

  return MONTH_LABELS.map((label, idx) => {
    const start = new Date(year, idx, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, idx + 1, 1, 0, 0, 0, 0).getTime();

    // ✅ monthly total uses:
    // - all available points
    // - unit-aware step totalization
    // - no interpolation
    // - no continuity across >1h gaps
    const total = accumulateWithinMonth(points, start, end, rateUnit);

    return {
      monthIndex: idx,
      label,
      total: Number.isFinite(total) ? total : 0,
      start,
      end,
    };
  });
}

function fmtNum(v) {
  return Number.isFinite(v) ? Number(v).toFixed(2) : "0.00";
}

function normalizeHexColor(v, fallback = DEFAULT_BAR_COLOR) {
  const s = String(v || "").trim();
  if (!s) return fallback;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;
  return fallback;
}

// ✅ stable storage key per widget/modal title + units
function buildBarColorStorageKey(title, totalizerRateUnit, totalizerTotalUnit) {
  const safeTitle = String(title || "Graphic Display").trim().toLowerCase();
  const safeRate = String(totalizerRateUnit || "").trim().toLowerCase();
  const safeTotal = String(totalizerTotalUnit || "").trim().toLowerCase();

  return `coreflex:graphic-display:timeseries-bar-color:${safeTitle}:${safeRate}:${safeTotal}`;
}

export default function GraphicDisplayTimeseriesBarModal({
  open = false,
  onClose = () => {},
  title = "Graphic Display",
  points = [],
  totalizerRateUnit = "",
  totalizerTotalUnit = "",
}) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const cleanPoints = useMemo(() => normalizePoints(points), [points]);

  const availableYears = useMemo(
    () => collectAvailableYears(cleanPoints),
    [cleanPoints]
  );

  const defaultYear = useMemo(() => {
    if (availableYears.length) return availableYears[availableYears.length - 1];
    return new Date().getFullYear();
  }, [availableYears]);

  const storageKey = useMemo(() => {
    return buildBarColorStorageKey(title, totalizerRateUnit, totalizerTotalUnit);
  }, [title, totalizerRateUnit, totalizerTotalUnit]);

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [barColor, setBarColor] = useState(DEFAULT_BAR_COLOR);

  useEffect(() => {
    setSelectedYear(defaultYear);
  }, [defaultYear, open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        setBarColor(normalizeHexColor(saved, DEFAULT_BAR_COLOR));
      } else {
        setBarColor(DEFAULT_BAR_COLOR);
      }
    } catch {
      setBarColor(DEFAULT_BAR_COLOR);
    }
  }, [storageKey, open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const safe = normalizeHexColor(barColor, DEFAULT_BAR_COLOR);
      window.localStorage.setItem(storageKey, safe);
    } catch {
      // ignore localStorage errors
    }
  }, [barColor, storageKey]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const safeBarColor = useMemo(
    () => normalizeHexColor(barColor, DEFAULT_BAR_COLOR),
    [barColor]
  );

  const monthlyTotals = useMemo(() => {
    return buildMonthlyTotals(cleanPoints, selectedYear, totalizerRateUnit);
  }, [cleanPoints, selectedYear, totalizerRateUnit]);

  const maxValue = useMemo(() => {
    const vals = monthlyTotals.map((m) => Number(m.total) || 0);
    return Math.max(0, ...vals);
  }, [monthlyTotals]);

  const grandTotal = useMemo(() => {
    return monthlyTotals.reduce((acc, m) => acc + (Number(m.total) || 0), 0);
  }, [monthlyTotals]);

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.38)",
        zIndex: 1000000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <div
        style={{
          width: "min(1560px, 99vw)",
          height: "min(900px, 96vh)",
          overflow: "hidden",
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          border: "1px solid #dbe2ea",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb",
            background: "linear-gradient(180deg,#0b1b33,#0a1730)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flex: "0 0 auto",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: 0.2,
              }}
            >
              📊 Timeseries Bar
            </div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.9,
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={title}
            >
              {title}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* TOP INFO */}
        <div
          style={{
            padding: 14,
            background: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            flex: "0 0 auto",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                border: "1px solid #dbe2ea",
                background: "#fff",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Rate Unit:{" "}
              <span style={{ color: "#334155", fontWeight: 700 }}>
                {totalizerRateUnit || "--"}
              </span>
            </div>

            <div
              style={{
                border: "1px solid #dbe2ea",
                background: "#fff",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Monthly Total Unit:{" "}
              <span style={{ color: "#334155", fontWeight: 700 }}>
                {totalizerTotalUnit || "--"}
              </span>
            </div>

            <div
              style={{
                border: "1px solid #dbe2ea",
                background: "#fff",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Year Total:{" "}
              <span style={{ color: "#0b3b18", fontWeight: 900 }}>
                {fmtNum(grandTotal)} {totalizerTotalUnit || ""}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#334155",
                }}
              >
                Bar Color
              </span>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: 10,
                  padding: "4px 8px",
                }}
              >
                <input
                  type="color"
                  value={safeBarColor}
                  onChange={(e) => setBarColor(e.target.value)}
                  title="Pick bar color"
                  style={{
                    width: 34,
                    height: 28,
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />

                <input
                  value={safeBarColor}
                  onChange={(e) => setBarColor(e.target.value)}
                  title="Bar color HEX"
                  style={{
                    width: 88,
                    height: 28,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "0 8px",
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: "#0f172a",
                    background: "#fff",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#334155",
                }}
              >
                Year
              </span>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  padding: "0 10px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {(availableYears.length ? availableYears : [defaultYear]).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          style={{
            padding: 14,
            overflow: "auto",
            background: "#fff",
            flex: "1 1 auto",
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,1))",
              padding: 16,
            }}
          >
            <div
              style={{
                height: 430,
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(74px, 1fr))",
                alignItems: "end",
                gap: 18,
                padding: "14px 8px 0 8px",
                borderBottom: "1px solid #d1d5db",
                position: "relative",
              }}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${(n / 4) * 100}%`,
                    borderTop: "1px dashed rgba(148,163,184,0.35)",
                    pointerEvents: "none",
                  }}
                />
              ))}

              {monthlyTotals.map((m) => {
                const totalValue = Number(m.total) || 0;
                const h =
                  maxValue > 0 && totalValue > 0
                    ? Math.max(6, (totalValue / maxValue) * 100)
                    : 0;

                return (
                  <div
                    key={m.monthIndex}
                    style={{
                      display: "grid",
                      gridTemplateRows: "32px 1fr 22px",
                      alignItems: "end",
                      justifyItems: "center",
                      minWidth: 0,
                      height: "100%",
                      gap: 10,
                    }}
                    title={`${m.label} ${selectedYear}: ${fmtNum(m.total)} ${
                      totalizerTotalUnit || ""
                    }`}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: "#0f172a",
                        textAlign: "center",
                        lineHeight: 1.15,
                        height: 32,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      {fmtNum(m.total)}
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 74,
                          height: `${h}%`,
                          minHeight: totalValue > 0 ? 12 : 0,
                          borderRadius: totalValue > 0 ? "12px 12px 0 0" : "0",
                          border:
                            totalValue > 0
                              ? `1px solid ${safeBarColor}`
                              : "none",
                          background:
                            totalValue > 0
                              ? `linear-gradient(180deg, ${safeBarColor}, ${safeBarColor})`
                              : "transparent",
                          boxShadow:
                            totalValue > 0
                              ? "0 6px 16px rgba(0,0,0,0.12)"
                              : "none",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#334155",
                        textAlign: "center",
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Each bar is the monthly totalizer amount for that month only.
              Past months stay fixed from historian data, while the current month
              keeps growing as new live points arrive. The calculation is
              unit-aware, uses time spacing between points, and does not bridge
              gaps larger than 1 hour.
            </div>
          </div>

          {/* TABLE */}
          <div
            style={{
              marginTop: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 1fr",
                gap: 0,
                background: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
                fontSize: 12,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              <div style={{ padding: 12 }}>Month</div>
              <div style={{ padding: 12 }}>Range</div>
              <div style={{ padding: 12 }}>Monthly Total</div>
            </div>

            {monthlyTotals.map((m) => {
              const startD = new Date(m.start);
              const endD = new Date(m.end - 1);

              const rangeText = `${
                MONTH_LABELS[startD.getMonth()]
              } ${startD.getDate()} - ${
                MONTH_LABELS[endD.getMonth()]
              } ${endD.getDate()}`;

              return (
                <div
                  key={`row-${m.monthIndex}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 1fr",
                    gap: 0,
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 12,
                    color: "#111827",
                  }}
                >
                  <div style={{ padding: 12, fontWeight: 900 }}>{m.label}</div>
                  <div style={{ padding: 12 }}>{rangeText}</div>
                  <div style={{ padding: 12, fontWeight: 900, color: "#0b3b18" }}>
                    {fmtNum(m.total)} {totalizerTotalUnit || ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}