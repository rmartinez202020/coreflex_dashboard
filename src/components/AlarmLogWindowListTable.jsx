// src/components/AlarmLogWindowListTable.jsx
import React from "react";

const COL = {
  sel: 34,
  time: 170,
  state: 96,
  ack: 52,
  device: 130,
  tag: 90,
  value: 100,
  group: 120,
};

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
    <div style={table}>
      <div style={headerRow}>
        <div style={{ ...cellHead, width: COL.sel, textAlign: "center" }}>
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

        <div style={{ ...cellHead, width: COL.time, textAlign: "left" }}>
          Time
        </div>

        <div style={{ ...cellHead, width: COL.state, textAlign: "center" }}>
          State
        </div>

        <div style={{ ...cellHead, width: COL.ack, textAlign: "center" }}>
          Ack
        </div>

        <div style={{ ...cellHead, flex: 1, minWidth: 260 }}>Alarm Text</div>

        <div style={{ ...cellHead, width: COL.device }}>Device</div>

        <div style={{ ...cellHead, width: COL.tag }}>Tag</div>

        <div style={{ ...cellHead, width: COL.value, textAlign: "right" }}>
          Value
        </div>

        <div style={{ ...cellHead, width: COL.group }}>Group</div>
      </div>

      {visibleAlarms.map((a) => {
        const isChecked = checkedIds?.has?.(a.id);
        const isSelected = selectedId === a.id;
        const stateText = renderState(a);

        return (
          <div
            key={a.id}
            style={{
              ...row,
              background: isSelected ? "#eef4ff" : "#ffffff",
              color: "#111827",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedId?.(a.id);
            }}
          >
            <div style={{ ...cell, width: COL.sel, textAlign: "center" }}>
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

            <div style={{ ...cell, width: COL.time }}>{a.time || "—"}</div>

            <div style={{ ...cell, width: COL.state, textAlign: "center" }}>
              <span style={{ ...stateBadge, ...getStateStyle(stateText) }}>
                {stateText}
              </span>
            </div>

            <div style={{ ...cell, width: COL.ack, textAlign: "center" }}>
              {renderAck(a)}
            </div>

            <div style={{ ...cell, flex: 1, minWidth: 260 }}>
              {renderAlarmText(a)}
            </div>

            <div style={{ ...cell, width: COL.device }}>{renderDevice(a)}</div>

            <div style={{ ...cell, width: COL.tag }}>{renderTag(a)}</div>

            <div style={{ ...cell, width: COL.value, textAlign: "right" }}>
              {renderValue(a)}
            </div>

            <div style={{ ...cell, width: COL.group }}>{renderGroup(a)}</div>
          </div>
        );
      })}

      {visibleAlarms.length === 0 && (
        <div style={emptyWrap}>
          <div style={emptyState}>
            <b>No alarms yet.</b>
            <div style={{ marginTop: 6, color: "#374151" }}>
              The alarm engine is not configured — this log window is ready and
              will show events once we wire the alarm rules.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const table = {
  flex: 1,
  overflow: "auto",
  background: "#ffffff",
  backgroundImage:
    "linear-gradient(#eef2f7 1px, transparent 1px), linear-gradient(90deg, #eef2f7 1px, transparent 1px)",
  backgroundSize: "100% 30px, 160px 100%",
};

const headerRow = {
  display: "flex",
  background: "#eef1f5",
  color: "#111827",
  borderBottom: "1px solid #d1d5db",
};

const cellHead = {
  padding: 8,
  fontWeight: 900,
  fontSize: 12,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const row = {
  display: "flex",
  borderBottom: "1px solid #e5e7eb",
  cursor: "default",
};

const cell = {
  padding: 8,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
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

const emptyWrap = {
  padding: 16,
  background: "transparent",
};

const emptyState = {
  padding: 14,
  fontSize: 13,
  color: "#111827",
  background: "#ffffff",
  border: "1px solid #dbe2ea",
  borderRadius: 10,
  width: "fit-content",
  maxWidth: 720,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};