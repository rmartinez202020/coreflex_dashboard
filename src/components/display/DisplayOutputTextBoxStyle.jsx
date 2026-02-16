// src/components/display/DisplayOutputTextBoxStyle.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

// ===============================
// ✅ helpers for Display Output input formatting (SETPOINT MODE)
// ===============================
function getFormatSpec(numberFormat) {
  const fmt = String(numberFormat || "00000");
  const digits = (fmt.match(/0/g) || []).length;
  return { maxDigits: Math.max(1, digits), fmt };
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
// ✅ helpers for "Display Output" BINDING MODE (AI + MATH)
// ===============================
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

function normalizeList(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

// ✅ IMPORTANT: user-safe endpoints (avoid /devices which gave 403/405)
async function loadLiveRowForDevice(modelKey, deviceId, { signal } = {}) {
  const base = String(modelKey || "zhc1921").toLowerCase(); // "zhc1921" | "zhc1661"
  const root = base === "zhc1661" ? "zhc1661" : "zhc1921";

  const listCandidates = [`/${root}/my-devices`, `/${root}/list`, `/${root}`];

  for (const p of listCandidates) {
    try {
      const data = await apiGet(p, { signal });
      const arr = normalizeList(data);

      const hit =
        arr.find((r) => {
          const id =
            r.deviceId ??
            r.device_id ??
            r.id ??
            r.imei ??
            r.IMEI ??
            r.DEVICE_ID ??
            "";
          return String(id) === String(deviceId);
        }) || null;

      if (hit) return hit;
    } catch {
      // continue
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

// ✅ pattern formatting like "000.00", "00000", etc.
function formatByPattern(raw, numberFormat) {
  const fmt = String(numberFormat || "00000");
  const [intPart, decPart] = fmt.split(".");
  const totalInt = (intPart || "0").length;
  const totalDec = decPart ? decPart.length : 0;

  // string output (CONCAT) -> return as-is
  if (typeof raw === "string" && raw.trim() !== "" && isNaN(Number(raw))) return raw;

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

// ✅ Green "PushButton NO" style SET button (always visible)
function SetButton({ isPlay, onSet, disabled }) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg = "#22c55e";
  const darkBg = "#16a34a";

  const canPress = isPlay && !disabled;

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
          ? "SET disabled (this widget is bound to AI + Math)"
          : canPress
          ? "Send/commit this setpoint"
          : "SET works in Play mode"
      }
    >
      SET
    </button>
  );
}

// ✅ DISPLAY OUTPUT (textbox style)
// - If bound (bindDeviceId + bindField): show live MATH output value (read-only) ✅
// - If not bound: keep old behavior (editable in PLAY + SET button) ✅
export default function DisplayOutputTextBoxStyle({ tank, isPlay, onUpdate }) {
  const w = tank.w ?? tank.width ?? 160;
  const h = tank.h ?? tank.height ?? 60;

  const label = tank?.properties?.label || "";
  const numberFormat = tank?.properties?.numberFormat || "00000";
  const { maxDigits } = getFormatSpec(numberFormat);

  // ✅ Binding props saved by DisplaySettingModal
  const bindModel = tank?.properties?.bindModel || "zhc1921";
  const bindDeviceId = tank?.properties?.bindDeviceId || "";
  const bindField = tank?.properties?.bindField || "";
  const formula = tank?.properties?.formula || "";
  const sampleMs = Number(tank?.properties?.sampleMs || 3000);

  const hasBinding = !!bindDeviceId && !!bindField;

  // -------------------------
  // ✅ LIVE POLL (binding mode)
  // -------------------------
  const [liveValue, setLiveValue] = React.useState(null);
  const [outValue, setOutValue] = React.useState(null);

  React.useEffect(() => {
    if (!hasBinding) {
      setLiveValue(null);
      setOutValue(null);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();

    const tick = async () => {
      try {
        const row = await loadLiveRowForDevice(bindModel, bindDeviceId, {
          signal: ctrl.signal,
        });

        const raw = row ? readAiField(row, bindField) : null;

        const num =
          raw === null || raw === undefined || raw === ""
            ? null
            : typeof raw === "number"
            ? raw
            : Number(raw);

        const safeLive = Number.isFinite(num) ? num : null;

        const computed = computeMathOutput(safeLive, formula);

        if (cancelled) return;
        setLiveValue(safeLive);
        setOutValue(computed);
      } catch {
        if (cancelled) return;
        setLiveValue(null);
        setOutValue(null);
      }
    };

    tick();
    const id = window.setInterval(tick, Math.max(250, sampleMs || 3000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [hasBinding, bindModel, bindDeviceId, bindField, formula, sampleMs]);

  // -------------------------
  // ✅ SETPOINT MODE (legacy)
  // -------------------------
  const rawSetpoint =
    tank.value !== undefined && tank.value !== null ? String(tank.value) : "";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(onlyDigits(rawSetpoint));

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

  const handleSet = () => {
    if (!isPlay) return;

    const formatted = commitFormattedValue();
    const now = new Date().toISOString();

    onUpdate?.({
      ...tank,
      value: formatted,
      lastSetValue: formatted,
      lastSetAt: now,
    });

    window.dispatchEvent(
      new CustomEvent("coreflex-displayOutput-set", {
        detail: { id: tank.id, value: formatted, label, numberFormat, at: now },
      })
    );
  };

  // -------------------------
  // ✅ DISPLAY PICKER
  // -------------------------
  const displayText = hasBinding
    ? formatByPattern(outValue, numberFormat) // ✅ show MATH OUTPUT on the item
    : displayedSetpoint;

  const setBtnH = 26;

  return (
    <div style={{ width: w, userSelect: "none" }}>
      {label ? (
        <div
          style={{
            marginBottom: 6,
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

      <div
        style={{
          width: w,
          height: h,
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
            top: 0,
            right: 0,
            bottom: setBtnH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {/* ✅ BINDING MODE: READ-ONLY SHOW OUTPUT */}
          {hasBinding ? (
            <div
              style={{
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: 22,
                color: "#111",
                letterSpacing: 1.5,
                lineHeight: "22px",
              }}
              title={
                Number.isFinite(liveValue)
                  ? `LIVE VALUE: ${liveValue}`
                  : "No live value"
              }
            >
              {displayText}
            </div>
          ) : isPlay ? (
            // ✅ SETPOINT MODE: editable in PLAY
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
            // ✅ SETPOINT MODE: read-only in edit mode
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
          {/* ✅ If bound, keep the button but disabled (so layout stays same) */}
          <SetButton isPlay={isPlay} onSet={handleSet} disabled={hasBinding} />
        </div>
      </div>
    </div>
  );
}
