// src/components/AlarmSetupModal.jsx
import React from "react";

export default function AlarmSetupModal({
  open,
  onClose,
  onAddAlarm,

  // provide these from parent if you already have them
  devices = [], // [{ deviceId, name }]
  availableTags = [], // [{ deviceId, field, label, type }] type: "DI" | "AO" | "AI" | ...
  sensorsData, // optional for preview
}) {
  if (!open) return null;

  // alarm type
  const [alarmType, setAlarmType] = React.useState("boolean"); // boolean | dynamic

  // tag search
  const [deviceId, setDeviceId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState(null);

  // boolean alarm options
  const [contactType, setContactType] = React.useState("NO"); // NO | NC

  // dynamic alarm options
  const [operator, setOperator] = React.useState(">="); // >= <= > < ==
  const [threshold, setThreshold] = React.useState("0");
  const [deadband, setDeadband] = React.useState("0");
  const [severity, setSeverity] = React.useState("warning"); // info | warning | critical

  // common
  const [message, setMessage] = React.useState("");

  // filter tags like your “Search Tag” behavior
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
      .slice(0, 40);
  }, [availableTags, deviceId, search, alarmType]);

  // optional preview
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

    const payload = {
      id: crypto?.randomUUID?.() || `alarm_${Date.now()}`,
      type: alarmType, // boolean | dynamic
      tag: {
        deviceId: selectedTag.deviceId,
        field: selectedTag.field,
        label: selectedTag.label || selectedTag.field,
        ioType: alarmType === "boolean" ? "DI" : "AO",
      },
      message: message?.trim() || "",
      createdAt: Date.now(),
    };

    if (alarmType === "boolean") {
      payload.boolean = { contactType }; // NO | NC
    } else {
      payload.dynamic = {
        operator,
        threshold: Number(threshold),
        deadband: Number(deadband || 0),
        severity,
      };
    }

    onAddAlarm?.(payload);
    onClose?.();
  };

  return (
    <div style={overlay} onMouseDown={(e) => e.stopPropagation()}>
      <div style={card}>
        {/* Header */}
        <div style={header}>
          <div style={headerLeft}>
            <div style={headerIcon}>⚙️</div>
            <div>
              <div style={title}>Alarm Setup</div>
              <div style={subtitle}>
                Add Boolean (DI) or Dynamic (AO) alarms for this log window
              </div>
            </div>
          </div>

          <button style={xBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={body}>
          {/* Alarm type */}
          <div style={section}>
            <div style={sectionLabel}>Alarm Type</div>
            <div style={typeRow}>
              <button
                type="button"
                style={{
                  ...typeBtn,
                  ...(alarmType === "boolean" ? typeBtnActive : {}),
                }}
                onClick={() => {
                  setAlarmType("boolean");
                  setSelectedTag(null);
                }}
              >
                Boolean Alarm (DI)
              </button>

              <button
                type="button"
                style={{
                  ...typeBtn,
                  ...(alarmType === "dynamic" ? typeBtnActive : {}),
                }}
                onClick={() => {
                  setAlarmType("dynamic");
                  setSelectedTag(null);
                }}
              >
                Dynamic Alarm (AO)
              </button>
            </div>
          </div>

          {/* Tag selector */}
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
                      <div style={empty}>
                        No matching tags. Choose a device and search.
                      </div>
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

                    <button
                      type="button"
                      style={miniBtn}
                      onClick={() => setSelectedTag(null)}
                    >
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

          {/* Options */}
          <div style={section}>
            <div style={sectionLabel}>Alarm Options</div>

            {alarmType === "boolean" ? (
              <div style={grid2}>
                <div>
                  <div style={fieldLabel}>Contact Type</div>
                  <div style={inlineRow}>
                    <button
                      type="button"
                      style={{
                        ...chip,
                        ...(contactType === "NO" ? chipActive : {}),
                      }}
                      onClick={() => setContactType("NO")}
                    >
                      NO
                    </button>
                    <button
                      type="button"
                      style={{
                        ...chip,
                        ...(contactType === "NC" ? chipActive : {}),
                      }}
                      onClick={() => setContactType("NC")}
                    >
                      NC
                    </button>
                  </div>
                  <div style={help}>
                    NO = alarm when input becomes <b>1</b> (ON) • NC = alarm when
                    input becomes <b>0</b> (OFF)
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
        </div>

        {/* Footer */}
        <div style={footer}>
          <button style={btnGhost} onClick={onClose}>
            Cancel
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
    </div>
  );
}

/* ---------- LIGHT STYLES (white/clean) ---------- */
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
  width: 980,
  maxWidth: "calc(100% - 40px)",
  height: 640,
  maxHeight: "calc(100% - 40px)",
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

const body = { padding: 16, overflow: "auto", flex: 1 };

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

const typeBtnActive = {
  border: "1px solid #2563eb",
  background: "#eff6ff",
};

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const grid3 = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 1fr 160px 1fr 1fr",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const tagBoxTitle = { color: "#0f172a", fontWeight: 900, fontSize: 12 };
const tagBoxHint = { color: "#475569", fontSize: 12 };

const tagList = { maxHeight: 170, overflow: "auto" };

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

const chipActive = {
  border: "1px solid #2563eb",
  background: "#eff6ff",
};

const help = { marginTop: 8, fontSize: 12, color: "#64748b" };

const footer = {
  padding: "12px 16px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  background: "#ffffff",
};

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
