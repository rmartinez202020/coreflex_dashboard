// src/components/AlarmSetupModal.jsx
import React from "react";

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

  // ======== FORM STATE ========
  const [alarmType, setAlarmType] = React.useState("boolean"); // boolean | dynamic
  const [deviceId, setDeviceId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState(null);

  const [contactType, setContactType] = React.useState("NO"); // NO | NC

  const [operator, setOperator] = React.useState(">=");
  const [threshold, setThreshold] = React.useState("0");
  const [deadband, setDeadband] = React.useState("0");
  const [severity, setSeverity] = React.useState("warning");

  const [message, setMessage] = React.useState("");

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
      .slice(0, 80);
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
      type: alarmType,
      deviceId: selectedTag.deviceId,
      field: selectedTag.field,
      tagLabel: selectedTag.label || selectedTag.field,
      ioType: alarmType === "boolean" ? "DI" : "AO",
      message: message?.trim() || "",
      edgeDetection: alarmType === "boolean" ? "Equal" : `When value ${operator} ${threshold}`,
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

  const allChecked = alarms.length > 0 && alarms.every((a) => checkedIds.has(a.id));

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
                Add Boolean (DI) or Dynamic (AO) alarms, then manage them in the table below
              </div>
            </div>
          </div>

          {/* ✅ RIGHT: move Close + Add Alarm to the X area */}
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
          {/* ✅ TOP (no scroll) */}
          <div style={topArea}>
            <div style={topGrid}>
              {/* LEFT */}
              <div style={col}>
                <div style={sectionCompact}>
                  <div style={sectionLabel}>Alarm Type</div>
                  <div style={typeRow}>
                    <button
                      type="button"
                      style={{ ...typeBtn, ...(alarmType === "boolean" ? typeBtnActive : {}) }}
                      onClick={() => setAlarmType("boolean")}
                    >
                      Boolean Alarm (DI)
                    </button>

                    <button
                      type="button"
                      style={{ ...typeBtn, ...(alarmType === "dynamic" ? typeBtnActive : {}) }}
                      onClick={() => setAlarmType("dynamic")}
                    >
                      Dynamic Alarm (AO)
                    </button>
                  </div>
                </div>

                <div style={sectionCompact}>
                  <div style={sectionLabel}>Alarm Options</div>

                  {alarmType === "boolean" ? (
                    <>
                      <div style={fieldRow}>
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
                          NO = alarm when input becomes <b>1</b> • NC = alarm when input becomes{" "}
                          <b>0</b>
                        </div>
                      </div>

                      <div style={fieldRow}>
                        <div style={fieldLabel}>Message</div>
                        <input
                          style={input}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="ex: E-Stop Pressed"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={row4}>
                        <div>
                          <div style={fieldLabel}>Operator</div>
                          <select style={select} value={operator} onChange={(e) => setOperator(e.target.value)}>
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
                          <select style={select} value={severity} onChange={(e) => setSeverity(e.target.value)}>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div style={fieldRow}>
                        <div style={fieldLabel}>Message</div>
                        <input
                          style={input}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="ex: LSH1 High Level Alarm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div style={col}>
                <div style={sectionCompact}>
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
                          <div style={previewValue}>{previewValue === null ? "—" : String(previewValue)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ BOTTOM: make it taller + ONLY scroll here */}
          <div style={bottomArea}>
            <div style={tableHeader}>
              <div style={tableHeaderLeft}>
                <button type="button" style={tableBtn}>
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

              <button
                type="button"
                style={advancedLink}
                onClick={() => {
                  const ok = window.confirm("Advanced: Clear ALL alarms?");
                  if (ok) clearAll();
                }}
              >
                Advanced &gt;&gt;
              </button>
            </div>

            <div style={tableWrap}>
              <div style={tHeadRow}>
                <div style={{ ...tHeadCell, width: 44, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    style={checkbox}
                    title="Select all"
                  />
                </div>

                <div style={{ ...tHeadCell, width: 220 }}>Trigger</div>
                <div style={{ ...tHeadCell, width: 130 }}>Alarm Type</div>
                <div style={{ ...tHeadCell, width: 170 }}>Edge Detection</div>
                <div style={{ ...tHeadCell, width: 110, textAlign: "center" }}>Value</div>
                <div style={{ ...tHeadCell, width: 160 }}>Deadband Mode</div>
                <div style={{ ...tHeadCell, width: 170, textAlign: "center" }}>Deadband Level</div>
                <div style={{ ...tHeadCell, flex: 1, minWidth: 420, borderRight: "none" }}>Message</div>
              </div>

              <div style={tBody}>
                {alarms.length === 0 ? (
                  <div style={tEmpty}>No alarms added yet. Add one above and it will appear here.</div>
                ) : (
                  alarms.map((a) => {
                    const checked = checkedIds.has(a.id);
                    return (
                      <div key={a.id} style={tRow}>
                        <div style={{ ...tCell, width: 44, textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRowCheck(a.id)}
                            style={checkbox}
                          />
                        </div>

                        <div style={{ ...tCell, width: 220 }}>
                          <b style={{ fontSize: 15 }}>{a.field}</b>
                          <div style={tSub}>{a.deviceId}</div>
                        </div>

                        <div style={{ ...tCell, width: 130 }}>{a.type === "boolean" ? "Bit" : "Analog"}</div>

                        <div style={{ ...tCell, width: 170 }}>
                          {a.type === "boolean" ? "Equal" : a.edgeDetection}
                        </div>

                        <div style={{ ...tCell, width: 110, textAlign: "center" }}>{String(a.value)}</div>

                        <div style={{ ...tCell, width: 160 }}>{a.deadbandMode}</div>

                        <div style={{ ...tCell, width: 170, textAlign: "center" }}>{String(a.deadbandLevel)}</div>

                        <div style={{ ...tCell, flex: 1, minWidth: 420, borderRight: "none" }}>
                          {a.message || <span style={{ color: "#888" }}>—</span>}
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
  fontSize: 15,
};

const header = {
  padding: "16px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(180deg, #f8fafc, #ffffff)",
};

const headerLeft = { display: "flex", alignItems: "center", gap: 12 };
const headerIcon = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const title = { fontWeight: 900, color: "#0f172a", fontSize: 17 };
const subtitle = { color: "#475569", fontSize: 13, marginTop: 2 };

const xBtn = {
  width: 42,
  height: 40,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 16,
};

const btnHeaderGhost = {
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};

const btnHeaderPrimary = {
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #1d4ed8",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};

const content = { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" };

/* ✅ TOP: no scroll */
const topArea = {
  flex: "0 0 40%",
  overflow: "hidden",
  padding: 16,
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
};

const topGrid = {
  height: "100%",
  display: "grid",
  gridTemplateColumns: "1fr 1.15fr",
  gap: 14,
};

const col = { display: "flex", flexDirection: "column", minHeight: 0 };

const sectionCompact = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  background: "#ffffff",
  marginBottom: 12,
};

const sectionLabel = { fontWeight: 900, color: "#0f172a", fontSize: 13, marginBottom: 10 };

const typeRow = { display: "flex", gap: 12, flexWrap: "wrap" };

const typeBtn = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};

const typeBtnActive = { border: "2px solid #2563eb", background: "#eff6ff" };

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

const row4 = {
  display: "grid",
  gridTemplateColumns: "160px 1fr 1fr 200px",
  gap: 12,
  alignItems: "end",
};

const fieldRow = { marginTop: 10 };
const fieldLabel = { fontSize: 13, color: "#475569", marginBottom: 8 };

const input = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 12px",
  outline: "none",
  fontSize: 14,
};

const select = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 12px",
  outline: "none",
  fontSize: 14,
};

const tagBox = {
  marginTop: 12,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  overflow: "hidden",
};

const tagBoxHeader = {
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const tagBoxTitle = { color: "#0f172a", fontWeight: 900, fontSize: 13 };
const tagBoxHint = { color: "#475569", fontSize: 13 };

const tagList = { maxHeight: 160, overflow: "auto" };

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
const tagField = { fontWeight: 900, fontSize: 14 };
const tagMeta = { fontSize: 13, color: "#475569", marginTop: 3 };

const tagTypePill = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
};

const empty = { padding: 12, color: "#64748b", fontSize: 13 };

const picked = { padding: 12 };
const pickedTop = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const pickedLabel = { color: "#475569", fontSize: 13 };
const pickedValue = { color: "#0f172a", fontSize: 14, marginTop: 6 };

const miniBtn = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 13,
};

const preview = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const previewLabel = { color: "#475569", fontSize: 13 };
const previewValue = { color: "#0f172a", fontWeight: 900, fontSize: 13 };

const inlineRow = { display: "flex", gap: 12, alignItems: "center", marginTop: 4 };

const chip = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
};

const chipActive = { border: "2px solid #2563eb", background: "#eff6ff" };

const help = { marginTop: 8, fontSize: 13, color: "#64748b" };

/* ✅ BOTTOM: taller + scroll in table body only */
const bottomArea = {
  flex: "1 1 auto",
  overflow: "hidden",
  padding: 16,
  background: "#ffffff",
};

const tableHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const tableHeaderLeft = { display: "flex", gap: 10, alignItems: "center" };

const tableBtn = {
  height: 36,
  padding: "0 14px",
  borderRadius: 2,
  border: "1px solid #c9c9c9",
  background: "#efefef",
  color: "#111",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 800,
};

const advancedLink = {
  border: "none",
  background: "transparent",
  color: "#1d4ed8",
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "underline",
  padding: 0,
  fontWeight: 800,
};

const tableWrap = {
  border: "1px solid #c9c9c9",
  borderRadius: 2,
  overflow: "hidden",
  height: "calc(100% - 44px)",
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
  padding: "9px 10px",
  fontWeight: 900,
  fontSize: 14,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  borderRight: "1px solid #d7d7d7",
};

const tBody = {
  flex: 1,
  overflowY: "auto", // ✅ scroll only on bottom table body
  overflowX: "hidden",
  background: "#ffffff",
};

const tRow = { display: "flex", borderBottom: "1px solid #e2e2e2", background: "#fff" };

const tCell = {
  padding: "9px 10px",
  fontSize: 14,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#111",
  borderRight: "1px solid #eeeeee",
};

const tSub = { fontSize: 12, color: "#666", marginTop: 3 };
const tEmpty = { padding: 12, color: "#666", fontSize: 14 };

const checkbox = { width: 16, height: 16, cursor: "pointer" };
