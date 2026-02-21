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

// ✅ Default backend writer (so Launch works even if parent forgot to pass onWrite)
async function defaultWriteToBackend({ dashboardId, widgetId, value01 }) {
  const dash = String(dashboardId || "").trim();
  const wid = String(widgetId || "").trim();

  if (!dash || !wid) throw new Error("Missing dashboardId/widgetId for write");

  const res = await fetch(`${API_URL}/control-bindings/write`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: JSON.stringify({
      dashboardId: dash,
      widgetId: wid,
      value01: Number(value01) ? 1 : 0,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Write failed (${res.status})`);
  }

  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}

function isLaunchRoute() {
  try {
    const p = String(window?.location?.pathname || "").toLowerCase();
    return p.includes("launch");
  } catch {
    return false;
  }
}

// ✅ Resolve ids robustly (Launch sometimes uses different shapes)
function resolveWidgetId(widget) {
  return String(
    widget?.id ??
      widget?.widgetId ??
      widget?._id ??
      widget?.uuid ??
      widget?.properties?.widgetId ??
      ""
  ).trim();
}
function resolveDashboardId({ dashboardId, widget }) {
  return String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();
}

export default function ToggleSwitchControl({
  isOn = true,

  width = 180,
  height = 70,

  visualOnly = true,
  isLaunched = false,

  widget = null,
  onSaveWidget = null,

  dashboardId = null,

  onWrite = null,

  lockMs = 4000, // also used as manual cooldown
  pollMs = 2000,
}) {
  const [openProps, setOpenProps] = React.useState(false);

  // ✅ Launch auto-detect
  const play = !!isLaunched || isLaunchRoute();

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
  // ✅ Mapping:
  // DO=1 -> UI OFF
  // DO=0 -> UI ON
  // =========================
  const [uiIsOn, setUiIsOn] = React.useState(() => {
    const v01 = to01(isOn);
    if (v01 === null) return true;
    return v01 === 0; // invert
  });

  const [deviceStatus, setDeviceStatus] = React.useState(""); // "online" | "offline" | ""
  const isOffline = hasBinding && deviceStatus === "offline";

  // ✅ Track if we were offline (so we can resync DO once we come back online)
  const wasOfflineRef = React.useRef(false);
  React.useEffect(() => {
    if (isOffline) wasOfflineRef.current = true;
  }, [isOffline]);

  // keep uiIsOn in sync with prop ONLY when not launched
  React.useEffect(() => {
    if (play) return;
    const v01 = to01(isOn);
    if (v01 === null) return;
    setUiIsOn(v01 === 0);
  }, [isOn, play]);

  // close modal if switching to launched
  React.useEffect(() => {
    if (play && openProps) setOpenProps(false);
  }, [play, openProps]);

  // =========================
  // ✅ TIME TICK (lock + cooldown)
  // =========================
  const [nowTick, setNowTick] = React.useState(Date.now());
  React.useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setNowTick(Date.now()), 150);
    return () => clearInterval(t);
  }, [play]);

  // =========================
  // ✅ STARTUP LOCK WINDOW
  // =========================
  const [lockedUntil, setLockedUntil] = React.useState(0);

  React.useEffect(() => {
    if (!play) {
      setLockedUntil(0);
      return;
    }
    setLockedUntil(Date.now() + Math.max(0, Number(lockMs) || 4000));
  }, [play, lockMs]);

  const isStartupLocked = play && nowTick < lockedUntil;

  // =========================
  // ✅ MANUAL COOLDOWN
  // =========================
  const [cooldownUntil, setCooldownUntil] = React.useState(0);

  React.useEffect(() => {
    if (!play) setCooldownUntil(0);
  }, [play]);

  const isManualCooldown = play && nowTick < cooldownUntil;

  // =========================
  // ✅ Fetch DO + status
  // Rules:
  // - Always fetch once at play start
  // - Poll during startup lock
  // - ALSO poll while offline (so Offline label clears when online returns)
  // - When coming back online after offline: resync DO ONCE
  // =========================
  const fetchRemote = React.useCallback(async () => {
    if (!play) return;
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

      const status = readStatusFromRow(row);
      setDeviceStatus(status);

      // ✅ If offline, do not try to sync DO (just keep polling until online)
      if (status === "offline") return;

      // ✅ Sync DO only in these cases:
      // 1) during startup lock (first 4 seconds)
      // 2) when we were offline and now we are back online (resync once)
      const shouldSync =
        isStartupLocked || (wasOfflineRef.current && status === "online");

      if (!shouldSync) return;

      const raw = readDoFromRow(row, bindField);
      const do01 = to01(raw);
      if (do01 === null) return;

      setUiIsOn(do01 === 0); // invert

      // ✅ consume the "offline recovery" one-time sync
      if (wasOfflineRef.current) wasOfflineRef.current = false;
    } catch {
      // ignore
    }
  }, [play, hasBinding, bindDeviceId, bindField, isStartupLocked]);

  // Fetch once when play starts
  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;
    fetchRemote();
  }, [play, hasBinding, fetchRemote]);

  // Poll during startup lock OR while offline
  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;

    const shouldPoll = isStartupLocked || isOffline;
    if (!shouldPoll) return;

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchRemote();
    }, Math.max(500, Number(pollMs) || 2000));

    return () => clearInterval(t);
  }, [play, hasBinding, isStartupLocked, isOffline, fetchRemote, pollMs]);

  // =========================
  // ✅ Manual toggle in PLAY:
  // Blocked when offline
  // =========================
  const canInteractInPlay =
    play && hasBinding && !isOffline && !isStartupLocked && !isManualCooldown;

  const handleToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!canInteractInPlay) return;

    const nextUi = !uiIsOn;
    setUiIsOn(nextUi);

    setCooldownUntil(Date.now() + Math.max(0, Number(lockMs) || 4000));

    // UI ON => DO 0
    // UI OFF => DO 1
    const nextDo01 = nextUi ? 0 : 1;

    try {
      if (typeof onWrite === "function") {
        await onWrite({
          deviceId: bindDeviceId,
          field: bindField,
          value01: nextDo01,
          widget,
        });
      } else {
        const wid = resolveWidgetId(widget);
        const dash = resolveDashboardId({ dashboardId, widget });

        if (!dash || !wid) {
          console.error("Toggle write blocked: missing dashboardId/widgetId", {
            dashboardId: dash,
            widgetId: wid,
            widget,
          });
          return;
        }

        await defaultWriteToBackend({
          dashboardId: dash,
          widgetId: wid,
          value01: nextDo01,
        });
      }
    } catch (err) {
      console.error("Toggle write failed:", err);
    }
  };

  // =========================
  // VISUALS
  // =========================
  const bezelBg =
    "linear-gradient(180deg, #2B2B2B 0%, #0E0E0E 50%, #1C1C1C 100%)";
  const trackBg = "#0A0A0A";
  const panelBg = uiIsOn
    ? "linear-gradient(180deg, #63FF78 0%, #2EE04C 60%, #14A82E 100%)"
    : "linear-gradient(180deg, #FF4F4F 0%, #E00000 60%, #B10000 100%)";
  const knobBg =
    "linear-gradient(180deg, #3A3A3A 0%, #141414 60%, #2A2A2A 100%)";

  const knobLeft = uiIsOn ? trackPad : safeW - trackPad - knobSize;

  const canEdit = !visualOnly && !play;

  const hoverCursor = canEdit
    ? "move"
    : isOffline
    ? "not-allowed"
    : canInteractInPlay
    ? "pointer"
    : play && hasBinding && (isStartupLocked || isManualCooldown)
    ? "not-allowed"
    : "default";

  const allowPointerEvents =
    (visualOnly ? false : true) || (play && hasBinding);

  const showOverlay =
    play && hasBinding && (isOffline || isStartupLocked || isManualCooldown);

  return (
    <>
      <div style={{ display: "inline-flex", flexDirection: "column" }}>
        <div
          title={
            !hasBinding
              ? "Bind this toggle to a DO"
              : isOffline
              ? "Device Offline"
              : uiIsOn
              ? "ON"
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

            {/* Lock/Cooldown/offline overlay (NO TEXT) */}
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
        </div>

        {/* ✅ OFFLINE text under toggle (red, NOT bold) */}
        {isOffline && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#dc2626",
              fontWeight: 400, // not bold
              fontSize: 14,
              letterSpacing: 0.2,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Offline
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
        isLaunched={play}
        dashboardId={dashboardId}
      />
    </>
  );
}