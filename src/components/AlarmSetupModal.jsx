// src/components/AlarmSetupModal.jsx
import React from "react";
import AlarmTelemetrySection from "./AlarmTelemetrySection";
import AlarmOptionsSection from "./AlarmOptionsSection";

function computeMathOutput(rawValue, mathFormula) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return rawValue;

  const formula = String(mathFormula || "").trim();
  if (!formula) return numeric;

  try {
    const expr = formula.replace(/\bVALUE\b/g, `(${numeric})`);
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr});`);
    const out = fn();
    return Number.isFinite(Number(out)) ? Number(out) : out;
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

  initialAlarms = [],
}) {
  if (!open) return null;

  // ======== ALARMS LIST (TABLE) ========
  const [alarms, setAlarms] = React.useState(() => initialAlarms || []);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());

  React.useEffect(() => {
    setAlarms(initialAlarms || []);
    setCheckedIds(new Set());
  }, [open, initialAlarms]);

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

  // ✅ math state
  const [mathEnabled, setMathEnabled] = React.useState(false);
  const [mathFormula, setMathFormula] = React.useState("");

  React.useEffect(() => {
    setSelectedTag(null);
    setSearch("");
  }, [alarmType]);

  // ✅ NEW: selected live raw value from telemetry section
  const rawValue = React.useMemo(() => {
    if (!selectedTag) return null;
    if (selectedTag.previewValue === undefined || selectedTag.previewValue === null) {
      return null;
    }
    return selectedTag.previewValue;
  }, [selectedTag]);

  // ✅ NEW: computed math output preview
  const outputValue = React.useMemo(() => {
    return computeMathOutput(rawValue, mathFormula);
  }, [rawValue, mathFormula]);

  const canAdd =
    !!selectedTag &&
    (alarmType === "boolean"
      ? true
      : threshold !== "" && !Number.isNaN(Number(threshold)));

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
    emitChange(next);
    onAddAlarm?.(newAlarm);
    setMessage("");
  };

  const allChecked =
    alarms.length > 0 && alarms.every((a) => checkedIds.has(a.id));

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
              <div style={title}>Alarm Setup</div>
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

            <button
              style={{ ...btnHeaderPrimary, opacity: canAdd ? 1 : 0.5 }}
              onClick={handleAdd}
              disabled={!canAdd}
              title={!canAdd ? "Select a tag first" : "Add Alarm"}
            >
              Add Alarm
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

          <div style={bottomArea}>
            <div style={tableHeader}>
              <div style={tableHeaderLeft}>
                <button
                  type="button"
                  style={tableBtn}
                  onClick={handleAdd}
                  disabled={!canAdd}
                >
                  Add Alarm
                </button>

                <button
                  type="button"
                  style={{
                    ...tableBtn,
                    opacity: checkedIds.size === 0 ? 0.5 : 1,
                    cursor: checkedIds.size === 0 ? "not-allowed" : "pointer",
                  }}
                  disabled={checkedIds.size === 0}
                  onClick={deleteSelected}
                >
                  Delete Alarms
                </button>
              </div>

              <div />
            </div>

            <div style={tableWrap}>
              <div style={tHeadRow}>
                <div style={{ ...tHeadCell, width: 40, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    style={checkbox}
                    title="Select all"
                  />
                </div>

                <div style={{ ...tHeadCell, width: 190 }}>Trigger</div>
                <div style={{ ...tHeadCell, width: 120 }}>Alarm Type</div>
                <div style={{ ...tHeadCell, width: 150 }}>Edge Detection</div>
                <div
                  style={{
                    ...tHeadCell,
                    width: 90,
                    textAlign: "center",
                  }}
                >
                  Value
                </div>
                <div style={{ ...tHeadCell, width: 130 }}>Deadband Mode</div>
                <div
                  style={{
                    ...tHeadCell,
                    width: 140,
                    textAlign: "center",
                  }}
                >
                  Deadband Level
                </div>
                <div
                  style={{
                    ...tHeadCell,
                    flex: 1,
                    minWidth: 320,
                    borderRight: "none",
                  }}
                >
                  Message
                </div>
              </div>

              <div style={tBody}>
                {alarms.length === 0 ? (
                  <div style={tEmpty}>
                    No alarms added yet. Add one above and it will appear here.
                  </div>
                ) : (
                  alarms.map((a) => {
                    const checked = checkedIds.has(a.id);
                    return (
                      <div key={a.id} style={tRow}>
                        <div
                          style={{
                            ...tCell,
                            width: 40,
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRowCheck(a.id)}
                            style={checkbox}
                          />
                        </div>

                        <div style={{ ...tCell, width: 190 }}>
                          <b style={{ fontSize: 13 }}>{a.field}</b>
                          <div style={tSub}>{a.deviceId}</div>
                        </div>

                        <div style={{ ...tCell, width: 120 }}>
                          {a.type === "boolean" ? "Bit" : "Analog"}
                        </div>

                        <div style={{ ...tCell, width: 150 }}>
                          {a.type === "boolean" ? "Equal" : a.edgeDetection}
                        </div>

                        <div
                          style={{
                            ...tCell,
                            width: 90,
                            textAlign: "center",
                          }}
                        >
                          {String(a.value)}
                        </div>

                        <div style={{ ...tCell, width: 130 }}>
                          {a.deadbandMode}
                        </div>

                        <div
                          style={{
                            ...tCell,
                            width: 140,
                            textAlign: "center",
                          }}
                        >
                          {String(a.deadbandLevel)}
                        </div>

                        <div
                          style={{
                            ...tCell,
                            flex: 1,
                            minWidth: 320,
                            borderRight: "none",
                          }}
                        >
                          {a.message || (
                            <span style={{ color: "#888" }}>—</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {false && <button onClick={clearAll}>Clear</button>}
          </div>
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

const title = { fontWeight: 900, color: "#0f172a", fontSize: 14 };

const subtitle = { color: "#475569", fontSize: 11, marginTop: 1 };

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

const btnHeaderPrimary = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #1d4ed8",
  background: "#2563eb",
  color: "#fff",
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

const col = { display: "flex", flexDirection: "column", minHeight: 0 };

/* ✅ BOTTOM: taller + scroll in table body only */
const bottomArea = {
  flex: "1 1 auto",
  overflow: "hidden",
  padding: "10px 12px 12px 12px",
  background: "#ffffff",
};

const tableHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const tableHeaderLeft = { display: "flex", gap: 8, alignItems: "center" };

const tableBtn = {
  height: 32,
  padding: "0 12px",
  borderRadius: 2,
  border: "1px solid #c9c9c9",
  background: "#efefef",
  color: "#111",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
};

const tableWrap = {
  border: "1px solid #c9c9c9",
  borderRadius: 2,
  overflow: "hidden",
  height: "calc(100% - 40px)",
  display: "flex",
  flexDirection: "column",
  background: "#fff",
};

const tHeadRow = {
  display: "flex",
  background: "#f3f3f3",
  color: "#111",
  borderBottom: "1px solid #c9c9c9",
};

const tHeadCell = {
  padding: "8px 8px",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  borderRight: "1px solid #d7d7d7",
};

const tBody = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  background: "#ffffff",
};

const tRow = {
  display: "flex",
  borderBottom: "1px solid #e2e2e2",
  background: "#fff",
};

const tCell = {
  padding: "8px 8px",
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#111",
  borderRight: "1px solid #eeeeee",
};

const tSub = { fontSize: 11, color: "#666", marginTop: 2 };
const tEmpty = { padding: 12, color: "#666", fontSize: 12 };
const checkbox = { width: 14, height: 14, cursor: "pointer" };