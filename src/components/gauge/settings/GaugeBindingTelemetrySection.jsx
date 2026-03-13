// src/components/gauge/settings/GaugeBindingTelemetrySection.jsx

import React, { useEffect, useMemo } from "react";
import {
  useGaugeSettingDevices,
  useGaugeSettingLiveValue,
} from "../GaugeDisplaySettingsModalTelemetry";

/* ===========================================
   MODEL + FIELD OPTIONS
=========================================== */

const FIELD_OPTIONS = ["ai1", "ai2", "ai3", "ai4"];

const MODEL_OPTIONS = [
  { value: "zhc1921", label: "CF-2000" },
  { value: "zhc1661", label: "CF-1600" },
];

/* ===========================================
   DEVICE ROW
=========================================== */

function DeviceRow({ device }) {
  const online = String(device?.status || "").toLowerCase() === "online";

  return (
    <>
      {String(device.deviceId)}
      {online && " • online"}
    </>
  );
}

/* ===========================================
   TELEMETRY CARD
=========================================== */

function TelemetryInfoCard({
  selectedDevice,
  pollMs,
  liveValue,
  pollError,
}) {
  const hasLive = Number.isFinite(Number(liveValue));

  const selectedDeviceText = selectedDevice?.deviceId
    ? String(selectedDevice.deviceId)
    : "--";

  return (
    <>
      <div
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
            }}
          >
            Selected device
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {selectedDeviceText}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
            }}
          >
            Polling
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {pollMs} ms
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
            }}
          >
            Raw live value
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: hasLive ? "#111827" : "#6b7280",
              marginTop: 4,
            }}
          >
            {hasLive ? String(liveValue) : "--"}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
            }}
          >
            Telemetry status
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: pollError ? "#b91c1c" : "#166534",
              marginTop: 4,
            }}
          >
            {pollError ? "Read error" : "Live"}
          </div>
        </div>
      </div>

      {pollError && (
        <div
          style={{
            marginTop: 10,
            borderRadius: 10,
            padding: "10px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {pollError}
        </div>
      )}
    </>
  );
}

/* ===========================================
   MAIN SECTION COMPONENT
=========================================== */

export default function GaugeBindingTelemetrySection({
  open,
  bindModel,
  setBindModel,
  bindDeviceId,
  setBindDeviceId,
  bindField,
  setBindField,
  onLiveValueChange,
  onPollErrorChange,
  onPollMsChange,
  onSelectedDeviceChange,
}) {
  const { devices, selectedDevice } = useGaugeSettingDevices({
    open,
    bindModel,
    bindDeviceId,
    setBindDeviceId,
  });

  const { liveValue, pollError, pollMs } = useGaugeSettingLiveValue({
    open,
    bindModel,
    bindDeviceId,
    bindField,
  });

  // ✅ Push live telemetry back to parent modal
  useEffect(() => {
    onLiveValueChange?.(liveValue);
  }, [liveValue, onLiveValueChange]);

  useEffect(() => {
    onPollErrorChange?.(pollError || "");
  }, [pollError, onPollErrorChange]);

  useEffect(() => {
    onPollMsChange?.(pollMs);
  }, [pollMs, onPollMsChange]);

  useEffect(() => {
    onSelectedDeviceChange?.(selectedDevice || null);
  }, [selectedDevice, onSelectedDeviceChange]);

  const deviceOptions = useMemo(() => {
    return (Array.isArray(devices) ? devices : []).map((d, idx) => {
      const id = d?.deviceId || "";
      return {
        id,
        label: <DeviceRow device={d} key={idx} />,
      };
    });
  }, [devices]);

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fcfcfd",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          marginBottom: 12,
          color: "#111827",
        }}
      >
        AI Binding
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* MODEL */}
        <label style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Model
          </span>

          <select
            value={bindModel}
            onChange={(e) => setBindModel(e.target.value)}
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
              background: "#fff",
            }}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {/* DEVICE */}
        <label style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Device
          </span>

          <select
            value={bindDeviceId}
            onChange={(e) => setBindDeviceId(e.target.value)}
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
              background: "#fff",
            }}
          >
            <option value="">Select device</option>

            {deviceOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id}
              </option>
            ))}
          </select>
        </label>

        {/* FIELD */}
        <label style={{ display: "grid", gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#374151",
            }}
          >
            AI Field
          </span>

          <select
            value={bindField}
            onChange={(e) => setBindField(e.target.value)}
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
              background: "#fff",
            }}
          >
            {FIELD_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TelemetryInfoCard
        selectedDevice={selectedDevice}
        pollMs={pollMs}
        liveValue={liveValue}
        pollError={pollError}
      />
    </section>
  );
}