// src/components/controls/ToggleSwitchControl.jsx
import React from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";
import ToggleSwitchPropertiesModal from "./ToggleSwitchPropertiesModal";

// ✅ Convert anything to 0/1
function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
  if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
  const n = Number(s);
  if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  return v ? 1 : 0;
}

// ✅ Read DO value from backend device row (supports do/out variants)
// ✅ clamp to do1..do4 only
function readDoFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field).toLowerCase().trim();
  if (!/^do[1-4]$/.test(f)) return undefined;

  if (row[f] !== undefined) return row[f];

  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  // do1..do4 -> out1..out4
  const n = f.replace("do", "");
  const alt = `out${n}`;
  if (row[alt] !== undefined) return row[alt];
  const altUp = `OUT${n}`;
  if (row[altUp] !== undefined) return row[altUp];

  return undefined;
}

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ToggleSwitchControl({
  // ✅ legacy external state (EDIT/visual usage)
  isOn = true,

  width = 180,
  height = 70,

  // ✅ keep old behavior by default
  visualOnly = true,

  // ✅ parent should pass true when dashboard is launched (PLAY)
  isLaunched = false,

  // ✅ optional (parent should pass to enable saving binding)
  widget = null,
  onSaveWidget = null,

  /**
   * ✅ OPTIONAL: write handler for real DO control.
   * Called when user toggles in PLAY after lock.
   *
   * Signature:
   *   await onWrite({ deviceId, field, value01, widget })
   *
   * value01 is the DO value (0 or 1).
   */
  onWrite = null,

  /**
   * ✅ Optional tuning
   */
  lockMs = 4000,
  pollMs = 2000,
}) {
  const [openProps, setOpenProps] = React.useState(false);

  const safeW = Math.max(90, Number(width) || 180);
  const safeH = Math.max(40, Number(height) || 70);
  const radius = safeH / 2;

  /* === VISUAL TUNING === */
  const bezelPad = Math.max(2, Math.round(safeH * 0.045));
  const trackPad = Math.max(4, Math.round(safeH * 0.075));
  const panelInset = Math.max(8, Math.round(safeH * 0.13));

  const knobSize = safeH - trackPad * 2 + Math.round(safeH * 0.04);
  const knobTop = trackPad - Math.round(safeH * 0.015);

  // =========================
  // ✅ Binding (from widget props)
  // =========================
  const p = widget?.properties || {};
  const bindDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "").trim();
  const bindField = String(p.bindField || p?.tag?.field || "")
    .trim()
    .toLowerCase();

  const hasBinding = !!bindDeviceId && /^do[1-4]$/.test(bindField);

  // =========================
  // ✅ PLAY/LAUNCH state machine
  // IMPORTANT mapping you requested:
  // DO=1 -> show OFF
  // DO=0 -> show ON
  // so UI "ON" is the INVERSE of DO
  // =========================
  const [uiIsOn, setUiIsOn] = React.useState(() => {
    const v01 = to01(isOn);
    if (v01 === null) return true;
    return v01 === 0; // ✅ INVERT: DO 0 -> UI ON
  });

  const [lockedUntil, setLockedUntil] = React.useState(0);
  const lastManualAtRef = React.useRef(0);

  // keep uiIsOn in sync with prop ONLY when not launched
  React.useEffect(() => {
    if (isLaunched) return;
    const v01 = to01(isOn);
    if (v01 === null) return;
    setUiIsOn(v01 === 0); // ✅ INVERT
  }, [isOn, isLaunched]);

  // close modal if switching to launched
  React.useEffect(() => {
    if (isLaunched && openProps) setOpenProps(false);
  }, [isLaunched, openProps]);

  // when launched turns ON => set lock timer
  React.useEffect(() => {
    if (!isLaunched) {
      setLockedUntil(0);
      return;
    }
    const until = Date.now() + Math.max(0, Number(lockMs) || 4000);
    setLockedUntil(until);
  }, [isLaunched, lockMs]);

  // ✅ make lock reactive (do not rely on Date.now() in render)
  const [nowTick, setNowTick] = React.useState(Date.now());
  React.useEffect(() => {
    if (!isLaunched) return;
    const t = setInterval(() => setNowTick(Date.now()), 200);
    return () => clearInterval(t);
  }, [isLaunched]);

  const isLocked = isLaunched && nowTick < lockedUntil;

  // =========================
  // ✅ Fetch DO state from backend (best-effort)
  // Uses /zhc1921/my-devices (same as your modal)
  // NOTE: Still runs during the 4s lock (lock only blocks manual).
  // =========================
  const fetchRemoteDo = React.useCallback(async () => {
    if (!isLaunched) return;
    if (!hasBinding) return;

    try {
      const token = String(getToken() || "").trim();
      if (!token) return;

      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) return;

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const row =
        list.find(
          (r) => String(r.deviceId ?? r.device_id ?? "").trim() === bindDeviceId
        ) || null;

      if (!row) return;

      const raw = readDoFromRow(row, bindField);
      const do01 = to01(raw);
      if (do01 === null) return;

      // ✅ don't "fight" the user right after a manual toggle
      const now = Date.now();
      const lastManualAt = lastManualAtRef.current || 0;
      if (now - lastManualAt < 1500) return;

      // ✅ INVERT mapping: DO 0 => UI ON, DO 1 => UI OFF
      setUiIsOn(do01 === 0);
    } catch {
      // ignore
    }
  }, [isLaunched, hasBinding, bindDeviceId, bindField]);

  // initial sync when launched + binding
  React.useEffect(() => {
    if (!isLaunched) return;
    fetchRemoteDo();
  }, [isLaunched, fetchRemoteDo]);

  // optional polling while launched (includes first 4 seconds)
  React.useEffect(() => {
    if (!isLaunched) return;
    if (!hasBinding) return;

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchRemoteDo();
    }, Math.max(800, Number(pollMs) || 2000));

    return () => clearInterval(t);
  }, [isLaunched, hasBinding, fetchRemoteDo, pollMs]);

  // =========================
  // ✅ Manual toggle in PLAY (after lock)
  // =========================
  const canInteractInPlay = isLaunched && hasBinding && !isLocked;

  const handleToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!canInteractInPlay) return;

    const nextUi = !uiIsOn;
    setUiIsOn(nextUi);
    lastManualAtRef.current = Date.now();

    // ✅ Convert UI state to DO value with your required inversion:
    // UI ON => DO 0
    // UI OFF => DO 1
    const nextDo01 = nextUi ? 0 : 1;

    if (typeof onWrite === "function") {
      try {
        await onWrite({
          deviceId: bindDeviceId,
          field: bindField,
          value01: nextDo01,
          widget,
        });
      } catch (err) {
        // if write fails, resync from device quickly
        setTimeout(() => fetchRemoteDo(), 300);
      }
    }
  };

  // =========================
  // VISUALS (use uiIsOn)
  // =========================
  const bezelBg =
    "linear-gradient(180deg, #2B2B2B 0%, #0E0E0E 50%, #1C1C1C 100%)";
  const trackBg = "#0A0A0A";
  const panelBg = uiIsOn
    ? "linear-gradient(180deg, #63FF78 0%, #2EE04C 60%, #14A82E 100%)"
    : "linear-gradient(180deg, #FF4F4F 0%, #E00000 60%, #B10000 100%)";
  const knobBg =
    "linear-gradient(180deg, #3A3A3A 0%, #141414 60%, #2A2A2A 100%)";

  // ON = LEFT, OFF = RIGHT
  const knobLeft = uiIsOn ? trackPad : safeW - trackPad - knobSize;

  // ✅ only allow edit affordances in EDIT mode
  const canEdit = !visualOnly && !isLaunched;

  // cursor logic
  const hoverCursor = canEdit
    ? "move"
    : canInteractInPlay
    ? "pointer"
    : isLaunched && hasBinding && isLocked
    ? "not-allowed"
    : "default";

  // pointer events:
  // - EDIT: same as before (visualOnly disables interaction)
  // - PLAY: allow interaction for manual toggle ONLY if has binding
  const allowPointerEvents =
    (visualOnly ? false : true) || (isLaunched && hasBinding);

  return (
    <>
      <div
        title={
          !hasBinding
            ? "Bind this toggle to a DO"
            : uiIsOn
            ? isLocked
              ? "ON (locked)"
              : "ON"
            : isLocked
            ? "OFF (locked)"
            : "OFF"
        }
        onDoubleClick={
          canEdit
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpenProps(true);
              }
            : undefined
        }
        onClick={canInteractInPlay ? handleToggle : undefined}
        style={{
          width: safeW,
          height: safeH,
          borderRadius: radius,
          background: bezelBg,
          padding: bezelPad,
          boxShadow: "0 8px 18px rgba(0,0,0,0.45)",
          position: "relative",
          userSelect: "none",
          cursor: hoverCursor,
          pointerEvents: allowPointerEvents ? "auto" : "none",
          opacity: isLaunched && hasBinding && isLocked ? 0.92 : 1,
        }}
      >
        {/* Track */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: radius - 4,
            background: trackBg,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Color panel */}
          <div
            style={{
              position: "absolute",
              inset: panelInset,
              borderRadius: radius,
              background: panelBg,
              zIndex: 1,
              transition: "background 180ms ease",
            }}
          />

          {/* ON / OFF text */}
          <div
            style={{
              position: "absolute",
              inset: panelInset,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: Math.max(14, Math.round(safeH * 0.28)),
              letterSpacing: 1,
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.45)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          >
            {uiIsOn ? "ON" : "OFF"}
          </div>

          {/* Knob */}
          <div
            style={{
              position: "absolute",
              top: knobTop,
              left: knobLeft,
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              background: knobBg,
              boxShadow:
                "0 6px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.12)",
              border: "2px solid rgba(0,0,0,0.5)",
              transition: "left 180ms ease",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />

          {/* Optional lock overlay */}
          {isLaunched && hasBinding && isLocked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18))",
              }}
            />
          )}
        </div>
      </div>

      <ToggleSwitchPropertiesModal
        open={openProps}
        toggleSwitch={widget}
        onClose={() => setOpenProps(false)}
        onSave={(nextWidget) => {
          if (typeof onSaveWidget === "function") onSaveWidget(nextWidget);
        }}
        isLaunched={isLaunched}
      />
    </>
  );
}