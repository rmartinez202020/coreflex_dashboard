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

function readStatusFromRow(row) {
  return String(row?.status ?? row?.Status ?? "").trim().toLowerCase(); // "online" | "offline" | ""
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

  // ✅ IMPORTANT: pass from parent (for backend uniqueness)
  dashboardId = null,

  /**
   * ✅ OPTIONAL: write handler for real DO control.
   * Called when user toggles in PLAY after lock/cooldown.
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
  lockMs = 4000, // also used as manual cooldown
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
  // ✅ Mapping you requested:
  // DO=1 -> UI OFF
  // DO=0 -> UI ON
  // So UI "ON" = inverse of DO.
  // =========================
  const [uiIsOn, setUiIsOn] = React.useState(() => {
    const v01 = to01(isOn);
    if (v01 === null) return true;
    return v01 === 0; // ✅ invert
  });

  // ✅ device online/offline indicator (from backend row)
  const [deviceStatus, setDeviceStatus] = React.useState(""); // "online" | "offline" | ""

  // keep uiIsOn in sync with prop ONLY when not launched
  React.useEffect(() => {
    if (isLaunched) return;
    const v01 = to01(isOn);
    if (v01 === null) return;
    setUiIsOn(v01 === 0); // ✅ invert
  }, [isOn, isLaunched]);

  // close modal if switching to launched
  React.useEffect(() => {
    if (isLaunched && openProps) setOpenProps(false);
  }, [isLaunched, openProps]);

  // =========================
  // ✅ TIME TICK (for lock + cooldown)
  // =========================
  const [nowTick, setNowTick] = React.useState(Date.now());
  React.useEffect(() => {
    if (!isLaunched) return;
    const t = setInterval(() => setNowTick(Date.now()), 150);
    return () => clearInterval(t);
  }, [isLaunched]);

  // =========================
  // ✅ STARTUP LOCK WINDOW (first 4 seconds only)
  // During this window we sync from DO.
  // After it ends: NO MORE AUTO-SYNC (user controls)
  // =========================
  const [lockedUntil, setLockedUntil] = React.useState(0);

  React.useEffect(() => {
    if (!isLaunched) {
      setLockedUntil(0);
      return;
    }
    setLockedUntil(Date.now() + Math.max(0, Number(lockMs) || 4000));
  }, [isLaunched, lockMs]);

  const isStartupLocked = isLaunched && nowTick < lockedUntil;

  // =========================
  // ✅ MANUAL COOLDOWN (after each manual toggle)
  // After user toggles, wait 4 seconds before allowing another toggle.
  // =========================
  const [cooldownUntil, setCooldownUntil] = React.useState(0);

  // reset cooldown when leaving play
  React.useEffect(() => {
    if (!isLaunched) setCooldownUntil(0);
  }, [isLaunched]);

  const isManualCooldown = isLaunched && nowTick < cooldownUntil;

  // =========================
  // ✅ Fetch DO state + device status from backend (best-effort)
  // - Always fetch once when play starts (for status + initial sync)
  // - Keep polling ONLY during startup lock window
  // =========================
  const fetchRemote = React.useCallback(async () => {
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

      // ✅ status
      setDeviceStatus(readStatusFromRow(row));

      // ✅ Only sync DO -> UI during startup lock window
      if (!isStartupLocked) return;

      const raw = readDoFromRow(row, bindField);
      const do01 = to01(raw);
      if (do01 === null) return;

      // ✅ invert mapping (DO 0 => UI ON)
      setUiIsOn(do01 === 0);
    } catch {
      // ignore
    }
  }, [isLaunched, hasBinding, bindDeviceId, bindField, isStartupLocked]);

  // Fetch once when play starts (gets status + initial sync)
  React.useEffect(() => {
    if (!isLaunched) return;
    if (!hasBinding) return;
    fetchRemote();
  }, [isLaunched, hasBinding, fetchRemote]);

  // Poll ONLY during startup lock (for first 4 seconds)
  React.useEffect(() => {
    if (!isLaunched) return;
    if (!hasBinding) return;
    if (!isStartupLocked) return;

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchRemote();
    }, Math.max(500, Number(pollMs) || 2000));

    return () => clearInterval(t);
  }, [isLaunched, hasBinding, isStartupLocked, fetchRemote, pollMs]);

  // =========================
  // ✅ Manual toggle in PLAY:
  // Allowed only when:
  // - has binding
  // - startup lock finished
  // - not in manual cooldown
  // =========================
  const canInteractInPlay =
    isLaunched && hasBinding && !isStartupLocked && !isManualCooldown;

  const handleToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!canInteractInPlay) return;

    const nextUi = !uiIsOn;
    setUiIsOn(nextUi);

    // ✅ start cooldown after every manual toggle
    setCooldownUntil(Date.now() + Math.max(0, Number(lockMs) || 4000));

    // ✅ convert UI state to DO value with inversion:
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
      } catch {
        // keep UI (no snap-back)
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

  // ✅ show offline badge even if status is empty (unknown) — only when bound
  const showOffline = hasBinding && deviceStatus === "offline";

  // cursor logic
  const hoverCursor = canEdit
    ? "move"
    : canInteractInPlay
    ? "pointer"
    : isLaunched && hasBinding && (isStartupLocked || isManualCooldown)
    ? "not-allowed"
    : "default";

  // pointer events:
  // - EDIT: same as before (visualOnly disables interaction)
  // - PLAY: allow interaction for manual toggle ONLY if has binding
  const allowPointerEvents =
    (visualOnly ? false : true) || (isLaunched && hasBinding);

  // ✅ overlay only visual dim (NO TEXT)
  const showOverlay =
    isLaunched && hasBinding && (isStartupLocked || isManualCooldown);

  return (
    <>
      <div
        title={!hasBinding ? "Bind this toggle to a DO" : uiIsOn ? "ON" : "OFF"}
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
          opacity: showOverlay ? 0.92 : 1,
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

          {/* Lock/Cooldown overlay (NO TEXT) */}
          {showOverlay && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.22))",
              }}
            />
          )}
        </div>

        {/* ✅ OFFLINE badge (right side) */}
        {showOffline && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: -78,
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.92)",
              border: "2px solid #dc2626",
              color: "#dc2626",
              fontWeight: 1000,
              fontSize: 14,
              padding: "6px 10px",
              borderRadius: 10,
              letterSpacing: 0.5,
              boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            OFFLINE
          </div>
        )}
      </div>

      <ToggleSwitchPropertiesModal
        open={openProps}
        toggleSwitch={widget}
        onClose={() => setOpenProps(false)}
        onSave={(nextWidget) => {
          if (typeof onSaveWidget === "function") onSaveWidget(nextWidget);
        }}
        isLaunched={isLaunched}
        dashboardId={dashboardId}
      />
    </>
  );
}