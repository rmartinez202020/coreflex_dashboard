// src/components/AlarmSetupModal.jsx
import React from "react";

export default function AlarmSetupModal({
  open,
  onClose,

  // called when user adds an alarm (optional, parent can persist)
  onAddAlarm,

  // (optional) called when alarms list changes (save to project)
  onChangeAlarms,

  // provide these from parent if you already have them
  devices = [], // [{ deviceId, name }]
  availableTags = [], // [{ deviceId, field, label, type }] type: "DI" | "AO" | "AI" | ...
  sensorsData, // optional for preview

  // optional: initial alarms from project
  initialAlarms = [],
}) {
  if (!open) return null;

  // ======== ALARMS LIST (TABLE) ========
  const [alarms, setAlarms] = React.useState(() => initialAlarms || []);
  const [checkedIds, setCheckedIds] = React.useState(() => new Set());

  // keep in sync when modal opens with new project data
  React.useEffect(() => {
    setAlarms(initialAlarms || []);
    setCheckedIds(new Set());
  }, [open, initialAlarms]);

  const emitChange = (next) => {
    onChangeAlarms?.(next);
  };

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
      const allSelected = alarms.length > 0 && alarms.every((a) => next.has(a.id));
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

  // ======== FORM STATE (ADD NEW ALARM) ========
  const [alarmType, setAlarmType] = React.useState("boolean"); // boolean | dynamic
  const [deviceId, setDeviceId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState(null);

  // boolean
  const [contactType, setContactType] = React.useState("NO"); // NO | NC

  // dynamic
  const [operator, setOperator] = React.useState(">=");
  const [threshold, setThreshold] = React.useState("0");
  const [deadband, setDeadband] = React.useState("0");
  const [severity, setSeverity] = React.useState("warning");

  // common
  const [message, setMessage] = React.useState("");

  // reset tag selection when type changes
  React.useEffect(() => {
    setSelectedTag(null);
    setSearch("");
  }, [alarmType]);

  const filteredTags = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const wanted = alarmType === "boolean" ? "DI" : "AO";

    return (availableTags || [])
      .filter((t) => (deviceId ? t.deviceId === deviceId : true))
      .filter((t) => (t.type ? t.type === wanted : true))
      .filter((t) => {
        if (!q) return true;
        const hay = `${t.field} ${t.label || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 60);
  }, [availableTags, deviceId, search, alarmType]);

  const previewValue = React.useMemo(() => {
    if (!selectedTag || !sensorsData) return null;
    const dev = sensorsData?.[selectedTag.deviceId];
    if (!dev) return null;
    const v =
      dev?.[selectedTag.field] ??
      dev?.values?.[selectedTag.field] ??
      dev?.tags?.[selectedTag.field];
    return v ?? null;
  }, [selectedTag, sensorsData]);

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
      type: alarmType, // boolean | dynamic
      deviceId: selectedTag.deviceId,
      field: selectedTag.field,
      tagLabel: selectedTag.label || selectedTag.field,
      ioType: alarmType === "boolean" ? "DI" : "AO",
      message: message?.trim() || "",
      edgeDetection:
        alarmType === "boolean"
          ? contactType === "NO"
            ? "Alarm when = 1 (ON)"
            : "Alarm when = 0 (OFF)"
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
            },
    };

    const next = [...alarms, newAlarm];
    setAlarms(next);
    emitChange(next);
    onAddAlarm?.(newAlarm);

    setMessage("");
  };

  return (
    <div style={overlay} onMouseDown={(e) => e.stopPropagation()}>
      <div style={card} onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={header}>
          <div style={headerLeft}>
            <div style={headerIcon}>⚙️</div>
            <div>
              <div style={title}>Alarm Setup</div>
              <div style={subtitle}>
                Add Boolean (DI) or Dynamic (AO) alarms, then manage them in the table below
              </div>
            </div>
          </div>

          <button style={xBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div style={content}>
          {/* TOP: ADD FORM */}
          <div style={topArea}>
            <div style={section}>
              <div style={sectionLabel}>Alarm Type</div>
              <div style={typeRow}>
                <button
                  type="button"
                  style={{
                    ...typeBtn,
                    ...(alarmType === "boolean" ? typeBtnActive : {}),
                  }}
                  onClick={() => setAlarmType("boolean")}
                >
                  Boolean Alarm (DI)
                </button>

                <button
                  type="button"
                  style={{
                    ...typeBtn,
                    ...(alarmType === "dynamic" ? typeBtnActive : {}),
                  }}
                  onClick={() => setAlarmType("dynamic")}
                >
                  Dynamic Alarm (AO)
                </button>
              </div>
            </div>

            <div style={section}>
              <div style={sectionLabel}>Tag that triggers this alarm</div>

              <div style={grid2}>
                <div>
                  <div style={fieldLabel}>Device</div>
                  <select
                    style={select}
                    value={deviceId}
                    onChange={(e) => {
                      setDeviceId(e.target.value);
                      setSelectedTag(null);
                    }}
                  >
                    <option value="">— Select device —</option>
                    {(devices || []).map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.name || d.deviceId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={fieldLabel}>Search Tag</div>
                  <input
                    style={input}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ex: DI0, level, run..."
                  />
                </div>
              </div>

              <div style={tagBox}>
                {!selectedTag ? (
                  <>
                    <div style={tagBoxHeader}>
                      <div style={tagBoxTitle}>Results</div>
                      <div style={tagBoxHint}>
                        Showing {alarmType === "boolean" ? "DI" : "AO"} tags
                      </div>
                    </div>

                    <div style={tagList}>
                      {filteredTags.length === 0 ? (
                        <div style={empty}>No matching tags. Choose a device and search.</div>
                      ) : (
                        filteredTags.map((t) => (
                          <button
                            key={`${t.deviceId}:${t.field}`}
                            type="button"
                            style={tagRowBtn}
                            onClick={() => setSelectedTag(t)}
                          >
                            <div style={tagMain}>
                              <div style={tagField}>{t.field}</div>
                              <div style={tagMeta}>{t.label ? t.label : ""}</div>
                            </div>
                            <div style={tagTypePill}>{t.type || "—"}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div style={picked}>
                    <div style={pickedTop}>
                      <div>
                        <div style={pickedLabel}>Selected Tag</div>
                        <div style={pickedValue}>
                          {selectedTag.deviceId} / <b>{selectedTag.field}</b>
                        </div>
                      </div>

                      <button type="button" style={miniBtn} onClick={() => setSelectedTag(null)}>
                        Change
                      </button>
                    </div>

                    <div style={preview}>
                      <div style={previewLabel}>Status</div>
                      <div style={previewValue}>
                        {previewValue === null ? "—" : String(previewValue)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={section}>
              <div style={sectionLabel}>Alarm Options</div>

              {alarmType === "boolean" ? (
                <div style={grid2}>
                  <div>
                    <div style={fieldLabel}>Contact Type</div>
                    <div style={inlineRow}>
                      <button
                        type="button"
                        style={{ ...chip, ...(contactType === "NO" ? chipActive : {}) }}
                        onClick={() => setContactType("NO")}
                      >
                        NO
                      </button>
                      <button
                        type="button"
                        style={{ ...chip, ...(contactType === "NC" ? chipActive : {}) }}
                        onClick={() => setContactType("NC")}
                      >
                        NC
                      </button>
                    </div>
                    <div style={help}>
                      NO = alarm when input becomes <b>1</b> (ON) • NC = alarm when input becomes{" "}
                      <b>0</b> (OFF)
                    </div>
                  </div>

                  <div>
                    <div style={fieldLabel}>Message</div>
                    <input
                      style={input}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="ex: E-Stop Pressed"
                    />
                  </div>
                </div>
              ) : (
                <div style={grid3}>
                  <div>
                    <div style={fieldLabel}>Operator</div>
                    <select
                      style={select}
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                    >
                      <option value=">=">&ge;</option>
                      <option value="<=">&le;</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">==</option>
                    </select>
                  </div>

                  <div>
                    <div style={fieldLabel}>Threshold</div>
                    <input
                      style={input}
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="ex: 75"
                    />
                  </div>

                  <div>
                    <div style={fieldLabel}>Deadband</div>
                    <input
                      style={input}
                      value={deadband}
                      onChange={(e) => setDeadband(e.target.value)}
                      placeholder="ex: 2"
                    />
                  </div>

                  <div>
                    <div style={fieldLabel}>Severity</div>
                    <select
                      style={select}
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <div style={fieldLabel}>Message</div>
                    <input
                      style={input}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="ex: LSH1 High Level Alarm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={topActions}>
              <button style={btnGhost} onClick={onClose}>
                Close
              </button>

              <button
                style={{ ...btnPrimary, opacity: canAdd ? 1 : 0.5 }}
                onClick={handleAdd}
                disabled={!canAdd}
              >
                Add Alarm
              </button>
            </div>
          </div>

          {/* BOTTOM: TABLE */}
          <div style={bottomArea}>
            <div style={tableHeader}>
              <div style={tableTitle}>Existing Alarms</div>

              <div style={tableBtns}>
                <button
                  style={{
                    ...miniActionBtn,
                    opacity: checkedIds.size === 0 ? 0.5 : 1,
                    cursor: checkedIds.size === 0 ? "not-allowed" : "pointer",
                  }}
                  disabled={checkedIds.size === 0}
                  onClick={deleteSelected}
                >
                  Delete Selected
                </button>

                <button
                  style={{
                    ...miniActionBtn,
                    borderColor: "#ef4444",
                    color: "#991b1b",
                    background: "#fff5f5",
                  }}
                  onClick={clearAll}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={tableWrap}>
              <div style={tHeadRow}>
                <div style={{ ...tHeadCell, width: 34, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={alarms.length > 0 && alarms.every((a) => checkedIds.has(a.id))}
                    onChange={toggleAll}
                    style={checkbox}
                  />
                </div>
                <div style={{ ...tHeadCell, width: 160 }}>Trigger</div>
                <div style={{ ...tHeadCell, width: 90 }}>Alarm Type</div>
                <div style={{ ...tHeadCell, width: 170 }}>Edge Detection</div>
                <div style={{ ...tHeadCell, width: 80, textAlign: "center" }}>Value</div>
                <div style={{ ...tHeadCell, width: 120 }}>Deadband Mode</div>
                <div style={{ ...tHeadCell, width: 120, textAlign: "center" }}>Deadband Level</div>
                <div style={{ ...tHeadCell, flex: 1, minWidth: 220 }}>Message</div>
              </div>

              <div style={tBody}>
                {alarms.length === 0 ? (
                  <div style={tEmpty}>No alarms added yet. Add one above and it will appear here.</div>
                ) : (
                  alarms.map((a) => {
                    const checked = checkedIds.has(a.id);
                    return (
                      <div key={a.id} style={tRow}>
                        <div style={{ ...tCell, width: 34, textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRowCheck(a.id)}
                            style={checkbox}
                          />
                        </div>
                        <div style={{ ...tCell, width: 160 }}>
                          <b>{a.field}</b>
                          <div style={tSub}>{a.deviceId}</div>
                        </div>
                        <div style={{ ...tCell, width: 90 }}>{a.type === "boolean" ? "Bit" : "Analog"}</div>
                        <div style={{ ...tCell, width: 170 }}>{a.edgeDetection}</div>
                        <div style={{ ...tCell, width: 80, textAlign: "center" }}>{String(a.value)}</div>
                        <div style={{ ...tCell, width: 120 }}>{a.deadbandMode}</div>
                        <div style={{ ...tCell, width: 120, textAlign: "center" }}>{String(a.deadbandLevel)}</div>
                        <div style={{ ...tCell, flex: 1, minWidth: 220 }}>
                          {a.message || <span style={{ color: "#94a3b8" }}>—</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- BIG MODAL (near full screen) ---------- */
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
  width: "min(1400px, calc(100% - 32px))",
  height: "min(880px, calc(100% - 32px))",
  background: "#ffffff",
  borderRadius: 16,
  border: "1px solid #cbd5e1",
  boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const header = {
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, #f8fafc, #ffffff)",
};

const headerLeft = { display: "flex", alignItems: "center", gap: 12 };
const headerIcon = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const title = { fontWeight: 900, color: "#0f172a", fontSize: 14 };
const subtitle = { color: "#475569", fontSize: 12, marginTop: 2 };

const xBtn = {
  width: 34,
  height: 32,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
};

const content = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
};

const topArea = {
  flex: "0 0 52%",
  overflow: "auto",
  padding: 16,
  borderBottom: "1px solid #e5e7eb",
};

const bottomArea = {
  flex: "1 1 auto",
  overflow: "hidden",
  padding: 16,
  background: "#ffffff",
};

const section = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#ffffff",
  marginBottom: 12,
};

const sectionLabel = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 12,
  marginBottom: 10,
};

const typeRow = { display: "flex", gap: 10, flexWrap: "wrap" };

const typeBtn = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
};

const typeBtnActive = { border: "1px solid #2563eb", background: "#eff6ff" };

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const grid3 = {
  display: "grid",
  gridTemplateColumns: "140px 1fr 1fr 180px 1fr 1fr",
  gap: 12,
};

const fieldLabel = { fontSize: 12, color: "#475569", marginBottom: 6 };

const input = {
  width: "100%",
  height: 36,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 10px",
  outline: "none",
};

const select = {
  width: "100%",
  height: 36,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 10px",
  outline: "none",
};

const tagBox = {
  marginTop: 12,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  overflow: "hidden",
};

const tagBoxHeader = {
  padding: "10px 12px",
  display: "flex", // ✅ FIXED
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const tagBoxTitle = { color: "#0f172a", fontWeight: 900, fontSize: 12 };
const tagBoxHint = { color: "#475569", fontSize: 12 };
const tagList = { maxHeight: 180, overflow: "auto" };

const tagRowBtn = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#0f172a",
};

const tagMain = { display: "flex", flexDirection: "column", alignItems: "flex-start" };
const tagField = { fontWeight: 900, fontSize: 12 };
const tagMeta = { fontSize: 12, color: "#475569", marginTop: 2 };

const tagTypePill = {
  fontSize: 11,
  fontWeight: 900,
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
};

const empty = { padding: 12, color: "#64748b", fontSize: 12 };

const picked = { padding: 12 };
const pickedTop = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const pickedLabel = { color: "#475569", fontSize: 12 };
const pickedValue = { color: "#0f172a", fontSize: 13, marginTop: 4 };

const miniBtn = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
};

const preview = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const previewLabel = { color: "#475569", fontSize: 12 };
const previewValue = { color: "#0f172a", fontWeight: 900, fontSize: 12 };

const inlineRow = { display: "flex", gap: 10, alignItems: "center" };

const chip = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
};

const chipActive = { border: "1px solid #2563eb", background: "#eff6ff" };
const help = { marginTop: 8, fontSize: 12, color: "#64748b" };

const topActions = { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 };

const btnGhost = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
};

const btnPrimary = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #1d4ed8",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const tableHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 };
const tableTitle = { fontWeight: 900, color: "#0f172a", fontSize: 13 };
const tableBtns = { display: "flex", gap: 10 };

const miniActionBtn = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const tableWrap = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  height: "calc(100% - 40px)",
  display: "flex",
  flexDirection: "column",
};

const tHeadRow = { display: "flex", background: "#0f172a", color: "#fff", borderBottom: "1px solid #000" };

const tHeadCell = {
  padding: 10,
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const tBody = { flex: 1, overflow: "auto", background: "#ffffff" };
const tRow = { display: "flex", borderBottom: "1px solid #e5e7eb", background: "#ffffff" };

const tCell = {
  padding: 10,
  fontSize: 12,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#0f172a",
};

const tSub = { fontSize: 11, color: "#64748b", marginTop: 2 };
const tEmpty = { padding: 14, color: "#64748b", fontSize: 12 };

const checkbox = { width: 14, height: 14, cursor: "pointer", accentColor: "#111827" };
