// src/components/AlarmLogWindow.jsx
import React from "react";
import AlarmSetupModal from "./AlarmSetupModal";
import AlarmLogWindowListTable from "./AlarmLogWindowListTable";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import useAlarmHistory from "./alarmLogWindow/useAlarmHistory";
import {
  wrap,
  topBar,
  titleWrap,
  titleDash,
  dashboardNameText,
  btnRow,
  iconBtn,
  closeBtnRed,
  tabsBar,
  tabsLeft,
  tabsRight,
  tabBtn,
  tabBtnActive,
  settingsTabBtn,
  gearPill,
  launchTabBtn,
  launchPill,
  errorBar,
  bottomBar,
  ackBtn,
  bottomInfo,
  confirmOverlay,
  confirmCard,
  confirmHeader,
  warnIcon,
  confirmTitle,
  confirmSubTitle,
  confirmBody,
  confirmHint,
  confirmErrorBox,
  confirmActions,
  cancelBtn,
  dangerBtn,
} from "./alarmLogWindow/alarmLogWindowStyles";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function pad2(v) {
  return String(v).padStart(2, "0");
}

function formatAlarmTime(value) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = pad2(d.getMinutes());
  const seconds = pad2(d.getSeconds());

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${month}/${day}/${year}-${pad2(hours)}:${minutes}:${seconds} ${ampm}`;
}

function normalizeState(row) {
  const stateRaw = String(
    row?.state ?? row?.alarmState ?? row?.status ?? ""
  )
    .trim()
    .toUpperCase();

  if (stateRaw === "RETURNED") return "RETURNED";
  if (stateRaw === "ACTIVE") return "ACTIVE";
  if (stateRaw === "ACKED") return "ACKED";
  if (stateRaw === "DISABLED") return "DISABLED";
  return stateRaw || "—";
}

function buildAlarmUniqueKey(row) {
  const alarmDefinitionId = String(row?.alarm_definition_id ?? "").trim();
  if (alarmDefinitionId) return `alarm_definition_id:${alarmDefinitionId}`;

  const device = String(row?.device_id ?? row?.deviceId ?? "").trim() || "—";
  const tag =
    String(row?.tag ?? row?.tagName ?? row?.tag_name ?? "").trim() || "—";
  const message =
    String(row?.message ?? row?.alarm_text ?? row?.alarmText ?? "").trim() ||
    "—";
  const group =
    String(row?.group_name ?? row?.group ?? "General").trim() || "General";

  return `fallback:${device}|${tag}|${message}|${group}`;
}

function normalizeHistoryRow(row, idx = 0) {
  const ts = row?.ts || row?.timestamp || row?.time || null;
  const state = normalizeState(row);
  const uniqueAlarmKey = buildAlarmUniqueKey(row);

  return {
    id: row?.id || `${uniqueAlarmKey}-${ts || "ts"}-${idx}-${state}`,
    uniqueAlarmKey,
    alarmDefinitionId: row?.alarm_definition_id ?? null,
    ts,
    time: formatAlarmTime(ts),
    state,
    alarmText: String(
      row?.message || row?.alarm_text || row?.alarmText || ""
    ).trim(),
    ack: row?.acknowledged ? "Yes" : "No",
    acknowledged: row?.acknowledged === true,
    device: String(row?.device_id || row?.deviceId || "").trim(),
    tag: String(row?.tag || row?.tagName || row?.tag_name || "").trim(),
    value:
      row?.computed_value ??
      row?.raw_value ??
      row?.value ??
      row?.threshold ??
      "",
    group: String(row?.group_name || row?.group || "General").trim(),
    severity: String(row?.severity || "").trim(),
    enabled: row?.enabled !== false,
    occurrences: 1,
    raw: row,
  };
}

function summarizeAlarmRows(rows) {
  const source = Array.isArray(rows) ? rows : [];
  const map = new Map();

  for (const row of source) {
    const key = String(row?.uniqueAlarmKey || row?.id || "").trim();
    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        ...row,
        occurrences: 1,
      });
      continue;
    }

    const prevTs = existing?.ts ? new Date(existing.ts).getTime() : -Infinity;
    const nextTs = row?.ts ? new Date(row.ts).getTime() : -Infinity;
    const nextOccurrences = Number(existing.occurrences || 1) + 1;

    if (nextTs >= prevTs) {
      map.set(key, {
        ...row,
        occurrences: nextOccurrences,
      });
    } else {
      map.set(key, {
        ...existing,
        occurrences: nextOccurrences,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const ta = a?.ts ? new Date(a.ts).getTime() : 0;
    const tb = b?.ts ? new Date(b.ts).getTime() : 0;
    return tb - ta;
  });
}

function buildDefinitionSeverityMap(definitions = []) {
  const byDefinitionId = new Map();
  const byFallbackKey = new Map();

  for (const alarm of definitions) {
    const alarmDefinitionId = String(alarm?.id ?? "").trim();
    const severity = String(alarm?.severity || "warning").trim();

    if (alarmDefinitionId) {
      byDefinitionId.set(alarmDefinitionId, severity);
    }

    const fallbackKey = buildAlarmUniqueKey({
      alarm_definition_id: "",
      device_id: alarm?.device_id,
      tag: alarm?.tag,
      message: alarm?.message,
      group_name: alarm?.group_name,
    });

    byFallbackKey.set(fallbackKey, severity);
  }

  return { byDefinitionId, byFallbackKey };
}

function applyLatestDefinitionFields(rows, definitions = []) {
  const { byDefinitionId, byFallbackKey } =
    buildDefinitionSeverityMap(definitions);

  return rows.map((row) => {
    const definitionId = String(row?.alarmDefinitionId ?? "").trim();
    let nextSeverity = row?.severity || "";

    if (definitionId && byDefinitionId.has(definitionId)) {
      nextSeverity = byDefinitionId.get(definitionId);
    } else if (byFallbackKey.has(row.uniqueAlarmKey)) {
      nextSeverity = byFallbackKey.get(row.uniqueAlarmKey);
    }

    return {
      ...row,
      severity: String(nextSeverity || "").trim(),
    };
  });
}

function sortAlarmRowsNewestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const ta = a?.ts ? new Date(a.ts).getTime() : 0;
    const tb = b?.ts ? new Date(b.ts).getTime() : 0;
    return tb - ta;
  });
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
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
  dashboardName = "",
  dashboardId = "main",
  windowKey = "alarmLog",
  isPage = false,
}) {
  const resolvedDashboardId = String(dashboardId || "").trim() || "main";
  const resolvedAlarmLogKey = `${resolvedDashboardId}__alarmLog`;

  const [expandedAlarmKeys, setExpandedAlarmKeys] = React.useState(
    () => new Set()
  );
  const [alarmView, setAlarmView] = React.useState("alarms");
  const [selectedId, setSelectedId] = React.useState(null);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());
  const [showCloseConfirm, setShowCloseConfirm] = React.useState(false);
  const [showAlarmSetup, setShowAlarmSetup] = React.useState(false);
  const [isDeletingClose, setIsDeletingClose] = React.useState(false);
  const [closeError, setCloseError] = React.useState("");

  const normalizedDashboardName =
    String(dashboardName || "").trim() ||
    (resolvedDashboardId === "main" ? "Main Dashboard" : "Dashboard");

  const applyDisabledMap = React.useCallback((rows) => rows, []);

  const {
    alarms,
    setAlarms,
    rawHistoryRows,
    setRawHistoryRows,
    expandedHistoryMap,
    setExpandedHistoryMap,
    isLoadingHistory,
    historyError,
    loadAlarmHistory,
  } = useAlarmHistory({
    resolvedAlarmLogKey,
    applyDisabledMap,
  });

  const visibleAlarms = React.useMemo(() => {
    const source = Array.isArray(alarms) ? alarms : [];

    if (alarmView === "active") {
      return source.filter(
        (a) =>
          a.enabled !== false &&
          String(a.state || "").trim().toLowerCase() === "active"
      );
    }

    if (alarmView === "history") {
      return source.filter((a) => a.enabled !== false);
    }

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

  const handleExportHistoryCsv = React.useCallback(() => {
    const source = sortAlarmRowsNewestFirst(rawHistoryRows || []);
    if (!source.length) return;

    const headers = [
      "Time",
      "State",
      "Alarm Text",
      "Severity",
      "Ack",
      "Device",
      "Tag",
      "Value",
      "Group",
      "Enabled",
      "Alarm Definition Id",
      "Unique Alarm Key",
    ];

    const lines = [
      headers.join(","),
      ...source.map((row) =>
        [
          row.time || "",
          row.state || "",
          row.alarmText || "",
          row.severity || "",
          row.ack || "",
          row.device || "",
          row.tag || "",
          row.value ?? "",
          row.group || "",
          row.enabled === false ? "No" : "Yes",
          row.alarmDefinitionId ?? "",
          row.uniqueAlarmKey || "",
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    const stamp = new Date();
    const fileName = `alarm-history-${resolvedDashboardId}-${stamp.getFullYear()}${pad2(
      stamp.getMonth() + 1
    )}${pad2(stamp.getDate())}-${pad2(stamp.getHours())}${pad2(
      stamp.getMinutes()
    )}${pad2(stamp.getSeconds())}.csv`;

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [rawHistoryRows, resolvedDashboardId]);

  const handleAcknowledgeAlarm = React.useCallback(
    (alarm) => {
      if (!alarm?.id) return;

      setAlarms((prev) =>
        prev.map((a) =>
          a.id === alarm.id
            ? {
                ...a,
                acknowledged: true,
                ack: "Yes",
                state:
                  String(a.state || "").trim().toUpperCase() === "ACTIVE"
                    ? "ACKED"
                    : a.state,
              }
            : a
        )
      );

      setExpandedHistoryMap((prev) => {
        const next = { ...prev };

        for (const key of Object.keys(next)) {
          next[key] = next[key].map((r) =>
            r.id === alarm.id
              ? {
                  ...r,
                  acknowledged: true,
                  ack: "Yes",
                  state:
                    String(r.state || "").trim().toUpperCase() === "ACTIVE"
                      ? "ACKED"
                      : r.state,
                }
              : r
          );
        }

        return next;
      });
    },
    [setAlarms, setExpandedHistoryMap]
  );

  const handleToggleExpandAlarm = React.useCallback(
    (alarm) => {
      if (!alarm?.uniqueAlarmKey) return;

      const key = alarm.uniqueAlarmKey;

      setExpandedAlarmKeys((prev) => {
        const next = new Set(prev);

        if (next.has(key)) {
          next.delete(key);
          return next;
        }

        next.add(key);
        return next;
      });

      setExpandedHistoryMap((prev) => {
        if (prev[key]) return prev;

        const rowsForAlarm = sortAlarmRowsNewestFirst(
          rawHistoryRows.filter((r) => r.uniqueAlarmKey === key)
        );

        return {
          ...prev,
          [key]: applyDisabledMap(rowsForAlarm),
        };
      });
    },
    [rawHistoryRows, applyDisabledMap, setExpandedHistoryMap]
  );

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

      <div style={tabsBar}>
        <div style={tabsLeft}>
          {["alarms", "history", "active"].map((v) => (
            <TabButton
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              active={alarmView === v}
              onClick={() => setAlarmView(v)}
            />
          ))}

          {alarmView === "history" && (
            <button
              type="button"
              style={exportTabBtn}
              title="Export history file"
              onClick={(e) => {
                e.stopPropagation();
                handleExportHistoryCsv();
              }}
            >
              <span style={exportPill}>⇩</span>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                Export File
              </span>
            </button>
          )}
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

          {!isPage && (
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
          )}
        </div>
      </div>

      {!!historyError && <div style={errorBar}>{historyError}</div>}

      <AlarmLogWindowListTable
        alarmView={alarmView}
        visibleAlarms={visibleAlarms}
        checkedIds={checkedIds}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        toggleChecked={toggleChecked}
        toggleAllVisible={toggleAllVisible}
        onAcknowledgeAlarm={handleAcknowledgeAlarm}
        expandedAlarmKeys={expandedAlarmKeys}
        onToggleExpandAlarm={handleToggleExpandAlarm}
        expandedHistoryMap={expandedHistoryMap}
      />

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
              If you close this window, <b>your current Alarm Log setup will be lost</b>{" "}
              (view mode, filters, selections, and any unsaved configuration).
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

const exportTabBtn = {
  height: 28,
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginLeft: 6,
};

const exportPill = {
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