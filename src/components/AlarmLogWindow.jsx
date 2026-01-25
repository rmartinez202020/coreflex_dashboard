// src/components/AlarmLogWindow.jsx
import React from "react";
import useAlarmsMockData from "../hooks/useAlarmsMockData";

export default function AlarmLogWindow({
  onLaunch,
  onMinimize,
  onClose,
  onOpenSettings,
  title = "Alarms Log (AI)",
}) {
  const alarms = useAlarmsMockData();

  const [alarmView, setAlarmView] = React.useState("alarms"); // alarms | history | active | disabled
  const [selectedId, setSelectedId] = React.useState(null);

  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

  const requestClose = (e) => {
    e?.stopPropagation?.();
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose?.();
  };

  const cancelClose = () => setShowCloseConfirm(false);

  const visibleAlarms = React.useMemo(() => {
    if (alarmView === "active") return alarms.filter((a) => !a.acknowledged);
    if (alarmView === "disabled") return [];
    return alarms; // alarms + history for now
  }, [alarmView, alarms]);

  const getRowStyle = (a) => {
    const isSelected = selectedId === a.id;

    if (isSelected) {
      return {
        background: "#fbbf24", // yellow
        color: "#111827",
      };
    }

    // Unacked alarms: red rows
    if (!a.acknowledged) {
      return {
        background: "#dc2626", // red
        color: "#ffffff",
      };
    }

    // Normal/ack rows: white
    return {
      background: "#ffffff",
      color: "#111827",
    };
  };

  return (
    <div style={wrap}>
      {/* TOP BAR */}
      <div style={topBar}>
        <div style={leftTop}>
          <div style={titleWrap}>
            <span style={{ fontWeight: 900 }}>{title}</span>
            <span style={countPill}>{visibleAlarms.length}</span>
          </div>
        </div>

        {/* ✅ 4 Buttons on top-right */}
        <div style={btnRow}>
          <button
            type="button"
            style={iconBtn}
            title="Settings"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings?.();
            }}
          >
            ⚙
          </button>

          <button
            type="button"
            style={iconBtn}
            title="Launch"
            onClick={(e) => {
              e.stopPropagation();
              onLaunch?.();
            }}
          >
            ↗
          </button>

          <button
            type="button"
            style={iconBtn}
            title="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize?.();
            }}
          >
            —
          </button>

          <button
            type="button"
            style={{ ...iconBtn, borderColor: "#7f1d1d" }}
            title="Close"
            onClick={requestClose}
          >
            ✕
          </button>
        </div>
      </div>

      {/* TABS ROW */}
      <div style={tabsBar}>
        <TabButton
          label="Alarms"
          active={alarmView === "alarms"}
          onClick={() => setAlarmView("alarms")}
        />
        <TabButton
          label="History"
          active={alarmView === "history"}
          onClick={() => setAlarmView("history")}
        />
        <TabButton
          label="Active"
          active={alarmView === "active"}
          onClick={() => setAlarmView("active")}
        />
        <TabButton
          label="Disabled"
          active={alarmView === "disabled"}
          onClick={() => setAlarmView("disabled")}
        />
      </div>

      {/* TABLE */}
      <div style={table}>
        <div style={header}>
          {["Ack", "Sev", "Alarm Text", "Time", "Group", "Controller"].map(
            (h) => (
              <div key={h} style={cellHead}>
                {h}
              </div>
            )
          )}
        </div>

        {visibleAlarms.map((a) => {
          const rowColors = getRowStyle(a);

          return (
            <div
              key={a.id}
              style={{
                ...row,
                background: rowColors.background,
                color: rowColors.color,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(a.id);
              }}
            >
              <div style={{ ...cell, color: rowColors.color }}>
                {a.acknowledged ? "✔" : ""}
              </div>
              <div style={{ ...cell, color: rowColors.color }}>{a.severity}</div>
              <div style={{ ...cell, flex: 2, color: rowColors.color }}>
                {a.text}
              </div>
              <div style={{ ...cell, color: rowColors.color }}>{a.time}</div>
              <div style={{ ...cell, color: rowColors.color }}>{a.groupName}</div>
              <div style={{ ...cell, color: rowColors.color }}>{a.controller}</div>
            </div>
          );
        })}

        {visibleAlarms.length === 0 && (
          <div style={emptyState}>
            No alarms to display in <b>{alarmView}</b>.
          </div>
        )}
      </div>

      {/* ✅ CLOSE CONFIRM MODAL */}
      {showCloseConfirm && (
        <div style={confirmOverlay} onMouseDown={(e) => e.stopPropagation()}>
          <div style={confirmCard}>
            <div style={confirmTitle}>Close Alarm Log?</div>
            <div style={confirmText}>
              All settings will be lost. This action cannot be undone.
            </div>

            <div style={confirmActions}>
              <button type="button" style={cancelBtn} onClick={cancelClose}>
                Cancel
              </button>
              <button type="button" style={dangerBtn} onClick={confirmClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        ...tabBtn,
        ...(active ? tabBtnActive : null),
      }}
      title={label}
    >
      {label}
    </button>
  );
}

/* ✅ Updated palette + ✅ NEW strong black frame */
const wrap = {
  width: "100%",
  height: "100%",
  background: "#e5e7eb", // ✅ light gray (instead of black)
  color: "#111827",
  display: "flex",
  flexDirection: "column",
  position: "relative",

  // ✅ NEW: visible border/frame (matches VTScada feel)
  border: "3px solid #000000",
  boxShadow: "0 0 0 1px #374151 inset, 0 8px 24px rgba(0,0,0,0.45)",
};

const topBar = {
  height: 42,
  background: "#111827", // dark bar
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 10px",

  // ✅ stronger separation
  borderBottom: "2px solid #000000",
  color: "#f9fafb",
};

const leftTop = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const titleWrap = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const countPill = {
  fontSize: 12,
  fontWeight: 900,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#0b1220",
  border: "1px solid #374151",
  color: "#f9fafb",
};

const btnRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const iconBtn = {
  width: 28,
  height: 26,
  background: "#0b1220",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#f9fafb",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "24px",
};

const tabsBar = {
  height: 34,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 10px",
  background: "#d1d5db", // slightly darker gray
  borderBottom: "1px solid #9ca3af",
};

const tabBtn = {
  height: 26,
  padding: "0 10px",
  borderRadius: 8,
  border: "1px solid #9ca3af",
  background: "#f3f4f6",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const tabBtnActive = {
  background: "#ffffff",
  borderColor: "#111827",
  boxShadow: "0 0 0 2px rgba(17,24,39,0.12) inset",
};

const table = {
  flex: 1,
  overflow: "auto",
  background: "#e5e7eb",

  // ✅ NEW: helps the grid feel contained
  borderTop: "1px solid #000000",
  borderBottom: "2px solid #000000",
};

const header = {
  display: "flex",
  background: "#111827", // dark column header
  borderBottom: "1px solid #0b1220",
};

const cellHead = {
  flex: 1,
  padding: 8,
  fontSize: 12,
  fontWeight: 900,
  color: "#f9fafb",
};

const row = {
  display: "flex",
  borderBottom: "1px solid #9ca3af",
  cursor: "default",
};

const cell = {
  flex: 1,
  padding: 8,
  fontSize: 12,
};

const emptyState = {
  padding: 14,
  fontSize: 13,
  color: "#111827",
  borderBottom: "1px solid #9ca3af",
};

/* Confirm modal */
const confirmOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999999,
};

const confirmCard = {
  width: 420,
  background: "#ffffff",
  border: "1px solid #9ca3af",
  borderRadius: 14,
  boxShadow: "0 18px 60px rgba(0,0,0,.6)",
  padding: 16,
};

const confirmTitle = {
  fontSize: 16,
  fontWeight: 900,
  marginBottom: 8,
  color: "#111827",
};

const confirmText = {
  fontSize: 13,
  color: "#374151",
  lineHeight: "18px",
};

const confirmActions = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelBtn = {
  background: "#f3f4f6",
  border: "1px solid #9ca3af",
  color: "#111827",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};

const dangerBtn = {
  background: "#7f1d1d",
  border: "1px solid #ef4444",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};
