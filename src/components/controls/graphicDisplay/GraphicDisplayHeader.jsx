// src/components/controls/graphicDisplay/GraphicDisplayHeader.jsx
import React, { useMemo } from "react";

const FRAME_LINE = "1px solid #cfcfcf";

export default function GraphicDisplayHeader({
  // mode
  isExploreMode = false,
  isRunMode = false,

  // header basics
  title = "Graphic Display",
  lineColor = "#0c5ac8",
  styleBadge = "",

  // status pill
  statusLabel = {
    text: "--",
    color: "#64748b",
    bg: "rgba(148,163,184,0.16)",
    border: "rgba(148,163,184,0.35)",
  },
  bindDeviceId = "",

  // settings
  showSettingsBtn = false,
  onOpenSettings = () => {},

  // run controls
  isPlaying = true,
  onPlay = () => {},
  onPause = () => {},
  onToggleExplore = () => {},
  onExport = () => {},

  // totalizer
  showTotalizerControls = false,
  totalizerEnabledEffective = false,
  onTotEnableClick = () => {},
  onTotDisableClick = () => {},
  onTotResetClick = () => {},

  // outputs / units
  mathOutput = null,
  outputUnitText = "",
  unitBadgeText = "",
  totalText = "--",
  totalTitle = "",

  // info row
  timeUnit = "seconds",
  sampleMs = 1000,
  windowSize = 60,
  yMin = 0,
  yMax = 100,
}) {
  const topBtnBase = useMemo(
    () => ({
      height: 28,
      padding: "0 10px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      background: "#fff",
      color: "#111",
      fontSize: 12,
      fontWeight: 400,
      cursor: "pointer",
      lineHeight: "28px",
      userSelect: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
    }),
    []
  );

  const topBtnDisabled = useMemo(
    () => ({
      ...topBtnBase,
      cursor: "not-allowed",
      opacity: 0.55,
    }),
    [topBtnBase]
  );

  const bigStatBoxStyle = useMemo(
    () => ({
      height: 26,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "0 8px",
      borderRadius: 9,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "rgba(255,255,255,0.96)",
      fontFamily: "monospace",
      fontSize: 11,
      fontWeight: 400,
      color: "#111",
      whiteSpace: "nowrap",
    }),
    []
  );

  const onlinePillStyle = useMemo(
    () => ({
      height: 20,
      padding: "0 9px",
      borderRadius: 999,
      border: `1px solid ${statusLabel.border}`,
      background: statusLabel.bg,
      color: statusLabel.color,
      fontSize: 10,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      letterSpacing: 0.2,
      userSelect: "none",
      whiteSpace: "nowrap",
    }),
    [statusLabel]
  );

  const totBtnBase = useMemo(
    () => ({
      height: 22,
      padding: "0 8px",
      borderRadius: 7,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "rgba(255,255,255,0.96)",
      fontSize: 10,
      fontWeight: 500,
      cursor: "pointer",
      lineHeight: "22px",
      userSelect: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      whiteSpace: "nowrap",
    }),
    []
  );

  const totBtnDisabled = useMemo(
    () => ({
      ...totBtnBase,
      cursor: "not-allowed",
      opacity: 0.55,
    }),
    [totBtnBase]
  );

  // ✅ ALWAYS visible now (edit + play + launch)
  const showSettingsButtonAlways = !!showSettingsBtn;
  const showExploreButtonAlways = true;

  return (
    <div
      style={{
        padding: "5px 7px",
        background: "linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%)",
        flex: "0 0 auto",
        minWidth: 0,
      }}
    >
      {/* ROW 1 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          paddingBottom: 5,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
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
            gap: 8,
            flex: "0 0 auto",
            justifyContent: "flex-end",
            maxWidth: "72%",
            overflowX: "auto",
            paddingBottom: 1,
          }}
        >
          {showSettingsButtonAlways && (
            <button
              type="button"
              onClick={onOpenSettings}
              style={topBtnBase}
              title="Open Settings"
            >
              ⚙ <span>Settings</span>
            </button>
          )}

          {showExploreButtonAlways && (
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
            title="Export (Download Data) - CSV"
          >
            ⬇ <span>Export</span>
          </button>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 28,
              padding: "0 8px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "rgba(255,255,255,0.92)",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
            title={`Line color: ${lineColor}`}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: lineColor,
                border: "1px solid rgba(0,0,0,0.15)",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#111" }}>
              LINE
            </span>
            {styleBadge ? (
              <span style={{ fontSize: 10, fontWeight: 500, color: "#475569" }}>
                {styleBadge}
              </span>
            ) : null}
          </div>

          <div
            style={onlinePillStyle}
            title={
              bindDeviceId ? `Device is ${statusLabel.text}` : "No device selected"
            }
          >
            {statusLabel.text}
          </div>
        </div>
      </div>

      <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />

      {/* ROW 2 */}
      <div
        style={{
          marginTop: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          paddingBottom: 4,
          minWidth: 0,
        }}
      >
        {showTotalizerControls ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flex: "1 1 auto",
              minWidth: 200,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#111",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
              title="Totalizer controls"
            >
              Totalizer
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={onTotEnableClick}
                disabled={!!totalizerEnabledEffective}
                style={
                  totalizerEnabledEffective
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

              <button
                type="button"
                onClick={onTotDisableClick}
                disabled={!totalizerEnabledEffective}
                style={
                  !totalizerEnabledEffective
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

              <button
                type="button"
                onClick={onTotResetClick}
                disabled={!totalizerEnabledEffective}
                style={!totalizerEnabledEffective ? totBtnDisabled : totBtnBase}
                title="Reset totalizer total to zero"
              >
                ↺ <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: "1 1 auto", minWidth: 200 }} />
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            flex: "0 0 auto",
            flexWrap: "wrap",
          }}
        >
          <div style={bigStatBoxStyle} title="Math Output">
            <span
              style={{
                color: "#555",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                fontWeight: 500,
                fontSize: 10,
              }}
            >
              Output:
            </span>
            <span style={{ color: "#0b3b18", fontWeight: 700, fontSize: 12 }}>
              {Number.isFinite(mathOutput) ? Number(mathOutput).toFixed(2) : "--"}
            </span>
            {outputUnitText ? (
              <span
                style={{
                  color: "#475569",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  fontWeight: 500,
                  fontSize: 10,
                  marginLeft: 2,
                }}
                title="Unit"
              >
                {outputUnitText}
              </span>
            ) : null}
          </div>

          {unitBadgeText ? (
            <div style={bigStatBoxStyle} title="Single Unit">
              <span
                style={{
                  color: "#555",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  fontWeight: 500,
                  fontSize: 10,
                }}
              >
                UNIT:
              </span>
              <span style={{ color: "#111", fontWeight: 700, fontSize: 12 }}>
                {unitBadgeText}
              </span>
            </div>
          ) : null}

          {totalizerEnabledEffective ? (
            <div style={bigStatBoxStyle} title={totalTitle}>
              <span
                style={{
                  color: "#555",
                  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
                  fontWeight: 500,
                  fontSize: 10,
                }}
              >
                TOTALLIZER:
              </span>
              <span style={{ color: "#111", fontWeight: 700, fontSize: 12 }}>
                {totalText}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />

      {/* info row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: "#444",
          fontSize: 9,
          marginTop: 4,
          minWidth: 0,
          flexWrap: "wrap",
          paddingBottom: 4,
          fontWeight: 500,
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
          Y: <span>{yMin}</span> → <span>{yMax}</span>{" "}
          {outputUnitText ? `(${outputUnitText})` : ""}
        </span>
      </div>

      <div style={{ height: 0, borderTop: FRAME_LINE, width: "100%" }} />
    </div>
  );
}