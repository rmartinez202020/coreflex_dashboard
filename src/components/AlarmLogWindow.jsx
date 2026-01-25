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

  return (
    <div style={wrap}>
      {/* TOP BAR */}
      <div style={topBar}>
        <div style={titleWrap}>
          <span style={{ fontWeight: 900 }}>{title}</span>
          <span style={countPill}>{alarms.length}</span>
        </div>

        {/* ✅ 4 Buttons on top-right */}
        <div style={btnRow}>
          {/* Settings */}
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

          {/* Launch */}
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

          {/* Minimize */}
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

          {/* Close */}
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

        {alarms.map((a) => (
          <div
            key={a.id}
            style={{
              ...row,
              background:
                a.severity >= 4 ? "rgba(245,158,11,0.12)" : "transparent",
            }}
          >
            <div style={cell}>{a.acknowledged ? "✔" : ""}</div>
            <div style={cell}>{a.severity}</div>
            <div style={{ ...cell, flex: 2 }}>{a.text}</div>
            <div style={cell}>{a.time}</div>
            <div style={cell}>{a.groupName}</div>
            <div style={cell}>{a.controller}</div>
          </div>
        ))}
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

const wrap = {
  width: "100%",
  height: "100%",
  background: "#0b1220",
  color: "#e5e7eb",
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  height: 42,
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 10px",
  borderBottom: "1px solid #111827",
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
  background: "#111827",
  border: "1px solid #334155",
  color: "#e5e7eb",
};

const btnRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const iconBtn = {
  width: 28,
  height: 26,
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: 8,
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "24px",
};

const table = {
  flex: 1,
  overflow: "auto",
};

const header = {
  display: "flex",
  background: "#020617",
  borderBottom: "1px solid #374151",
};

const cellHead = {
  flex: 1,
  padding: 8,
  fontSize: 12,
  fontWeight: 900,
  color: "#e5e7eb",
};

const row = {
  display: "flex",
  borderBottom: "1px solid #1f2937",
};

const cell = {
  flex: 1,
  padding: 8,
  fontSize: 12,
  color: "#e5e7eb",
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
  background: "#0b1220",
  border: "1px solid #334155",
  borderRadius: 14,
  boxShadow: "0 18px 60px rgba(0,0,0,.6)",
  padding: 16,
};

const confirmTitle = {
  fontSize: 16,
  fontWeight: 900,
  marginBottom: 8,
};

const confirmText = {
  fontSize: 13,
  color: "#cbd5e1",
  lineHeight: "18px",
};

const confirmActions = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelBtn = {
  background: "#111827",
  border: "1px solid #374151",
  color: "#e5e7eb",
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
