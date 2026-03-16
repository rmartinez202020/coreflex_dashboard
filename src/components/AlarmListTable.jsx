// src/components/AlarmListTable.jsx
import React from "react";

function formatTagLabel(field) {
  const s = String(field || "").trim().toLowerCase();
  if (!s) return "—";

  if (/^di[1-9]\d*$/.test(s)) return s.toUpperCase().replace("DI", "DI-");
  if (/^do[1-9]\d*$/.test(s)) return s.toUpperCase().replace("DO", "DO-");
  if (/^ai[1-9]\d*$/.test(s)) return s.toUpperCase().replace("AI", "AI-");
  if (/^ao[1-9]\d*$/.test(s)) return s.toUpperCase().replace("AO", "AO-");
  if (/^te10[1-9]\d*$/.test(s)) return s.toUpperCase();

  return s.toUpperCase();
}

function getTypeText(alarm) {
  const io = String(alarm?.ioType || "").trim().toUpperCase();
  if (io === "DI" || io === "AI") return io;

  return String(alarm?.type || "").trim().toLowerCase() === "boolean"
    ? "DI"
    : "AI";
}

function getConditionText(alarm) {
  const type = String(alarm?.type || "").trim().toLowerCase();

  if (type === "boolean") {
    const contactType = String(
      alarm?.config?.contactType || ""
    ).trim().toUpperCase();
    if (contactType === "NC") return "NC → 0";
    return "NO → 1";
  }

  const op =
    String(alarm?.config?.operator || alarm?.operator || "").trim() || "—";
  const threshold =
    alarm?.config?.threshold ?? alarm?.value ?? alarm?.threshold ?? "—";

  return `${op} ${String(threshold)}`;
}

function getMathText(alarm) {
  const type = String(alarm?.type || "").trim().toLowerCase();
  if (type !== "dynamic") return "—";

  const formula = String(alarm?.config?.mathFormula || "").trim();
  return formula || "—";
}

function getGroupText(alarm) {
  return String(
    alarm?.group || alarm?.config?.group || alarm?.groupName || "General"
  ).trim();
}

function getSeverityText(alarm) {
  const type = String(alarm?.type || "").trim().toLowerCase();
  if (type === "boolean") return "—";

  return String(alarm?.severity || alarm?.config?.severity || "Warning").trim();
}

function getEnabledText(alarm) {
  const enabled = alarm?.enabled;
  if (enabled === false) return "No";
  return "Yes";
}

function getDashboardText(alarm) {
  const name = String(alarm?.dashboardName || "").trim();
  const id = String(alarm?.dashboardId || "").trim();

  if (name) return name;
  if (id === "main") return "Main Dashboard";
  return id || "—";
}

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
            style={{
              ...tableBtn,
              ...(canAdd ? {} : tableBtnDisabled),
            }}
            onClick={onAdd}
            disabled={!canAdd}
            title={!canAdd ? "Complete all required alarm settings" : "Add Alarm"}
          >
            Add Alarm
          </button>

          <button
            type="button"
            style={{
              ...tableBtn,
              ...(checkedIds.size === 0 ? tableBtnDisabled : {}),
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

          <div style={{ ...tHeadCell, width: 180 }}>Dashboard</div>
          <div style={{ ...tHeadCell, width: 100 }}>Tag</div>
          <div style={{ ...tHeadCell, width: 170 }}>Device</div>
          <div style={{ ...tHeadCell, width: 70, textAlign: "center" }}>
            Type
          </div>
          <div style={{ ...tHeadCell, width: 140 }}>Condition</div>
          <div style={{ ...tHeadCell, width: 160 }}>Math</div>
          <div style={{ ...tHeadCell, width: 120 }}>Group</div>
          <div style={{ ...tHeadCell, width: 100 }}>Severity</div>
          <div
            style={{
              ...tHeadCell,
              flex: 1,
              minWidth: 260,
            }}
          >
            Message
          </div>
          <div
            style={{
              ...tHeadCell,
              width: 90,
              textAlign: "center",
              borderRight: "none",
            }}
          >
            Enabled
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

                  <div style={{ ...tCell, width: 180 }}>
                    {getDashboardText(a)}
                  </div>

                  <div style={{ ...tCell, width: 100, fontWeight: 800 }}>
                    {formatTagLabel(a.field)}
                  </div>

                  <div style={{ ...tCell, width: 170 }}>
                    {String(a.deviceId || "—")}
                  </div>

                  <div
                    style={{
                      ...tCell,
                      width: 70,
                      textAlign: "center",
                      fontWeight: 800,
                    }}
                  >
                    {getTypeText(a)}
                  </div>

                  <div style={{ ...tCell, width: 140 }}>
                    {getConditionText(a)}
                  </div>

                  <div style={{ ...tCell, width: 160 }}>{getMathText(a)}</div>

                  <div style={{ ...tCell, width: 120 }}>
                    {getGroupText(a)}
                  </div>

                  <div style={{ ...tCell, width: 100 }}>
                    {getSeverityText(a)}
                  </div>

                  <div
                    style={{
                      ...tCell,
                      flex: 1,
                      minWidth: 260,
                    }}
                  >
                    {a.message || <span style={{ color: "#888" }}>—</span>}
                  </div>

                  <div
                    style={{
                      ...tCell,
                      width: 90,
                      textAlign: "center",
                      borderRight: "none",
                      fontWeight: 800,
                    }}
                  >
                    {getEnabledText(a)}
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

const tableBtnDisabled = {
  opacity: 0.45,
  cursor: "not-allowed",
  background: "#f3f4f6",
  color: "#8a8f98",
  border: "1px solid #d7dbe0",
  boxShadow: "none",
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
  overflowX: "auto",
  background: "#ffffff",
};

const tRow = {
  display: "flex",
  borderBottom: "1px solid #e2e2e2",
  background: "#fff",
  minWidth: "1390px",
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