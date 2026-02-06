// src/components/AlarmLogWindow.jsx
import React from "react";
import AlarmSetupModal from "./AlarmSetupModal";

export default function AlarmLogWindow({
  onLaunch,
  onMinimize,
  onClose,
  onOpenSettings,
  onStartDragWindow,

  devices = [],
  availableTags = [],
  sensorsData,
  onAddAlarm,

  title = "Alarms Log (DI-AI)",

  // ✅ NEW: when true, renders like a full page (no drag/minimize/launch)
  isPage = false,
}) {
  const alarms = [];

  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showAlarmSetup, setShowAlarmSetup] = React.useState(false);

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
      <div
        style={{ ...topBar, cursor: isPage ? "default" : "move" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isPage) onStartDragWindow?.(e);
        }}
      >
        <div style={titleWrap}>
          <span style={{ fontWeight: 900 }}>{title}</span>
          <span style={countPill}>{visibleAlarms.length}</span>
        </div>

     <div style={btnRow}>
  {/* Minimize only in window mode */}
  {!isPage && (
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
  )}

  {/* ❌ Close ONLY in window mode */}
  {!isPage && (
    <button
      style={closeBtnRed}
      title="Close"
      onClick={(e) => {
        e.stopPropagation();
        setShowCloseConfirm(true);
      }}
    >
      ✕
    </button>
  )}
</div>

      </div>

      {/* TABS BAR */}
      <div style={tabsBar}>
        <div style={tabsLeft}>
          {["alarms", "history", "active", "disabled"].map((v) => (
            <TabButton
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              active={alarmView === v}
              onClick={() => setAlarmView(v)}
            />
          ))}
        </div>

        <div style={tabsRight}>
          {/* ✅ In page mode, hide Launch (already launched) */}
          {!isPage && (
            <button
              type="button"
              style={launchTabBtn}
              title="Launch"
              onClick={(e) => {
                e.stopPropagation();
                onLaunch?.();
              }}
            >
              <span style={launchPill}>↗</span>
              <span style={{ fontSize: 12, fontWeight: 900 }}>Launch</span>
            </button>
          )}

          <button
            type="button"
            style={settingsTabBtn}
            title="Alarm Manager"
            onClick={(e) => {
              e.stopPropagation();
              setShowAlarmSetup(true);
              onOpenSettings?.();
            }}
          >
            <span style={gearPill}>⚙</span>
            <span style={{ fontSize: 12, fontWeight: 900 }}>Settings</span>
          </button>
        </div>
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

        {/* Rows */}
        {visibleAlarms.map((a) => {
          const isChecked = checkedIds.has(a.id);
          const isSelected = selectedId === a.id;

          return (
            <div
              key={a.id}
              style={{
                ...row,
                background: isSelected ? "#eff6ff" : "#ffffff",
                color: "#111827",
              }}
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
              <div style={{ ...cell, width: COL.controller }}>
                {a.controller}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
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

      {/* Alarm Setup Modal */}
      <AlarmSetupModal
        open={showAlarmSetup}
        onClose={() => setShowAlarmSetup(false)}
        onAddAlarm={(alarmObj) => {
          console.log("✅ Added Alarm:", alarmObj);
          onAddAlarm?.(alarmObj);
        }}
        devices={devices}
        availableTags={availableTags}
        sensorsData={sensorsData}
      />

      {/* Close confirm */}
      {showCloseConfirm && (
        <div
          style={confirmOverlay}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={confirmCard}>
            <div style={confirmHeader}>
              <div style={warnIcon}>⚠️</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={confirmTitle}>Unsaved changes</div>
                <div style={confirmSubTitle}>
                  {isPage ? "Leave Alarms Page?" : "Close Alarms Log?"}
                </div>
              </div>
            </div>

            <div style={confirmBody}>
              If you close this window,{" "}
              <b>your current Alarm Log setup will be lost</b> (view mode,
              filters, selections, and any unsaved configuration).
              <div style={confirmHint}>
                Tip: Save your project and Minimize the window if you want to
                keep this setup.
              </div>
            </div>

            <div style={confirmActions}>
              <button
                style={cancelBtn}
                onClick={() => setShowCloseConfirm(false)}
              >
                Keep Open
              </button>

              <button
                style={dangerBtn}
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose?.();
                }}
              >
                {isPage ? "Leave Page" : "Close Anyway"}
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
  background: "#f8fafc",
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
  userSelect: "none",
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

const closeBtnRed = {
  width: 28,
  height: 26,
  background: "#ef4444",
  color: "#fff",
  borderRadius: 6,
  border: "1px solid #b91c1c",
  cursor: "pointer",
  fontWeight: 900,
};

const tabsBar = {
  height: 34,
  display: "flex",
  gap: 6,
  padding: "0 10px",
  background: "#e5e7eb",
  alignItems: "center",
  borderBottom: "1px solid #9ca3af",
};

const tabsLeft = { display: "flex", gap: 6, alignItems: "center" };

const tabsRight = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const tabBtn = {
  padding: "4px 10px",
  fontWeight: 900,
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 12,
};

const tabBtnActive = {
  background: "#ffffff",
  border: "1px solid #000",
  boxShadow: "0 1px 0 rgba(0,0,0,0.25)",
};

const settingsTabBtn = {
  height: 26,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const gearPill = {
  width: 18,
  height: 18,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
};

const launchTabBtn = {
  height: 26,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const launchPill = {
  width: 18,
  height: 18,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 900,
};

const table = {
  flex: 1,
  overflow: "auto",
  background: "#ffffff",
  backgroundImage:
    "linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)",
  backgroundSize: "100% 30px, 160px 100%",
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

const emptyWrap = {
  padding: 16,
  background: "transparent",
};

const emptyState = {
  padding: 14,
  fontSize: 13,
  color: "#111827",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  width: "fit-content",
  maxWidth: 720,
};

const bottomBar = {
  height: 44,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  background: "#d1d5db",
  borderTop: "1px solid #000",
};

const ackBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #000",
  background: "#e5e7eb",
  fontWeight: 900,
};

const bottomInfo = { fontSize: 12, color: "#111827" };

/* confirm modal (unchanged) */
const confirmOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.60)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
};

const confirmCard = {
  width: 440,
  maxWidth: "calc(100% - 40px)",
  background: "#0b1220",
  borderRadius: 14,
  border: "1px solid rgba(148,163,184,0.25)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
  overflow: "hidden",
};

const confirmHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(148,163,184,0.18)",
  background: "linear-gradient(180deg, rgba(30,41,59,0.65), rgba(2,6,23,0))",
};

const warnIcon = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  background: "rgba(245,158,11,0.12)",
  border: "1px solid rgba(245,158,11,0.35)",
};

const confirmTitle = {
  fontWeight: 900,
  color: "#f8fafc",
  fontSize: 14,
  letterSpacing: 0.2,
  lineHeight: 1.1,
};

const confirmSubTitle = {
  marginTop: 2,
  fontSize: 12,
  color: "rgba(226,232,240,0.75)",
};

const confirmBody = {
  padding: "14px 16px 6px",
  color: "rgba(226,232,240,0.88)",
  fontSize: 13,
  lineHeight: 1.35,
};

const confirmHint = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "rgba(254,226,226,0.92)",
  fontSize: 12,
};

const confirmActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "12px 16px 16px",
};

const cancelBtn = {
  padding: "8px 12px",
  cursor: "pointer",
  border: "1px solid rgba(148,163,184,0.30)",
  background: "rgba(15,23,42,0.55)",
  color: "rgba(226,232,240,0.92)",
  borderRadius: 10,
  fontWeight: 900,
};

const dangerBtn = {
  padding: "8px 12px",
  cursor: "pointer",
  border: "1px solid rgba(239,68,68,0.45)",
  background: "rgba(239,68,68,0.95)",
  color: "#fff",
  borderRadius: 10,
  fontWeight: 900,
};
