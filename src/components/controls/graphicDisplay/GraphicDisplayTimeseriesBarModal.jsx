import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../../config/api";
import { getToken } from "../../../utils/authToken";

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

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseHistorianTs(ts) {
  if (typeof ts !== "string") return null;

  const s = ts.trim();
  if (!s) return null;

  const direct = new Date(s).getTime();
  if (Number.isFinite(direct)) return direct;

  const m = s.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i
  );

  if (!m) return null;

  let [, mm, dd, yyyy, hh, min, sec, ap] = m;
  let hour = Number(hh);
  const month = Number(mm) - 1;
  const day = Number(dd);
  const year = Number(yyyy);
  const minute = Number(min);
  const second = Number(sec);
  const ampm = String(ap || "").toUpperCase();

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const t = new Date(year, month, day, hour, minute, second, 0).getTime();
  return Number.isFinite(t) ? t : null;
}

function normalizeHexColor(v, fallback = DEFAULT_BAR_COLOR) {
  const s = String(v || "").trim();
  if (!s) return fallback;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s}`;
  return fallback;
}

function buildBarColorStorageKey(title, totalizerRateUnit, totalizerTotalUnit) {
  const safeTitle = String(title || "Graphic Display").trim().toLowerCase();
  const safeRate = String(totalizerRateUnit || "").trim().toLowerCase();
  const safeTotal = String(totalizerTotalUnit || "").trim().toLowerCase();

  return `coreflex:graphic-display:timeseries-bar-color:${safeTitle}:${safeRate}:${safeTotal}`;
}

function fmtNum(v) {
  return Number.isFinite(v) ? Number(v).toFixed(2) : "0.00";
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

function normalizeTotalizerHistorianRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const t =
        toNumber(row?.t) ??
        parseHistorianTs(row?.ts) ??
        toNumber(row?.timestamp) ??
        toNumber(row?.time);

      const y =
        toNumber(row?.totalizer) ??
        toNumber(row?.yTotalizer) ??
        toNumber(row?.totalizerValue);

      return {
        t,
        y,
        status: String(row?.status || "").trim().toLowerCase(),
      };
    })
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.y))
    .sort((a, b) => a.t - b.t);
}

function buildMonthlyTotalsFromTotalizer(points, year) {
  const src = (Array.isArray(points) ? points : [])
    .filter((p) => {
      const t = Number(p?.t);
      const y = Number(p?.y);
      return Number.isFinite(t) && Number.isFinite(y);
    })
    .sort((a, b) => Number(a.t) - Number(b.t));

  return MONTH_LABELS.map((label, idx) => {
    const start = new Date(year, idx, 1, 0, 0, 0, 0).getTime();
    const end = new Date(year, idx + 1, 1, 0, 0, 0, 0).getTime();

    const monthPoints = src.filter((p) => {
      const t = Number(p.t);
      return t >= start && t < end;
    });

    let total = 0;

    if (monthPoints.length >= 2) {
      const firstValue = Number(monthPoints[0].y);
      const lastValue = Number(monthPoints[monthPoints.length - 1].y);
      const diff = lastValue - firstValue;
      total = Number.isFinite(diff) && diff > 0 ? diff : 0;
    }

    return {
      monthIndex: idx,
      label,
      total,
      start,
      end,
    };
  });
}

export default function GraphicDisplayTimeseriesBarModal({
  open = false,
  onClose = () => {},
  title = "Graphic Display",
  points = [],
  totalizerRateUnit = "",
  totalizerTotalUnit = "",
  widgetId = "",
  dashboardId = "",
}) {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const storageKey = useMemo(() => {
    return buildBarColorStorageKey(title, totalizerRateUnit, totalizerTotalUnit);
  }, [title, totalizerRateUnit, totalizerTotalUnit]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [barColor, setBarColor] = useState(DEFAULT_BAR_COLOR);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [totalizerPoints, setTotalizerPoints] = useState([]);

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
      // ignore
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

  useEffect(() => {
    let cancelled = false;

    async function loadTotalizerHistory() {
      if (!open) return;

      const safeWidgetId = String(widgetId || "").trim();
      const safeDashboardId = String(dashboardId || "").trim();

      if (!safeWidgetId || !safeDashboardId) {
        setTotalizerPoints([]);
        setHistoryError("Missing widget or dashboard id.");
        return;
      }

      const token = String(getToken() || "").trim();
      if (!token) {
        setTotalizerPoints([]);
        setHistoryError("Missing auth token.");
        return;
      }

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const url = new URL(`${API_URL}/graphic-display-bindings/history`);
        url.searchParams.set("dashboard_id", safeDashboardId);
        url.searchParams.set("widget_id", safeWidgetId);

        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`History request failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        const normalized = normalizeTotalizerHistorianRows(data?.points || []);

        if (cancelled) return;

        setTotalizerPoints(normalized);

        const years = collectAvailableYears(normalized);
        if (years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        } else {
          setSelectedYear(new Date().getFullYear());
        }
      } catch (e) {
        if (cancelled) return;
        setTotalizerPoints([]);
        setHistoryError(
          e?.message || "Failed to load totalizer history."
        );
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadTotalizerHistory();

    return () => {
      cancelled = true;
    };
  }, [open, widgetId, dashboardId]);

  const safeBarColor = useMemo(
    () => normalizeHexColor(barColor, DEFAULT_BAR_COLOR),
    [barColor]
  );

  const availableYears = useMemo(
    () => collectAvailableYears(totalizerPoints),
    [totalizerPoints]
  );

  const monthlyTotals = useMemo(() => {
    return buildMonthlyTotalsFromTotalizer(totalizerPoints, selectedYear);
  }, [totalizerPoints, selectedYear]);

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
                {(availableYears.length ? availableYears : [selectedYear]).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 14,
            overflow: "auto",
            background: "#fff",
            flex: "1 1 auto",
          }}
        >
          {historyLoading ? (
            <div
              style={{
                padding: 18,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                background: "#f8fafc",
                fontSize: 14,
                fontWeight: 800,
                color: "#334155",
              }}
            >
              Loading totalizer history...
            </div>
          ) : historyError ? (
            <div
              style={{
                padding: 18,
                border: "1px solid #fecaca",
                borderRadius: 14,
                background: "#fff1f2",
                fontSize: 14,
                fontWeight: 800,
                color: "#b91c1c",
              }}
            >
              {historyError}
            </div>
          ) : (
            <>
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
                      maxValue > 0
                        ? Math.max(6, (Number(m.total) / maxValue) * 100)
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
                              minHeight: maxValue > 0 ? 12 : 2,
                              borderRadius: "12px 12px 0 0",
                              border: `1px solid ${safeBarColor}`,
                              background: `linear-gradient(180deg, ${safeBarColor}, ${safeBarColor})`,
                              boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
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
                  Each bar is calculated as the last totalizer value of the month
                  minus the first totalizer value of the month.
                </div>
              </div>

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
                      <div style={{ padding: 12, fontWeight: 900 }}>
                        {m.label}
                      </div>
                      <div style={{ padding: 12 }}>{rangeText}</div>
                      <div
                        style={{
                          padding: 12,
                          fontWeight: 900,
                          color: "#0b3b18",
                        }}
                      >
                        {fmtNum(m.total)} {totalizerTotalUnit || ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
}