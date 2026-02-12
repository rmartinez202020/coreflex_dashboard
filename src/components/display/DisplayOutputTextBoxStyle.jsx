// src/components/display/DisplayOutputTextBoxStyle.jsx
import React from "react";

// ===============================
// ✅ helpers for Display Output input formatting
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

// ✅ Green "PushButton NO" style SET button (always visible)
function SetButton({ isPlay, onSet }) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg = "#22c55e";
  const darkBg = "#16a34a";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        setPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        setPressed(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        setPressed(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        onSet?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        cursor: isPlay ? "pointer" : "default",
        userSelect: "none",
        fontWeight: 900,
        letterSpacing: 1,
        background: isPlay ? (pressed ? darkBg : baseBg) : "#cbd5e1",
        color: isPlay ? "white" : "#334155",
        boxShadow: isPlay
          ? pressed
            ? "inset 0 3px 10px rgba(0,0,0,0.35)"
            : "0 3px 0 rgba(0,0,0,0.35)"
          : "none",
        transform: isPlay
          ? pressed
            ? "translateY(1px)"
            : "translateY(0)"
          : "none",
        transition:
          "transform 80ms ease, box-shadow 80ms ease, background 120ms ease",
      }}
      title={isPlay ? "Send/commit this setpoint" : "SET works in Play mode"}
    >
      SET
    </button>
  );
}

// ✅ DISPLAY OUTPUT (textbox style + editable in PLAY + SET always visible)
export default function DisplayOutputTextBoxStyle({ tank, isPlay, onUpdate }) {
  const w = tank.w ?? tank.width ?? 160;
  const h = tank.h ?? tank.height ?? 60;

  const label = tank?.properties?.label || "";
  const numberFormat = tank?.properties?.numberFormat || "00000";
  const { maxDigits } = getFormatSpec(numberFormat);

  const rawValue =
    tank.value !== undefined && tank.value !== null ? String(tank.value) : "";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(onlyDigits(rawValue));

  React.useEffect(() => {
    if (!editing) setDraft(onlyDigits(rawValue));
  }, [rawValue, editing]);

  const displayed = isPlay
    ? editing
      ? draft
      : padToFormat(rawValue, numberFormat)
    : padToFormat(rawValue, numberFormat);

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
          {isPlay ? (
            <input
              value={displayed}
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
              {displayed}
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
          <SetButton isPlay={isPlay} onSet={handleSet} />
        </div>
      </div>
    </div>
  );
}
