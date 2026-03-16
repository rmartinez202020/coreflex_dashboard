// src/components/controls/graphicDisplay/GraphicDisplayTimeseriesBarModal.jsx
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

function lerpValueAtTime(p1, p2, targetT) {
  const t1 = Number(p1?.t);
  const t2 = Number(p2?.t);
  const y1 = Number(p1?.y);
  const y2 = Number(p2?.y);

  if (
    !Number.isFinite(t1) ||
    !Number.isFinite(t2) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(y2)
  ) {
    return null;
  }

  if (t2 <= t1) return y1;
  if (targetT <= t1) return y1;
  if (targetT >= t2) return y2;

  const ratio = (targetT - t1) / (t2 - t1);
  return y1 + (y2 - y1) * ratio;
}

function integrateSegment(y1, y2, dtMs, base) {
  if (!Number.isFinite(y1) || !Number.isFinite(y2) || !Number.isFinite(dtMs)) {
    return 0;
  }
  if (dtMs <= 0) return 0;

  let dtBase = 0;
  if (base === "minute") dtBase = dtMs / 60000;
  else if (base === "hour") dtBase = dtMs / 3600000;
  else if (base === "second") dtBase = dtMs / 1000;
  else if (base === "day") dtBase = dtMs / 86400000;
  else return 0;

  if (!Number.isFinite(dtBase) || dtBase <= 0) return 0;

  const avgRate = (y1 + y2) / 2;

  // ✅ same behavior as your live totalizer: do not accumulate if avg <= 0
  if (!Number.isFinite(avgRate) || avgRate <= 0) return 0;

  return avgRate * dtBase;
}

function integrateWithinRange(points, startT, endT, base) {
  if (!Array.isArray(points) || points.length < 2) return 0;
  if (!Number.isFinite(startT) || !Number.isFinite(endT) || endT <= startT) {
    return 0;
  }
  if (!base) return 0;

  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    const t1 = Number(p1.t);
    const t2 = Number(p2.t);
    if (!Number.isFinite(t1) || !Number.isFinite(t2) || t2 <= t1) continue;

    const segStart = Math.max(startT, t1);
    const segEnd = Math.min(endT, t2);
    if (segEnd <= segStart) continue;

    const yStart =
      segStart === t1 ? p1.y : lerpValueAtTime(p1, p2, segStart);
    const yEnd =
      segEnd === t2 ? p2.y : lerpValueAtTime(p1, p2, segEnd);

    total += integrateSegment(yStart, yEnd, segEnd - segStart, base);
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

    // ✅ each month starts from zero independently
    const total = integrateWithinRange(points, start, end, base);

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

  const [selectedYear, setSelectedYear] = useState(defaultYear);

  useEffect(() => {
    setSelectedYear(defaultYear);
  }, [defaultYear, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
                const h =
                  maxValue > 0 ? Math.max(6, (Number(m.total) / maxValue) * 100) : 0;

                return (
                  <div
                    key={m.monthIndex}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "end",
                      minWidth: 0,
                      gap: 10,
                      height: "100%",
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
                        minHeight: 32,
                      }}
                    >
                      {fmtNum(m.total)}
                    </div>

                    <div
                      style={{
                        width: "100%",
                        maxWidth: 74,
                        height: `${h}%`,
                        minHeight: maxValue > 0 ? 12 : 2,
                        borderRadius: "12px 12px 0 0",
                        border: "1px solid rgba(234,179,8,0.45)",
                        background: "linear-gradient(180deg,#facc15,#f59e0b)",
                        boxShadow: "0 6px 16px rgba(245,158,11,0.18)",
                      }}
                    />

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#334155",
                        textAlign: "center",
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
              January starts at zero, February starts again at zero, then March,
              April, and so on.
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