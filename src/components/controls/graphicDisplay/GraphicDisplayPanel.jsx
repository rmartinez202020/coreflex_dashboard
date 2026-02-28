// src/components/controls/graphicDisplay/GraphicDisplayPanel.jsx
import React, { useMemo } from "react";

const DEFAULT_LINE_COLOR = "#0c5ac8";

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

  // ✅ NEW: TOTALIZER (computed in parent GraphicDisplay.jsx)
  totalizerEnabled = false,
  totalizerRateUnit = "",
  totalizerTotalUnit = "",
  totalizerValue = null,

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

  const strokeW = isExploreMode ? 2 : 3; // thinner line in Explore
  const yFont = isExploreMode ? 14 : 11; // bigger Y numbers in Explore

  // ✅ wrappers: stop propagation but still call hook handlers
  const onPointerMove = (e) => {
    e.stopPropagation();
    handlers?.onPointerMove?.(e);
  };
  const onPointerLeave = (e) => {
    e.stopPropagation();
    handlers?.onPointerLeave?.(e);
  };
  const onPointerDown = (e) => {
    e.stopPropagation();
    handlers?.onPointerDown?.(e);
  };
  const onPointerUp = (e) => {
    e.stopPropagation();
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
    fontWeight: 900,
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

  const outputBoxStyle = {
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.92)",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 900,
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
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    letterSpacing: 0.2,
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const totalizerBoxStyle = {
    ...outputBoxStyle,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fontSize: 11,
    fontWeight: 900,
  };

  const totalText = useMemo(() => {
    if (!totalizerEnabled) return "--";
    if (!totalizerTotalUnit) return "--";
    if (!Number.isFinite(totalizerValue)) return "--";
    return `${Number(totalizerValue).toFixed(2)} ${totalizerTotalUnit}`;
  }, [totalizerEnabled, totalizerTotalUnit, totalizerValue]);

  const totalTitle = useMemo(() => {
    if (!totalizerEnabled) return "";
    if (!totalizerRateUnit) return "Totallizer";
    return `Totallizer integrated from ${totalizerRateUnit}`;
  }, [totalizerEnabled, totalizerRateUnit]);

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
        {/* ===================== ROW 1 (full width) ===================== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#111",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 120,
              flex: "0 0 auto",
            }}
            title={title}
          >
            {title}
          </div>

          {/* Explore only in play/launch */}
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

          <button
            type="button"
            onClick={onExport}
            style={topBtnBase}
            title="Export visible points to CSV"
          >
            ⬇ <span>Export</span>
          </button>

          {/* LINE indicator */}
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
            <span style={{ fontSize: 12, fontWeight: 900, color: "#111" }}>LINE</span>
            {styleBadge ? (
              <span style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>
                {styleBadge}
              </span>
            ) : null}
          </div>

          {/* ONLINE (inline on row 1) */}
          <div
            style={onlinePillStyle}
            title={bindDeviceId ? `Device is ${statusLabel.text}` : "No device selected"}
          >
            {statusLabel.text}
          </div>
        </div>

        {/* ===================== ROW 2 (right aligned) ===================== */}
        <div
          style={{
            marginTop: 6,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* Output */}
          <div style={outputBoxStyle} title="Math Output">
            <span style={{ color: "#555", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
              Output:
            </span>
            <span style={{ color: "#0b3b18" }}>
              {Number.isFinite(mathOutput) ? Number(mathOutput).toFixed(2) : "--"}
            </span>
          </div>

          {/* Totallizer */}
          {totalizerEnabled ? (
            <div style={totalizerBoxStyle} title={totalTitle}>
              <span style={{ color: "#555" }}>TOTALLIZER:</span>
              <span style={{ color: "#111" }}>{totalText}</span>
            </div>
          ) : null}
        </div>

        {/* info row (stays above divider like your screenshot) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#444",
            fontSize: 11,
            marginTop: 8,
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
        </div>
      </div>

      {/* ✅ BLACK DIVIDER (graphic starts below this) */}
      <div style={{ height: 2, background: "#000", width: "100%" }} />

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
            onDoubleClick={onDoubleClick}
            style={{
              position: "absolute",
              left: 92,
              right: 10,
              top: 10,
              bottom: 36,
              cursor: sel ? "crosshair" : "default",
              touchAction: "none",
            }}
            title="Move mouse to ping time/value. Drag to zoom. Double-click to reset zoom."
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

            {sel ? (
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

            {hover ? (
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
                    fontWeight: 900,
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
                  }}
                >
                  <div>{fmtTime(hover.t)}</div>
                  <div>
                    Y:{" "}
                    <span style={{ color: "#0b3b18" }}>
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
                fontWeight: 900,
                color: "#0b3b18",
                background: "rgba(255,255,255,0.85)",
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                pointerEvents: "none",
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
                  fontWeight: 900,
                  color: "#991b1b",
                  background: "rgba(255,241,242,0.92)",
                  border: "1px solid #fecaca",
                  padding: "6px 10px",
                  borderRadius: 10,
                  pointerEvents: "none",
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
              fontWeight: 900,
              color: "#444",
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