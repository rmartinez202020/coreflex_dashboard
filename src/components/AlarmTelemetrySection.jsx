// src/components/AlarmTelemetrySection.jsx
import React from "react";

function normalizeTagType(alarmType) {
  const s = String(alarmType || "").trim().toLowerCase();

  // ✅ boolean alarms -> DI
  if (s === "boolean" || s === "digital" || s === "di") return "di";

  // ✅ analog alarms -> AI
  if (s === "analog" || s === "ai" || s === "analog_input") return "ai";

  // fallback
  return "di";
}

function previewStatusMeta(previewValue, selectedTag, tagMode) {
  if (!selectedTag) {
    return {
      text: "—",
      color: "#0f172a",
      badgeBg: "#f8fafc",
      badgeBorder: "#e5e7eb",
    };
  }

  if (previewValue === null || previewValue === undefined || previewValue === "") {
    return {
      text: "No data",
      color: "#64748b",
      badgeBg: "#f8fafc",
      badgeBorder: "#e5e7eb",
    };
  }

  if (tagMode === "di") {
    const n = Number(previewValue);
    const isOn = Number.isFinite(n) ? n > 0 : String(previewValue).trim() === "1";

    return {
      text: isOn ? `ON (${String(previewValue)})` : `OFF (${String(previewValue)})`,
      color: isOn ? "#166534" : "#334155",
      badgeBg: isOn ? "rgba(187,247,208,0.55)" : "#f8fafc",
      badgeBorder: isOn ? "rgba(22,163,74,0.25)" : "#cbd5e1",
    };
  }

  const numeric = Number(previewValue);
  return {
    text: Number.isFinite(numeric) ? String(numeric) : String(previewValue),
    color: "#0f172a",
    badgeBg: "rgba(219,234,254,0.65)",
    badgeBorder: "rgba(59,130,246,0.24)",
  };
}

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
  // ✅ common poller-ready mode:
  // boolean -> DI
  // analog  -> AI
  const tagMode = React.useMemo(() => normalizeTagType(alarmType), [alarmType]);

  const hintText = tagMode === "ai" ? "Showing AI tags" : "Showing DI tags";

  const selectedPreview = React.useMemo(
    () => previewStatusMeta(previewValue, selectedTag, tagMode),
    [previewValue, selectedTag, tagMode]
  );

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
            {(devices || []).map((d) => {
              const id = String(d.deviceId ?? d.id ?? "").trim();
              const name = String(d.name ?? d.deviceId ?? d.id ?? "").trim();
              if (!id) return null;

              return (
                <option key={id} value={id}>
                  {name || id}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <div style={fieldLabel}>Search Tag</div>
          <input
            style={input}
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
            placeholder={tagMode === "ai" ? "ex: AI1, pressure, temp..." : "ex: DI1, level, run..."}
          />
        </div>
      </div>

      <div style={tagBox}>
        {!selectedTag ? (
          <>
            <div style={tagBoxHeader}>
              <div style={tagBoxTitle}>Results</div>
              <div style={tagBoxHint}>{hintText}</div>
            </div>

            <div style={tagList}>
              {filteredTags.length === 0 ? (
                <div style={empty}>
                  No matching tags. Choose a device and search.
                </div>
              ) : (
                filteredTags.map((t) => {
                  const rowKey = `${t.deviceId}:${t.field}`;
                  const typeText = String(t.type || (tagMode === "ai" ? "AI" : "DI")).toUpperCase();

                  return (
                    <button
                      key={rowKey}
                      type="button"
                      style={tagRowBtn}
                      onClick={() => setSelectedTag?.(t)}
                    >
                      <div style={tagMain}>
                        <div style={tagField}>{t.field}</div>
                        <div style={tagMeta}>
                          {t.label ? t.label : ""}
                          {t.label && t.deviceId ? " • " : ""}
                          {t.deviceId ? t.deviceId : ""}
                        </div>
                      </div>

                      <div style={tagRight}>
                        {"previewValue" in t && t.previewValue !== undefined && t.previewValue !== null ? (
                          <div style={tagLiveValue}>{String(t.previewValue)}</div>
                        ) : null}
                        <div style={tagTypePill}>{typeText}</div>
                      </div>
                    </button>
                  );
                })
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
                <div style={pickedSubMeta}>
                  Type: <b>{String(selectedTag.type || tagMode).toUpperCase()}</b>
                  {selectedTag.label ? (
                    <>
                      {" "}
                      • Label: <b>{selectedTag.label}</b>
                    </>
                  ) : null}
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
              <div style={previewLeft}>
                <div style={previewLabel}>Status</div>
                <div style={previewModeHint}>
                  {tagMode === "ai" ? "Live AI value" : "Live DI state"}
                </div>
              </div>

              <div
                style={{
                  ...previewBadge,
                  color: selectedPreview.color,
                  background: selectedPreview.badgeBg,
                  borderColor: selectedPreview.badgeBorder,
                }}
              >
                {selectedPreview.text}
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
  minWidth: 0,
};

const tagField = {
  fontWeight: 900,
  fontSize: 14,
};

const tagMeta = {
  fontSize: 13,
  color: "#475569",
  marginTop: 3,
  textAlign: "left",
};

const tagRight = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginLeft: 12,
};

const tagLiveValue = {
  fontSize: 12,
  fontWeight: 900,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
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
  gap: 12,
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

const pickedSubMeta = {
  color: "#64748b",
  fontSize: 12,
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
  gap: 12,
};

const previewLeft = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const previewLabel = {
  color: "#475569",
  fontSize: 13,
};

const previewModeHint = {
  color: "#64748b",
  fontSize: 12,
};

const previewBadge = {
  minWidth: 120,
  height: 34,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
  fontSize: 13,
};