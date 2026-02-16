// src/components/DisplaySettingModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

/* ===========================================
   MODELS
=========================================== */

const MODEL_META = {
  zhc1921: { label: "CF-2000", base: "zhc1921" },
  zhc1661: { label: "CF-1600", base: "zhc1661" },
};

/* ===========================================
   AUTH HELPERS (same as GraphicDisplay)
=========================================== */

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withNoCache(path) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}_ts=${Date.now()}`;
}

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

/* ===========================================
   DEVICE LOADER (same logic as GraphicDisplay)
=========================================== */

async function loadDevicesForModel(modelKey, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const candidates =
    base === "zhc1921"
      ? ["/zhc1921/my-devices", "/zhc1921/devices", "/zhc1921/list", "/zhc1921"]
      : ["/zhc1661/my-devices", "/zhc1661/devices", "/zhc1661/list", "/zhc1661"];

  for (const p of candidates) {
    try {
      const data = await apiGet(p, { signal });

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.devices)
        ? data.devices
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      return arr.map((r) => ({
        deviceId:
          r.deviceId ??
          r.device_id ??
          r.id ??
          r.imei ??
          r.IMEI ??
          r.DEVICE_ID ??
          "",
        status: String(r.status ?? r.online ?? "").toLowerCase(),
      }));
    } catch {
      continue;
    }
  }

  return [];
}

async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = MODEL_META[modelKey]?.base || modelKey;

  const direct =
    base === "zhc1921"
      ? [
          `/zhc1921/device/${deviceId}`,
          `/zhc1921/devices/${deviceId}`,
          `/zhc1921/${deviceId}`,
        ]
      : [
          `/zhc1661/device/${deviceId}`,
          `/zhc1661/devices/${deviceId}`,
          `/zhc1661/${deviceId}`,
        ];

  for (const p of direct) {
    try {
      const r = await apiGet(p, { signal });
      return r?.row ?? r?.device ?? r;
    } catch {
      continue;
    }
  }

  return null;
}

function readAiField(row, bindField) {
  if (!row || !bindField) return null;
  const f = String(bindField).toLowerCase();

  const candidates = [
    f,
    f.toUpperCase(),
    f.replace("ai", "analog"),
    f.replace("ai", "ANALOG"),
  ];

  for (const k of candidates) {
    if (row[k] !== undefined) return row[k];
  }

  return null;
}

/* ===========================================
   COMPONENT
=========================================== */

export default function DisplaySettingModal({ tank, onClose, onSave }) {
  const props = tank?.properties || {};

  const [bindModel, setBindModel] = useState(props.bindModel || "zhc1921");
  const [bindDeviceId, setBindDeviceId] = useState(props.bindDeviceId || "");
  const [bindField, setBindField] = useState(props.bindField || "ai1");

  const [devices, setDevices] = useState([]);
  const [liveValue, setLiveValue] = useState(null);
  const [liveErr, setLiveErr] = useState("");

  /* ===========================================
     LOAD DEVICES
  =========================================== */

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    const load = async () => {
      const list = await loadDevicesForModel(bindModel, {
        signal: ctrl.signal,
      });
      if (cancelled) return;
      setDevices(list);
    };

    load();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [bindModel]);

  /* ===========================================
     LIVE POLL (same style as GraphicDisplay)
  =========================================== */

  useEffect(() => {
    if (!bindModel || !bindDeviceId || !bindField) {
      setLiveValue(null);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        setLiveErr("");

        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        const raw = readAiField(row, bindField);
        const num =
          raw === null || raw === undefined
            ? null
            : typeof raw === "number"
            ? raw
            : Number(raw);

        if (cancelled) return;
        setLiveValue(Number.isFinite(num) ? num : null);
      } catch {
        if (cancelled) return;
        setLiveErr("Could not read live value.");
      }
    };

    tick();
    const id = window.setInterval(tick, 3000);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [bindModel, bindDeviceId, bindField]);

  const selectedDevice = devices.find(
    (d) => String(d.deviceId) === String(bindDeviceId)
  );

  /* ===========================================
     UI
  =========================================== */

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 820,
          background: "#f8fafc",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          padding: 20,
        }}
      >
        <h2 style={{ fontWeight: 900, marginBottom: 16 }}>
          Tag that drives the Output (AI)
        </h2>

        {/* MODEL */}
        <div style={{ marginBottom: 12 }}>
          <label>Model</label>
          <select
            value={bindModel}
            onChange={(e) => setBindModel(e.target.value)}
          >
            {Object.entries(MODEL_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* DEVICE */}
        <div style={{ marginBottom: 12 }}>
          <label>Device</label>
          <select
            value={bindDeviceId}
            onChange={(e) => setBindDeviceId(e.target.value)}
          >
            <option value="">Select device...</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.deviceId}
              </option>
            ))}
          </select>
        </div>

        {/* AI */}
        <div style={{ marginBottom: 12 }}>
          <label>Analog Input (AI)</label>
          <select
            value={bindField}
            onChange={(e) => setBindField(e.target.value)}
          >
            <option value="ai1">AI-1</option>
            <option value="ai2">AI-2</option>
            <option value="ai3">AI-3</option>
            <option value="ai4">AI-4</option>
          </select>
        </div>

        {/* PREVIEW */}
        {selectedDevice && (
          <div
            style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Binding Preview
            </div>

            <div>
              Selected: {selectedDevice.deviceId} ·{" "}
              {selectedDevice.status === "online" ? (
                <span style={{ color: "green" }}>ONLINE</span>
              ) : (
                <span style={{ color: "gray" }}>OFFLINE</span>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Current Value:</strong>{" "}
              <span
                style={{
                  background: "#c7f9cc",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontWeight: 900,
                }}
              >
                {Number.isFinite(liveValue)
                  ? liveValue.toFixed(2)
                  : "--"}
              </span>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button onClick={onClose} style={{ marginRight: 10 }}>
            Cancel
          </button>

          <button
            onClick={() =>
              onSave({
                ...tank,
                bindModel,
                bindDeviceId,
                bindField,
              })
            }
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
