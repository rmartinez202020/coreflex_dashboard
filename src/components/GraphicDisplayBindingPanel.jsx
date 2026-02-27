// src/components/GraphicDisplayBindingPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

// ✅ Only analog inputs for CF-2000 + CF-1600
const AI_OPTIONS = [
  { key: "ai1", label: "AI-1" },
  { key: "ai2", label: "AI-2" },
  { key: "ai3", label: "AI-3" },
  { key: "ai4", label: "AI-4" },
];

// ✅ Models allowed for this widget (labels WITHOUT ZHCxxxx)
const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ add cache-buster so Vercel/CDN/browser never serves a cached JSON
function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

// ✅ resilient JSON fetch (NO-CACHE)
async function apiGet(path, { signal } = {}) {
  const res = await fetch(`${API_URL}${withNoCache(path)}`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

function normalizeArray(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

function readDeviceId(row) {
  return (
    row?.deviceId ??
    row?.device_id ??
    row?.id ??
    row?.imei ??
    row?.IMEI ??
    row?.DEVICE_ID ??
    ""
  );
}

// ✅ read AI field from row, accept multiple naming styles
function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "a"),
    f.replace("ai", "A"),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  const n = f.replace("ai", "");
  const extra = [`ai_${n}`, `AI_${n}`, `ai-${n}`, `AI-${n}`];
  for (const k of extra) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

// ✅ COMMON POLLER READER
function getRowFromTelemetryMap(telemetryMap, modelKey, deviceId) {
  if (!telemetryMap || !modelKey || !deviceId) return null;

  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  // direct modelKey
  const direct = telemetryMap?.[mk]?.[id];
  if (direct) return direct;

  // base modelKey (zhc1921/zhc1661)
  const base = MODEL_META?.[mk]?.base || mk;
  const byBase = telemetryMap?.[base]?.[id];
  if (byBase) return byBase;

  return null;
}

/**
 * ✅ DEVICE LIST LOADER (NO-SPAM)
 * Prefer telemetryMap keys if present (instant, no network),
 * else ONLY call /{base}/my-devices (the endpoint you confirmed works).
 */
async function loadDevicesForModel(modelKey, { telemetryMap, signal } = {}) {
  const mk = String(modelKey || "").trim();
  const base = MODEL_META[mk]?.base || mk;

  // 1) If telemetryMap exists, we can build a list from it (no API call).
  const bucket = telemetryMap?.[mk] || telemetryMap?.[base] || null;
  if (bucket && typeof bucket === "object") {
    const out = Object.entries(bucket)
      .map(([deviceId, row]) => {
        const id = String(deviceId || "").trim();
        if (!id) return null;
        return {
          deviceId: id,
          status: String(row?.status ?? row?.online ?? "").toLowerCase(),
          lastSeen: row?.lastSeen ?? row?.last_seen ?? row?.updatedAt ?? row?.updated_at,
        };
      })
      .filter(Boolean);

    // Keep stable ordering
    out.sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));
    return out;
  }

  // 2) Fallback: ONLY /my-devices
  const data = await apiGet(`/${base}/my-devices`, { signal });
  const arr = normalizeArray(data);

  const out = arr
    .map((r) => {
      const deviceId = readDeviceId(r);
      if (!deviceId) return null;
      return {
        deviceId: String(deviceId),
        status: String(r.status ?? r.online ?? "").toLowerCase(),
        lastSeen: r.lastSeen ?? r.last_seen ?? r.updatedAt ?? r.updated_at,
      };
    })
    .filter(Boolean);

  out.sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));
  return out;
}

/**
 * ✅ LIVE ROW LOADER (NO-SPAM)
 * - Prefer telemetryMap (common poller)
 * - Otherwise ONLY call /{base}/my-devices and find the device row
 */
async function loadLiveRowForDevice(modelKey, deviceId, { telemetryMap, signal } = {}) {
  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  // 1) Common poller (best)
  const fromCommon = getRowFromTelemetryMap(telemetryMap, mk, id);
  if (fromCommon) return fromCommon;

  // 2) Fallback: /my-devices only
  const base = MODEL_META[mk]?.base || mk;
  const data = await apiGet(`/${base}/my-devices`, { signal });
  const arr = normalizeArray(data);

  const found =
    arr.find((r) => String(readDeviceId(r) || "").trim() === id) || null;

  return found;
}

export default function GraphicDisplayBindingPanel({
  bindModel,
  setBindModel,
  bindDeviceId,
  setBindDeviceId,
  bindField,
  setBindField,
  sampleMs,
  formatSampleLabel,

  // ✅ NEW: pass the common poller map to stop modal spam
  telemetryMap = null,
}) {
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceErr, setDeviceErr] = useState("");

  const [currentValue, setCurrentValue] = useState(null);
  const [valueErr, setValueErr] = useState("");

  // Load devices when model changes (NO-SPAM)
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    async function run() {
      setLoadingDevices(true);
      setDeviceErr("");
      try {
        const list = await loadDevicesForModel(bindModel, {
          telemetryMap,
          signal: ctrl.signal,
        });
        if (cancelled) return;

        setDevices(list);

        // auto-pick first device if empty
        if (!bindDeviceId && list.length > 0) {
          setBindDeviceId(list[0].deviceId);
        }
      } catch (e) {
        if (cancelled) return;
        setDevices([]);
        setDeviceErr(
          "Could not load devices. Check your /my-devices endpoint and auth token."
        );
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindModel, telemetryMap]);

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.deviceId === bindDeviceId) || null;
  }, [devices, bindDeviceId]);

  const deviceStatusLabel = useMemo(() => {
    const s = String(selectedDevice?.status || "");
    if (!s) return "—";
    if (s === "online" || s === "true" || s === "1") return "Online";
    if (s === "offline" || s === "false" || s === "0") return "Offline";
    return s;
  }, [selectedDevice]);

  const deviceStatusColor = useMemo(() => {
    const s = String(deviceStatusLabel).toLowerCase();
    if (s.includes("online")) return "#16a34a";
    if (s.includes("offline")) return "#b42318";
    return "#6b7280";
  }, [deviceStatusLabel]);

  // ✅ Poll current value using the selected sampleMs (NO-SPAM)
  useEffect(() => {
    if (!bindDeviceId || !bindField || !bindModel) {
      setCurrentValue(null);
      setValueErr("");
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setValueErr("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          telemetryMap,
          signal: ctrl.signal,
        });

        if (cancelled) return;

        const value = row ? readAiField(row, bindField) : null;

        const num =
          value === null || value === undefined || value === ""
            ? null
            : typeof value === "number"
            ? value
            : Number(value);

        setCurrentValue(Number.isFinite(num) ? num : value ?? null);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;
        setValueErr("Could not read current value (check /my-devices fields).");
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, Number(sampleMs) || 1000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [bindModel, bindDeviceId, bindField, sampleMs, telemetryMap]);

  const currentValueLabel = useMemo(() => {
    if (currentValue === null || currentValue === undefined) return "—";
    if (typeof currentValue === "number") return currentValue.toFixed(2);
    return String(currentValue);
  }, [currentValue]);

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        padding: 14,
        display: "grid",
        gap: 12,
        alignContent: "start",
      }}
    >
      <div style={{ fontWeight: 900, color: "#111827" }}>
        Tag that drives the Trend (AI)
      </div>

      {/* Model */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
          Model
        </span>
        <select
          value={bindModel}
          onChange={(e) => {
            setBindModel(e.target.value);
            setBindDeviceId("");
            setCurrentValue(null);
            setValueErr("");
          }}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 10px",
            fontSize: 14,
          }}
        >
          {Object.keys(MODEL_META).map((k) => (
            <option key={k} value={k}>
              {MODEL_META[k].label}
            </option>
          ))}
        </select>
      </label>

      {/* Device */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
          Device
        </span>
        <select
          value={bindDeviceId}
          onChange={(e) => {
            setBindDeviceId(e.target.value);
            setCurrentValue(null);
            setValueErr("");
          }}
          disabled={loadingDevices}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 10px",
            fontSize: 14,
            background: loadingDevices ? "#f3f4f6" : "#fff",
          }}
        >
          <option value="">
            {loadingDevices ? "Loading devices..." : "Select a device…"}
          </option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.deviceId}
            </option>
          ))}
        </select>
      </label>

      {/* Tag (AI only) */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
          Analog Input (AI)
        </span>
        <select
          value={bindField}
          onChange={(e) => {
            setBindField(e.target.value);
            setCurrentValue(null);
            setValueErr("");
          }}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 10px",
            fontSize: 14,
          }}
        >
          {AI_OPTIONS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {/* Status panel */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 12,
          background: "#f9fafb",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8, color: "#111827" }}>
          Binding Preview
        </div>

        <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>
          Selected: <b>{bindDeviceId || "—"}</b>{" "}
          <span style={{ color: deviceStatusColor, fontWeight: 900 }}>
            {bindDeviceId ? `• ${deviceStatusLabel.toUpperCase()}` : ""}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
              Model
            </div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              {MODEL_META[bindModel]?.label || bindModel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
              Selected AI
            </div>
            <div style={{ fontSize: 12, color: "#374151" }}>
              {AI_OPTIONS.find((x) => x.key === bindField)?.label || bindField}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
            Current Value
          </div>

          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <div
              style={{
                minWidth: 110,
                textAlign: "center",
                borderRadius: 999,
                padding: "6px 10px",
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: 12,
                border: "1px solid #c7e7d1",
                background: "#dff7e6",
                color: "#0b3b18",
              }}
              title={`Live value (polling every ${formatSampleLabel(sampleMs)})`}
            >
              {currentValueLabel}
            </div>
          </div>

          {valueErr && (
            <div
              style={{
                marginTop: 8,
                color: "#b42318",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {valueErr}
            </div>
          )}

          {deviceErr && (
            <div
              style={{
                marginTop: 8,
                color: "#b42318",
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              {deviceErr}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}