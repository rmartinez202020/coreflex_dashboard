// src/components/AlarmTelemetrySection.jsx
import React from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ match your working modal model map
const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
  tp4000: { label: "TP-4000", base: "tp4000" },
};

function normalizeTagType(alarmType) {
  const s = String(alarmType || "").trim().toLowerCase();

  // ✅ boolean alarms -> DI
  if (s === "boolean" || s === "digital" || s === "di") return "di";

  // ✅ dynamic / analog alarms -> AI
  if (
    s === "dynamic" ||
    s === "analog" ||
    s === "ai" ||
    s === "analog_input"
  ) {
    return "ai";
  }

  return "di";
}

function formatTagLabel(field) {
  const s = String(field || "").trim().toLowerCase();
  if (!s) return "";

  if (/^di[1-6]$/.test(s)) return s.toUpperCase().replace("DI", "DI-");
  if (/^do[1-4]$/.test(s)) return s.toUpperCase().replace("DO", "DO-");
  if (/^ai[1-8]$/.test(s)) return s.toUpperCase().replace("AI", "AI-");
  if (/^ao[1-4]$/.test(s)) return s.toUpperCase().replace("AO", "AO-");
  if (/^te10[1-8]$/.test(s)) return s.toUpperCase();

  return s.toUpperCase();
}

function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;

  const s = String(v).trim().toLowerCase();
  if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
  if (s === "0" || s === "false" || s === "off" || s === "no") return 0;

  const n = Number(s);
  if (!Number.isNaN(n)) return n > 0 ? 1 : 0;

  return null;
}

function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  if (/^di[1-6]$/.test(field)) {
    const n = field.replace("di", "");
    const alt = `in${n}`;
    const altUp = `IN${n}`;
    if (row[alt] !== undefined) return row[alt];
    if (row[altUp] !== undefined) return row[altUp];
  }

  if (/^do[1-4]$/.test(field)) {
    const n = field.replace("do", "");
    const alt = `out${n}`;
    const altUp = `OUT${n}`;
    if (row[alt] !== undefined) return row[alt];
    if (row[altUp] !== undefined) return row[altUp];
  }

  // ✅ optional aliases for AI naming variations
  if (/^ai[1-8]$/.test(field)) {
    const n = field.replace("ai", "");
    const extra = [`AI${n}`, `ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
    for (const k of extra) {
      if (row[k] !== undefined) return row[k];
    }
  }

  // ✅ TP-4000 common variants
  if (/^te10[1-8]$/.test(field)) {
    const upTe = String(field).toUpperCase();
    const extra = [upTe, upTe.replace("TE", "T"), field.toLowerCase()];
    for (const k of extra) {
      if (row[k] !== undefined) return row[k];
    }
  }

  return undefined;
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

  if (
    previewValue === null ||
    previewValue === undefined ||
    previewValue === ""
  ) {
    return {
      text: "No data",
      color: "#64748b",
      badgeBg: "#f8fafc",
      badgeBorder: "#e5e7eb",
    };
  }

  if (tagMode === "di") {
    const n = Number(previewValue);
    const isOn = Number.isFinite(n)
      ? n > 0
      : String(previewValue).trim() === "1";

    return {
      text: isOn
        ? `ON (${String(previewValue)})`
        : `OFF (${String(previewValue)})`,
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

function getTagFieldsForMode(model, tagMode) {
  const m = String(model || "").trim().toLowerCase();

  if (tagMode === "di") {
    if (m === "zhc1921") return ["di1", "di2", "di3", "di4", "di5", "di6"];
    return [];
  }

  if (tagMode === "ai") {
    if (m === "zhc1921") return ["ai1", "ai2", "ai3", "ai4"];
    if (m === "zhc1661") return ["ai1", "ai2", "ai3", "ai4"];
    if (m === "tp4000") {
      return [
        "te101",
        "te102",
        "te103",
        "te104",
        "te105",
        "te106",
        "te107",
        "te108",
      ];
    }
  }

  return [];
}

export default function AlarmTelemetrySection({
  sectionLabel = "Tag that triggers this alarm",
  alarmType = "boolean",

  // ✅ now smart section keeps model too
  model = "zhc1921",
  setModel,

  deviceId = "",
  setDeviceId,

  search = "",
  setSearch,

  selectedTag = null,
  setSelectedTag,
}) {
  const [devices, setDevices] = React.useState([]);
  const [devicesErr, setDevicesErr] = React.useState("");
  const [telemetryRow, setTelemetryRow] = React.useState(null);

  const telemetryRef = React.useRef({ loading: false });

  const tagMode = React.useMemo(
    () => normalizeTagType(alarmType),
    [alarmType]
  );
  const base = React.useMemo(
    () => MODEL_META?.[model]?.base || "zhc1921",
    [model]
  );

  const selectedDevice = React.useMemo(() => {
    return devices.find((d) => String(d.id) === String(deviceId)) || null;
  }, [devices, deviceId]);

  React.useEffect(() => {
    setSelectedTag?.(null);
  }, [model, alarmType, setSelectedTag]);

  React.useEffect(() => {
    let alive = true;

    async function loadDevices() {
      setDevicesErr("");
      setDevices([]);
      setTelemetryRow(null);

      try {
        const token = String(getToken() || "").trim();
        if (!token) {
          throw new Error(
            "Missing auth token. Please logout and login again."
          );
        }

        const res = await fetch(`${API_URL}/${base}/my-devices`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            j?.detail || `Failed to load devices (${res.status})`
          );
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const mapped = list
          .map((r) => {
            const id = String(r.deviceId ?? r.device_id ?? "").trim();
            return { id, name: id };
          })
          .filter((x) => x.id);

        if (!alive) return;
        setDevices(mapped);

        const currentId = String(deviceId || "").trim();
        if (currentId && !mapped.some((d) => String(d.id) === currentId)) {
          setDeviceId?.("");
          setSelectedTag?.(null);
        }
      } catch (e) {
        if (!alive) return;
        setDevices([]);
        setDevicesErr(e.message || "Failed to load devices");
      }
    }

    loadDevices();

    return () => {
      alive = false;
    };
  }, [base, deviceId, setDeviceId, setSelectedTag]);

  const fetchTelemetryRow = React.useCallback(async () => {
    const id = String(deviceId || "").trim();
    if (!id) {
      setTelemetryRow(null);
      return;
    }

    if (telemetryRef.current.loading) return;
    telemetryRef.current.loading = true;

    try {
      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error(
          "Missing auth token. Please logout and login again."
        );
      }

      const res = await fetch(`${API_URL}/${base}/my-devices`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setTelemetryRow(null);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const row =
        list.find(
          (r) => String(r.deviceId ?? r.device_id ?? "").trim() === id
        ) || null;

      setTelemetryRow(row);
    } catch {
      setTelemetryRow(null);
    } finally {
      telemetryRef.current.loading = false;
    }
  }, [deviceId, base]);

  React.useEffect(() => {
    fetchTelemetryRow();

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchTelemetryRow();
    }, 3000);

    return () => clearInterval(t);
  }, [fetchTelemetryRow]);

  const backendDeviceStatus = React.useMemo(() => {
    const s = String(telemetryRow?.status || "").trim().toLowerCase();
    if (!deviceId) return "";
    return s || "";
  }, [telemetryRow, deviceId]);

  const deviceIsOnline = backendDeviceStatus === "online";

  const availableFields = React.useMemo(
    () => getTagFieldsForMode(model, tagMode),
    [model, tagMode]
  );

  const filteredTags = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();

    return availableFields
      .map((field) => {
        const value = telemetryRow
          ? readTagFromRow(telemetryRow, field)
          : undefined;

        return {
          deviceId: String(deviceId || "").trim(),
          field,
          label: formatTagLabel(field),
          type: tagMode.toUpperCase(),
          previewValue: value,
        };
      })
      .filter((t) => {
        if (!deviceId) return false;
        if (!q) return true;

        const hay = [
          String(t.field || "").toLowerCase(),
          String(t.label || "").toLowerCase(),
        ].join(" ");

        return hay.includes(q);
      });
  }, [availableFields, telemetryRow, deviceId, search, tagMode]);

  const previewValue = React.useMemo(() => {
    if (!selectedTag || !telemetryRow) return null;
    const raw = readTagFromRow(telemetryRow, selectedTag.field);
    return tagMode === "di" ? to01(raw) : raw;
  }, [selectedTag, telemetryRow, tagMode]);

  const selectedPreview = React.useMemo(
    () => previewStatusMeta(previewValue, selectedTag, tagMode),
    [previewValue, selectedTag, tagMode]
  );

  const hintText = "Live Values";

  return (
    <div style={sectionCompact}>
      <div style={sectionLabelStyle}>{sectionLabel}</div>

      {devicesErr ? <div style={errorText}>{devicesErr}</div> : null}

      <div style={grid3}>
        <div>
          <div style={fieldLabel}>Model</div>
          <select
            style={select}
            value={model}
            onChange={(e) => {
              setModel?.(e.target.value);
              setDeviceId?.("");
              setSelectedTag?.(null);
            }}
          >
            {Object.keys(MODEL_META).map((k) => (
              <option key={k} value={k}>
                {MODEL_META[k].label}
              </option>
            ))}
          </select>
        </div>

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
              const id = String(d.id ?? d.deviceId ?? "").trim();
              const name = String(d.name ?? d.id ?? d.deviceId ?? "").trim();
              if (!id) return null;

              return (
                <option key={id} value={id}>
                  {name || id}
                </option>
              );
            })}
          </select>

          {deviceId && selectedDevice ? (
            <div style={subInfo}>
              Selected: <b>{selectedDevice.id}</b> •{" "}
              <span
                style={{
                  color: deviceIsOnline ? "#16a34a" : "#dc2626",
                  fontWeight: 900,
                }}
              >
                {backendDeviceStatus ? backendDeviceStatus.toUpperCase() : "—"}
              </span>
            </div>
          ) : null}
        </div>

        <div>
          <div style={fieldLabel}>Search Tag</div>
          <input
            style={input}
            value={search}
            onChange={(e) => setSearch?.(e.target.value)}
            placeholder={
              tagMode === "ai"
                ? "ex: AI1, pressure, temp, TE101..."
                : "ex: DI1, level, run..."
            }
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
                  {!deviceId
                    ? "Choose a device first."
                    : "No matching tags. Choose a device and search."}
                </div>
              ) : (
                filteredTags.map((t) => {
                  const rowKey = `${t.deviceId}:${t.field}`;
                  const typeText = String(
                    t.type || (tagMode === "ai" ? "AI" : "DI")
                  ).toUpperCase();

                  return (
                    <button
                      key={rowKey}
                      type="button"
                      style={tagRowBtn}
                      onClick={() => setSelectedTag?.(t)}
                    >
                      <div style={tagMain}>
                        <div style={tagField}>{formatTagLabel(t.field)}</div>
                      </div>

                      <div style={tagRight}>
                        {"previewValue" in t &&
                        t.previewValue !== undefined &&
                        t.previewValue !== null ? (
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
                  {selectedTag.deviceId} /{" "}
                  <b>{formatTagLabel(selectedTag.field)}</b>
                </div>
                <div style={pickedSubMeta}>
                  Type:{" "}
                  <b>{String(selectedTag.type || tagMode).toUpperCase()}</b>
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

const grid3 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
};

const fieldLabel = {
  fontSize: 13,
  color: "#475569",
  marginBottom: 8,
};

const subInfo = {
  marginTop: 6,
  fontSize: 12,
  color: "#64748b",
};

const errorText = {
  marginBottom: 10,
  color: "#dc2626",
  fontSize: 12,
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