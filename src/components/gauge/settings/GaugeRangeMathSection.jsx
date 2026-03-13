// src/components/gauge/settings/GaugeRangeMathSection.jsx

import React, { useMemo } from "react";
import { computeGaugeValue, evaluateMathFormula } from "../utils";

// ✅ Normalize common user aliases to VALUE
function normalizeFormulaInput(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  return raw
    .replace(/\bvalue\b/gi, "VALUE")
    .replace(/\bai\b/gi, "VALUE");
}

function formatOutput(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";

  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(6)));
}

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
  const normalizedFormula = useMemo(
    () => normalizeFormulaInput(formula),
    [formula]
  );

  // ✅ Raw live value exactly as received from telemetry
  const rawLiveDisplay = useMemo(() => {
    if (
      telemetryLiveValue === null ||
      telemetryLiveValue === undefined ||
      telemetryLiveValue === ""
    ) {
      return "--";
    }
    return String(telemetryLiveValue);
  }, [telemetryLiveValue]);

  // ✅ Numeric raw value for math operations
  const liveRawNumber = useMemo(() => {
    const n = Number(telemetryLiveValue);
    return Number.isFinite(n) ? n : null;
  }, [telemetryLiveValue]);

  const hasLive = liveRawNumber !== null;

  // ✅ This is the actual OUTPUT from raw live value after formula
  const liveOutput = useMemo(() => {
    if (!hasLive) {
      return {
        ok: false,
        value: null,
        error: "",
      };
    }

    if (!normalizedFormula) {
      return {
        ok: true,
        value: liveRawNumber,
        error: "",
      };
    }

    const result = evaluateMathFormula(normalizedFormula, liveRawNumber);

    return {
      ok: !!result?.ok,
      value: result?.ok ? Number(result.value) : null,
      error: result?.error || "Invalid formula",
    };
  }, [hasLive, normalizedFormula, liveRawNumber]);

  // ✅ Keep gauge clamped/draw value logic using shared helper
  const liveComputed = useMemo(() => {
    return computeGaugeValue(liveRawNumber, {
      minValue,
      maxValue,
      formula: normalizedFormula,
      lowWarn: String(lowWarn).trim() === "" ? null : Number(lowWarn),
      highWarn: String(highWarn).trim() === "" ? null : Number(highWarn),
    });
  }, [
    liveRawNumber,
    minValue,
    maxValue,
    normalizedFormula,
    lowWarn,
    highWarn,
  ]);

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
            placeholder="Example: VALUE / 100"
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
            {rawLiveDisplay}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
            Live computed (Output)
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color:
                hasLive && normalizedFormula && !liveOutput.ok
                  ? "#b91c1c"
                  : "#111827",
              marginTop: 4,
            }}
          >
            {hasLive
              ? liveOutput.ok
                ? formatOutput(liveOutput.value)
                : "ERR"
              : "--"}
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
            {hasLive ? formatOutput(liveComputed.clampedValue) : "--"}
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

      {(telemetryPollError ||
        telemetrySelectedDevice ||
        (hasLive && normalizedFormula && !liveOutput.ok)) && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            color:
              telemetryPollError || (hasLive && normalizedFormula && !liveOutput.ok)
                ? "#991b1b"
                : "#6b7280",
            fontWeight: 700,
          }}
        >
          {telemetryPollError
            ? `Telemetry: ${telemetryPollError}`
            : hasLive && normalizedFormula && !liveOutput.ok
            ? `Formula: ${liveOutput.error || "Invalid formula"}`
            : `Telemetry source: ${
                telemetrySelectedDevice?.deviceId || "--"
              } @ ${telemetryPollMs} ms`}
        </div>
      )}
    </section>
  );
}