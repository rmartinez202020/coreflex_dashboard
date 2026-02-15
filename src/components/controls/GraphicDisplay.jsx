// src/components/controls/GraphicDisplay.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

const MODEL_META = {
  zhc1921: { base: "zhc1921" },
  zhc1661: { base: "zhc1661" },
  tp4000: { base: "tp4000" }, // safe if you later add
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "a"),
    f.replace("ai", "A"),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const directCandidates =
    base === "zhc1921"
      ? [
          `/zhc1921/device/${deviceId}`,
          `/zhc1921/devices/${deviceId}`,
          `/zhc1921/${deviceId}`,
          `/zhc1921/one/${deviceId}`,
        ]
      : base === "zhc1661"
      ? [
          `/zhc1661/device/${deviceId}`,
          `/zhc1661/devices/${deviceId}`,
          `/zhc1661/${deviceId}`,
          `/zhc1661/one/${deviceId}`,
        ]
      : [];

  for (const p of directCandidates) {
    try {
      const r = await apiGet(p, { signal });
      return r?.row ?? r?.device ?? r;
    } catch (e) {
      // continue
    }
  }

  // fallback list scan (some endpoints only give live in list)
  const rawCandidates =
    base === "zhc1921"
      ? ["/zhc1921/devices", "/zhc1921/my-devices", "/zhc1921/list", "/zhc1921"]
      : base === "zhc1661"
      ? ["/zhc1661/devices", "/zhc1661/my-devices", "/zhc1661/list", "/zhc1661"]
      : [];

  for (const p of rawCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      const rawRow =
        arr.find((r) => {
          const id =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";
          return String(id) === String(deviceId);
        }) || null;

      if (rawRow) return rawRow;
    } catch (e) {
      // continue
    }
  }

  return null;
}

// ✅ compute math output safely (VALUE or value)
function computeMathOutput(liveValue, formula) {
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
    // sandbox-ish: only "value" is provided (no window, no document)
    // eslint-disable-next-line no-new-func
    const fn = new Function("value", `"use strict"; return (${expr});`);
    const out = fn(v);
    const num = typeof out === "number" ? out : Number(out);
    return Number.isFinite(num) ? num : null;
  } catch (e) {
    return null;
  }
}

function msPerUnit(timeUnit) {
  const u = String(timeUnit || "").toLowerCase();
  if (u === "minutes" || u === "minute" || u === "min") return 60000;
  if (u === "hours" || u === "hour" || u === "hr") return 3600000;
  return 1000; // seconds default
}

export default function GraphicDisplay({ tank }) {
  const title = tank?.title ?? "Graphic Display";
  const timeUnit = tank?.timeUnit ?? "seconds";
  const windowSize = Number(tank?.window ?? 60);
  const sampleMs = Number(tank?.sampleMs ?? 1000);

  const yMin = Number.isFinite(tank?.yMin) ? tank.yMin : 0;
  const yMax = Number.isFinite(tank?.yMax) ? tank.yMax : 100;
  const yUnits = tank?.yUnits ?? "";
  const graphStyle = tank?.graphStyle ?? "line";

  // ✅ binding + math
  const bindModel = tank?.bindModel ?? "zhc1921";
  const bindDeviceId = String(tank?.bindDeviceId ?? "").trim();
  const bindField = String(tank?.bindField ?? "ai1").trim();
  const mathFormula = tank?.mathFormula ?? "";

  // ✅ grid divisions
  const yDivs = Number.isFinite(tank?.yDivs) ? Math.max(2, tank.yDivs) : 10;
  const xDivs = Number.isFinite(tank?.xDivs) ? Math.max(2, tank.xDivs) : 12;
  const yMinor = Number.isFinite(tank?.yMinor) ? Math.max(1, tank.yMinor) : 2;
  const xMinor = Number.isFinite(tank?.xMinor) ? Math.max(1, tank.xMinor) : 2;

  const styleBadge = (() => {
    if (graphStyle === "line") return "LINE";
    if (graphStyle === "area") return "AREA";
    if (graphStyle === "bar") return "BAR";
    if (graphStyle === "step") return "STEP";
    return "LINE";
  })();

  // ✅ derived Y ticks
  const yTicks = useMemo(() => {
    const min = Number(yMin);
    const max = Number(yMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return [];
    const step = (max - min) / yDivs;
    const arr = [];
    for (let i = 0; i <= yDivs; i++) arr.push(min + step * i);
    return arr;
  }, [yMin, yMax, yDivs]);

  // ✅ background grid (major + minor)
  const gridBackground = useMemo(() => {
    const majorX = Math.max(24, Math.round(520 / xDivs));
    const majorY = Math.max(20, Math.round(260 / yDivs));
    const minorX = Math.max(8, Math.round(majorX / (xMinor + 1)));
    const minorY = Math.max(8, Math.round(majorY / (yMinor + 1)));

    return {
      backgroundImage: `
        linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px),
        linear-gradient(to right, rgba(0,0,0,0.085) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0,0,0,0.085) 1px, transparent 1px)
      `,
      backgroundSize: `
        ${minorX}px ${minorY}px,
        ${minorX}px ${minorY}px,
        ${majorX}px ${majorY}px,
        ${majorX}px ${majorY}px
      `,
      backgroundPosition: `0 0, 0 0, 0 0, 0 0`,
    };
  }, [xDivs, yDivs, xMinor, yMinor]);

  // ===============================
  // ✅ LIVE POLL + MATH OUTPUT + TREND POINTS
  // ===============================
  const [liveValue, setLiveValue] = useState(null);
  const [mathOutput, setMathOutput] = useState(null);
  const [err, setErr] = useState("");

  const [points, setPoints] = useState([]); // [{t:number, y:number}]

  const maxPoints = useMemo(() => {
    const win = Number.isFinite(windowSize) ? Math.max(2, windowSize) : 60;
    const smp = Number.isFinite(sampleMs) ? Math.max(250, sampleMs) : 1000;
    const units = msPerUnit(timeUnit);
    const totalMs = win * units;
    return Math.max(2, Math.round(totalMs / smp));
  }, [windowSize, sampleMs, timeUnit]);

  // ✅ avoid stale maxPoints in interval closure
  const maxPointsRef = useRef(maxPoints);
  useEffect(() => {
    maxPointsRef.current = maxPoints;
  }, [maxPoints]);

  useEffect(() => {
    // reset points if binding missing
    if (!bindDeviceId || !bindField) {
      setLiveValue(null);
      setMathOutput(null);
      setErr("");
      setPoints([]);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setErr("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        const raw = row ? readAiField(row, bindField) : null;

        const num =
          raw === null || raw === undefined || raw === ""
            ? null
            : typeof raw === "number"
            ? raw
            : Number(raw);

        const safeLive = Number.isFinite(num) ? num : null;
        const out = computeMathOutput(safeLive, mathFormula);

        if (cancelled) return;

        setLiveValue(safeLive);
        setMathOutput(out);

        if (Number.isFinite(out)) {
          const t = Date.now();
          setPoints((prev) => {
            const next = [...prev, { t, y: out }];
            const limit = maxPointsRef.current || 2;
            if (next.length > limit) next.splice(0, next.length - limit);
            return next;
          });
        }
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setErr("Trend read failed (device endpoint / tag field).");
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 1000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [bindModel, bindDeviceId, bindField, sampleMs, mathFormula]);

  // ===============================
  // ✅ SVG PATH from points (TIME-BASED X so it always moves LEFT -> RIGHT)
  // ===============================
  const svg = useMemo(() => {
    const W = 1000;
    const H = 360;

    const minY = Number(yMin);
    const maxY = Number(yMax);
    const ySpan = maxY - minY;

    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || ySpan <= 0) {
      return { poly: "", W, H };
    }

    if (!points.length) {
      return { poly: "", W, H };
    }

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    // ✅ time scale: oldest at left, newest at right
    const tMin = points[0]?.t ?? Date.now();
    const tMax = points[points.length - 1]?.t ?? tMin;
    const tSpan = Math.max(1, tMax - tMin);

    const coords = points.map((p) => {
      const x = ((p.t - tMin) / tSpan) * W;
      const yy = clamp(p.y, minY, maxY);
      const y = H - ((yy - minY) / ySpan) * H;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return { poly: coords.join(" "), W, H };
  }, [points, yMin, yMax]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #cfcfcf",
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none", // ✅ passive so dragging works
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "6px 10px",
          borderBottom: "1px solid #e6e6e6",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
          flex: "0 0 auto",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 800,
              border: "1px solid #ddd",
              borderRadius: 999,
              padding: "2px 8px",
              background: "#fff",
              color: "#333",
              flex: "0 0 auto",
            }}
          >
            {styleBadge}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#444",
            fontSize: 11,
            marginTop: 4,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <span>
            Time: <b>{timeUnit}</b>
          </span>
          <span>•</span>
          <span>
            Sample: <b>{sampleMs} ms</b>
          </span>
          <span>•</span>
          <span>
            Window: <b>{windowSize}</b>
          </span>
          <span>•</span>
          <span>
            Y: <b>{yMin}</b> → <b>{yMax}</b> {yUnits ? `(${yUnits})` : ""}
          </span>

          <span style={{ marginLeft: "auto" }}>
            Output:{" "}
            <b>{Number.isFinite(mathOutput) ? mathOutput.toFixed(2) : "--"}</b>
          </span>
        </div>
      </div>

      {/* BODY */}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          padding: 12,
          display: "flex",
        }}
      >
        <div
          style={{
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            width: "100%",
            height: "100%",
            borderRadius: 10,
            background: "linear-gradient(180deg,#ffffff,#fbfbfb)",
            position: "relative",
            overflow: "hidden",
            border: "1px solid #d9d9d9",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              ...gridBackground,
              pointerEvents: "none",
            }}
          />

          {yTicks.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                bottom: 8,
                width: 64,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {[...yTicks].reverse().map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#555",
                    background: "rgba(255,255,255,0.78)",
                    padding: "1px 6px",
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  {Number(v).toFixed(2)}
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              position: "absolute",
              left: 84,
              right: 10,
              top: 10,
              bottom: 10,
              pointerEvents: "none",
            }}
          >
            <svg
              viewBox={`0 0 ${svg.W} ${svg.H}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {svg.poly ? (
                <polyline
                  fill="none"
                  stroke="rgba(12, 90, 200, 0.95)"
                  strokeWidth="3"
                  points={svg.poly}
                />
              ) : null}
            </svg>

            <div
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                fontFamily: "monospace",
                fontSize: 12,
                fontWeight: 900,
                color: "#0b3b18",
                background: "rgba(255,255,255,0.85)",
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {Number.isFinite(mathOutput) ? mathOutput.toFixed(2) : "--"}
            </div>

            {err ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  bottom: 10,
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#991b1b",
                  background: "rgba(255,241,242,0.92)",
                  border: "1px solid #fecaca",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                {err}
              </div>
            ) : null}
          </div>

          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              fontSize: 11,
              fontWeight: 900,
              color: "#666",
              background: "rgba(255,255,255,0.75)",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {styleBadge} MODE
          </div>
        </div>
      </div>
    </div>
  );
}
