// src/components/gauge/settings/GaugeRangeMathSection.jsx

import React, { useMemo } from "react";
import { computeGaugeValue, evaluateMathFormula } from "../utils";

export default function GaugeRangeMathSection({
  minValue,
  setMinValue,
  maxValue,
  setMaxValue,
  formula,
  setFormula,
  lowWarn,
  highWarn,
  telemetryLiveValue,
  telemetryPollError,
  telemetryPollMs,
  telemetrySelectedDevice,
}) {
  const formulaPreview = useMemo(() => {
    return evaluateMathFormula(formula, 50);
  }, [formula]);

  const liveComputed = useMemo(() => {
    return computeGaugeValue(telemetryLiveValue, {
      minValue,
      maxValue,
      formula,
      lowWarn: String(lowWarn).trim() === "" ? null : Number(lowWarn),
      highWarn: String(highWarn).trim() === "" ? null : Number(highWarn),
    });
  }, [
    telemetryLiveValue,
    minValue,
    maxValue,
    formula,
    lowWarn,
    highWarn,
  ]);

  const hasLive = Number.isFinite(Number(telemetryLiveValue));

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
        Range and Math
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.7fr 0.7fr 1.6fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Min Value
          </span>
          <input
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Max Value
          </span>
          <input
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Math Formula
          </span>
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="Example: (VALUE / 4095) * 100"
            style={{
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "0 12px",
            }}
          />
        </label>
      </div>

      <div
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          background: formula
            ? formulaPreview.ok
              ? "#ecfdf5"
              : "#fef2f2"
            : "#f8fafc",
          border: `1px solid ${
            formula
              ? formulaPreview.ok
                ? "#bbf7d0"
                : "#fecaca"
              : "#e5e7eb"
          }`,
          fontSize: 12,
          color: formula
            ? formulaPreview.ok
              ? "#166534"
              : "#991b1b"
            : "#475569",
          marginBottom: 10,
        }}
      >
        {!formula && (
          <span>
            Formula preview: using raw sample <strong>VALUE = 50</strong>,
            output will stay <strong>50</strong>.
          </span>
        )}

        {formula && formulaPreview.ok && (
          <span>
            Formula preview: with <strong>VALUE = 50</strong> result ={" "}
            <strong>{String(formulaPreview.value)}</strong>
          </span>
        )}

        {formula && !formulaPreview.ok && (
          <span>
            Formula error:{" "}
            <strong>{formulaPreview.error || "Invalid formula"}</strong>
          </span>
        )}
      </div>

      <div
        style={{
          borderRadius: 12,
          padding: "12px 14px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
            Live raw
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {hasLive ? String(liveComputed.rawValue) : "--"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
            Live computed
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {hasLive ? String(liveComputed.displayValue) : "--"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
            Gauge draw value
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {hasLive ? String(liveComputed.clampedValue) : "--"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
            Active range
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#111827",
              marginTop: 4,
            }}
          >
            {String(liveComputed.min)} → {String(liveComputed.max)}
          </div>
        </div>
      </div>

      {(telemetryPollError || telemetrySelectedDevice) && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color: telemetryPollError ? "#991b1b" : "#6b7280",
            fontWeight: 700,
          }}
        >
          {telemetryPollError
            ? `Telemetry: ${telemetryPollError}`
            : `Telemetry source: ${
                telemetrySelectedDevice?.deviceId || "--"
              } @ ${telemetryPollMs} ms`}
        </div>
      )}
    </section>
  );
}