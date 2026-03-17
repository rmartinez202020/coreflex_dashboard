// src/components/AlarmLogWindow.jsx
import React from "react";
import AlarmSetupModal from "./AlarmSetupModal";
import AlarmLogWindowListTable from "./AlarmLogWindowListTable";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeHistoryRow(row, idx = 0) {
  const ts = row?.ts || row?.timestamp || row?.time || null;
  const stateRaw = String(row?.state || "").trim().toUpperCase();

  return {
    id:
      row?.id ||
      `${row?.alarm_definition_id || "alarm"}-${ts || "ts"}-${idx}-${stateRaw}`,
    ts,
    time: ts,
    state:
      stateRaw === "RETURNED"
        ? "Returned"
        : stateRaw === "ACTIVE"
        ? "Active"
        : stateRaw || "—",
    alarmText: String(row?.message || row?.alarm_text || "").trim(),
    ack: row?.acknowledged ? "Yes" : "",
    device: String(row?.device_id || "").trim(),
    tag: String(row?.tag || "").trim(),
    value:
      row?.computed_value ?? row?.raw_value ?? row?.value ?? row?.threshold ?? "",
    group: String(row?.group_name || row?.group || "General").trim(),
    severity: String(row?.severity || "").trim(),
    enabled: row?.enabled !== false,
    raw: row,
  };
}

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

  // ✅ NEW: show owner dashboard on top bar
  dashboardName = "",

  // ✅ NEW: lets frontend know which dashboard/window row to delete
  dashboardId = "main",
  windowKey = "alarmLog",

  // ✅ NEW: when true, renders like a full page (no drag/minimize/launch)
  isPage = false,
}) {
  const resolvedDashboardId = String(dashboardId || "").trim() || "main";
  const resolvedAlarmLogKey = `${resolvedDashboardId}__alarmLog`;

  const [alarms, setAlarms] = React.useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState("");

  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showAlarmSetup, setShowAlarmSetup] = React.useState(false);

  // ✅ NEW: UX state for Close Anyway delete flow
  const [isDeletingClose, setIsDeletingClose] = React.useState(false);
  const [closeError, setCloseError] = React.useState("");

  // ✅ dashboard label shown in the top bar
  const normalizedDashboardName =
    String(dashboardName || "").trim() ||
    (resolvedDashboardId === "main" ? "Main Dashboard" : "Dashboard");

  const loadAlarmHistory = React.useCallback(
    async (silent = false) => {
      if (!silent) setIsLoadingHistory(true);
      setHistoryError("");

      try {
        const res = await fetch(`${API_URL}/alarm-history/read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            alarm_log_key: resolvedAlarmLogKey,
          }),
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = [];
        }

        if (!res.ok) {
          throw new Error(
            data?.detail || data?.error || "Failed to load alarm history"
          );
        }

        const rows = Array.isArray(data)
          ? data.map((row, idx) => normalizeHistoryRow(row, idx))
          : [];

        setAlarms(rows);
      } catch (err) {
        console.error("❌ Failed to load alarm history:", err);
        setHistoryError(err?.message || "Failed to load alarm history");
        setAlarms([]);
      } finally {
        if (!silent) setIsLoadingHistory(false);
      }
    },
    [resolvedAlarmLogKey]
  );

  React.useEffect(() => {
    loadAlarmHistory(false);

    const timer = window.setInterval(() => {
      loadAlarmHistory(true);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadAlarmHistory]);

  const visibleAlarms = React.useMemo(() => {
    const source = Array.isArray(alarms) ? alarms : [];

    if (alarmView === "disabled") {
      return source.filter((a) => a.enabled === false);
    }

    if (alarmView === "active") {
      return source.filter(
        (a) => String(a.state || "").trim().toLowerCase() === "active"
      );
    }

    if (alarmView === "history") {
      return source;
    }

    // alarms tab
    return source.filter((a) => a.enabled !== false);
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
    setCheckedIds(new Set());
  };

  // ✅ NEW: delete saved alarm-log row when user confirms Close Anyway
  const handleCloseAnyway = async () => {
    if (isDeletingClose) return;

    setCloseError("");
    setIsDeletingClose(true);

    try {
      const res = await fetch(`${API_URL}/alarm-log-windows/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          dashboard_id: resolvedDashboardId,
          window_key: String(windowKey || "alarmLog").trim() || "alarmLog",
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to delete alarm log window row"
        );
      }

      setShowCloseConfirm(false);
      setCheckedIds(new Set());
      setSelectedId(null);
      onClose?.();
    } catch (err) {
      console.error("❌ Alarm log Close Anyway failed:", err);
      setCloseError(err?.message || "Failed to close alarm log window.");
    } finally {
      setIsDeletingClose(false);
    }
  };

  return (
    <div style={wrap}>
      {/* TOP BAR */}
      <div
        style={{ ...topBar, cursor: isPage ? "default" : "grab" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isPage) onStartDragWindow?.(e);
        }}
      >
        <div style={titleWrap}>
          <span style={{ fontWeight: 900 }}>{title}</span>

          <span style={titleDash}>—</span>

          <span style={dashboardNameText} title={normalizedDashboardName}>
            {normalizedDashboardName}
          </span>
        </div>

        <div style={btnRow}>
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

          {!isPage && (
            <button
              style={closeBtnRed}
              title="Close"
              onClick={(e) => {
                e.stopPropagation();
                setCloseError("");
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
              <span style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                Launch
              </span>
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
            <span style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
              Settings
            </span>
          </button>
        </div>
      </div>

      {!!historyError && (
        <div style={errorBar}>
          {historyError}
        </div>
      )}

      {/* TABLE */}
      <AlarmLogWindowListTable
        visibleAlarms={visibleAlarms}
        checkedIds={checkedIds}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        toggleChecked={toggleChecked}
        toggleAllVisible={toggleAllVisible}
        isLoading={isLoadingHistory}
      />

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

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#111827" }}>
          File: <b>{resolvedAlarmLogKey}</b>
        </div>
      </div>

      {/* Alarm Setup Modal */}
      <AlarmSetupModal
        open={showAlarmSetup}
        onClose={() => setShowAlarmSetup(false)}
        onAddAlarm={(alarmObj) => {
          onAddAlarm?.(alarmObj);
          loadAlarmHistory(false);
        }}
        devices={devices}
        availableTags={availableTags}
        sensorsData={sensorsData}
        dashboardName={normalizedDashboardName}
        dashboardId={resolvedDashboardId}
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

              {!!closeError && <div style={confirmErrorBox}>{closeError}</div>}
            </div>

            <div style={confirmActions}>
              <button
                style={{
                  ...cancelBtn,
                  opacity: isDeletingClose ? 0.7 : 1,
                  cursor: isDeletingClose ? "not-allowed" : "pointer",
                }}
                disabled={isDeletingClose}
                onClick={() => {
                  if (isDeletingClose) return;
                  setCloseError("");
                  setShowCloseConfirm(false);
                }}
              >
                Keep Open
              </button>

              <button
                style={{
                  ...dangerBtn,
                  opacity: isDeletingClose ? 0.75 : 1,
                  cursor: isDeletingClose ? "not-allowed" : "pointer",
                }}
                disabled={isDeletingClose}
                onClick={handleCloseAnyway}
              >
                {isDeletingClose
                  ? isPage
                    ? "Leaving..."
                    : "Closing..."
                  : isPage
                  ? "Leave Page"
                  : "Close Anyway"}
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

const wrap = {
  width: "100%",
  height: "100%",
  background: "#f8fafc",
  border: "1.5px solid #1f2937",
  borderRadius: 12,
  boxShadow:
    "0 0 0 1px rgba(148,163,184,0.28) inset, 0 10px 26px rgba(0,0,0,.28)",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
};

const topBar = {
  height: 42,
  background: "#eceff3",
  color: "#111827",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 10px",
  borderBottom: "1px solid #d1d5db",
  userSelect: "none",
};

const titleWrap = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  minWidth: 0,
  flex: 1,
};

const titleDash = {
  color: "#9ca3af",
  fontWeight: 800,
  flexShrink: 0,
};

const dashboardNameText = {
  color: "#374151",
  fontWeight: 800,
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
};

const btnRow = { display: "flex", gap: 6, alignItems: "center" };

const iconBtn = {
  width: 28,
  height: 26,
  background: "#f8fafc",
  color: "#111827",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
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
  background: "#eceff3",
  alignItems: "center",
  borderBottom: "1px solid #d1d5db",
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
  color: "#111827",
  cursor: "pointer",
  fontSize: 12,
};

const tabBtnActive = {
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #6b7280",
  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
};

const settingsTabBtn = {
  height: 26,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
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
  color: "#111827",
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

const errorBar = {
  minHeight: 28,
  padding: "6px 10px",
  borderBottom: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
};

const bottomBar = {
  height: 44,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  background: "#d9dde3",
  borderTop: "1px solid #cbd5e1",
};

const ackBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #9ca3af",
  background: "#f3f4f6",
  color: "#111827",
  fontWeight: 900,
};

const bottomInfo = { fontSize: 12, color: "#111827" };

/* confirm modal */
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

const confirmErrorBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(127,29,29,0.22)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#fecaca",
  fontSize: 12,
  lineHeight: 1.35,
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