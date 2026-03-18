// src/components/AlarmLogWindowListTable.jsx
import React from "react";

const GRID_TEMPLATE =
  "34px minmax(130px,1.1fr) minmax(96px,0.8fr) minmax(220px,2.2fr) minmax(110px,0.9fr) minmax(64px,0.7fr) minmax(140px,1.1fr) minmax(90px,0.8fr) minmax(90px,0.8fr) minmax(100px,0.9fr)";

function renderAck(a) {
  if (a?.acknowledged === true) return "Yes";
  if (a?.ack === "Yes") return "Yes";
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
      <div style={tableInner}>
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
          <div style={cellHead}>Alarm Text</div>
          <div style={{ ...cellHead, justifyContent: "center" }}>
            Occurrences
          </div>
          <div style={{ ...cellHead, justifyContent: "center" }}>Ack</div>
          <div style={cellHead}>Device</div>
          <div style={cellHead}>Tag</div>
          <div style={{ ...cellHead, justifyContent: "flex-end" }}>Value</div>
          <div style={cellHead}>Group</div>
        </div>

        {/* BODY */}
        <div style={bodyWrap}>
          <div style={gridOverlay} />

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

                  <div style={cell}>{renderAlarmText(a)}</div>

                  <div style={{ ...cell, justifyContent: "center" }}>
                    {renderOccurrences(a)}
                  </div>

                  <div style={{ ...cell, justifyContent: "center" }}>
                    {renderAck(a)}
                  </div>

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
  borderBottom: "1px solid #d1d5db",
  position: "sticky",
  top: 0,
  zIndex: 5,
  width: "100%",
  minWidth: 0,
};

const bodyWrap = {
  position: "relative",
  minHeight: "calc(100% - 36px)",
  width: "100%",
  minWidth: 0,
};

const gridOverlay = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 0,
  backgroundImage:
    "linear-gradient(#eef2f7 1px, transparent 1px), linear-gradient(90deg, #eef2f7 1px, transparent 1px)",
  backgroundSize: "100% 30px, 100% 100%",
};

const rowsLayer = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  minWidth: 0,
};

const dataRow = {
  display: "grid",
  alignItems: "stretch",
  minHeight: 30,
  borderBottom: "1px solid #e5e7eb",
  cursor: "default",
  width: "100%",
  minWidth: 0,
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