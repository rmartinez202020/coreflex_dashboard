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

  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

  const visibleAlarms = React.useMemo(() => {
    if (alarmView === "active") return alarms.filter(a => !a.acknowledged);
    if (alarmView === "disabled") return [];
    return alarms;
  }, [alarmView, alarms]);

  const getRowStyle = (a) => {
    if (selectedId === a.id) {
      return { background: "#fbbf24", color: "#111827" };
    }
    if (!a.acknowledged) {
      return { background: "#dc2626", color: "#ffffff" };
    }
    return { background: "#ffffff", color: "#111827" };
  };

  return (
    <div style={wrap}>
      {/* TOP BAR */}
      <div style={topBar}>
        <div style={titleWrap}>
          <span style={{ fontWeight: 900 }}>{title}</span>
          <span style={countPill}>{visibleAlarms.length}</span>
        </div>

        <div style={btnRow}>
          <button style={iconBtn} onClick={onOpenSettings}>⚙</button>
          <button style={iconBtn} onClick={onLaunch}>↗</button>
          <button style={iconBtn} onClick={onMinimize}>—</button>
          <button style={{ ...iconBtn, borderColor: "#7f1d1d" }} onClick={() => setShowCloseConfirm(true)}>✕</button>
        </div>
      </div>

      {/* TABS */}
      <div style={tabsBar}>
        {["alarms", "history", "active", "disabled"].map(v => (
          <TabButton
            key={v}
            label={v.charAt(0).toUpperCase() + v.slice(1)}
            active={alarmView === v}
            onClick={() => setAlarmView(v)}
          />
        ))}
      </div>

      {/* TABLE */}
      <div style={table}>
        {/* HEADER */}
        <div style={headerRow}>
          <div style={{ ...cellHead, width: 170 }}>Time</div>
          <div style={{ ...cellHead, width: 48, textAlign: "center" }}>Ack</div>
          <div style={{ ...cellHead, width: 48, textAlign: "center" }}>Sev</div>
          <div style={{ ...cellHead, flex: 1 }}>Alarm Text</div>
          <div style={{ ...cellHead, width: 120 }}>Group</div>
          <div style={{ ...cellHead, width: 120 }}>Controller</div>
        </div>

        {/* ROWS */}
        {visibleAlarms.map(a => {
          const style = getRowStyle(a);
          return (
            <div
              key={a.id}
              style={{ ...row, background: style.background, color: style.color }}
              onMouseDown={() => setSelectedId(a.id)}
            >
              <div style={{ ...cell, width: 170 }}>{a.time}</div>
              <div style={{ ...cell, width: 48, textAlign: "center" }}>{a.acknowledged ? "✔" : ""}</div>
              <div style={{ ...cell, width: 48, textAlign: "center" }}>{a.severity}</div>
              <div style={{ ...cell, flex: 1 }}>{a.text}</div>
              <div style={{ ...cell, width: 120 }}>{a.groupName}</div>
              <div style={{ ...cell, width: 120 }}>{a.controller}</div>
            </div>
          );
        })}
      </div>

      {/* CLOSE CONFIRM */}
      {showCloseConfirm && (
        <div style={confirmOverlay}>
          <div style={confirmCard}>
            <div style={confirmTitle}>Close Alarm Log?</div>
            <div style={confirmActions}>
              <button style={cancelBtn} onClick={() => setShowCloseConfirm(false)}>Cancel</button>
              <button style={dangerBtn} onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ ...tabBtn, ...(active ? tabBtnActive : {}) }}
    >
      {label}
    </button>
  );
}

const wrap = {
  width: "100%",
  height: "100%",
  background: "#e5e7eb",
  border: "3px solid #000",
  boxShadow: "0 0 0 1px #374151 inset, 0 8px 24px rgba(0,0,0,.45)",
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  height: 42,
  background: "#111827",
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 10px",
  borderBottom: "2px solid #000",
};

const titleWrap = { display: "flex", gap: 8, alignItems: "center" };
const countPill = { background: "#000", padding: "2px 8px", borderRadius: 999 };

const btnRow = { display: "flex", gap: 6 };
const iconBtn = { width: 28, height: 26, background: "#000", color: "#fff", borderRadius: 6 };

const tabsBar = { height: 34, display: "flex", gap: 6, padding: "0 10px", background: "#d1d5db" };
const tabBtn = { padding: "4px 10px", fontWeight: 900, borderRadius: 6 };
const tabBtnActive = { background: "#fff", border: "1px solid #000" };

const table = { flex: 1, overflow: "auto" };
const headerRow = { display: "flex", background: "#111827", color: "#fff" };
const cellHead = { padding: 8, fontWeight: 900, fontSize: 12 };

const row = { display: "flex", borderBottom: "1px solid #9ca3af", cursor: "default" };
const cell = { padding: 8, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const confirmOverlay = { position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", justifyContent: "center", alignItems: "center" };
const confirmCard = { background: "#fff", padding: 16, borderRadius: 12 };
const confirmTitle = { fontWeight: 900 };
const confirmActions = { display: "flex", justifyContent: "flex-end", gap: 10 };
const cancelBtn = { padding: "6px 12px" };
const dangerBtn = { padding: "6px 12px", background: "#7f1d1d", color: "#fff" };
