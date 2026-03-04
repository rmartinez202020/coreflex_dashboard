// src/components/GraphicDisplayBindingPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

// ✅ optional cache-buster (ONLY use when truly needed)
function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

// ✅ resilient JSON fetch (default uses normal cache behavior)
async function apiGet(path, { signal, noCache = false } = {}) {
  const url = `${API_URL}${noCache ? withNoCache(path) : path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      ...(noCache
        ? {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          }
        : {}),
    },
    cache: noCache ? "no-store" : "default",
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

// ✅ COMMON POLLER READER (ONLY for LIVE VALUE, NOT for device list)
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
 * ✅ DEVICE LIST LOADER (SECURE)
 * IMPORTANT: user must ONLY see devices they registered.
 * Therefore: device list MUST come from /{base}/my-devices (or parent-provided rows from that endpoint),
 * NOT from telemetryMap.
 */
async function loadDevicesForModelSecure(modelKey, { signal } = {}) {
  const mk = String(modelKey || "").trim();
  const base = MODEL_META[mk]?.base || mk;

  // ✅ /my-devices should already be "current user's registered devices"
  // ✅ no cache-buster spam needed here
  const data = await apiGet(`/${base}/my-devices`, { signal, noCache: false });
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
 * - Otherwise call /{base}/my-devices and find the device row
 */
async function loadLiveRowForDevice(
  modelKey,
  deviceId,
  { telemetryMap, signal } = {}
) {
  const mk = String(modelKey || "").trim();
  const id = String(deviceId || "").trim();
  if (!mk || !id) return null;

  // 1) Common poller (best)
  const fromCommon = getRowFromTelemetryMap(telemetryMap, mk, id);
  if (fromCommon) return fromCommon;

  // 2) Fallback: /my-devices only (secure)
  const base = MODEL_META[mk]?.base || mk;
  const data = await apiGet(`/${base}/my-devices`, { signal, noCache: false });
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

  // ✅ common poller map is allowed ONLY for live value (not device list)
  telemetryMap = null,

  // ✅ NEW: if parent already loaded /my-devices, pass it here to avoid any extra fetch
  devices: devicesProp = null,
}) {
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceErr, setDeviceErr] = useState("");

  // ✅ NEW: search devices
  const [deviceSearch, setDeviceSearch] = useState("");

  const [currentValue, setCurrentValue] = useState(null);
  const [valueErr, setValueErr] = useState("");

  // ✅ tiny in-panel cache to prevent refetch storms (if parent doesn't pass devices)
  const devicesCacheRef = useRef({}); // { zhc1921: { at, list } }
  const DEVICES_TTL_MS = 15000;

  const filteredDevices = useMemo(() => {
    const q = String(deviceSearch || "").trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      String(d?.deviceId || "").toLowerCase().includes(q)
    );
  }, [devices, deviceSearch]);

  // Load devices when model changes (SECURE + SEARCHABLE)
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    async function run() {
      setDeviceErr("");

      // ✅ If parent passed devices, use them (assumed already filtered to "my devices")
      if (Array.isArray(devicesProp)) {
        setLoadingDevices(false);
        const list = (devicesProp || [])
          .map((r) => {
            // accept either {deviceId,...} or raw rows
            const id = r?.deviceId ?? readDeviceId(r);
            if (!id) return null;
            return {
              deviceId: String(id),
              status: String(r?.status ?? r?.online ?? "").toLowerCase(),
              lastSeen:
                r?.lastSeen ?? r?.last_seen ?? r?.updatedAt ?? r?.updated_at,
            };
          })
          .filter(Boolean)
          .sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));

        setDevices(list);

        // auto-pick first device if empty
        if (!bindDeviceId && list.length > 0) {
          setBindDeviceId(list[0].deviceId);
        }
        return;
      }

      // ✅ Otherwise, fetch securely from /my-devices with TTL cache
      const mk = String(bindModel || "").trim();
      const now = Date.now();
      const cached = devicesCacheRef.current[mk];

      if (cached && now - cached.at < DEVICES_TTL_MS) {
        const list = cached.list || [];
        setDevices(list);

        if (!bindDeviceId && list.length > 0) {
          setBindDeviceId(list[0].deviceId);
        }
        return;
      }

      setLoadingDevices(true);

      try {
        const list = await loadDevicesForModelSecure(mk, {
          signal: ctrl.signal,
        });
        if (cancelled) return;

        devicesCacheRef.current[mk] = { at: now, list };
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
  }, [bindModel, devicesProp]);

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

  // ✅ Poll current value using the selected sampleMs
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
    const id = window.setInterval(tick, Math.max(750, Number(sampleMs) || 3000));

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
            setDeviceSearch("");
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

      {/* ✅ Search device */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#374151" }}>
          Search Device
        </span>
        <input
          value={deviceSearch}
          onChange={(e) => setDeviceSearch(e.target.value)}
          placeholder="Type to search device ID…"
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: "10px 10px",
            fontSize: 14,
            outline: "none",
          }}
        />
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
            {loadingDevices
              ? "Loading devices..."
              : filteredDevices.length === 0 && devices.length > 0
              ? "No matches (clear search)"
              : "Select a device…"}
          </option>

          {filteredDevices.map((d) => (
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