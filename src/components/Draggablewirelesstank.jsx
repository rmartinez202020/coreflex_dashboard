// src/components/Draggablewirelesstank.jsx
import React, { useMemo } from "react";
import Sidebarleftwirelesstank from "./Sidebarleftwirelesstank";

function readField(row, field) {
  if (!row || !field) return null;

  const rawField = String(field || "").trim();
  const f = rawField.toLowerCase();

  const candidates = [
    rawField,
    f,
    rawField.toUpperCase(),
    f.replace(/-/g, "_"),
    f.replace(/_/g, "-"),
  ];

  for (const k of candidates) {
    const v = row?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }

  return null;
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  const id = String(deviceId || "").trim();
  if (!telemetryMap || !id) return null;

  const m = String(model || "").trim();

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];
  if (telemetryMap?.[id]) return telemetryMap[id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

function mmToIn(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n / 25.4;
}

function cToF(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return (n * 9) / 5 + 32;
}

function formatNumber(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(digits);
}

function formatDateTime(value) {
  if (!value) return "--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleString();
}

function computeMathOutput(liveValue, formula, realTankHeight) {
  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = Number(liveValue);
  const REAL_TANK_HEIGHT = Number(realTankHeight);
  const TANK_HEIGHT = REAL_TANK_HEIGHT;

  if (!Number.isFinite(VALUE)) return liveValue;

  const upper = f.toUpperCase();
  if (upper.startsWith("CONCAT(") && f.endsWith(")")) {
    const inner = f.slice(7, -1);
    const parts = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (ch === '"' && inner[i - 1] !== "\\") inQ = !inQ;

      if (ch === "," && !inQ) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }

    if (cur.trim()) parts.push(cur.trim());

    return parts
      .map((p) => {
        if (!p) return "";
        if (p === "VALUE" || p === "value") return VALUE ?? "";
        if (p === "REAL_TANK_HEIGHT") return REAL_TANK_HEIGHT ?? "";
        if (p === "TANK_HEIGHT") return TANK_HEIGHT ?? "";
        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);

        try {
          const expr = p
            .replace(/\bVALUE\b/gi, "VALUE")
            .replace(/\bREAL_TANK_HEIGHT\b/g, "REAL_TANK_HEIGHT")
            .replace(/\bTANK_HEIGHT\b/g, "TANK_HEIGHT");

          // eslint-disable-next-line no-new-func
          const fn = new Function(
            "VALUE",
            "REAL_TANK_HEIGHT",
            "TANK_HEIGHT",
            `return (${expr});`
          );

          const r = fn(VALUE, REAL_TANK_HEIGHT, TANK_HEIGHT);
          return r ?? "";
        } catch {
          return "";
        }
      })
      .join("");
  }

  try {
    const expr = f
      .replace(/\bVALUE\b/gi, "VALUE")
      .replace(/\bREAL_TANK_HEIGHT\b/g, "REAL_TANK_HEIGHT")
      .replace(/\bTANK_HEIGHT\b/g, "TANK_HEIGHT");

    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "VALUE",
      "REAL_TANK_HEIGHT",
      "TANK_HEIGHT",
      `return (${expr});`
    );

    return fn(VALUE, REAL_TANK_HEIGHT, TANK_HEIGHT);
  } catch {
    return liveValue;
  }
}

function clampLiquidLevel(value, tankHeight) {
  const v = Number(value);
  const h = Number(tankHeight);

  if (!Number.isFinite(v)) return null;

  // ✅ Empty / negative liquid level cannot show below 0.
  if (v <= 0) return 0;

  // ✅ Full tank rule:
  // if liquid level is equal to or higher than tank height,
  // show tank height as the liquid level.
  if (Number.isFinite(h) && h > 0 && v >= h) return h;

  return v;
}

export default function Draggablewirelesstank({
  tank,
  isPlay = false,
  telemetryMap = null,
}) {
  const props = tank?.properties || {};
  const scale = tank?.scale || 1;

  const unit = String(props.unit || "in").trim();

  const strokeColor = String(
    props.strokeColor || props.lineColor || "#111827"
  ).trim();

  const bindModel = String(props.bindModel || "cfr100").trim();
  const bindDeviceId = String(
    props.bindDeviceId || props.bindImei || props.unitId || ""
  ).trim();

  const bindHeightField = String(props.bindHeightField || "height_mm").trim();
  const bindTemperatureField = String(
    props.bindTemperatureField || "temperature_c"
  ).trim();
  const bindBatteryField = String(props.bindBatteryField || "battery_v").trim();
  const bindDateField = String(props.bindDateField || "received_at").trim();

  const formula = String(
    props.heightFormula ??
      props.formula ??
      props.mathFormula ??
      props.math ??
      props.mathExpr ??
      ""
  ).trim();

  const realTankHeight = String(props.realTankHeight || "").trim();

  const hasBinding = !!bindDeviceId;

  const telemetryRow = useMemo(() => {
    if (!isPlay) return null;
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [isPlay, hasBinding, telemetryMap, bindModel, bindDeviceId]);

  const backendStatus = String(telemetryRow?.status || "")
    .trim()
    .toLowerCase();

  const deviceIsOffline = isPlay && hasBinding && backendStatus === "offline";

  const deviceIsOnline = backendStatus ? backendStatus === "online" : true;

  const liveRawHeightIn = useMemo(() => {
    if (!isPlay || !hasBinding || !deviceIsOnline) {
      const saved = Number(props.rawHeightValue);
      return Number.isFinite(saved) ? saved : null;
    }

    const rawHeight = telemetryRow
      ? readField(telemetryRow, bindHeightField)
      : null;

    const rawNumber =
      rawHeight === null || rawHeight === undefined || rawHeight === ""
        ? null
        : Number(rawHeight);

    if (!Number.isFinite(rawNumber)) {
      const saved = Number(props.rawHeightValue);
      return Number.isFinite(saved) ? saved : null;
    }

    if (String(bindHeightField).toLowerCase().includes("mm")) {
      return mmToIn(rawNumber);
    }

    return rawNumber;
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    telemetryRow,
    bindHeightField,
    props.rawHeightValue,
  ]);

  const calculatedLiquidLevel = useMemo(() => {
    const fallbackSaved = Number(props.heightValue || props.heightOutputValue);

    if (!isPlay) {
      return Number.isFinite(fallbackSaved) ? fallbackSaved : null;
    }

    if (!hasBinding || !deviceIsOnline) {
      return Number.isFinite(fallbackSaved) ? fallbackSaved : null;
    }

    return computeMathOutput(liveRawHeightIn, formula, realTankHeight);
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    liveRawHeightIn,
    formula,
    realTankHeight,
    props.heightValue,
    props.heightOutputValue,
  ]);

  const liquidLevelValue = useMemo(() => {
    return clampLiquidLevel(calculatedLiquidLevel, realTankHeight);
  }, [calculatedLiquidLevel, realTankHeight]);

  const liquidLevelText = useMemo(() => {
    const n = Number(liquidLevelValue);
    if (!Number.isFinite(n)) return "--";

    return n.toFixed(2);
  }, [liquidLevelValue]);

  const liquidLevelDisplay = useMemo(() => {
    if (liquidLevelText === "--") return "--";
    return unit ? `${liquidLevelText} ${unit}` : liquidLevelText;
  }, [liquidLevelText, unit]);

  const temperatureText = useMemo(() => {
    const saved = props.temperatureValue || "--";

    if (!isPlay || !hasBinding || !deviceIsOnline || !telemetryRow) {
      return saved;
    }

    const raw = readField(telemetryRow, bindTemperatureField);
    const n = Number(raw);

    if (!Number.isFinite(n)) return saved;

    const f = String(bindTemperatureField).toLowerCase().includes("_c")
      ? cToF(n)
      : n;

    return Number.isFinite(f) ? `${formatNumber(f, 1)} °F` : saved;
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    telemetryRow,
    bindTemperatureField,
    props.temperatureValue,
  ]);

  const batteryText = useMemo(() => {
    const saved = props.batteryValue || "--";

    if (!isPlay || !hasBinding || !deviceIsOnline || !telemetryRow) {
      return saved;
    }

    const raw = readField(telemetryRow, bindBatteryField);
    const n = Number(raw);

    if (!Number.isFinite(n)) return saved;

    return `${formatNumber(n, 2)} V`;
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    telemetryRow,
    bindBatteryField,
    props.batteryValue,
  ]);

  const dateText = useMemo(() => {
    const saved = props.dateValue || "--";

    if (!isPlay || !hasBinding || !deviceIsOnline || !telemetryRow) {
      return saved;
    }

    const raw = readField(telemetryRow, bindDateField);

    return raw ? formatDateTime(raw) : saved;
  }, [
    isPlay,
    hasBinding,
    deviceIsOnline,
    telemetryRow,
    bindDateField,
    props.dateValue,
  ]);

  return (
    <div style={{ textAlign: "center", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", position: "relative" }}>
        <Sidebarleftwirelesstank
          size={180 * scale}
          strokeColor={strokeColor}
          liquidTankLevelValue={liquidLevelDisplay}
          heightValue={liquidLevelDisplay}
          liquidLevelNumeric={liquidLevelValue}
          tankHeightNumeric={realTankHeight}
          temperatureValue={temperatureText}
          batteryValue={batteryText}
          dateValue={dateText}
        />

        {deviceIsOffline && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${78 * scale}px`,
              transform: "translate(-50%, -50%)",
              width: `${70 * scale}px`,
              color: "#dc2626",
              fontWeight: 600,
              fontSize: `${11 * scale}px`,
              lineHeight: 1.05,
              letterSpacing: "0px",
              textAlign: "center",
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "break-word",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            Offline
          </div>
        )}
      </div>
    </div>
  );
}