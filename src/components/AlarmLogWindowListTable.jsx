// src/components/AlarmLogWindowListTable.jsx
import React from "react";

const COL = {
  sel: 34,
  time: 160,
  state: 96,
  ack: 56,
  alarmText: 220,
  device: 160,
  tag: 96,
  value: 110,
  group: 120,
};

const COL_ORDER = [
  ["sel", COL.sel],
  ["time", COL.time],
  ["state", COL.state],
  ["ack", COL.ack],
  ["alarmText", COL.alarmText],
  ["device", COL.device],
  ["tag", COL.tag],
  ["value", COL.value],
  ["group", COL.group],
];

const GRID_TEMPLATE = COL_ORDER.map(([, w]) => `${w}px`).join(" ");
const TOTAL_WIDTH = COL_ORDER.reduce((sum, [, w]) => sum + w, 0);

const VERTICAL_LINES = (() => {
  let x = 0;
  const out = [];
  for (let i = 0; i < COL_ORDER.length - 1; i += 1) {
    x += COL_ORDER[i][1];
    out.push(x);
  }
  return out;
})();

function renderAck(a) {
  if (a?.acknowledged === true) return "Yes";
  return "No";
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

function renderGroup(a) {
  return a?.groupName ?? a?.group ?? "—";
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

export default function AlarmLogWindowListTable({
  visibleAlarms = [],
  checkedIds,
  selectedId,
  setSelectedId,
  toggleChecked,
  toggleAllVisible,
}) {
  const allVisibleSelected =
    visibleAlarms.length > 0 &&
    visibleAlarms.every((a) => checkedIds?.has?.(a.id));

  return (
    <div style={tableOuter}>
      <div style={{ ...tableInner, width: TOTAL_WIDTH, minWidth: TOTAL_WIDTH }}>
        {/* HEADER */}
        <div style={{ ...headerRow, gridTemplateColumns: GRID_TEMPLATE }}>
          <div style={{ ...cellHead, justifyContent: "center" }}>
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

          <div style={cellHead}>Time</div>
          <div style={{ ...cellHead, justifyContent: "center" }}>State</div>
          <div style={{ ...cellHead, justifyContent: "center" }}>Ack</div>
          <div style={cellHead}>Alarm Text</div>
          <div style={cellHead}>Device</div>
          <div style={cellHead}>Tag</div>
          <div style={{ ...cellHead, justifyContent: "flex-end" }}>Value</div>
          <div style={cellHead}>Group</div>
        </div>

        {/* BODY */}
        <div style={bodyWrap}>
          {/* aligned background grid */}
          <div style={gridOverlay}>
            {VERTICAL_LINES.map((left, idx) => (
              <div
                key={`v-${idx}`}
                style={{
                  ...verticalLine,
                  left,
                }}
              />
            ))}
          </div>

          {/* ROWS */}
          <div style={rowsLayer}>
            {visibleAlarms.map((a) => {
              const isChecked = checkedIds?.has?.(a.id);
              const isSelected = selectedId === a.id;
              const stateText = renderState(a);

              return (
                <div
                  key={a.id}
                  style={{
                    ...dataRow,
                    gridTemplateColumns: GRID_TEMPLATE,
                    background: isSelected ? "#eef4ff" : "transparent",
                    color: "#111827",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedId?.(a.id);
                  }}
                >
                  <div style={{ ...cell, justifyContent: "center" }}>
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

                  <div style={cell}>{a.time || "—"}</div>

                  <div style={{ ...cell, justifyContent: "center" }}>
                    <span style={{ ...stateBadge, ...getStateStyle(stateText) }}>
                      {stateText}
                    </span>
                  </div>

                  <div style={{ ...cell, justifyContent: "center" }}>
                    {renderAck(a)}
                  </div>

                  <div style={cell}>{renderAlarmText(a)}</div>

                  <div style={cell}>{renderDevice(a)}</div>

                  <div style={cell}>{renderTag(a)}</div>

                  <div style={{ ...cell, justifyContent: "flex-end" }}>
                    {renderValue(a)}
                  </div>

                  <div style={cell}>{renderGroup(a)}</div>
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
};

const tableInner = {
  position: "relative",
  minHeight: "100%",
  background: "#ffffff",
};

const headerRow = {
  display: "grid",
  alignItems: "stretch",
  background: "#eef1f5",
  color: "#111827",
  borderBottom: "1px solid #d1d5db",
  position: "sticky",
  top: 0,
  zIndex: 5,
};

const bodyWrap = {
  position: "relative",
  minHeight: "calc(100% - 36px)",
};

const gridOverlay = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: "linear-gradient(#eef2f7 1px, transparent 1px)",
  backgroundSize: "100% 30px",
  zIndex: 0,
};

const verticalLine = {
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 1,
  background: "#eef2f7",
};

const rowsLayer = {
  position: "relative",
  zIndex: 1,
};

const dataRow = {
  display: "grid",
  alignItems: "stretch",
  minHeight: 30,
  borderBottom: "1px solid #e5e7eb",
  cursor: "default",
};

const cellHead = {
  minWidth: 0,
  padding: "8px 10px",
  fontWeight: 900,
  fontSize: 12,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  borderRight: "1px solid #dbe3ec",
};

const cell = {
  minWidth: 0,
  padding: "8px 10px",
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "flex",
  alignItems: "center",
  borderRight: "1px solid #eef2f7",
};

const checkbox = {
  width: 14,
  height: 14,
  cursor: "pointer",
  accentColor: "#111827",
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
  color: "#991b1b",
  borderColor: "#fecaca",
};

const stateReturned = {
  background: "#dcfce7",
  color: "#166534",
  borderColor: "#bbf7d0",
};

const stateAcked = {
  background: "#dbeafe",
  color: "#1d4ed8",
  borderColor: "#bfdbfe",
};

const stateDisabled = {
  background: "#e5e7eb",
  color: "#374151",
  borderColor: "#d1d5db",
};

const stateDefault = {
  background: "#f3f4f6",
  color: "#111827",
  borderColor: "#e5e7eb",
};