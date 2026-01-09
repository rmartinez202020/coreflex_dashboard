import React, { useEffect, useMemo, useRef } from "react";

/**
 * GraphicDisplay.jsx
 * - Trend chart (Y vs time X)
 * - Record/Stop in PLAY mode
 * - Export CSV (Excel-friendly)
 *
 * Props:
 * - tank: the dropped object (shape: "graphicDisplay")
 * - onUpdate(updatedTank): updates droppedTanks in parent
 * - isPlay: boolean (dashboardMode === "play")
 * - sensorsData: array from API (same one you already pass around)
 */
export default function GraphicDisplay({
  tank,
  onUpdate,
  isPlay = false,
  sensorsData = [],
}) {
  const w = Math.max(260, Number(tank.w ?? tank.width ?? 520));
  const h = Math.max(160, Number(tank.h ?? tank.height ?? 260));

  // panel sizes
  const pad = 14;
  const headerH = 44;
  const footerH = 36;

  const chartX = pad;
  const chartY = pad + headerH;
  const chartW = w - pad * 2;
  const chartH = h - (pad + headerH + footerH + pad);

  const timeUnit = tank.timeUnit || "seconds";
  const sampleEveryMs = Math.max(200, Number(tank.sampleEveryMs ?? 1000));
  const windowCount = Math.max(10, Number(tank.windowCount ?? 60));

  const series = Array.isArray(tank.series) ? tank.series : [];
  const recording = !!tank.recording;
  const samples = Array.isArray(tank.samples) ? tank.samples : [];

  // ---- helpers ----
  const findDeviceValue = (deviceId, field) => {
    if (!deviceId || !field) return null;
    const dev = sensorsData.find(
      (d) => String(d.device_id ?? d.deviceId ?? d.id ?? "") === String(deviceId)
    );
    if (!dev) return null;
    const v = dev[field];
    if (v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const nowValues = useMemo(() => {
    // returns array of numbers aligned with series index
    return series.map((s) =>
      findDeviceValue(s.deviceId, s.field)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(series), sensorsData]);

  // keep latest references for the interval (avoid stale closure)
  const tankRef = useRef(tank);
  const valuesRef = useRef(nowValues);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    tankRef.current = tank;
  }, [tank]);

  useEffect(() => {
    valuesRef.current = nowValues;
  }, [nowValues]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // ---- recording loop (only in PLAY, only when tank.recording true) ----
  useEffect(() => {
    if (!isPlay) return;
    if (!recording) return;

    const interval = setInterval(() => {
      const t = new Date().toISOString();

      // store values by series index: s0, s1, s2...
      const values = {};
      (valuesRef.current || []).forEach((v, idx) => {
        values[`s${idx}`] = v;
      });

      const current = tankRef.current;
      const prevSamples = Array.isArray(current.samples) ? current.samples : [];

      const nextSamples = [...prevSamples, { t, values }];

      // keep memory bounded (optional): keep last 10k points
      const bounded =
        nextSamples.length > 10000
          ? nextSamples.slice(nextSamples.length - 10000)
          : nextSamples;

      onUpdateRef.current?.({
        ...current,
        samples: bounded,
      });
    }, sampleEveryMs);

    return () => clearInterval(interval);
  }, [isPlay, recording, sampleEveryMs]);

  // ---- chart data window ----
  const viewSamples = useMemo(() => {
    const last = samples.slice(Math.max(0, samples.length - windowCount));
    return last;
  }, [samples, windowCount]);

  // derive y-range across all series for visible window
  const { yMin, yMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    viewSamples.forEach((s) => {
      series.forEach((_, idx) => {
        const v = s?.values?.[`s${idx}`];
        if (v === null || v === undefined) return;
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        min = Math.min(min, n);
        max = Math.max(max, n);
      });
    });

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { yMin: 0, yMax: 100 };
    }

    // padding
    if (min === max) {
      return { yMin: min - 1, yMax: max + 1 };
    }
    const padY = (max - min) * 0.12;
    return { yMin: min - padY, yMax: max + padY };
  }, [viewSamples, series]);

  const toX = (i) => {
    if (viewSamples.length <= 1) return chartX;
    return chartX + (i / (viewSamples.length - 1)) * chartW;
  };

  const toY = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return chartY + chartH / 2;
    const t = (n - yMin) / (yMax - yMin);
    // invert for svg
    return chartY + (1 - t) * chartH;
  };

  const buildPolyline = (idx) => {
    const pts = viewSamples
      .map((s, i) => {
        const v = s?.values?.[`s${idx}`];
        if (v === null || v === undefined) return null;
        const x = toX(i);
        const y = toY(v);
        return `${x},${y}`;
      })
      .filter(Boolean);

    return pts.join(" ");
  };

  const toggleRecord = (e) => {
    e.stopPropagation();
    if (!isPlay) return;

    onUpdate?.({
      ...tank,
      recording: !recording,
    });
  };

  const clearSamples = (e) => {
    e.stopPropagation();
    if (!isPlay) return;

    onUpdate?.({
      ...tank,
      samples: [],
    });
  };

  const exportCSV = (e) => {
    e.stopPropagation();

    const cols = [
      "timestamp",
      ...series.map((s, idx) => (s?.name ? s.name : `S${idx}`)),
    ];

    const rows = samples.map((s) => {
      const line = [s.t];
      series.forEach((_, idx) => {
        const v = s?.values?.[`s${idx}`];
        line.push(v === null || v === undefined ? "" : String(v));
      });
      return line;
    });

    const csv = [cols, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const c = String(cell ?? "");
            // CSV safe quoting
            if (c.includes(",") || c.includes('"') || c.includes("\n")) {
              return `"${c.replace(/"/g, '""')}"`;
            }
            return c;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const stamp = new Date().toISOString().replaceAll(":", "-");
    a.href = url;
    a.download = `coreflex-graphic-display-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const headerText = tank.title || "Graphic Display";

  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 12,
        background:
          "linear-gradient(180deg, #ffffff 0%, #f3f3f3 100%)",
        border: "2px solid #cfcfcf",
        boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: headerH,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.10)",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.00) 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 900, color: "#111", lineHeight: 1 }}>
            {headerText}
          </div>
          <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>
            Time: {timeUnit} • Sample: {Math.round(sampleEveryMs)} ms • Window:{" "}
            {windowCount}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={toggleRecord}
            style={{
              cursor: isPlay ? "pointer" : "not-allowed",
              opacity: isPlay ? 1 : 0.45,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              background: recording
                ? "linear-gradient(180deg, #ff5a5a 0%, #d60000 100%)"
                : "linear-gradient(180deg, #2ee04c 0%, #14a82e 100%)",
              color: "white",
              fontWeight: 900,
              boxShadow: "0 6px 12px rgba(0,0,0,0.16)",
            }}
            title={isPlay ? "Record samples" : "Only available in Play mode"}
          >
            {recording ? "STOP" : "RECORD"}
          </button>

          <button
            onClick={exportCSV}
            disabled={!samples.length}
            style={{
              cursor: samples.length ? "pointer" : "not-allowed",
              opacity: samples.length ? 1 : 0.45,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              background:
                "linear-gradient(180deg, #ffffff 0%, #e9e9e9 100%)",
              color: "#111",
              fontWeight: 900,
              boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
            }}
            title="Export to CSV (Excel)"
          >
            EXPORT
          </button>

          <button
            onClick={clearSamples}
            disabled={!isPlay || !samples.length}
            style={{
              cursor: isPlay && samples.length ? "pointer" : "not-allowed",
              opacity: isPlay && samples.length ? 1 : 0.45,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.18)",
              background:
                "linear-gradient(180deg, #ffffff 0%, #e9e9e9 100%)",
              color: "#111",
              fontWeight: 900,
              boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
            }}
            title="Clear recorded samples"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Chart */}
      <svg
        width={w}
        height={h}
        style={{ display: "block" }}
        viewBox={`0 0 ${w} ${h}`}
      >
        {/* chart background */}
        <rect
          x={chartX}
          y={chartY}
          width={chartW}
          height={chartH}
          rx="10"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.14)"
          strokeWidth="1.5"
        />

        {/* grid */}
        {Array.from({ length: 6 }).map((_, i) => {
          const yy = chartY + (i / 5) * chartH;
          return (
            <line
              key={`gy-${i}`}
              x1={chartX}
              x2={chartX + chartW}
              y1={yy}
              y2={yy}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {Array.from({ length: 9 }).map((_, i) => {
          const xx = chartX + (i / 8) * chartW;
          return (
            <line
              key={`gx-${i}`}
              y1={chartY}
              y2={chartY + chartH}
              x1={xx}
              x2={xx}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />
          );
        })}

        {/* y-axis labels (min/max) */}
        <text
          x={chartX + 10}
          y={chartY + 18}
          fontSize="12"
          fontFamily="monospace"
          fill="rgba(0,0,0,0.70)"
        >
          {yMax.toFixed(2)}
        </text>
        <text
          x={chartX + 10}
          y={chartY + chartH - 10}
          fontSize="12"
          fontFamily="monospace"
          fill="rgba(0,0,0,0.70)"
        >
          {yMin.toFixed(2)}
        </text>

        {/* series lines */}
        {series.map((s, idx) => {
          const pts = buildPolyline(idx);
          if (!pts) return null;

          // basic palette (no hard dependency)
          const colors = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#f59e0b"];
          const stroke = colors[idx % colors.length];

          return (
            <polyline
              key={`line-${idx}`}
              points={pts}
              fill="none"
              stroke={stroke}
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.95"
            />
          );
        })}
      </svg>

      {/* Footer legend */}
      <div
        style={{
          height: footerH,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: "1px solid rgba(0,0,0,0.10)",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.03) 100%)",
          fontSize: 12,
          color: "#222",
        }}
      >
        <div style={{ fontWeight: 900 }}>Inputs:</div>
        {series.length === 0 ? (
          <div style={{ color: "#666" }}>No series configured</div>
        ) : (
          series.map((s, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#f59e0b"][idx % 5],
                }}
              />
              <div style={{ fontWeight: 800 }}>
                {s?.name || `S${idx}`}
              </div>
            </div>
          ))
        )}

        <div style={{ marginLeft: "auto", fontFamily: "monospace", fontWeight: 800 }}>
          {recording ? "● REC" : "○ IDLE"} • {samples.length} samples
        </div>
      </div>
    </div>
  );
}
