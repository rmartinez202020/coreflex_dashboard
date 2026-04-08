// src/components/display/DisplayOutputTextBoxStyle.jsx
import React from "react";
import { writeControlAO } from "../controls/controlBindings";

// ===============================
// ✅ helpers for Display Output input formatting (SETPOINT MODE)
// ===============================
function getFormatSpec(numberFormat) {
  const fmt = String(numberFormat || "00000");
  const [intPartRaw, decPartRaw] = fmt.split(".");
  const intPart = String(intPartRaw || "0");
  const decPart = String(decPartRaw || "");
  const intDigits = (intPart.match(/0/g) || []).length || 1;
  const decDigits = (decPart.match(/0/g) || []).length;

  return {
    fmt,
    intDigits,
    decDigits,
    maxDigits: intDigits,
    allowDecimal: decDigits > 0,
    maxWholeDigits: intDigits,
    maxDecimalDigits: decDigits,
  };
}

function sanitizeNumericInput(str, numberFormat) {
  const { allowDecimal, maxWholeDigits, maxDecimalDigits } =
    getFormatSpec(numberFormat);

  let s = String(str || "").replace(/[^\d.]/g, "");

  if (!allowDecimal) {
    return s.replace(/\./g, "").slice(0, maxWholeDigits);
  }

  const firstDot = s.indexOf(".");
  if (firstDot >= 0) {
    const whole = s
      .slice(0, firstDot)
      .replace(/\./g, "")
      .slice(0, maxWholeDigits);
    const dec = s
      .slice(firstDot + 1)
      .replace(/\./g, "")
      .slice(0, maxDecimalDigits);
    return `${whole}${s.includes(".") ? "." : ""}${dec}`;
  }

  return s.replace(/\./g, "").slice(0, maxWholeDigits);
}

function onlyDigits(str) {
  return String(str || "").replace(/\D/g, "");
}

function trimLeadingZerosKeepOne(s) {
  const v = String(s || "");
  return v.replace(/^0+(?=\d)/, "");
}

function normalizeRawSetpoint(str, numberFormat) {
  const { allowDecimal } = getFormatSpec(numberFormat);
  const s = String(str || "").trim();

  if (!s) return "";

  if (!allowDecimal) {
    return onlyDigits(s);
  }

  return sanitizeNumericInput(s, numberFormat);
}

function padToFormat(rawValue, numberFormat) {
  const { allowDecimal, maxWholeDigits, maxDecimalDigits } =
    getFormatSpec(numberFormat);

  const s = sanitizeNumericInput(rawValue, numberFormat);

  if (!s) return "";

  if (!allowDecimal) {
    const clean = trimLeadingZerosKeepOne(s);
    return clean || "0";
  }

  const hasDot = s.includes(".");
  let [whole, dec = ""] = s.split(".");
  whole = String(whole || "").slice(0, maxWholeDigits);
  dec = String(dec || "").slice(0, maxDecimalDigits);

  whole = trimLeadingZerosKeepOne(whole || "0");
  dec = dec.replace(/0+$/, "");

  if (hasDot && dec) {
    return `${whole || "0"}.${dec}`;
  }

  return whole || "0";
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

// ===============================
// ✅ helpers for telemetryMap BINDING MODE (AI + AO + MATH)
// ===============================
function normalizeField(field) {
  return String(field || "").trim().toLowerCase();
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  if (!telemetryMap || !deviceId) return null;

  const m = String(model || "").trim().toLowerCase();
  const id = String(deviceId || "").trim();
  if (!id) return null;

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];
  if (telemetryMap?.[id]) return telemetryMap[id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

function getTelemetryStatus(row) {
  if (!row || typeof row !== "object") return "offline";

  const raw =
    row?.status ??
    row?.deviceStatus ??
    row?.telemetryStatus ??
    row?.onlineStatus ??
    row?.connectionStatus ??
    row?.state ??
    row?.online ??
    row?.is_online ??
    row?.connected ??
    "";

  const s = String(raw || "").trim().toLowerCase();

  if (
    s === "offline" ||
    s === "false" ||
    s === "0" ||
    s === "down" ||
    s === "disconnected" ||
    s === "not_running" ||
    s === "not running"
  ) {
    return "offline";
  }

  if (
    s === "online" ||
    s === "true" ||
    s === "1" ||
    s === "up" ||
    s === "connected"
  ) {
    return "online";
  }

  if (row?.online === true) return "online";
  if (row?.online === false) return "offline";
  if (row?.is_online === true) return "online";
  if (row?.is_online === false) return "offline";
  if (row?.connected === true) return "online";
  if (row?.connected === false) return "offline";

  return s || "offline";
}

function getFieldAliases(f) {
  if (/^ai\d+$/.test(f)) {
    const n = f.replace("ai", "");
    return [
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
      `analog_${n}`,
      `ANALOG_${n}`,
      `analog-${n}`,
      `ANALOG-${n}`,
    ];
  }

  if (/^ao\d+$/.test(f)) {
    const n = f.replace("ao", "");
    return [
      `ao_${n}`,
      `AO_${n}`,
      `ao-${n}`,
      `AO-${n}`,
      `analogout${n}`,
      `ANALOGOUT${n}`,
      `analog_out_${n}`,
      `ANALOG_OUT_${n}`,
      `analog-out-${n}`,
      `ANALOG-OUT-${n}`,
      `output${n}`,
      `OUTPUT${n}`,
      `ao${n}`,
      `AO${n}`,
    ];
  }

  return [];
}

function getTelemetryValue(row, field) {
  if (!row || !field) return null;

  const f = normalizeField(field);
  if (!f) return null;

  const direct = [
    f,
    f.toLowerCase(),
    f.toUpperCase(),
    f.replace(/(\D+)(\d+)/, "$1_$2"),
    f.replace(/(\D+)(\d+)/, "$1-$2"),
  ];

  for (const key of direct) {
    if (row[key] !== undefined) return row[key];
  }

  const extra = getFieldAliases(f);
  for (const key of extra) {
    if (row[key] !== undefined) return row[key];
  }

  const nestedContainers = [
    row.data,
    row.row,
    row.device,
    row.telemetry,
    row.values,
    row.payload,
    row.latest,
    row.readings,
    row.tags,
  ].filter(Boolean);

  for (const obj of nestedContainers) {
    for (const key of direct) {
      if (obj?.[key] !== undefined) return obj[key];
    }

    const nestedExtra = getFieldAliases(f);
    for (const key of nestedExtra) {
      if (obj?.[key] !== undefined) return obj[key];
    }
  }

  const tagArrays = [row.tags, row.points, row.values, row.readings].filter(
    Array.isArray
  );

  for (const arr of tagArrays) {
    const hit = arr.find((item) => {
      const name = String(
        item?.name ?? item?.tag ?? item?.field ?? item?.key ?? item?.id ?? ""
      )
        .trim()
        .toLowerCase();

      const alt1 = f.replace(/(\D+)(\d+)/, "$1_$2");
      const alt2 = f.replace(/(\D+)(\d+)/, "$1-$2");
      const extraNames = getFieldAliases(f).map((x) => String(x).toLowerCase());

      return (
        name === f ||
        name === alt1 ||
        name === alt2 ||
        extraNames.includes(name)
      );
    });

    if (hit) {
      const v = hit.value ?? hit.val ?? hit.reading ?? hit.data;
      if (v !== undefined) return v;
    }
  }

  return null;
}

function computeMathOutput(liveValue, formula) {
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
  if (typeof raw === "string" && raw.trim() !== "" && isNaN(Number(raw))) {
    return raw;
  }

  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num)) return "--";

  if (Number.isInteger(num)) {
    return String(num);
  }

  return String(parseFloat(num.toFixed(6)));
}

function SetButton({ isPlay, onSet, disabled, busy }) {
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
          ? "Writing..."
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

  const label = tank?.properties?.label || "";
  const numberFormat = "000000.000000";

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
    return computeMathOutput(liveValue, formula);
  }, [hasBinding, liveValue, formula]);

  const isOffline =
    hasBinding &&
    (!row ||
      backendStatus === "offline" ||
      backendStatus === "false" ||
      backendStatus === "0" ||
      backendStatus === "down" ||
      backendStatus === "disconnected");

  const rawSetpoint = React.useMemo(() => {
    const current =
      hasBinding &&
      !isOffline &&
      outValue !== null &&
      outValue !== undefined &&
      Number.isFinite(Number(outValue))
        ? String(outValue)
        : hasBinding &&
          !isOffline &&
          liveValue !== null &&
          liveValue !== undefined &&
          Number.isFinite(Number(liveValue))
        ? String(liveValue)
        : "";

    const saved =
      tank.value !== undefined && tank.value !== null
        ? String(tank.value).trim()
        : "";

    return current || saved || "";
  }, [tank.value, hasBinding, isOffline, outValue, liveValue]);

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(
    normalizeRawSetpoint(rawSetpoint, numberFormat)
  );
  const [isWriting, setIsWriting] = React.useState(false);
  const [writeError, setWriteError] = React.useState("");

  React.useEffect(() => {
    if (!editing) {
      setDraft(normalizeRawSetpoint(rawSetpoint, numberFormat));
    }
  }, [rawSetpoint, editing, numberFormat]);

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
    if (!isPlay || isWriting) return;

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

        await writeControlAO({
          dashboardId: resolvedDashboardId,
          widgetId: resolvedWidgetId,
          field,
          value: numericValue,
        });
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
      const msg =
        String(err?.message || "").trim() || "Failed to write AO value";
      console.error("❌ DisplayOutput AO write failed:", err);
      setWriteError(msg);
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
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation();

                const baseValue =
                  hasBinding &&
                  !isOffline &&
                  outValue !== null &&
                  outValue !== undefined &&
                  Number.isFinite(Number(outValue))
                    ? String(outValue)
                    : hasBinding &&
                      !isOffline &&
                      liveValue !== null &&
                      liveValue !== undefined &&
                      Number.isFinite(Number(liveValue))
                    ? String(liveValue)
                    : rawSetpoint;

                setDraft(normalizeRawSetpoint(baseValue, numberFormat));
                setEditing(true);

                requestAnimationFrame(() => {
                  try {
                    e.target.select();
                  } catch {}
                });
              }}
              onChange={(e) => {
                const next = sanitizeNumericInput(
                  e.target.value,
                  numberFormat
                );
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
            disabled={hasBinding && isOffline}
            busy={isWriting}
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