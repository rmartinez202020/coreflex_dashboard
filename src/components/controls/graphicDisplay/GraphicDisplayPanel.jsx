// src/components/controls/graphicDisplay/GraphicDisplayPanel.jsx
import React, { useMemo } from "react";

const DEFAULT_LINE_COLOR = "#0c5ac8";
const FRAME_LINE = "1px solid #cfcfcf";

function normalizeLineColor(c) {
  const s = String(c || "").trim();
  return s || DEFAULT_LINE_COLOR;
}

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

  // totalizer (computed in parent GraphicDisplay.jsx)
  totalizerEnabled = false,
  totalizerRateUnit = "",
  totalizerTotalUnit = "",
  totalizerValue = null,

  // ✅ totalizer enable/disable controls (parent MUST wire these to persist setting)
  onTotalizerEnable = () => {},
  onTotalizerDisable = () => {},
  onTotalizerReset = () => {},

  // ✅ Single Units (NEW)
  // If enabled, we hide Totalizer Controls row and show a Unit box on the right.
  singleUnitsEnabled = false,
  singleUnitsUnit = "",

  // (kept for backwards compatibility if parent still passes them; not used now)
  totalizerIsPlaying: _totalizerIsPlayingProp,
  onTotalizerPlay: _onTotalizerPlay,
  onTotalizerPause: _onTotalizerPause,

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
  const lineColor = useMemo(() => normalizeLineColor(lineColorProp), [lineColorProp]);

  const strokeW = isExploreMode ? 2 : 3;
  const yFont = isExploreMode ? 14 : 11;

  // show vector/hover/selection visuals ONLY in Explore IN mode
  const showVectors = !!isExploreMode;

  // ✅ show Totalizer Controls ONLY in Play/Launch mode AND only if Single Units is NOT enabled
  const showTotalizerControls = !!isPlay && !singleUnitsEnabled;

  // ✅ Unit text:
  // - For Single Units: prefer singleUnitsUnit prop, else fall back to yUnits
  // - For normal: yUnits
  const unitText = useMemo(() => {
    const su = String(singleUnitsUnit || "").trim();
    const yu = String(yUnits || "").trim();
    return singleUnitsEnabled ? (su || yu || "") : (yu || "");
  }, [singleUnitsEnabled, singleUnitsUnit, yUnits]);

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

  const topBtnBase = {
    height: 36,
    padding: "0 18px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111",
    fontSize: 13,
    fontWeight: 400,
    cursor: "pointer",
    lineHeight: "36px",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    whiteSpace: "nowrap",
  };

  const topBtnDisabled = {
    ...topBtnBase,
    cursor: "not-allowed",
    opacity: 0.55,
  };

  // Bigger Output / Totallizer
  const bigStatBoxStyle = {
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "0 16px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.96)",
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: 400,
    color: "#111",
    whiteSpace: "nowrap",
  };

  const onlinePillStyle = {
    height: 26,
    padding: "0 12px",
    borderRadius: 999,
    border: `1px solid ${statusLabel.border}`,
    background: statusLabel.bg,
    color: statusLabel.color,
    fontSize: 11,
    fontWeight: 400,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    letterSpacing: 0.2,
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  // Totalizer controls section title (professional)
  const totalizerSectionTitle = "Totalizer Controls";

  // ✅ Totalizer header buttons (Enable/Disable/Reset) — same vibe as modal
  const totBtnBase = {
    height: 32,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.96)",
    fontSize: 12,
    fontWeight: 400,
    cursor: "pointer",
    lineHeight: "32px",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };

  const totBtnDisabled = {
    ...totBtnBase,
    cursor: "not-allowed",
    opacity: 0.55,
  };

  const onTotEnableClick = () => {
    onTotalizerEnable?.();
  };

  const onTotDisableClick = () => {
    onTotalizerDisable?.();
  };

  const onTotResetClick = () => {
    if (!totalizerEnabled) return;
    onTotalizerReset?.();
  };

  const totalText = useMemo(() => {
    if (!totalizerEnabled) return "--";
    if (!totalizerTotalUnit) return "--";
    if (!Number.isFinite(totalizerValue)) return "--";
    return `${Number(totalizerValue).toFixed(2)} ${totalizerTotalUnit}`;
  }, [totalizerEnabled, totalizerTotalUnit, totalizerValue]);

  const totalTitle = useMemo(() => {
    if (!totalizerEnabled) return "";
    if (!totalizerRateUnit) return "Totalizer";
    return `Totalizer integrated from ${totalizerRateUnit}`;
  }, [totalizerEnabled, totalizerRateUnit]);

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
      {/* HEADER */}
      <div
        style={{
          padding: "8px 10px",
          background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
          flex: "0 0 auto",
          minWidth: 0,
        }}
      >
        {/* ROW 1 (title left, controls pinned right) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              fontWeight: 400,
              fontSize: 14,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              flex: "1 1 auto",
            }}
            title={title}
          >
            {title}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              flex: "0 0 auto",
              justifyContent: "flex-end",
              maxWidth: "70%",
              overflowX: "auto",
              paddingBottom: 2,
            }}
          >
            {isPlay && (
              <button
                type="button"
                onClick={onToggleExplore}
                style={{
                  ...topBtnBase,
                  background: isExploreMode ? "#fee2e2" : "#fff",
                  border: isExploreMode ? "1px solid #fecaca" : topBtnBase.border,
                }}
                title={isExploreMode ? "Close Explore" : "Open Explore"}
              >
                🔎 <span>{isExploreMode ? "Explore OUT" : "Explore IN"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPlay}
              style={isPlaying ? topBtnDisabled : topBtnBase}
              disabled={isPlaying}
              title="Resume"
            >
              ▶ <span>Play</span>
            </button>

            <button
              type="button"
              onClick={onPause}
              style={!isPlaying ? topBtnDisabled : topBtnBase}
              disabled={!isPlaying}
              title="Pause"
            >
              ⏸ <span>Pause</span>
            </button>

            {/* ✅ RENAMED BUTTON */}
            <button
              type="button"
              onClick={onExport}
              style={topBtnBase}
              title="Export (Download Data) - CSV"
            >
              ⬇ <span>Export (Download Data)</span>
            </button>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 36,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(255,255,255,0.92)",
                whiteSpace: "nowrap",
                flex: "0 0 auto",
              }}
              title={`Line color: ${lineColor}`}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: lineColor,
                  border: "1px solid rgba(0,0,0,0.15)",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 400, color: "#111" }}>LINE</span>
              {styleBadge ? (
                <span style={{ fontSize: 11, fontWeight: 400, color: "#475569" }}>{styleBadge}</span>
              ) : null}
            </div>

            <div style={onlinePillStyle} title={bindDeviceId ? `Device is ${statusLabel.text}` : "No device selected"}>
              {statusLabel.text}
            </div>
          </div>
        </div>

        {/* LINE between row 1 and row 2 */}
        <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />

        {/* ROW 2: left = totalizer controls (Enable/Disable) [hidden when Single Units], right = output/totallizer/units boxes */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            paddingBottom: 10,
            minWidth: 0,
          }}
        >
          {/* LEFT: Totalizer Controls (ONLY in Play/Launch AND only if Single Units is NOT enabled) */}
          {showTotalizerControls ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                flex: "1 1 auto",
                minWidth: 240,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#111",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                }}
                title="Totalizer controls"
              >
                {totalizerSectionTitle}
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {/* ✅ ENABLE */}
                <button
                  type="button"
                  onClick={onTotEnableClick}
                  disabled={!!totalizerEnabled}
                  style={
                    totalizerEnabled
                      ? totBtnDisabled
                      : {
                          ...totBtnBase,
                          background: "rgba(220,252,231,0.90)",
                          border: "1px solid rgba(34,197,94,0.35)",
                        }
                  }
                  title="Enable totalizer accumulation"
                >
                  ✅ <span>Enable</span>
                </button>

                {/* ✅ DISABLE */}
                <button
                  type="button"
                  onClick={onTotDisableClick}
                  disabled={!totalizerEnabled}
                  style={
                    !totalizerEnabled
                      ? totBtnDisabled
                      : {
                          ...totBtnBase,
                          background: "rgba(254,242,242,0.95)",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }
                  }
                  title="Disable totalizer accumulation"
                >
                  ⛔ <span>Disable</span>
                </button>

                {/* ✅ RESET (only when enabled) */}
                <button
                  type="button"
                  onClick={onTotResetClick}
                  disabled={!totalizerEnabled}
                  style={!totalizerEnabled ? totBtnDisabled : totBtnBase}
                  title="Reset totalizer total to zero"
                >
                  ↺ <span>Reset</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: "1 1 auto", minWidth: 240 }} />
          )}

          {/* RIGHT: Output + Unit + Totalizer boxes */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              flex: "0 0 auto",
              flexWrap: "wrap",
            }}
          >
            <div style={bigStatBoxStyle} title="Math Output">
              <span
                style={{
                  color: "#555",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  fontWeight: 400,
                  fontSize: 13,
                }}
              >
                Output:
              </span>
              <span style={{ color: "#0b3b18", fontWeight: 400, fontSize: 15 }}>
                {Number.isFinite(mathOutput) ? Number(mathOutput).toFixed(2) : "--"}
              </span>

              {/* keep inline unit after output (works for both totalizer + single units) */}
              {unitText ? (
                <span
                  style={{
                    color: "#475569",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                    fontWeight: 400,
                    fontSize: 13,
                    marginLeft: 2,
                  }}
                  title="Unit"
                >
                  {unitText}
                </span>
              ) : null}
            </div>

            {/* ✅ Single Units box (shows when enabled) */}
            {singleUnitsEnabled ? (
              <div style={bigStatBoxStyle} title="Single Units (instant measurement)">
                <span
                  style={{
                    color: "#555",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                    fontWeight: 400,
                    fontSize: 13,
                  }}
                >
                  UNIT:
                </span>
                <span style={{ color: "#111", fontWeight: 400, fontSize: 15 }}>{unitText || "--"}</span>
              </div>
            ) : null}

            {/* ✅ Totalizer box (hide if Single Units enabled) */}
            {!singleUnitsEnabled && totalizerEnabled ? (
              <div style={bigStatBoxStyle} title={totalTitle}>
                <span
                  style={{
                    color: "#555",
                    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                    fontWeight: 400,
                    fontSize: 13,
                  }}
                >
                  TOTALLIZER:
                </span>
                <span style={{ color: "#111", fontWeight: 400, fontSize: 15 }}>{totalText}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* splitter line below row 2 */}
        <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />

        {/* info row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#444",
            fontSize: 11,
            marginTop: 10,
            minWidth: 0,
            flexWrap: "wrap",
            paddingBottom: 8,
            fontWeight: 400,
          }}
        >
          <span>
            Time: <span>{timeUnit}</span>
          </span>
          <span>•</span>
          <span>
            Sample: <span>{sampleMs} ms</span>
          </span>
          <span>•</span>
          <span>
            Window: <span>{windowSize}</span>
          </span>
          <span>•</span>
          <span>
            Y: <span>{yMin}</span> → <span>{yMax}</span> {unitText ? `(${unitText})` : ""}
          </span>
        </div>

        <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />
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
                bottom: 36,
                width: 72,
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
                    fontSize: yFont,
                    color: "#111",
                    background: "rgba(255,255,255,0.86)",
                    padding: "2px 8px",
                    borderRadius: 8,
                    alignSelf: "flex-start",
                    border: "1px solid rgba(0,0,0,0.06)",
                    fontWeight: 400,
                  }}
                >
                  {Number(v).toFixed(2)}
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
              left: 92,
              right: 10,
              top: 10,
              bottom: 36,
              cursor: showVectors && sel ? "crosshair" : "default",
              touchAction: "none",
            }}
            title={showVectors ? "Move mouse to ping time/value. Drag to zoom. Double-click to reset zoom." : ""}
          >
            <svg
              viewBox={`0 0 ${svg.W} ${svg.H}`}
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {(svg?.segs || []).map((pts, idx) => (
                <polyline key={idx} fill="none" stroke={lineColor} strokeWidth={strokeW} points={(pts || []).join(" ")} />
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
              left: 92,
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