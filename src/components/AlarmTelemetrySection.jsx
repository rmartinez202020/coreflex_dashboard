// src/components/AlarmTelemetrySection.jsx
import React from "react";

export default function AlarmTelemetrySection({
  sectionLabel = "Tag that triggers this alarm",
  alarmType = "boolean",
  deviceId = "",
  setDeviceId,
  search = "",
  setSearch,
  selectedTag = null,
  setSelectedTag,
  devices = [],
  filteredTags = [],
  previewValue = null,
}) {
  return (
    <div style={sectionCompact}>
      <div style={sectionLabelStyle}>{sectionLabel}</div>

      <div style={grid2}>
        <div>
          <div style={fieldLabel}>Device</div>
          <select
            style={select}
            value={deviceId}
            onChange={(e) => {
              setDeviceId?.(e.target.value);
              setSelectedTag?.(null);
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
            onChange={(e) => setSearch?.(e.target.value)}
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
                    onClick={() => setSelectedTag?.(t)}
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
                onClick={() => setSelectedTag?.(null)}
              >
                Change
              </button>
            </div>

            <div style={preview}>
              <div style={previewLabel}>Status</div>
              <div style={previewValueText}>
                {previewValue === null ? "—" : String(previewValue)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const sectionCompact = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  background: "#ffffff",
  marginBottom: 12,
};

const sectionLabelStyle = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 13,
  marginBottom: 10,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
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

const tagBoxTitle = {
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 13,
};

const tagBoxHint = {
  color: "#475569",
  fontSize: 13,
};

const tagList = {
  maxHeight: 160,
  overflow: "auto",
};

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

const tagMain = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const tagField = {
  fontWeight: 900,
  fontSize: 14,
};

const tagMeta = {
  fontSize: 13,
  color: "#475569",
  marginTop: 3,
};

const tagTypePill = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#0f172a",
};

const empty = {
  padding: 12,
  color: "#64748b",
  fontSize: 13,
};

const picked = {
  padding: 12,
};

const pickedTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const pickedLabel = {
  color: "#475569",
  fontSize: 13,
};

const pickedValue = {
  color: "#0f172a",
  fontSize: 14,
  marginTop: 6,
};

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

const previewLabel = {
  color: "#475569",
  fontSize: 13,
};

const previewValueText = {
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 13,
};