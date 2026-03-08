// src/components/controls/graphicDisplay/GraphicDisplayPanel.jsx
import React, { useMemo } from "react";
import GraphicDisplayHeader from "./GraphicDisplayHeader";

const DEFAULT_LINE_COLOR = "#0c5ac8";
const FRAME_LINE = "1px solid #cfcfcf";

function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
}

// ✅ Detect Launch mode robustly (query, path, hash)
function detectLaunchMode() {
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

function formatDateTimeLocalValue(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

const exploreInputWrapStyle = {
  display: "grid",
  gap: 4,
  minWidth: 210,
};

const exploreLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: "#334155",
  letterSpacing: 0.1,
};

const exploreInputStyle = {
  height: 34,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  padding: "0 10px",
  fontSize: 12,
  fontWeight: 700,
  color: "#0f172a",
  outline: "none",
  minWidth: 0,
};

export default function GraphicDisplayPanel({
  // mode
  isExploreMode = false,
  isPlay = false,

  // header basics
  title = "Graphic Display",
  lineColor: lineColorProp,
  styleBadge = "",

  // status pill (already computed in parent)
  statusLabel = {
    text: "--",
    color: "#64748b",
    bg: "rgba(148,163,184,0.16)",
    border: "rgba(148,163,184,0.35)",
  },
  bindDeviceId = "",

  singleUnitsEnabled = false,
  singleUnit = "",

  // totalizer (computed in parent GraphicDisplay.jsx)
  totalizerEnabled = false,
  totalizerRateUnit = "",
  totalizerTotalUnit = "",
  totalizerValue = null,

  // totalizer controls (parent MUST wire these to persist setting)
  onTotalizerEnable = () => {},
  onTotalizerDisable = () => {},
  onTotalizerReset = () => {},

  // (kept for backwards compatibility if parent still passes them; not used now)
  totalizerIsPlaying: _totalizerIsPlayingProp,
  onTotalizerPlay: _onTotalizerPlay,
  onTotalizerPause: _onTotalizerPause,

  // ✅ NEW: Settings button handler (parent should open GraphicDisplaySettingsModal)
  onOpenSettings = () => {},

  // ✅ NEW: Explore-IN range controls
  exploreStart = "",
  exploreEnd = "",
  onExploreStartChange = () => {},
  onExploreEndChange = () => {},

  // control state + handlers
  isPlaying = true,
  onPlay = () => {},
  onPause = () => {},
  onToggleExplore = () => {},
  onExport = () => {},

  // info row
  timeUnit = "seconds",
  sampleMs = 1000,
  windowSize = 60,
  yMin = 0,
  yMax = 100,
  yUnits = "",

  // layout
  gridBackground = {},
  yTicks = [],

  // plot interaction (from usePingZoom)
  plotRef,
  handlers = {},
  sel = null,
  hover = null,
  timeTicks = [],
  fmtTime = (t) => new Date(t).toISOString(),

  // svg (from useTrendSvg)
  svg = { W: 1000, H: 420, segs: [] },

  // outputs
  mathOutput = null,
  err = "",
}) {
  const lineColor = useMemo(
    () => normalizeLineColor(lineColorProp),
    [lineColorProp]
  );

  const strokeW = isExploreMode ? 2 : 3;

  // ✅ SMALLER Y font
  const yFont = isExploreMode ? 12 : 10;

  // show vector/hover/selection visuals ONLY in Explore IN mode
  const showVectors = !!isExploreMode;

  // ✅ Treat Launch like Play (so controls + unit behaviors match)
  const isRunMode = useMemo(() => {
    return !!isPlay || detectLaunchMode();
  }, [isPlay]);

  // ✅ If Single Units is enabled, hide Totalizer Controls
  const showTotalizerControls = !!isRunMode && !singleUnitsEnabled;

  // ✅ If Single Units is enabled, totalizer display is suppressed
  const totalizerEnabledEffective = !!totalizerEnabled && !singleUnitsEnabled;

  // wrappers: stop propagation but still call hook handlers
  const onPointerMove = (e) => {
    e.stopPropagation();
    handlers?.onPointerMove?.(e);
  };
  const onPointerLeave = (e) => {
    handlers?.onPointerLeave?.(e);
  };
  const onPointerDown = (e) => {
    e.stopPropagation();
    handlers?.onPointerDown?.(e);
  };
  const onPointerUp = (e) => {
    handlers?.onPointerUp?.(e);
  };
  const onPointerCancel = (e) => {
    handlers?.onPointerUp?.(e);
  };
  const onDoubleClick = (e) => {
    e.stopPropagation();
    handlers?.onDoubleClick?.(e);
  };

  const onTotEnableClick = () => onTotalizerEnable?.();
  const onTotDisableClick = () => onTotalizerDisable?.();
  const onTotResetClick = () => {
    if (!totalizerEnabledEffective) return;
    onTotalizerReset?.();
  };

  const totalText = useMemo(() => {
    if (!totalizerEnabledEffective) return "--";
    if (!totalizerTotalUnit) return "--";
    if (!Number.isFinite(totalizerValue)) return "--";
    return `${Number(totalizerValue).toFixed(2)} ${totalizerTotalUnit}`;
  }, [totalizerEnabledEffective, totalizerTotalUnit, totalizerValue]);

  const totalTitle = useMemo(() => {
    if (!totalizerEnabledEffective) return "";
    if (!totalizerRateUnit) return "Totalizer";
    return `Totalizer integrated from ${totalizerRateUnit}`;
  }, [totalizerEnabledEffective, totalizerRateUnit]);

  // ✅ OUTPUT UNIT PRIORITY:
  // - Single Units -> singleUnit
  // - Totalizer enabled -> totalizerRateUnit
  // - fallback -> yUnits
  const outputUnitText = useMemo(() => {
    const su = String(singleUnit || "").trim();
    if (singleUnitsEnabled && su) return su;

    const rateU = String(totalizerRateUnit || "").trim();
    if (totalizerEnabledEffective && rateU) return rateU;

    const u = String(yUnits || "").trim();
    return u ? u : "";
  }, [
    singleUnitsEnabled,
    singleUnit,
    totalizerEnabledEffective,
    totalizerRateUnit,
    yUnits,
  ]);

  const unitBadgeText = useMemo(() => {
    const su = String(singleUnit || "").trim();
    return singleUnitsEnabled && su ? su : "";
  }, [singleUnitsEnabled, singleUnit]);

  // ✅ Settings button:
  // - Show ONLY in normal panel (not Explore)
  // - Hide in Play + Launch (Run mode)
  const showSettingsBtn = !isExploreMode && !isRunMode;

  // ✅ build positioned Y ticks (top aligned to matching grid line)
  const yTickItems = useMemo(() => {
    const arr = Array.isArray(yTicks) ? yTicks : [];
    if (arr.length === 0) return [];

    const sorted = [...arr].sort((a, b) => Number(a) - Number(b)); // low->high
    const denom = Math.max(1, sorted.length - 1);

    // top should be max, bottom should be min -> invert
    return sorted.map((v, i) => {
      const pctFromTop = (1 - i / denom) * 100; // 100->0
      return { v: Number(v), topPct: pctFromTop };
    });
  }, [yTicks]);

  const exploreStartValue = useMemo(
    () => formatDateTimeLocalValue(exploreStart),
    [exploreStart]
  );
  const exploreEndValue = useMemo(
    () => formatDateTimeLocalValue(exploreEnd),
    [exploreEnd]
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: 10,
        border: FRAME_LINE,
        boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* ✅ HEADER extracted */}
      <GraphicDisplayHeader
        isExploreMode={isExploreMode}
        isRunMode={isRunMode}
        title={title}
        lineColor={lineColor}
        styleBadge={styleBadge}
        statusLabel={statusLabel}
        bindDeviceId={bindDeviceId}
        showSettingsBtn={showSettingsBtn}
        onOpenSettings={onOpenSettings}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onToggleExplore={onToggleExplore}
        onExport={onExport}
        showTotalizerControls={showTotalizerControls}
        totalizerEnabledEffective={totalizerEnabledEffective}
        onTotEnableClick={onTotEnableClick}
        onTotDisableClick={onTotDisableClick}
        onTotResetClick={onTotResetClick}
        mathOutput={mathOutput}
        outputUnitText={outputUnitText}
        unitBadgeText={unitBadgeText}
        totalText={totalText}
        totalTitle={totalTitle}
        timeUnit={timeUnit}
        sampleMs={sampleMs}
        windowSize={windowSize}
        yMin={yMin}
        yMax={yMax}
      />

      {/* ✅ Explore-IN only date filter row */}
      {isExploreMode ? (
        <div
          style={{
            padding: "8px 12px 0 12px",
            background: "#fff",
            borderBottom: "1px solid #eceff3",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={exploreInputWrapStyle}>
              <label style={exploreLabelStyle}>Start Date</label>
              <input
                type="datetime-local"
                value={exploreStartValue}
                onChange={(e) => {
                  e.stopPropagation();
                  onExploreStartChange?.(e.target.value || "");
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={exploreInputStyle}
              />
            </div>

            <div style={exploreInputWrapStyle}>
              <label style={exploreLabelStyle}>End Date</label>
              <input
                type="datetime-local"
                value={exploreEndValue}
                onChange={(e) => {
                  e.stopPropagation();
                  onExploreEndChange?.(e.target.value || "");
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={exploreInputStyle}
              />
            </div>
          </div>
        </div>
      ) : null}

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

          {/* ✅ Y AXIS labels: smaller, no pills */}
          {yTickItems.length > 0 && (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 10,
                bottom: 36,
                width: 72,
                pointerEvents: "none",
              }}
            >
              {yTickItems.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: `${it.topPct}%`,
                    transform: "translateY(-50%)",
                    fontFamily: "monospace",
                    fontSize: yFont,
                    color: "#111",
                    fontWeight: 400,
                    background: "rgba(255,255,255,0.70)",
                    padding: "0 1px",
                    borderRadius: 0,
                    border: "none",
                    lineHeight: 1.05,
                  }}
                >
                  {Number(it.v).toFixed(2)}
                </div>
              ))}
            </div>
          )}

          <div
            ref={plotRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onDoubleClick={onDoubleClick}
            style={{
              position: "absolute",
              left: 68,
              right: 10,
              top: 10,
              bottom: 36,
              cursor: showVectors && sel ? "crosshair" : "default",
              touchAction: "none",
            }}
            title={
              showVectors
                ? "Move mouse to ping time/value. Drag to zoom. Double-click to reset zoom."
                : ""
            }
          >
            <svg
              viewBox={`0 0 ${svg.W} ${svg.H}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {(svg?.segs || []).map((pts, idx) => (
                <polyline
                  key={idx}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={strokeW}
                  points={(pts || []).join(" ")}
                />
              ))}
            </svg>

            {showVectors && sel ? (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: Math.min(sel.x0, sel.x1),
                  width: Math.max(1, Math.abs(sel.x1 - sel.x0)),
                  background: "rgba(59, 130, 246, 0.12)",
                  border: "1px solid rgba(59, 130, 246, 0.35)",
                  borderRadius: 6,
                  pointerEvents: "none",
                }}
              />
            ) : null}

            {showVectors && hover ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: hover.xPx,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "rgba(0,0,0,0.18)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(
                      Math.max(hover.xPx + 10, 8),
                      (plotRef?.current?.getBoundingClientRect?.().width || 0) - 260
                    ),
                    top: Math.min(
                      Math.max(hover.yPx - 26, 8),
                      (plotRef?.current?.getBoundingClientRect?.().height || 0) - 60
                    ),
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: "#111",
                    background: "rgba(255,255,255,0.92)",
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.10)",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.10)",
                    pointerEvents: "none",
                    maxWidth: 260,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 400,
                  }}
                >
                  <div>{fmtTime(hover.t)}</div>
                  <div>
                    Y:{" "}
                    <span style={{ color: "#0b3b18", fontWeight: 400 }}>
                      {Number.isFinite(hover.y) ? Number(hover.y).toFixed(2) : "--"}
                    </span>
                    {outputUnitText ? (
                      <span style={{ color: "#475569" }}> {outputUnitText}</span>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            <div
              style={{
                position: "absolute",
                right: 10,
                top: 10,
                fontFamily: "monospace",
                fontSize: 12,
                color: "#0b3b18",
                background: "rgba(255,255,255,0.85)",
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                pointerEvents: "none",
                fontWeight: 400,
              }}
              title="Current math output"
            >
              {Number.isFinite(mathOutput) ? Number(mathOutput).toFixed(2) : "--"}
            </div>

            {err ? (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  bottom: 10,
                  fontSize: 12,
                  color: "#991b1b",
                  background: "rgba(255,241,242,0.92)",
                  border: "1px solid #fecaca",
                  padding: "6px 10px",
                  borderRadius: 10,
                  pointerEvents: "none",
                  fontWeight: 400,
                }}
              >
                {err}
              </div>
            ) : null}
          </div>

          <div
            style={{
              position: "absolute",
              left: 68,
              right: 10,
              bottom: 10,
              height: 22,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 8,
              pointerEvents: "none",
              fontFamily: "monospace",
              fontSize: 10,
              color: "#444",
              fontWeight: 400,
            }}
          >
            {timeTicks.length ? (
              timeTicks.map((tk, idx) => (
                <div
                  key={idx}
                  style={{
                    maxWidth: "22%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "2px 6px",
                    borderRadius: 8,
                    fontWeight: 400,
                  }}
                  title={tk.label}
                >
                  {tk.label}
                </div>
              ))
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: "2px 6px",
                  borderRadius: 8,
                  fontWeight: 400,
                }}
              >
                --
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}