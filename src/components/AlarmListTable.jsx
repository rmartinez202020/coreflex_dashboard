// src/components/AlarmListTable.jsx
import React from "react";

export default function AlarmListTable({
  alarms = [],
  checkedIds = new Set(),
  allChecked = false,
  onToggleAll,
  onToggleRowCheck,
  onAdd,
  onDeleteSelected,
  canAdd = false,
}) {
  return (
    <div style={bottomArea}>
      <div style={tableHeader}>
        <div style={tableHeaderLeft}>
          <button
            type="button"
            style={tableBtn}
            onClick={onAdd}
            disabled={!canAdd}
          >
            Add Alarm
          </button>

          <button
            type="button"
            style={{
              ...tableBtn,
              opacity: checkedIds.size === 0 ? 0.5 : 1,
              cursor: checkedIds.size === 0 ? "not-allowed" : "pointer",
            }}
            disabled={checkedIds.size === 0}
            onClick={onDeleteSelected}
          >
            Delete Alarms
          </button>
        </div>

        <div />
      </div>

      <div style={tableWrap}>
        <div style={tHeadRow}>
          <div style={{ ...tHeadCell, width: 40, textAlign: "center" }}>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={onToggleAll}
              style={checkbox}
              title="Select all"
            />
          </div>

          <div style={{ ...tHeadCell, width: 190 }}>Trigger</div>
          <div style={{ ...tHeadCell, width: 120 }}>Alarm Type</div>
          <div style={{ ...tHeadCell, width: 150 }}>Edge Detection</div>
          <div
            style={{
              ...tHeadCell,
              width: 90,
              textAlign: "center",
            }}
          >
            Value
          </div>
          <div style={{ ...tHeadCell, width: 130 }}>Deadband Mode</div>
          <div
            style={{
              ...tHeadCell,
              width: 140,
              textAlign: "center",
            }}
          >
            Deadband Level
          </div>
          <div
            style={{
              ...tHeadCell,
              flex: 1,
              minWidth: 320,
              borderRight: "none",
            }}
          >
            Message
          </div>
        </div>

        <div style={tBody}>
          {alarms.length === 0 ? (
            <div style={tEmpty}>
              No alarms added yet. Add one above and it will appear here.
            </div>
          ) : (
            alarms.map((a) => {
              const checked = checkedIds.has(a.id);
              return (
                <div key={a.id} style={tRow}>
                  <div
                    style={{
                      ...tCell,
                      width: 40,
                      textAlign: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRowCheck?.(a.id)}
                      style={checkbox}
                    />
                  </div>

                  <div style={{ ...tCell, width: 190 }}>
                    <b style={{ fontSize: 13 }}>{a.field}</b>
                    <div style={tSub}>{a.deviceId}</div>
                  </div>

                  <div style={{ ...tCell, width: 120 }}>
                    {a.type === "boolean" ? "Bit" : "Analog"}
                  </div>

                  <div style={{ ...tCell, width: 150 }}>
                    {a.type === "boolean" ? "Equal" : a.edgeDetection}
                  </div>

                  <div
                    style={{
                      ...tCell,
                      width: 90,
                      textAlign: "center",
                    }}
                  >
                    {String(a.value)}
                  </div>

                  <div style={{ ...tCell, width: 130 }}>{a.deadbandMode}</div>

                  <div
                    style={{
                      ...tCell,
                      width: 140,
                      textAlign: "center",
                    }}
                  >
                    {String(a.deadbandLevel)}
                  </div>

                  <div
                    style={{
                      ...tCell,
                      flex: 1,
                      minWidth: 320,
                      borderRight: "none",
                    }}
                  >
                    {a.message || <span style={{ color: "#888" }}>—</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const bottomArea = {
  flex: "1 1 auto",
  overflow: "hidden",
  padding: "10px 12px 12px 12px",
  background: "#ffffff",
};

const tableHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const tableHeaderLeft = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const tableBtn = {
  height: 32,
  padding: "0 12px",
  borderRadius: 2,
  border: "1px solid #c9c9c9",
  background: "#efefef",
  color: "#111",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
};

const tableWrap = {
  border: "1px solid #c9c9c9",
  borderRadius: 2,
  overflow: "hidden",
  height: "calc(100% - 40px)",
  display: "flex",
  flexDirection: "column",
  background: "#fff",
};

const tHeadRow = {
  display: "flex",
  background: "#f3f3f3",
  color: "#111",
  borderBottom: "1px solid #c9c9c9",
};

const tHeadCell = {
  padding: "8px 8px",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  borderRight: "1px solid #d7d7d7",
};

const tBody = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  background: "#ffffff",
};

const tRow = {
  display: "flex",
  borderBottom: "1px solid #e2e2e2",
  background: "#fff",
};

const tCell = {
  padding: "8px 8px",
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#111",
  borderRight: "1px solid #eeeeee",
};

const tSub = {
  fontSize: 11,
  color: "#666",
  marginTop: 2,
};

const tEmpty = {
  padding: 12,
  color: "#666",
  fontSize: 12,
};

const checkbox = {
  width: 14,
  height: 14,
  cursor: "pointer",
};