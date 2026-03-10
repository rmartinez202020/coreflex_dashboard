// src/components/AlarmOptionsSection.jsx
import React from "react";

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
                  style={{
                    ...chip,
                    ...(contactType === "NO" ? chipActive : {}),
                  }}
                  onClick={() => setContactType?.("NO")}
                >
                  NO
                </button>
                <button
                  type="button"
                  style={{
                    ...chip,
                    ...(contactType === "NC" ? chipActive : {}),
                  }}
                  onClick={() => setContactType?.("NC")}
                >
                  NC
                </button>
              </div>
              <div style={help}>
                NO = alarm when input becomes <b>1</b> • NC = alarm when input
                becomes <b>0</b>
              </div>
            </div>

            <div style={fieldRow}>
              <div style={fieldLabel}>Message</div>
              <input
                style={input}
                value={message}
                onChange={(e) => setMessage?.(e.target.value)}
                placeholder="ex: E-Stop Pressed"
              />
            </div>
          </>
        ) : (
          <>
            <div style={row4}>
              <div>
                <div style={fieldLabel}>Operator</div>
                <select
                  style={select}
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
                  style={input}
                  value={threshold}
                  onChange={(e) => setThreshold?.(e.target.value)}
                  placeholder="ex: 75"
                />
              </div>

              <div>
                <div style={fieldLabel}>Deadband</div>
                <input
                  style={input}
                  value={deadband}
                  onChange={(e) => setDeadband?.(e.target.value)}
                  placeholder="ex: 2"
                />
              </div>

              <div>
                <div style={fieldLabel}>Severity</div>
                <select
                  style={select}
                  value={severity}
                  onChange={(e) => setSeverity?.(e.target.value)}
                >
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
  padding: 14,
  background: "#ffffff",
  marginBottom: 12,
};

const sectionLabel = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 13,
  marginBottom: 10,
};

const typeRow = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

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

const typeBtnActive = {
  border: "2px solid #2563eb",
  background: "#eff6ff",
};

const row4 = {
  display: "grid",
  gridTemplateColumns: "160px 1fr 1fr 200px",
  gap: 12,
  alignItems: "end",
};

const fieldRow = {
  marginTop: 10,
};

const fieldLabel = {
  fontSize: 13,
  color: "#475569",
  marginBottom: 8,
};

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

const inlineRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginTop: 4,
};

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

const chipActive = {
  border: "2px solid #2563eb",
  background: "#eff6ff",
};

const help = {
  marginTop: 8,
  fontSize: 13,
  color: "#64748b",
};