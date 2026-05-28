// src/components/Draggablewirelesstank.jsx
import React, { useMemo } from "react";
import Sidebarleftwirelesstank from "./Sidebarleftwirelesstank";

function normalizeImei(value) {
  return String(value || "")
    .trim()
    .replace(/\D/g, "");
}

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
  const id = normalizeImei(deviceId);
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

  if (v <= 0) return 0;

  if (Number.isFinite(h) && h > 0 && v >= h) return h;

  return v;
}

function liquidLevelToPercent(liquidLevel, tankHeight) {
  const v = Number(liquidLevel);
  const h = Number(tankHeight);

  if (!Number.isFinite(v) || !Number.isFinite(h) || h <= 0) {
    return null;
  }

  const pct = (v / h) * 100;
  return Math.max(0, Math.min(100, pct));
}

function getPreviousLiquidPercentDisplay(row, fieldName, formula, realTankHeight) {
  const raw = readField(row, fieldName);

  if (raw === null || raw === undefined || raw === "") {
    return "--";
  }

  const rawHeightIn = mmToIn(raw);

  if (!Number.isFinite(rawHeightIn)) {
    return "--";
  }

  const calculated = computeMathOutput(rawHeightIn, formula, realTankHeight);
  const clamped = clampLiquidLevel(calculated, realTankHeight);
  const percent = liquidLevelToPercent(clamped, realTankHeight);

  if (!Number.isFinite(percent)) {
    return "--";
  }

  return `${Math.round(percent)}%`;
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

  const bindDeviceId = normalizeImei(
    props.bindDeviceId || props.bindImei || props.unitId || ""
  );

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

  const liveRawHeightIn = useMemo(() => {
    if (!isPlay || !hasBinding) {
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
    telemetryRow,
    bindHeightField,
    props.rawHeightValue,
  ]);

  const calculatedLiquidLevel = useMemo(() => {
    const fallbackSaved = Number(props.heightValue || props.heightOutputValue);

    if (!isPlay) {
      return Number.isFinite(fallbackSaved) ? fallbackSaved : null;
    }

    if (!hasBinding) {
      return Number.isFinite(fallbackSaved) ? fallbackSaved : null;
    }

    return computeMathOutput(liveRawHeightIn, formula, realTankHeight);
  }, [
    isPlay,
    hasBinding,
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

    if (!isPlay || !hasBinding || !telemetryRow) {
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
    telemetryRow,
    bindTemperatureField,
    props.temperatureValue,
  ]);

  const batteryText = useMemo(() => {
    const saved = props.batteryValue || "--";

    if (!isPlay || !hasBinding || !telemetryRow) {
      return saved;
    }

    const raw = readField(telemetryRow, bindBatteryField);
    const n = Number(raw);

    if (!Number.isFinite(n)) return saved;

    return `${formatNumber(n, 2)} V`;
  }, [
    isPlay,
    hasBinding,
    telemetryRow,
    bindBatteryField,
    props.batteryValue,
  ]);

  const dateText = useMemo(() => {
    const saved = props.dateValue || "--";

    if (!isPlay || !hasBinding || !telemetryRow) {
      return saved;
    }

    const raw = readField(telemetryRow, bindDateField);

    return raw ? formatDateTime(raw) : saved;
  }, [
    isPlay,
    hasBinding,
    telemetryRow,
    bindDateField,
    props.dateValue,
  ]);

  const previous1Height = useMemo(() => {
    if (!telemetryRow) return "--";
    return getPreviousLiquidPercentDisplay(
      telemetryRow,
      "height_2_mm",
      formula,
      realTankHeight
    );
  }, [telemetryRow, formula, realTankHeight]);

  const previous2Height = useMemo(() => {
    if (!telemetryRow) return "--";
    return getPreviousLiquidPercentDisplay(
      telemetryRow,
      "height_3_mm",
      formula,
      realTankHeight
    );
  }, [telemetryRow, formula, realTankHeight]);

  const previous3Height = useMemo(() => {
    if (!telemetryRow) return "--";
    return getPreviousLiquidPercentDisplay(
      telemetryRow,
      "height_4_mm",
      formula,
      realTankHeight
    );
  }, [telemetryRow, formula, realTankHeight]);

  const previous1Date = useMemo(() => {
    if (!telemetryRow) return "--";
    return formatDateTime(readField(telemetryRow, "received_at_2"));
  }, [telemetryRow]);

  const previous2Date = useMemo(() => {
    if (!telemetryRow) return "--";
    return formatDateTime(readField(telemetryRow, "received_at_3"));
  }, [telemetryRow]);

  const previous3Date = useMemo(() => {
    if (!telemetryRow) return "--";
    return formatDateTime(readField(telemetryRow, "received_at_4"));
  }, [telemetryRow]);

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
          previous1Height={previous1Height}
          previous2Height={previous2Height}
          previous3Height={previous3Height}
          previous1Date={previous1Date}
          previous2Date={previous2Date}
          previous3Date={previous3Date}
        />
      </div>
    </div>
  );
}