// src/components/AlarmLogWindow.jsx
import React from "react";

export default function AlarmLogWindow({
  onLaunch,
  onMinimize,
  onClose,
  onOpenSettings,
  title = "Alarms Log (DI-AI)",
}) {
  // ✅ NO ALARMS YET
  const alarms = [];

  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);

  const visibleAlarms = React.useMemo(() => {
    if (alarmView === "disabled") return [];
    return alarms;
  }, [alarmView, alarms]);

  const toggleChecked = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        visibleAlarms.length > 0 && visibleAlarms.every((a) => next.has(a.id));

      if (allSelected) visibleAlarms.forEach((a) => next.delete(a.id));
      else visibleAlarms.forEach((a) => next.add(a.id));

      return next;
    });
  };

  const onAcknowledgeSelected = () => {
    if (checkedIds.size === 0) return;
    console.log("✅ Acknowledge IDs:", Array.from(checkedIds));
    setCheckedIds(new Set());
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

          {/* ✅ IMPORTANT: this MUST call parent minimizer */}
          <button
            style={iconBtn}
            title="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              console.log("🟡 AlarmLogWindow minimize clicked");
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
        <div style={headerRow}>
          <div style={{ ...cellHead, width: COL.sel, textAlign: "center" }}>
            <input
              type="checkbox"
              checked={
                visibleAlarms.length > 0 &&
                visibleAlarms.every((a) => checkedIds.has(a.id))
              }
              onChange={(e) => {
                e.stopPropagation();
                toggleAllVisible();
              }}
              style={checkbox}
              title="Select all"
              disabled={visibleAlarms.length === 0}
            />
          </div>

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

        {/* Rows (none for now) */}
        {visibleAlarms.map((a) => {
          const isChecked = checkedIds.has(a.id);

          return (
            <div
              key={a.id}
              style={{ ...row, background: "#fff", color: "#111827" }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedId(a.id);
              }}
            >
              <div style={{ ...cell, width: COL.sel, textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleChecked(a.id);
                  }}
                  style={checkbox}
                />
              </div>

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

        {/* Empty state */}
        {visibleAlarms.length === 0 && (
          <div style={emptyState}>
            <b>No alarms yet.</b>
            <div style={{ marginTop: 6, color: "#374151" }}>
              The alarm engine is not configured — this log window is ready and will
              show events once we wire the alarm rules.
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={bottomBar}>
        <button
          type="button"
          style={{
            ...ackBtn,
            opacity: checkedIds.size === 0 ? 0.5 : 1,
            cursor: checkedIds.size === 0 ? "not-allowed" : "pointer",
          }}
          disabled={checkedIds.size === 0}
          onClick={(e) => {
            e.stopPropagation();
            onAcknowledgeSelected();
          }}
        >
          Acknowledge
        </button>

        <div style={bottomInfo}>
          Selected: <b>{checkedIds.size}</b>
        </div>
      </div>

      {/* CLOSE CONFIRM */}
      {showCloseConfirm && (
        <div style={confirmOverlay} onMouseDown={(e) => e.stopPropagation()}>
          <div style={confirmCard}>
            <div style={confirmTitle}>Close Alarm Log?</div>
            <div style={confirmActions}>
              <button style={cancelBtn} onClick={() => setShowCloseConfirm(false)}>
                Cancel
              </button>
              <button
                style={dangerBtn}
                onClick={() => {
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

const COL = { sel: 34, time: 170, ack: 48, sev: 48, group: 120, controller: 120 };

const wrap = {
  width: "100%",
  height: "100%",
  background: "#e5e7eb",
  border: "3px solid #000",
  boxShadow: "0 0 0 1px #374151 inset, 0 8px 24px rgba(0,0,0,.45)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
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

const tabBtnActive = { background: "#fff", border: "1px solid #000" };

const table = { flex: 1, overflow: "auto", background: "#e5e7eb" };
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

const row = { display: "flex", borderBottom: "1px solid #9ca3af", cursor: "default" };
const cell = {
  padding: 8,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const checkbox = { width: 14, height: 14, cursor: "pointer", accentColor: "#111827" };

const emptyState = { padding: 16, fontSize: 13, color: "#111827" };

const bottomBar = {
  height: 44,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  background: "#d1d5db",
  borderTop: "2px solid #000",
};

const ackBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "2px solid #000",
  background: "#f3f4f6",
  fontWeight: 900,
};

const bottomInfo = { fontSize: 12, color: "#111827" };

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

const confirmTitle = { fontWeight: 900, marginBottom: 12 };
const confirmActions = { display: "flex", justifyContent: "flex-end", gap: 10 };

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
