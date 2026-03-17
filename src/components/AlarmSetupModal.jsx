// src/components/AlarmSetupModal.jsx
import React from "react";
import AlarmTelemetrySection from "./AlarmTelemetrySection";
import AlarmOptionsSection from "./AlarmOptionsSection";
import AlarmListTable from "./AlarmListTable";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function computeMathOutput(rawValue, mathFormula) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return rawValue;

  const formula = String(mathFormula || "").trim();
  if (!formula) return numeric;

  try {
    const expr = formula.replace(/\bvalue\b/gi, `(${numeric})`);
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr});`);
    const out = fn();

    if (out === null || out === undefined || out === "") return numeric;

    const outNum = Number(out);
    return Number.isFinite(outNum) ? outNum : out;
  } catch {
    return numeric;
  }
}

function mapBackendAlarmToUi(alarm) {
  const alarmType = String(alarm?.alarm_type || "").trim().toUpperCase();
  const isBoolean = alarmType === "DI";

  const savedContactType = String(alarm?.contact_type || "")
    .trim()
    .toUpperCase();
  const contactType =
    savedContactType === "NC" || savedContactType === "NO"
      ? savedContactType
      : "NO";

  return {
    id: alarm?.id,
    createdAt: alarm?.created_at ? Date.parse(alarm.created_at) : Date.now(),
    type: isBoolean ? "boolean" : "dynamic",
    model: String(alarm?.model || "").trim() || "zhc1921",
    deviceId: String(alarm?.device_id || "").trim(),
    field: String(alarm?.tag || "").trim(),
    tagLabel: String(alarm?.tag || "").trim(),
    ioType: alarmType || "DI",
    dashboardName: "",
    dashboardId: "",
    message: String(alarm?.message || "").trim(),
    edgeDetection: isBoolean
      ? contactType === "NC"
        ? "NC → 0"
        : "NO → 1"
      : `When value ${String(alarm?.operator || "").trim()} ${String(
          alarm?.threshold ?? ""
        ).trim()}`,
    value: isBoolean
      ? contactType === "NO"
        ? 1
        : 0
      : alarm?.threshold,
    deadbandMode: isBoolean ? "—" : "Absolute",
    deadbandLevel: isBoolean ? "—" : 0,
    severity: isBoolean
      ? "—"
      : String(alarm?.severity || "Warning").trim(),
    enabled: alarm?.enabled !== false,
    operator: alarm?.operator ?? "",
    threshold: alarm?.threshold ?? "",
    groupName: String(alarm?.group_name || "General").trim(),
    group: String(alarm?.group_name || "General").trim(),
    config: isBoolean
      ? {
          contactType,
        }
      : {
          operator: alarm?.operator ?? "",
          threshold: alarm?.threshold ?? "",
          deadband: 0,
          severity: String(alarm?.severity || "Warning").trim(),
          mathEnabled: String(alarm?.math_formula || "").trim() !== "",
          mathFormula: String(alarm?.math_formula || "").trim(),
          rawValue: null,
          outputValue: null,
        },
  };
}

export default function AlarmSetupModal({
  open,
  onClose,

  onAddAlarm,
  onChangeAlarms,

  devices = [],
  availableTags = [],
  sensorsData,

  initialAlarms,

  dashboardName = "",
  dashboardId = "",
}) {
  if (!open) return null;

  const [alarms, setAlarms] = React.useState(() =>
    Array.isArray(initialAlarms) ? initialAlarms : []
  );
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());

  const [isLoadingAlarms, setIsLoadingAlarms] = React.useState(false);

  const emitChange = (next) => onChangeAlarms?.(next);

  const loadAlarmDefinitions = React.useCallback(async () => {
    setIsLoadingAlarms(true);
    try {
      const res = await fetch(`${API_URL}/alarm-definitions/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = [];
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to load alarm definitions"
        );
      }

      const mapped = Array.isArray(data) ? data.map(mapBackendAlarmToUi) : [];

      setAlarms(mapped);
      setCheckedIds(new Set());
      emitChange(mapped);
    } catch (err) {
      console.error("❌ Failed to load alarm definitions:", err);

      const fallback = Array.isArray(initialAlarms) ? initialAlarms : [];
      setAlarms(fallback);
      setCheckedIds(new Set());
      emitChange(fallback);
    } finally {
      setIsLoadingAlarms(false);
    }
  }, [initialAlarms]);

  React.useEffect(() => {
    if (!open) return;
    loadAlarmDefinitions();
  }, [open, loadAlarmDefinitions]);

  const toggleRowCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        alarms.length > 0 && alarms.every((a) => next.has(a.id));

      if (allSelected) alarms.forEach((a) => next.delete(a.id));
      else alarms.forEach((a) => next.add(a.id));

      return next;
    });
  };

  const toggleAlarmEnabled = (id) => {
    const next = alarms.map((a) =>
      a.id === id ? { ...a, enabled: a.enabled === false ? true : false } : a
    );
    setAlarms(next);
    emitChange(next);
  };

  const deleteSelected = () => {
    if (checkedIds.size === 0) return;
    const next = alarms.filter((a) => !checkedIds.has(a.id));
    setAlarms(next);
    setCheckedIds(new Set());
    emitChange(next);
  };

  const clearAll = () => {
    const next = [];
    setAlarms(next);
    setCheckedIds(new Set());
    emitChange(next);
  };

  const [alarmType, setAlarmType] = React.useState("boolean");
  const [model, setModel] = React.useState("zhc1921");

  const [deviceId, setDeviceId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState(null);

  const [contactType, setContactType] = React.useState("NO");

  const [operator, setOperator] = React.useState(">=");
  const [threshold, setThreshold] = React.useState("0");
  const [deadband, setDeadband] = React.useState("0");
  const [severity, setSeverity] = React.useState("warning");

  const [message, setMessage] = React.useState("");

  const [mathEnabled, setMathEnabled] = React.useState(false);
  const [mathFormula, setMathFormula] = React.useState("");

  React.useEffect(() => {
    setSelectedTag(null);
    setSearch("");
  }, [alarmType]);

  const rawValue = React.useMemo(() => {
    if (!selectedTag) return null;
    if (
      selectedTag.previewValue === undefined ||
      selectedTag.previewValue === null
    ) {
      return null;
    }
    return selectedTag.previewValue;
  }, [selectedTag]);

  const outputValue = React.useMemo(() => {
    return computeMathOutput(rawValue, mathFormula);
  }, [rawValue, mathFormula]);

  const hasSelectedTag =
    !!selectedTag &&
    String(selectedTag.deviceId || "").trim() !== "" &&
    String(selectedTag.field || "").trim() !== "";

  const hasMessage = String(message || "").trim() !== "";

  const hasBooleanSettings = ["NO", "NC"].includes(
    String(contactType || "").trim().toUpperCase()
  );

  const hasDynamicSettings =
    String(operator || "").trim() !== "" &&
    String(threshold || "").trim() !== "" &&
    !Number.isNaN(Number(threshold)) &&
    String(severity || "").trim() !== "";

  const canAdd =
    alarmType === "boolean"
      ? hasSelectedTag && hasMessage && hasBooleanSettings
      : hasSelectedTag && hasMessage && hasDynamicSettings;

  const handleAdd = async () => {
    if (!canAdd) return;

    const isBoolean = alarmType === "boolean";
    const trimmedMathFormula = String(mathFormula || "").trim();

    const payload = {
      device_id: String(selectedTag.deviceId || "").trim(),
      model: String(model || "").trim() || "zhc1921",
      tag: String(selectedTag.field || "").trim(),
      alarm_type: isBoolean ? "DI" : "AI",

      // ✅ Boolean alarms now pass NO / NC explicitly
      contact_type: isBoolean
        ? String(contactType || "NO").trim().toUpperCase()
        : null,

      operator: isBoolean ? null : String(operator || "").trim() || null,

      threshold: isBoolean
        ? contactType === "NO"
          ? 1
          : 0
        : Number(threshold),

      // ✅ Pass math formula only for dynamic alarms when enabled and non-empty
      math_formula:
        !isBoolean && mathEnabled && trimmedMathFormula
          ? trimmedMathFormula
          : null,

      group_name: "General",
      severity: !isBoolean ? String(severity || "").trim() || null : null,
      message: message?.trim() || "",
      enabled: true,
    };

    const res = await fetch(`${API_URL}/alarm-definitions/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(
        data?.detail || data?.error || "Failed to save alarm definition"
      );
    }

    onAddAlarm?.(data);
    setMessage("");
    await loadAlarmDefinitions();
  };

  const allChecked =
    alarms.length > 0 && alarms.every((a) => checkedIds.has(a.id));

  const dashboardLabel = String(dashboardName || dashboardId || "").trim();

  return (
    <div
      style={overlay}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={headerLeft}>
            <div style={headerIcon}>⚙️</div>
            <div>
              <div style={titleRow}>
                <div style={title}>Alarm Setup</div>
                {dashboardLabel ? (
                  <>
                    <span style={titleDash}>—</span>
                    <div style={dashboardTitle} title={dashboardLabel}>
                      {dashboardLabel}
                    </div>
                  </>
                ) : null}
              </div>

              <div style={subtitle}>
                Add Boolean (DI) or Dynamic (AI) alarms, then manage them in the
                table below
              </div>
            </div>
          </div>

          <div style={headerRight}>
            <button style={btnHeaderGhost} onClick={onClose}>
              Close
            </button>

            <button style={xBtn} onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        <div style={content}>
          <div style={topArea}>
            <div style={topGrid}>
              <AlarmOptionsSection
                alarmType={alarmType}
                setAlarmType={setAlarmType}
                contactType={contactType}
                setContactType={setContactType}
                operator={operator}
                setOperator={setOperator}
                threshold={threshold}
                setThreshold={setThreshold}
                deadband={deadband}
                setDeadband={setDeadband}
                severity={severity}
                setSeverity={setSeverity}
                message={message}
                setMessage={setMessage}
                mathEnabled={mathEnabled}
                setMathEnabled={setMathEnabled}
                mathFormula={mathFormula}
                setMathFormula={setMathFormula}
                rawValue={rawValue}
                outputValue={outputValue}
              />

              <div style={col}>
                <AlarmTelemetrySection
                  sectionLabel="Tag that triggers this alarm"
                  alarmType={alarmType}
                  model={model}
                  setModel={setModel}
                  deviceId={deviceId}
                  setDeviceId={setDeviceId}
                  search={search}
                  setSearch={setSearch}
                  selectedTag={selectedTag}
                  setSelectedTag={setSelectedTag}
                />
              </div>
            </div>
          </div>

          <AlarmListTable
            alarms={alarms}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onToggleAll={toggleAll}
            onToggleRowCheck={toggleRowCheck}
            onToggleEnabled={toggleAlarmEnabled}
            onAdd={handleAdd}
            onDeleteSelected={deleteSelected}
            canAdd={canAdd && !isLoadingAlarms}
          />

          {false && <button onClick={clearAll}>Clear</button>}
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999999,
};

const card = {
  width: "min(1900px, calc(100% - 12px))",
  height: "min(1040px, calc(100% - 12px))",
  background: "#ffffff",
  borderRadius: 18,
  border: "1px solid #cbd5e1",
  boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  fontSize: 13,
};

const header = {
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, #f8fafc, #ffffff)",
};

const headerLeft = { display: "flex", alignItems: "center", gap: 10 };

const headerIcon = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const titleRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flexWrap: "wrap",
};

const title = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 14,
};

const titleDash = {
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 14,
  flexShrink: 0,
};

const dashboardTitle = {
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 14,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 420,
};

const subtitle = {
  color: "#475569",
  fontSize: 11,
  marginTop: 1,
};

const xBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 15,
};

const btnHeaderGhost = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const content = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
};

const topArea = {
  flex: "0 0 50%",
  overflow: "hidden",
  padding: "10px 12px 12px 12px",
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
};

const topGrid = {
  height: "100%",
  display: "grid",
  gridTemplateColumns: "1fr 1.15fr",
  gap: 10,
};

const col = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};