// src/components/AlarmSetupModal.jsx
import React from "react";
import AlarmTelemetrySection from "./AlarmTelemetrySection";
import AlarmOptionsSection from "./AlarmOptionsSection";
import AlarmListTable from "./AlarmListTable";

function computeMathOutput(rawValue, mathFormula) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return rawValue;

  const formula = String(mathFormula || "").trim();
  if (!formula) return numeric;

  try {
    // ✅ support VALUE / value / Value
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

export default function AlarmSetupModal({
  open,
  onClose,

  onAddAlarm,
  onChangeAlarms,

  devices = [],
  availableTags = [],
  sensorsData,

  initialAlarms,

  // ✅ dashboard info
  dashboardName = "",
  dashboardId = "",
}) {
  if (!open) return null;

  // ======== ALARMS LIST (TABLE) ========
  const [alarms, setAlarms] = React.useState(() =>
    Array.isArray(initialAlarms) ? initialAlarms : []
  );
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());

  React.useEffect(() => {
    if (!open) return;
    setAlarms(Array.isArray(initialAlarms) ? initialAlarms : []);
    setCheckedIds(new Set());
  }, [open]);

  const emitChange = (next) => onChangeAlarms?.(next);

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

  // ======== FORM STATE ========
  const [alarmType, setAlarmType] = React.useState("boolean"); // boolean | dynamic

  // ✅ smart telemetry section model
  const [model, setModel] = React.useState("zhc1921");

  const [deviceId, setDeviceId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState(null);

  const [contactType, setContactType] = React.useState("NO"); // NO | NC

  const [operator, setOperator] = React.useState(">=");
  const [threshold, setThreshold] = React.useState("0");
  const [deadband, setDeadband] = React.useState("0");
  const [severity, setSeverity] = React.useState("warning");

  const [message, setMessage] = React.useState("");

  // ✅ kept for compatibility
  const [mathEnabled, setMathEnabled] = React.useState(false);
  const [mathFormula, setMathFormula] = React.useState("");

  React.useEffect(() => {
    setSelectedTag(null);
    setSearch("");
  }, [alarmType]);

  // ✅ selected live raw value from telemetry section
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

  // ✅ computed math output preview
  const outputValue = React.useMemo(() => {
    return computeMathOutput(rawValue, mathFormula);
  }, [rawValue, mathFormula]);

  // ✅ Add Alarm only enables when setup is completed
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

  const handleAdd = () => {
    if (!canAdd) return;

    const id = globalThis.crypto?.randomUUID?.() || `alarm_${Date.now()}`;

    const newAlarm = {
      id,
      createdAt: Date.now(),
      type: alarmType,

      // ✅ smart telemetry section now owns model/device/tag selection
      model: String(model || "").trim() || "zhc1921",
      deviceId: String(selectedTag.deviceId || "").trim(),
      field: String(selectedTag.field || "").trim(),
      tagLabel: selectedTag.label || selectedTag.field,
      ioType: alarmType === "boolean" ? "DI" : "AI",

      // ✅ store dashboard info too
      dashboardName: String(dashboardName || "").trim(),
      dashboardId: String(dashboardId || "").trim(),

      message: message?.trim() || "",
      edgeDetection:
        alarmType === "boolean"
          ? "Equal"
          : `When value ${operator} ${threshold}`,
      value:
        alarmType === "boolean"
          ? contactType === "NO"
            ? 1
            : 0
          : Number(threshold),
      deadbandMode: alarmType === "dynamic" ? "Absolute" : "—",
      deadbandLevel: alarmType === "dynamic" ? Number(deadband || 0) : "—",
      severity: alarmType === "dynamic" ? severity : "—",
      enabled: true,
      config:
        alarmType === "boolean"
          ? { contactType }
          : {
              operator,
              threshold: Number(threshold),
              deadband: Number(deadband || 0),
              severity,
              mathEnabled,
              mathFormula: String(mathFormula || "").trim(),
              rawValue,
              outputValue,
            },
    };

    const next = [...alarms, newAlarm];
    setAlarms(next);
    setCheckedIds(new Set());
    emitChange(next);
    onAddAlarm?.(newAlarm);
    setMessage("");
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
        {/* HEADER */}
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

        {/* CONTENT */}
        <div style={content}>
          <div style={topArea}>
            <div style={topGrid}>
              {/* LEFT — extracted alarm options section */}
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

              {/* RIGHT — smart telemetry section */}
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
            onAdd={handleAdd}
            onDeleteSelected={deleteSelected}
            canAdd={canAdd}
          />

          {false && <button onClick={clearAll}>Clear</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- LAYOUT / SIZING ---------- */
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