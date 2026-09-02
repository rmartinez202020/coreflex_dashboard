// src/components/gauge/settings/GaugeBindingTelemetrySection.jsx

import React, { useEffect, useMemo } from "react";
import {
  useGaugeSettingDevices,
  useGaugeSettingLiveValue,
} from "../GaugeDisplaySettingsModalTelemetry";

/* ===========================================
   MODEL + FIELD OPTIONS
=========================================== */

const MODEL_OPTIONS = [
  { value: "zhc1921", label: "CF-2000" },
  { value: "zhc1661", label: "CF-1600" },
  { value: "tp4000", label: "TP-4000" },
];

const FIELD_OPTIONS_BY_MODEL = {
  zhc1921: [
    { value: "ai1", label: "AI1" },
    { value: "ai2", label: "AI2" },
    { value: "ai3", label: "AI3" },
    { value: "ai4", label: "AI4" },
  ],

  zhc1661: [
    { value: "ai1", label: "AI1" },
    { value: "ai2", label: "AI2" },
    { value: "ai3", label: "AI3" },
    { value: "ai4", label: "AI4" },
  ],

  tp4000: [
    { value: "te101", label: "TE-101" },
    { value: "te102", label: "TE-102" },
    { value: "te103", label: "TE-103" },
    { value: "te104", label: "TE-104" },
    { value: "te105", label: "TE-105" },
    { value: "te106", label: "TE-106" },
    { value: "te107", label: "TE-107" },
    { value: "te108", label: "TE-108" },
  ],
};

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
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
  onSelectedDeviceChange,
}) {
  const fieldOptions =
    FIELD_OPTIONS_BY_MODEL[bindModel] || FIELD_OPTIONS_BY_MODEL.zhc1921;

  const { devices, selectedDevice } = useGaugeSettingDevices({
    open,
    bindModel,
    bindDeviceId,
    setBindDeviceId,
  });

  const { liveValue, pollError } = useGaugeSettingLiveValue({
    open,
    bindModel,
    bindDeviceId,
    bindField,
  });

  // Keep the selected field valid when model changes.
  useEffect(() => {
    const stillValid = fieldOptions.some((item) => item.value === bindField);

    if (!stillValid) {
      setBindField?.(fieldOptions[0]?.value || "");
    }
  }, [bindModel, bindField, fieldOptions, setBindField]);

  // ✅ Push live telemetry back to parent modal
  useEffect(() => {
    onLiveValueChange?.(liveValue);
  }, [liveValue, onLiveValueChange]);

  useEffect(() => {
    onPollErrorChange?.(pollError || "");
  }, [pollError, onPollErrorChange]);

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

  const fieldLabel =
    bindModel === "tp4000"
      ? "Type J Thermocouple - Celsius"
      : "AI Field";

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
        Telemetry Binding
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
            onChange={(e) => {
              const nextModel = e.target.value;
              const nextFields =
                FIELD_OPTIONS_BY_MODEL[nextModel] ||
                FIELD_OPTIONS_BY_MODEL.zhc1921;

              setBindModel(nextModel);
              setBindDeviceId?.("");
              setBindField?.(nextFields[0]?.value || "");
            }}
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
            {fieldLabel}
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
            {fieldOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TelemetryInfoCard
        selectedDevice={selectedDevice}
        liveValue={liveValue}
        pollError={pollError}
      />
    </section>
  );
}
