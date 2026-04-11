// src/components/display/DisplayOutputTextBoxStyle.jsx
import React from "react";
import { writeControlAO } from "../controls/controlBindings";
import {
  getTelemetryRow,
  getTelemetryStatus,
  getTelemetryValue,
} from "./displayOutputTelemetry";

// ===============================
// ✅ helpers for Display Output input formatting (SETPOINT MODE)
// ===============================
function getFormatSpec(numberFormat) {
  const fmt = String(numberFormat || "00000").trim();
  const [intPartRaw] = fmt.split(".");
  const formatDigits = (String(intPartRaw || "").match(/0/g) || []).length;

  // ✅ IMPORTANT:
  // Allow at least 4 digits so user can type 1000 even if modal format is 000
  const maxDigits = Math.max(5, formatDigits || 0, 1);

  return { maxDigits, fmt };
}

function onlyDigits(str) {
  return String(str || "").replace(/\D/g, "");
}

function padToFormat(rawDigits, numberFormat) {
  const { maxDigits } = getFormatSpec(numberFormat);
  const d = onlyDigits(rawDigits).slice(0, maxDigits);

  // ✅ if nothing typed, show blank (not zeros)
  if (!d) return "";

  return d.padStart(maxDigits, "0");
}

// ===============================
// ✅ shared widget/dashboard resolvers
// ===============================
function resolveWidgetId(widget) {
  return String(
    widget?.id ??
      widget?.widgetId ??
      widget?.widget_id ??
      widget?._id ??
      widget?.uuid ??
      widget?.properties?.widgetId ??
      widget?.properties?.widget_id ??
      ""
  ).trim();
}

function resolveDashboardId({ dashboardId, widget }) {
  return String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.dashboard_id ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();
}

function resolveDashboardName({ dashboardName, widget }) {
  return String(
    dashboardName ??
      widget?.dashboardName ??
      widget?.dashboard_name ??
      widget?.properties?.dashboardName ??
      widget?.properties?.dashboard_name ??
      ""
  ).trim();
}

// ✅ NEW SCALE FEATURE
function parseFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ✅ NEW SCALE FEATURE
function computeScaledValueFromMilliAmps(liveValue, scaleMin, scaleMax) {
  const value = Number(liveValue);
  const min = Number(scaleMin);
  const max = Number(scaleMax);

  if (!Number.isFinite(value)) return null;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min >= max) return null;

  // 4000 mAmp -> min
  // 20000 mAmp -> max
  return min + ((value - 4000) / (20000 - 4000)) * (max - min);
}

function computeMathOutput(liveValue, formula, scaleMin, scaleMax) {
  // ✅ NEW SCALE FEATURE
  const scaled = computeScaledValueFromMilliAmps(liveValue, scaleMin, scaleMax);
  if (scaled !== null) return scaled;

  const f = String(formula || "").trim();
  if (!f) return liveValue;

  const VALUE = liveValue;

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
        if (p.startsWith('"') && p.endsWith('"')) return p.slice(1, -1);

        try {
          const expr = p.replace(/\bVALUE\b/gi, "VALUE");
          // eslint-disable-next-line no-new-func
          const fn = new Function("VALUE", `return (${expr});`);
          const r = fn(VALUE);
          return r ?? "";
        } catch {
          return "";
        }
      })
      .join("");
  }

  try {
    const expr = f.replace(/\bVALUE\b/gi, "VALUE");
    // eslint-disable-next-line no-new-func
    const fn = new Function("VALUE", `return (${expr});`);
    return fn(VALUE);
  } catch {
    return liveValue;
  }
}

function formatByPattern(raw, numberFormat) {
  const fmt = String(numberFormat || "00000");
  const [intPart, decPart] = fmt.split(".");
  const totalInt = (intPart || "0").length;
  const totalDec = decPart ? decPart.length : 0;

  if (typeof raw === "string" && raw.trim() !== "" && isNaN(Number(raw)))
    return raw;

  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num)) return "--";

  let formatted =
    totalDec > 0 ? Number(num).toFixed(totalDec) : String(Math.round(num));

  if (totalDec > 0) {
    let [i, d] = formatted.split(".");
    i = String(i).padStart(totalInt, "0");
    d = String(d || "").padEnd(totalDec, "0");
    formatted = `${i}.${d}`;
  } else {
    formatted = String(formatted).padStart(totalInt, "0");
  }

  return formatted;
}

function getActuationHoldMsFromError(err) {
  const detail = err?.detail;
  if (detail && typeof detail === "object") {
    const ms = Number(detail.actuationHoldMs);
    if (Number.isFinite(ms) && ms > 0) return ms;
  }

  const ms = Number(err?.actuationHoldMs);
  if (Number.isFinite(ms) && ms > 0) return ms;

  return 10000;
}

function isControlActionInProgressError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const detailError = String(err?.detail?.error || "").toLowerCase();

  return (
    msg.includes("control action in progress") ||
    detailError.includes("control action in progress")
  );
}

function SetButton({ isPlay, onSet, disabled, busy, holdActive }) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg = "#22c55e";
  const darkBg = "#16a34a";

  const canPress = isPlay && !disabled && !busy;

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!canPress) return;
        setPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (!canPress) return;
        setPressed(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        if (!canPress) return;
        setPressed(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!canPress) return;
        onSet?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        cursor: canPress ? "pointer" : "default",
        userSelect: "none",
        fontWeight: 900,
        letterSpacing: 1,
        background: canPress ? (pressed ? darkBg : baseBg) : "#cbd5e1",
        color: canPress ? "white" : "#334155",
        boxShadow: canPress
          ? pressed
            ? "inset 0 3px 10px rgba(0,0,0,0.35)"
            : "0 3px 0 rgba(0,0,0,0.35)"
          : "none",
        transform: canPress
          ? pressed
            ? "translateY(1px)"
            : "translateY(0)"
          : "none",
        transition:
          "transform 80ms ease, box-shadow 80ms ease, background 120ms ease",
      }}
      title={
        disabled
          ? "SET disabled"
          : busy
          ? holdActive
            ? "Control Action in Progress"
            : "Writing..."
          : canPress
          ? "Send/commit this setpoint"
          : "SET works in Play mode"
      }
    >
      {busy ? "..." : "SET"}
    </button>
  );
}

export default function DisplayOutputTextBoxStyle({
  tank,
  isPlay,
  onUpdate,
  telemetryMap = null,
  onDoubleClick,
  dashboardId = "",
  dashboardName = "",
}) {
  const w = tank.w ?? tank.width ?? 160;
  const h = tank.h ?? tank.height ?? 60;

  const label = String(tank?.properties?.label ?? tank?.label ?? "").trim();
  const numberFormat = tank?.properties?.numberFormat || "00000";
  const { maxDigits } = getFormatSpec(numberFormat);

  const bindModel = String(
    tank?.properties?.bindModel ?? tank?.bindModel ?? "zhc1921"
  )
    .trim()
    .toLowerCase();
  const bindDeviceId = String(
    tank?.properties?.bindDeviceId ?? tank?.bindDeviceId ?? ""
  ).trim();
  const bindField = String(
    tank?.properties?.bindField ?? tank?.bindField ?? ""
  ).trim();
  const formula = tank?.properties?.formula ?? tank?.formula ?? "";

  // ✅ NEW SCALE FEATURE
  const scaleMin = parseFiniteNumber(
    tank?.properties?.scaleMin ?? tank?.properties?.aoScaleMin
  );
  const scaleMax = parseFiniteNumber(
    tank?.properties?.scaleMax ?? tank?.properties?.aoScaleMax
  );

  const hasBinding = !!bindDeviceId && !!bindField;

  const resolvedDashboardId = React.useMemo(() => {
    return resolveDashboardId({ dashboardId, widget: tank });
  }, [dashboardId, tank]);

  const resolvedDashboardName = React.useMemo(() => {
    return resolveDashboardName({ dashboardName, widget: tank });
  }, [dashboardName, tank]);

  const resolvedWidgetId = React.useMemo(() => {
    return resolveWidgetId(tank);
  }, [tank]);

  const row = React.useMemo(() => {
    if (!hasBinding) return null;
    return getTelemetryRow(telemetryMap, bindModel, bindDeviceId);
  }, [telemetryMap, bindModel, bindDeviceId, hasBinding]);

  const backendStatus = React.useMemo(() => getTelemetryStatus(row), [row]);

  const rawValue = React.useMemo(() => {
    if (!hasBinding) return null;
    return getTelemetryValue(row, bindField);
  }, [row, bindField, hasBinding]);

  const liveValue = React.useMemo(() => {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return null;
    }

    if (typeof rawValue === "number") {
      return Number.isFinite(rawValue) ? rawValue : null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }, [rawValue]);

  const outValue = React.useMemo(() => {
    if (!hasBinding) return null;
    return computeMathOutput(liveValue, formula, scaleMin, scaleMax);
  }, [hasBinding, liveValue, formula, scaleMin, scaleMax]);

  const isOffline =
    hasBinding &&
    (!row ||
      backendStatus === "offline" ||
      backendStatus === "false" ||
      backendStatus === "0" ||
      backendStatus === "down" ||
      backendStatus === "disconnected");

  const rawSetpoint =
    tank.value !== undefined && tank.value !== null ? String(tank.value) : "";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(onlyDigits(rawSetpoint));
  const [isWriting, setIsWriting] = React.useState(false);
  const [writeError, setWriteError] = React.useState("");

  // ✅ same behavior style as push button:
  // local UI stays blocked during backend actuation hold window
  const [holdActive, setHoldActive] = React.useState(false);
  const holdTimerRef = React.useRef(null);

  const startHoldWindow = React.useCallback((ms) => {
    const holdMs = Math.max(250, Number(ms) || 10000);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    setHoldActive(true);

    holdTimerRef.current = setTimeout(() => {
      setHoldActive(false);
      holdTimerRef.current = null;
    }, holdMs);
  }, []);

  React.useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!editing) setDraft(onlyDigits(rawSetpoint));
  }, [rawSetpoint, editing]);

  const displayedSetpoint = isPlay
    ? editing
      ? draft
      : padToFormat(rawSetpoint, numberFormat)
    : padToFormat(rawSetpoint, numberFormat);

  const commitFormattedValue = () => {
    const formatted = padToFormat(draft, numberFormat);
    onUpdate?.({ ...tank, value: formatted });
    return formatted;
  };

  const handleSet = async () => {
    if (!isPlay || isWriting || holdActive) return;

    const formatted = commitFormattedValue();
    const now = new Date().toISOString();

    const nextTank = {
      ...tank,
      value: formatted,
      lastSetValue: formatted,
      lastSetAt: now,
      dashboardId: resolvedDashboardId || tank?.dashboardId || "",
      dashboard_id: resolvedDashboardId || tank?.dashboard_id || "",
      dashboardName: resolvedDashboardName || tank?.dashboardName || "",
      dashboard_name: resolvedDashboardName || tank?.dashboard_name || "",
      properties: {
        ...(tank?.properties || {}),
        dashboardId:
          resolvedDashboardId ||
          tank?.properties?.dashboardId ||
          tank?.properties?.dashboard_id ||
          "",
        dashboard_id:
          resolvedDashboardId ||
          tank?.properties?.dashboard_id ||
          tank?.properties?.dashboardId ||
          "",
        dashboardName:
          resolvedDashboardName ||
          tank?.properties?.dashboardName ||
          tank?.properties?.dashboard_name ||
          "",
        dashboard_name:
          resolvedDashboardName ||
          tank?.properties?.dashboard_name ||
          tank?.properties?.dashboardName ||
          "",
      },
    };

    onUpdate?.(nextTank);
    setWriteError("");

    try {
      if (hasBinding) {
        const field = String(bindField || "").trim().toLowerCase();
        const numericValue = Number(formatted);

        if (!resolvedDashboardId || !resolvedWidgetId) {
          throw new Error("Missing dashboardId or widgetId for AO write");
        }

        if (!Number.isFinite(numericValue)) {
          throw new Error("Invalid setpoint value");
        }

        setIsWriting(true);

        const res = await writeControlAO({
          dashboardId: resolvedDashboardId,
          widgetId: resolvedWidgetId,
          field,
          value: numericValue,
        });

        const holdMs = Number(res?.actuationHoldMs);
        startHoldWindow(Number.isFinite(holdMs) && holdMs > 0 ? holdMs : 10000);
      }

      window.dispatchEvent(
        new CustomEvent("coreflex-displayOutput-set", {
          detail: {
            id: resolvedWidgetId || tank.id,
            value: formatted,
            label,
            numberFormat,
            at: now,
            bindField,
            bindDeviceId,
            dashboardId: resolvedDashboardId,
            dashboardName: resolvedDashboardName,
          },
        })
      );
    } catch (err) {
      if (isControlActionInProgressError(err)) {
        const holdMs = getActuationHoldMsFromError(err);
        startHoldWindow(holdMs);
        setWriteError("Control Action in Progress");
      } else {
        const msg =
          String(err?.message || "").trim() || "Failed to write AO value";
        console.error("❌ DisplayOutput AO write failed:", err);
        setWriteError(msg);
      }
    } finally {
      setIsWriting(false);
    }
  };

  const displayText = displayedSetpoint;

  const actualText =
    hasBinding && !isOffline && liveValue !== null && liveValue !== undefined
      ? formatByPattern(
          outValue !== null && outValue !== undefined ? outValue : liveValue,
          numberFormat
        )
      : "--";

  const actualRowH = 26;
  const actualValueH = 28;
  const mainDisplayH = 38;
  const setBtnH = 26;
  const totalBoxH = actualRowH + actualValueH + mainDisplayH + setBtnH;

  const enrichedTankForModal = React.useMemo(() => {
    return {
      ...tank,
      dashboardId: resolvedDashboardId || tank?.dashboardId || "",
      dashboard_id: resolvedDashboardId || tank?.dashboard_id || "",
      dashboardName: resolvedDashboardName || tank?.dashboardName || "",
      dashboard_name: resolvedDashboardName || tank?.dashboard_name || "",
      properties: {
        ...(tank?.properties || {}),
        dashboardId:
          resolvedDashboardId ||
          tank?.properties?.dashboardId ||
          tank?.properties?.dashboard_id ||
          "",
        dashboard_id:
          resolvedDashboardId ||
          tank?.properties?.dashboard_id ||
          tank?.properties?.dashboardId ||
          "",
        dashboardName:
          resolvedDashboardName ||
          tank?.properties?.dashboardName ||
          tank?.properties?.dashboard_name ||
          "",
        dashboard_name:
          resolvedDashboardName ||
          tank?.properties?.dashboard_name ||
          tank?.properties?.dashboardName ||
          "",
      },
    };
  }, [tank, resolvedDashboardId, resolvedDashboardName]);

  return (
    <div
      style={{ width: w, userSelect: "none" }}
      onDoubleClickCapture={(e) => {
        e.stopPropagation();
        onDoubleClick?.(enrichedTankForModal);
      }}
    >
      <div
        style={{
          width: w,
          height: totalBoxH,
          background: "white",
          border: "2px solid black",
          borderRadius: 0,
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: actualValueH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            borderBottom: "2px solid black",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 18,
              color: isOffline ? "#dc2626" : "#111",
              letterSpacing: 1.2,
              lineHeight: "18px",
            }}
          >
            {actualText}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: actualValueH,
            height: actualRowH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            borderBottom: "2px solid black",
            background: "#e5e7eb",
            fontSize: 12,
            fontWeight: 900,
            color: "#111",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Actual
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: actualValueH + actualRowH,
            height: mainDisplayH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            background: "#ffffff",
          }}
        >
          {isPlay ? (
            <input
              value={displayText}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation();
                setEditing(true);
                requestAnimationFrame(() => {
                  try {
                    const len = e.target.value.length;
                    e.target.setSelectionRange(len, len);
                  } catch {}
                });
              }}
              onChange={(e) => {
                const next = onlyDigits(e.target.value).slice(0, maxDigits);
                setDraft(next);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              onBlur={() => {
                setEditing(false);
                commitFormattedValue();
              }}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                textAlign: "center",
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: 22,
                color: "#111",
                letterSpacing: 1.5,
              }}
            />
          ) : (
            <div
              style={{
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: 22,
                color: "#111",
                letterSpacing: 1.5,
                lineHeight: "22px",
              }}
            >
              {displayText}
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: setBtnH,
            borderTop: "2px solid black",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SetButton
            isPlay={isPlay}
            onSet={handleSet}
            disabled={(hasBinding && isOffline) || holdActive}
            busy={isWriting || holdActive}
            holdActive={holdActive}
          />
        </div>
      </div>

      {label ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 18,
            fontWeight: 900,
            color: "#111",
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
      ) : null}

      {hasBinding && isOffline ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            fontWeight: 700,
            color: "#dc2626",
            textAlign: "center",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Offline
        </div>
      ) : null}

      {!isOffline && holdActive ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 18,
            fontWeight: 900,
            color: "#d97706",
            textAlign: "center",
            lineHeight: 1,
            whiteSpace: "nowrap",
            position: "relative",
            left: -30,
          }}
        >
          Control Action in Progress
        </div>
      ) : null}

      {writeError ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#dc2626",
            textAlign: "center",
            lineHeight: 1.2,
            wordBreak: "break-word",
          }}
        >
          {writeError}
        </div>
      ) : null}
    </div>
  );
}