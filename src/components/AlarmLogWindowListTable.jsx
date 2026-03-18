// src/components/AlarmLogWindowListTable.jsx
import React from "react";

const GRID_TEMPLATE =
  "34px minmax(130px,1.1fr) minmax(96px,0.8fr) minmax(220px,2.2fr) minmax(100px,0.9fr) minmax(110px,0.9fr) minmax(84px,0.8fr) minmax(140px,1.1fr) minmax(90px,0.8fr) minmax(90px,0.8fr) minmax(100px,0.9fr)";

function isAcknowledged(alarm) {
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

function getStateStyle(state) {
  switch (String(state || "").toUpperCase()) {
    case "ACTIVE":
      return stateActive;
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
  visibleAlarms = [],
  checkedIds,
  selectedId,
  setSelectedId,
  toggleChecked,
  toggleAllVisible,
  onAcknowledgeAlarm, // ✅ NEW
}) {
  const allVisibleSelected =
    visibleAlarms.length > 0 &&
    visibleAlarms.every((a) => checkedIds?.has?.(a.id));

  return (
    <div style={tableOuter}>
      <div style={tableInner}>
        {/* HEADER */}
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

          <div style={getHeadCellStyle()}>Time</div>

          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            State
          </div>

          <div style={getHeadCellStyle()}>Alarm Text</div>

          <div style={getHeadCellStyle()}>Severity</div>

          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            Occurrences
          </div>

          <div style={getHeadCellStyle(false, { justifyContent: "center" })}>
            Ack
          </div>

          <div style={getHeadCellStyle()}>Device</div>

          <div style={getHeadCellStyle()}>Tag</div>

          <div style={getHeadCellStyle(false, { justifyContent: "flex-end" })}>
            Value
          </div>

          <div style={getHeadCellStyle(true)}>Group</div>
        </div>

        {/* BODY */}
        <div style={bodyWrap}>
          <div style={rowsLayer}>
            {visibleAlarms.map((a) => {
              const isChecked = checkedIds?.has?.(a.id);
              const isSelected = selectedId === a.id;
              const stateText = renderState(a);
              const acked = isAcknowledged(a);
              const isActiveUnacked = stateText === "ACTIVE" && !acked;

              let rowBg = "#ffffff";
              if (isActiveUnacked) rowBg = "#fee2e2";
              else if (isSelected) rowBg = "#eef4ff";

              return (
                <div
                  key={a.id}
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

                  <div style={getBodyCellStyle(false, { background: rowBg })}>
                    {a.time || "—"}
                  </div>

                  <div
                    style={getBodyCellStyle(false, {
                      justifyContent: "center",
                      background: rowBg,
                    })}
                  >
                    <span style={{ ...stateBadge, ...getStateStyle(stateText) }}>
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
                    {renderOccurrences(a)}
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
                        ...(acked ? ackBtnDone : ackBtnReady),
                      }}
                      disabled={acked}
                      title={acked ? "Alarm already acknowledged" : "Acknowledge alarm"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (acked) return;
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

                  <div style={getBodyCellStyle(true, { background: rowBg })}>
                    {renderGroup(a)}
                  </div>
                </div>
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

const ackBtn = {
  minWidth: 58,
  height: 26,
  padding: "0 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid transparent",
  cursor: "pointer",
};

const ackBtnReady = {
  background: "#fee2e2",
  color: "#991b1b",
  borderColor: "#fecaca",
};

const ackBtnDone = {
  background: "#e5e7eb",
  color: "#475569",
  borderColor: "#cbd5e1",
  cursor: "default",
};

const stateBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 72,
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid transparent",
};

const stateActive = {
  background: "#fee2e2",
  color: "#000000",
  borderColor: "#fecaca",
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