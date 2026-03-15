// src/components/AlarmOptionsSection.jsx
import React from "react";

function formatPreviewNumber(v) {
  if (v === null || v === undefined || v === "") return "—";

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "—";
    return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3)));
  }

  const n = Number(v);
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  }

  return String(v);
}

export default function AlarmOptionsSection({
  alarmType = "boolean",
  setAlarmType,
  contactType = "NO",
  setContactType,
  operator = ">=",
  setOperator,
  threshold = "0",
  setThreshold,
  deadband = "0",
  setDeadband,
  severity = "warning",
  setSeverity,
  message = "",
  setMessage,

  // ✅ kept for compatibility with parent props
  mathEnabled = false,
  setMathEnabled,
  mathFormula = "",
  setMathFormula,

  // ✅ live preview values for math row
  rawValue = null,
  outputValue = null,
}) {
  return (
    <div style={col}>
      <div style={sectionCompact}>
        <div style={sectionLabel}>Alarm Type</div>

        <div style={typeRow}>
          <button
            type="button"
            style={{
              ...typeBtn,
              ...(alarmType === "boolean" ? typeBtnActive : {}),
            }}
            onClick={() => setAlarmType?.("boolean")}
          >
            Boolean Alarm (DI)
          </button>

          <button
            type="button"
            style={{
              ...typeBtn,
              ...(alarmType === "dynamic" ? typeBtnActive : {}),
            }}
            onClick={() => setAlarmType?.("dynamic")}
          >
            Dynamic Alarm (AI)
          </button>
        </div>

        {alarmType === "dynamic" && (
          <div style={mathWrap}>
            <div style={mathTopRow}>
              <div style={sectionSubLabel}>Math</div>

              <div style={mathRightRow}>
                <div style={mathReadoutGroup}>
                  <div style={mathReadoutBlock}>
                    <span style={mathReadoutLabel}>Raw</span>
                    <span style={mathReadoutValue}>
                      {formatPreviewNumber(rawValue)}
                    </span>
                  </div>

                  <div style={mathReadoutBlock}>
                    <span style={mathReadoutLabel}>Output</span>
                    <span style={mathReadoutValue}>
                      {formatPreviewNumber(outputValue ?? rawValue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={mathInputRow}>
              <input
                style={inputCompact}
                value={mathFormula}
                onChange={(e) => setMathFormula?.(e.target.value)}
                placeholder="ex: VALUE * 1.8 + 32"
              />
            </div>

            <div style={helpCompact}>
              Use <b>VALUE</b> as the live AI reading. Examples:{" "}
              <b>VALUE * 1.8 + 32</b>, <b>VALUE / 10</b>, <b>VALUE - 4</b>
            </div>
          </div>
        )}
      </div>

      <div style={sectionCompact}>
        <div style={sectionLabel}>Alarm Options</div>

        {alarmType === "boolean" ? (
          <>
            <div style={fieldRowCompact}>
              <div style={fieldLabel}>Contact Type</div>
              <div style={inlineRow}>
                <button
                  type="button"
                  style={{
                    ...chipCompact,
                    ...(contactType === "NO" ? chipActive : {}),
                  }}
                  onClick={() => setContactType?.("NO")}
                >
                  NO
                </button>
                <button
                  type="button"
                  style={{
                    ...chipCompact,
                    ...(contactType === "NC" ? chipActive : {}),
                  }}
                  onClick={() => setContactType?.("NC")}
                >
                  NC
                </button>
              </div>
              <div style={helpCompact}>
                NO = alarm when input becomes <b>1</b> • NC = alarm when input
                becomes <b>0</b>
              </div>
            </div>

            <div style={fieldRowCompact}>
              <div style={fieldLabel}>Message</div>
              <input
                style={inputCompact}
                value={message}
                onChange={(e) => setMessage?.(e.target.value)}
                placeholder="ex: E-Stop Pressed"
              />
            </div>
          </>
        ) : (
          <>
            <div style={row4Compact}>
              <div>
                <div style={fieldLabel}>Operator</div>
                <select
                  style={selectCompact}
                  value={operator}
                  onChange={(e) => setOperator?.(e.target.value)}
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
                  style={inputCompact}
                  value={threshold}
                  onChange={(e) => setThreshold?.(e.target.value)}
                  placeholder="ex: 75"
                />
              </div>

              <div>
                <div style={fieldLabel}>Deadband</div>
                <input
                  style={inputCompact}
                  value={deadband}
                  onChange={(e) => setDeadband?.(e.target.value)}
                  placeholder="ex: 2"
                />
              </div>

              <div>
                <div style={fieldLabel}>Severity</div>
                <select
                  style={selectCompact}
                  value={severity}
                  onChange={(e) => setSeverity?.(e.target.value)}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={fieldRowCompact}>
              <div style={fieldLabel}>Message</div>
              <input
                style={inputCompact}
                value={message}
                onChange={(e) => setMessage?.(e.target.value)}
                placeholder="ex: LSH1 High Level Alarm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const col = {
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const sectionCompact = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 10,
  background: "#ffffff",
  marginBottom: 10,
};

const sectionLabel = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 12,
  marginBottom: 8,
};

const sectionSubLabel = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 12,
};

const typeRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const typeBtn = {
  padding: "8px 12px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const typeBtnActive = {
  border: "2px solid #2563eb",
  background: "#eff6ff",
};

const mathWrap = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid #e5e7eb",
};

const mathTopRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
};

const mathRightRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const mathReadoutGroup = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const mathReadoutBlock = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const mathReadoutLabel = {
  fontSize: 11,
  fontWeight: 800,
  color: "#475569",
};

const mathReadoutValue = {
  minWidth: 68,
  height: 28,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #b7dec2",
  background: "#d9f1df",
  color: "#111111",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1,
};

const mathInputRow = {
  marginTop: 0,
};

const row4Compact = {
  display: "grid",
  gridTemplateColumns: "120px 1fr 1fr 150px",
  gap: 10,
  alignItems: "end",
};

const fieldRowCompact = {
  marginTop: 8,
};

const fieldLabel = {
  fontSize: 12,
  color: "#475569",
  marginBottom: 6,
};

const inputCompact = {
  width: "100%",
  height: 36,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 10px",
  outline: "none",
  fontSize: 12,
};

const selectCompact = {
  width: "100%",
  height: 36,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  padding: "0 10px",
  outline: "none",
  fontSize: 12,
};

const inlineRow = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  marginTop: 2,
};

const chipCompact = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const chipActive = {
  border: "2px solid #2563eb",
  background: "#eff6ff",
};

const helpCompact = {
  marginTop: 6,
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.3,
};