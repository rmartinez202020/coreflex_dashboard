// src/components/AlarmLogWindowListTable.jsx
import React from "react";

const GRID_TEMPLATE =
  "34px 34px minmax(130px,1.1fr) minmax(96px,0.8fr) minmax(220px,2.2fr) minmax(100px,0.9fr) minmax(110px,0.9fr) minmax(84px,0.8fr) minmax(140px,1.1fr) minmax(90px,0.8fr) minmax(90px,0.8fr) minmax(100px,0.9fr) minmax(92px,0.8fr)";

function isAcknowledged(alarm, localAck = {}) {
  if (localAck?.[alarm?.id]) return true;
  if (alarm?.acknowledged === true) return true;
  if (String(alarm?.ack || "").trim().toLowerCase() === "yes") return true;

  const state = String(
    alarm?.state ?? alarm?.alarmState ?? alarm?.status ?? ""
  )
    .trim()
    .toUpperCase();

  if (state === "ACKED") return true;

  return false;
}

function renderState(a) {
  const raw =
    a?.state ??
    a?.alarmState ??
    a?.status ??
    (a?.active ? "ACTIVE" : "");

  const s = String(raw || "").trim().toUpperCase();

  if (s === "ACTIVE") return "ACTIVE";
  if (s === "RETURNED") return "RETURNED";
  if (s === "ACKED") return "ACKED";
  if (s === "DISABLED") return "DISABLED";
  return s || "—";
}

function renderDevice(a) {
  return (
    a?.device ??
    a?.deviceName ??
    a?.device_id ??
    a?.deviceId ??
    a?.controller ??
    "—"
  );
}

function renderTag(a) {
  return a?.tag ?? a?.tagName ?? a?.tag_name ?? "—";
}

function renderValue(a) {
  const v =
    a?.value ??
    a?.triggerValue ??
    a?.trigger_value ??
    a?.currentValue ??
    a?.current_value ??
    a?.rawValue ??
    a?.raw_value;

  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function renderAlarmText(a) {
  return a?.text ?? a?.alarmText ?? a?.message ?? "—";
}

function renderSeverity(a) {
  return String(a?.severity ?? a?.raw?.severity ?? "—").trim() || "—";
}

function renderGroup(a) {
  return a?.groupName ?? a?.group ?? "—";
}

function renderOccurrences(a) {
  const n = Number(a?.occurrences);
  if (!Number.isFinite(n) || n <= 0) return "1";
  return String(n);
}

function getActiveStateStyleBySeverity(severity) {
  const s = String(severity || "").trim().toLowerCase();

  if (s === "warning") return stateActiveWarning;
  if (s === "info") return stateActiveInfo;
  return stateActiveCritical;
}

function getStateStyle(state, alarm) {
  switch (String(state || "").toUpperCase()) {
    case "ACTIVE":
      return getActiveStateStyleBySeverity(
        alarm?.severity ?? alarm?.raw?.severity ?? ""
      );
    case "RETURNED":
      return stateReturned;
    case "ACKED":
      return stateAcked;
    case "DISABLED":
      return stateDisabled;
    default:
      return stateDefault;
  }
}

function getActiveRowBgBySeverity(severity) {
  const s = String(severity || "").trim().toLowerCase();

  if (s === "warning") return "#fef9c3";
  if (s === "info") return "#e0f2fe";
  return "#fee2e2";
}

function getHeadCellStyle(isLast = false, extra = {}) {
  return {
    ...cellHead,
    ...(isLast ? noRightBorder : null),
    ...extra,
  };
}

function getBodyCellStyle(isLast = false, extra = {}) {
  return {
    ...cell,
    ...(isLast ? noRightBorder : null),
    ...extra,
  };
}

export default function AlarmLogWindowListTable({
  alarmView = "alarms",
  visibleAlarms = [],
  checkedIds,
  selectedId,
  setSelectedId,
  toggleChecked,
  toggleAllVisible,
  onAcknowledgeAlarm,
  onDisableAlarm,
  expandedAlarmKeys = new Set(),
  onToggleExpandAlarm,
  expandedHistoryMap = {},
}) {
  const [localAck, setLocalAck] = React.useState({});

  const isAlarmsTab = alarmView === "alarms";

  const allVisibleSelected =
    visibleAlarms.length > 0 &&
    visibleAlarms.every((a) => checkedIds?.has?.(a.id));

  React.useEffect(() => {
    const next = {};
    for (const a of visibleAlarms) {
      if (isAcknowledged(a)) {
        next[a.id] = true;
      }
      const historyRows = expandedHistoryMap?.[a.uniqueAlarmKey] || [];
      for (const h of historyRows) {
        if (isAcknowledged(h)) {
          next[h.id] = true;
        }
      }
    }
    setLocalAck((prev) => ({ ...prev, ...next }));
  }, [visibleAlarms, expandedHistoryMap]);

  return (
    <div style={tableOuter}>
      <div style={tableInner}>
        <div style={{ ...headerRow, gridTemplateColumns: GRID_TEMPLATE }}>
          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleAllVisible?.();
              }}
              style={checkbox}
              title="Select all"
              disabled={visibleAlarms.length === 0}
            />
          </div>

          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            {isAlarmsTab ? "" : "▼"}
          </div>

          <div style={getHeadCellStyle()}>Time</div>
          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            State
          </div>
          <div style={getHeadCellStyle()}>Alarm Text</div>
          <div style={getHeadCellStyle()}>Severity</div>
          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            {isAlarmsTab ? "" : "Occurrences"}
          </div>
          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            Ack
          </div>
          <div style={getHeadCellStyle()}>Device</div>
          <div style={getHeadCellStyle()}>Tag</div>
          <div style={getHeadCellStyle(false, { justifyContent: "flex-end" })}>
            Value
          </div>
          <div style={getHeadCellStyle()}>Group</div>
          <div style={getHeadCellStyle(true, { justifyContent: "center" })}>
            Disable
          </div>
        </div>

        <div style={bodyWrap}>
          <div style={rowsLayer}>
            {visibleAlarms.map((a) => {
              const isChecked = checkedIds?.has?.(a.id);
              const isSelected = selectedId === a.id;
              const stateText = renderState(a);
              const acked = isAcknowledged(a, localAck);
              const isActiveUnacked = stateText === "ACTIVE" && !acked;
              const canAck = stateText === "ACTIVE" && !acked;
              const isDisabled =
                stateText === "DISABLED" || a?.enabled === false;
              const disableLabel = isDisabled ? "Enable" : "Disable";
              const disableTitle = isDisabled
                ? "Enable this alarm"
                : "Disable this alarm";
              const isExpanded =
                !isAlarmsTab && expandedAlarmKeys?.has?.(a.uniqueAlarmKey);
              const historyRows = expandedHistoryMap?.[a.uniqueAlarmKey] || [];

              let rowBg = "#ffffff";
              if (isActiveUnacked) {
                rowBg = getActiveRowBgBySeverity(
                  a?.severity ?? a?.raw?.severity ?? ""
                );
              } else if (isSelected) {
                rowBg = "#eef4ff";
              }

              return (
                <React.Fragment key={a.id}>
                  <div
                    style={{
                      ...dataRow,
                      gridTemplateColumns: GRID_TEMPLATE,
                      background: rowBg,
                      color: "#111827",
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedId?.(a.id);
                    }}
                  >
                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      <input
                        type="checkbox"
                        checked={!!isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleChecked?.(a.id);
                        }}
                        style={checkbox}
                      />
                    </div>

                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      {!isAlarmsTab ? (
                        <button
                          type="button"
                          style={expandBtn}
                          title={
                            isExpanded ? "Collapse history" : "Show history"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpandAlarm?.(a);
                          }}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      ) : null}
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {a.time || "—"}
                    </div>

                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      <span
                        style={{
                          ...stateBadge,
                          ...getStateStyle(stateText, a),
                        }}
                      >
                        {stateText}
                      </span>
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {renderAlarmText(a)}
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {renderSeverity(a)}
                    </div>

                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      {isAlarmsTab ? "" : renderOccurrences(a)}
                    </div>

                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      <button
                        type="button"
                        style={{
                          ...ackBtn,
                          ...(canAck ? ackBtnReady : ackBtnDisabled),
                        }}
                        disabled={!canAck}
                        title={
                          canAck
                            ? "Acknowledge alarm"
                            : acked
                            ? "Alarm already acknowledged"
                            : stateText === "RETURNED"
                            ? "Returned alarms cannot be acknowledged"
                            : stateText === "DISABLED"
                            ? "Disabled alarms cannot be acknowledged"
                            : "Only active alarms can be acknowledged"
                        }
                        onMouseEnter={(e) => {
                          if (canAck) {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.borderColor = "#bfc6cf";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (canAck) {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.borderColor = "#c7cdd4";
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canAck) return;

                          setLocalAck((prev) => ({
                            ...prev,
                            [a.id]: true,
                          }));

                          onAcknowledgeAlarm?.(a);
                        }}
                      >
                        {acked ? "Acked" : "Ack"}
                      </button>
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {renderDevice(a)}
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {renderTag(a)}
                    </div>

                    <div
                      style={getBodyCellStyle(false, {
                        justifyContent: "flex-end",
                        background: rowBg,
                      })}
                    >
                      {renderValue(a)}
                    </div>

                    <div style={getBodyCellStyle(false, { background: rowBg })}>
                      {renderGroup(a)}
                    </div>

                    <div
                      style={getBodyCellStyle(true, {
                        justifyContent: "center",
                        background: rowBg,
                      })}
                    >
                      <button
                        type="button"
                        style={{
                          ...disableBtn,
                          ...disableBtnReady,
                        }}
                        title={disableTitle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e5e7eb";
                          e.currentTarget.style.borderColor = "#bfc6cf";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.borderColor = "#c7cdd4";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDisableAlarm?.(a);
                        }}
                      >
                        {disableLabel}
                      </button>
                    </div>
                  </div>

                  {!isAlarmsTab &&
                    isExpanded &&
                    historyRows.map((h) => {
                      const historyState = renderState(h);
                      const historyAcked = isAcknowledged(h, localAck);
                      const historyCanAck =
                        historyState === "ACTIVE" && !historyAcked;

                      let historyBg = "#f8fafc";
                      if (historyState === "ACTIVE" && !historyAcked) {
                        historyBg = getActiveRowBgBySeverity(
                          h?.severity ?? h?.raw?.severity ?? ""
                        );
                      }

                      return (
                        <div
                          key={h.id}
                          style={{
                            ...historyRow,
                            gridTemplateColumns: GRID_TEMPLATE,
                            background: historyBg,
                            color: "#111827",
                          }}
                        >
                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          />

                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          >
                            <span style={historyIndent}>↳</span>
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {h.time || "—"}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          >
                            <span
                              style={{
                                ...stateBadge,
                                ...getStateStyle(historyState, h),
                              }}
                            >
                              {historyState}
                            </span>
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {renderAlarmText(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {renderSeverity(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          >
                            1
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          >
                            <button
                              type="button"
                              style={{
                                ...ackBtn,
                                ...(historyCanAck
                                  ? ackBtnReady
                                  : ackBtnDisabled),
                              }}
                              disabled={!historyCanAck}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!historyCanAck) return;

                                setLocalAck((prev) => ({
                                  ...prev,
                                  [h.id]: true,
                                }));

                                onAcknowledgeAlarm?.(h);
                              }}
                            >
                              {historyAcked ? "Acked" : "Ack"}
                            </button>
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {renderDevice(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {renderTag(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              justifyContent: "flex-end",
                              background: historyBg,
                            })}
                          >
                            {renderValue(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(false, {
                              background: historyBg,
                            })}
                          >
                            {renderGroup(h)}
                          </div>

                          <div
                            style={getBodyCellStyle(true, {
                              justifyContent: "center",
                              background: historyBg,
                            })}
                          />
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const tableOuter = {
  flex: 1,
  overflow: "auto",
  background: "#ffffff",
  width: "100%",
  minWidth: 0,
};

const tableInner = {
  position: "relative",
  minHeight: "100%",
  background: "#ffffff",
  width: "100%",
  minWidth: 0,
};

const headerRow = {
  display: "grid",
  alignItems: "stretch",
  background: "#eef1f5",
  color: "#111827",
  position: "sticky",
  top: 0,
  zIndex: 5,
  width: "100%",
  minWidth: 0,
};

const bodyWrap = {
  position: "relative",
  flex: 1,
  background: "#ffffff",
  width: "100%",
  minWidth: 0,
};

const rowsLayer = {
  position: "relative",
  width: "100%",
  minWidth: 0,
};

const dataRow = {
  display: "grid",
  alignItems: "stretch",
  width: "100%",
  minWidth: 0,
  cursor: "default",
};

const historyRow = {
  display: "grid",
  alignItems: "stretch",
  width: "100%",
  minWidth: 0,
  cursor: "default",
};

const cellHead = {
  minWidth: 0,
  minHeight: 34,
  padding: "8px 10px",
  fontWeight: 900,
  fontSize: 12,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  borderRight: "1px solid #d9e0e7",
  borderBottom: "1px solid #cfd6dd",
  boxSizing: "border-box",
};

const cell = {
  minWidth: 0,
  minHeight: 38,
  padding: "8px 10px",
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  borderRight: "1px solid #e4e9ef",
  borderBottom: "1px solid #d7dde5",
  boxSizing: "border-box",
};

const noRightBorder = {
  borderRight: "none",
};

const checkbox = {
  width: 14,
  height: 14,
  cursor: "pointer",
  accentColor: "#111827",
};

const expandBtn = {
  width: 24,
  height: 24,
  borderRadius: 6,
  border: "1px solid #c7cdd4",
  background: "#f8fafc",
  color: "#111827",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
};

const historyIndent = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
};

const ackBtn = {
  minWidth: 64,
  height: 26,
  padding: "0 12px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #c7cdd4",
  background: "#f3f4f6",
  color: "#111827",
  transition:
    "background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
};

const ackBtnReady = {
  background: "#f3f4f6",
  color: "#111827",
  borderColor: "#c7cdd4",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
};

const ackBtnDisabled = {
  background: "#e5e7eb",
  color: "#9ca3af",
  borderColor: "#d1d5db",
  cursor: "not-allowed",
  boxShadow: "inset 0 1px 1px rgba(0,0,0,0.04)",
  opacity: 0.9,
};

const disableBtn = {
  minWidth: 72,
  height: 26,
  padding: "0 12px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #c7cdd4",
  background: "#f3f4f6",
  color: "#111827",
  transition:
    "background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
};

const disableBtnReady = {
  background: "#f3f4f6",
  color: "#111827",
  borderColor: "#c7cdd4",
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
};

const disableBtnDisabled = {
  background: "#e5e7eb",
  color: "#9ca3af",
  borderColor: "#d1d5db",
  cursor: "not-allowed",
  boxShadow: "inset 0 1px 1px rgba(0,0,0,0.04)",
  opacity: 0.9,
};

const stateBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 72,
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  border: "1px solid transparent",
};

const stateActiveCritical = {
  background: "#fee2e2",
  color: "#000000",
  borderColor: "#fecaca",
};

const stateActiveWarning = {
  background: "#fef3c7",
  color: "#000000",
  borderColor: "#fcd34d",
};

const stateActiveInfo = {
  background: "#dbeafe",
  color: "#000000",
  borderColor: "#bfdbfe",
};

const stateReturned = {
  background: "#dcfce7",
  color: "#000000",
  borderColor: "#bbf7d0",
};

const stateAcked = {
  background: "#dbeafe",
  color: "#000000",
  borderColor: "#bfdbfe",
};

const stateDisabled = {
  background: "#e5e7eb",
  color: "#000000",
  borderColor: "#d1d5db",
};

const stateDefault = {
  background: "#f3f4f6",
  color: "#000000",
  borderColor: "#e5e7eb",
};