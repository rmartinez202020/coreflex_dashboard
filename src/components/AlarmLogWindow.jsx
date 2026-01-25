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
  // ✅ NOTE: no real alarm setup yet — keep UI, but don’t show “alarm red” logic
  const alarms = useAlarmsMockData();

  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

  // ✅ For now, ALL tabs show the same mock data (until real alarm logic exists)
  const visibleAlarms = React.useMemo(() => {
    if (alarmView === "disabled") return []; // keep this as empty placeholder tab
    return alarms;
  }, [alarmView, alarms]);

  // ✅ No alarm logic yet → remove red background rule
  const getRowStyle = (a) => {
    if (selectedId === a.id) {
      return { background: "#fbbf24", color: "#111827" }; // selected = yellow
    }
    return { background: "#ffffff", color: "#111827" }; // default rows = white
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
          <button
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
            style={{ ...iconBtn, borderColor: "#7f1d1d" }}
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              setShowCloseConfirm(true);
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={tabsBar}>
        {["alarms", "history", "active", "disabled"].map((v) => (
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
          {/* ✅ Time is FIRST left-to-right */}
          <div style={{ ...cellHead, width: COL.time, textAlign: "left" }}>
            Time
          </div>
          <div style={{ ...cellHead, width: COL.ack, textAlign: "center" }}>
            Ack
          </div>
          <div style={{ ...cellHead, width: COL.sev, textAlign: "center" }}>
            Sev
          </div>
          <div style={{ ...cellHead, flex: 1, minWidth: 260 }}>Alarm Text</div>
          <div style={{ ...cellHead, width: COL.group }}>Group</div>
          <div style={{ ...cellHead, width: COL.controller }}>Controller</div>
        </div>

        {/* ROWS */}
        {visibleAlarms.map((a) => {
          const style = getRowStyle(a);

          return (
            <div
              key={a.id}
              style={{
                ...row,
                background: style.background,
                color: style.color,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(a.id);
              }}
              title={a.text}
            >
              <div style={{ ...cell, width: COL.time }}>{a.time}</div>
              <div style={{ ...cell, width: COL.ack, textAlign: "center" }}>
                {a.acknowledged ? "✔" : ""}
              </div>
              <div style={{ ...cell, width: COL.sev, textAlign: "center" }}>
                {a.severity}
              </div>
              <div style={{ ...cell, flex: 1, minWidth: 260 }}>{a.text}</div>
              <div style={{ ...cell, width: COL.group }}>{a.groupName}</div>
              <div style={{ ...cell, width: COL.controller }}>{a.controller}</div>
            </div>
          );
        })}

        {visibleAlarms.length === 0 && (
          <div style={emptyState}>
            No items to display in <b>{alarmView}</b>.
          </div>
        )}
      </div>

      {/* CLOSE CONFIRM */}
      {showCloseConfirm && (
        <div
          style={confirmOverlay}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={confirmCard}>
            <div style={confirmTitle}>Close Alarm Log?</div>

            <div style={confirmActions}>
              <button
                style={cancelBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCloseConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                style={dangerBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCloseConfirm(false);
                  onClose?.();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{ ...tabBtn, ...(active ? tabBtnActive : {}) }}
    >
      {label}
    </button>
  );
}

// ✅ Fixed column widths = perfect alignment (SCADA-style)
const COL = {
  time: 170,
  ack: 48,
  sev: 48,
  group: 120,
  controller: 120,
};

/* ---------------- STYLES ---------------- */

const wrap = {
  width: "100%",
  height: "100%",
  background: "#e5e7eb",
  border: "3px solid #000",
  boxShadow: "0 0 0 1px #374151 inset, 0 8px 24px rgba(0,0,0,.45)",
  display: "flex",
  flexDirection: "column",
  position: "relative", // ✅ required for confirmOverlay
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
const countPill = {
  background: "#000",
  padding: "2px 8px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12,
};

const btnRow = { display: "flex", gap: 6, alignItems: "center" };
const iconBtn = {
  width: 28,
  height: 26,
  background: "#000",
  color: "#fff",
  borderRadius: 6,
  border: "1px solid #111",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "26px",
};

const tabsBar = {
  height: 34,
  display: "flex",
  gap: 6,
  padding: "0 10px",
  background: "#d1d5db",
  alignItems: "center",
  borderBottom: "1px solid #9ca3af",
};

const tabBtn = {
  padding: "4px 10px",
  fontWeight: 900,
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#f3f4f6",
  cursor: "pointer",
  fontSize: 12,
};

const tabBtnActive = {
  background: "#fff",
  border: "1px solid #000",
};

const table = {
  flex: 1,
  overflow: "auto",
  background: "#e5e7eb",
};

const headerRow = {
  display: "flex",
  background: "#111827",
  color: "#fff",
  borderBottom: "1px solid #000",
};

const cellHead = {
  padding: 8,
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const row = {
  display: "flex",
  borderBottom: "1px solid #9ca3af",
  cursor: "default",
};

const cell = {
  padding: 8,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyState = {
  padding: 14,
  fontSize: 13,
  color: "#111827",
  borderBottom: "1px solid #9ca3af",
};

const confirmOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
};

const confirmCard = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  border: "2px solid #000",
  minWidth: 320,
};

const confirmTitle = {
  fontWeight: 900,
  marginBottom: 12,
};

const confirmActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelBtn = {
  padding: "6px 12px",
  cursor: "pointer",
  border: "1px solid #9ca3af",
  background: "#f3f4f6",
  borderRadius: 8,
  fontWeight: 900,
};

const dangerBtn = {
  padding: "6px 12px",
  background: "#7f1d1d",
  color: "#fff",
  cursor: "pointer",
  border: "1px solid #ef4444",
  borderRadius: 8,
  fontWeight: 900,
};
