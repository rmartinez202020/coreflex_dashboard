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

  const n = f.replace("do", "");
  const alt = `out${n}`;
  if (row[alt] !== undefined) return row[alt];

  const altUp = `OUT${n}`;
  if (row[altUp] !== undefined) return row[altUp];

  return undefined;
}

// ✅ Read DI value from backend device row
function readDiFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field).toLowerCase().trim();
  if (!/^di[1-6]$/.test(f)) return undefined;

  if (row[f] !== undefined) return row[f];

  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  return undefined;
}

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function readStatusFromRow(row) {
  return String(row?.status ?? row?.Status ?? "").trim().toLowerCase();
}

async function defaultWriteToBackend({
  dashboardId,
  widgetId,
  value01,
  tenantEmail = "",
  tenantAccessLevel = "",
}) {
  const dash = String(dashboardId || "").trim();
  const wid = String(widgetId || "").trim();
  const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
  const tenantAccessSafe = String(tenantAccessLevel || "").trim();

  if (!dash || !wid) throw new Error("Missing dashboardId/widgetId for write");

  const res = await fetch(`${API_URL}/control-bindings/write`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(tenantEmailSafe ? { "X-Tenant-Email": tenantEmailSafe } : {}),
      ...(tenantAccessSafe ? { "X-Tenant-Access": tenantAccessSafe } : {}),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    body: JSON.stringify({
      dashboardId: dash,
      widgetId: wid,
      value01: Number(value01) ? 1 : 0,
    }),
  });

  if (res.status === 409) {
    let detail = null;
    try {
      detail = await res.json();
    } catch {
      detail = null;
    }

    return {
      ok: false,
      busy: true,
      status: 409,
      message:
        detail?.detail?.error ||
        detail?.detail ||
        detail?.error ||
        "Control Action in Progress",
      detail,
    };
  }

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
  const v = String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.dashboard_id ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();

  return v || "main";
}

function resolveDashboardName({ dashboardName, widget }) {
  return String(
    dashboardName ??
      widget?.dashboardName ??
      widget?.dashboardTitle ??
      widget?.properties?.dashboardName ??
      widget?.properties?.dashboardTitle ??
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
  dashboardName = "",
  onSaveProject = null,
  onWrite = null,
  lockMs = 12000,
  pollMs = 12000,
  statusVerifyMs = 10000,
  actuationHoldMs = 10000,
  tenantEmail = "",
  tenantAccessLevel = "",
}) {
  const [openProps, setOpenProps] = React.useState(false);

  const play = !!isLaunched || isLaunchRoute();

  const safeW = Math.max(90, Number(width) || 180);
  const safeH = Math.max(40, Number(height) || 70);
  const radius = safeH / 2;

  const bezelPad = Math.max(2, Math.round(safeH * 0.045));
  const trackPad = Math.max(4, Math.round(safeH * 0.075));
  const panelInset = Math.max(8, Math.round(safeH * 0.13));

  const knobSize = safeH - trackPad * 2 + Math.round(safeH * 0.04);
  const knobTop = trackPad - Math.round(safeH * 0.015);

  const resolvedDashboardIdForWidget = React.useMemo(
    () => resolveDashboardId({ dashboardId, widget }),
    [dashboardId, widget]
  );

  const resolvedDashboardNameForWidget = React.useMemo(
    () => resolveDashboardName({ dashboardName, widget }),
    [dashboardName, widget]
  );

  const widgetForModal = React.useMemo(() => {
    const base = widget || {};
    const props = base?.properties || {};

    return {
      ...base,
      dashboardId: resolvedDashboardIdForWidget || base?.dashboardId || "",
      dashboardName:
        resolvedDashboardNameForWidget || base?.dashboardName || "",
      properties: {
        ...props,
        dashboardId: resolvedDashboardIdForWidget || props?.dashboardId || "",
        dashboardName:
          resolvedDashboardNameForWidget || props?.dashboardName || "",
      },
    };
  }, [widget, resolvedDashboardIdForWidget, resolvedDashboardNameForWidget]);

  const p = widget?.properties || {};

  // =========================
  // 🔒 Interlock config
  // Supports BOTH:
  // 1) saved widget properties: properties.interlock.enabled/deviceId/field/type
  // 2) backend-style fields: properties.interlock_enabled/interlock_device_id/...
  // =========================
  const interlock = p.interlock || {};

  const interlockEnabled =
    Boolean(interlock.enabled) || Boolean(p.interlock_enabled);

  const interlockDeviceId = String(
    interlock.deviceId || p.interlock_device_id || ""
  ).trim();

  const interlockField = String(
    interlock.field || p.interlock_field || ""
  )
    .trim()
    .toLowerCase();

  const interlockType = String(interlock.type || p.interlock_type || "NO")
    .trim()
    .toUpperCase();

  const hasInterlockConfig =
    interlockEnabled &&
    !!interlockDeviceId &&
    /^di[1-6]$/.test(interlockField) &&
    (interlockType === "NO" || interlockType === "NC");

  const bindDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "").trim();
  const bindField = String(p.bindField || p?.tag?.field || "")
    .trim()
    .toLowerCase();

  const hasBinding = !!bindDeviceId && /^do[1-4]$/.test(bindField);

  const title = String(p.title || "").trim();

  const token = String(getToken() || "").trim();
  const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
  const tenantAccessSafe = String(tenantAccessLevel || "").trim();
  const secureReadReady = !!token || !!tenantEmailSafe;

  const [uiIsOn, setUiIsOn] = React.useState(() => {
    const v01 = to01(isOn);
    if (v01 === null) return true;
    return v01 === 0;
  });

  const [deviceStatus, setDeviceStatus] = React.useState("");
  const isOffline = hasBinding && deviceStatus === "offline";

  // ✅ Runtime interlock state
  const [interlockActive, setInterlockActive] = React.useState(false);
  const [interlockKnown, setInterlockKnown] = React.useState(false);

  const [banner, setBanner] = React.useState({ kind: "none", text: "" });
  const bannerTimerRef = React.useRef(null);

  const pendingWriteRef = React.useRef(null);

  React.useEffect(() => {
    if (play) return;
    const v01 = to01(isOn);
    if (v01 === null) return;
    setUiIsOn(v01 === 0);
  }, [isOn, play]);

  React.useEffect(() => {
    if (play && openProps) setOpenProps(false);
  }, [play, openProps]);

  React.useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  function showBanner(kind, text, ms = null) {
    setBanner({ kind, text: String(text || "") });

    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = null;

    if (ms && ms > 0) {
      bannerTimerRef.current = setTimeout(() => {
        setBanner({ kind: "none", text: "" });
      }, ms);
    }
  }

  const [nowTick, setNowTick] = React.useState(Date.now());

  React.useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [play]);

  const [lockedUntil, setLockedUntil] = React.useState(0);

  React.useEffect(() => {
    if (!play) {
      setLockedUntil(0);
      return;
    }

    setLockedUntil(Date.now() + Math.max(0, Number(lockMs) || 6000));
  }, [play, lockMs]);

  const isStartupLocked = play && nowTick < lockedUntil;

  const [cooldownUntil, setCooldownUntil] = React.useState(0);

  React.useEffect(() => {
    if (!play) setCooldownUntil(0);
  }, [play]);

  const isManualCooldown = play && nowTick < cooldownUntil;

  const fetchRemote = React.useCallback(async () => {
    if (!play) return;
    if (!hasBinding) return;
    if (!secureReadReady) return;

    try {
      const res = await fetch(`${API_URL}/zhc1921/my-devices`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          ...(tenantEmailSafe ? { "X-Tenant-Email": tenantEmailSafe } : {}),
          ...(tenantAccessSafe ? { "X-Tenant-Access": tenantAccessSafe } : {}),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const controlRow =
        list.find(
          (r) => String(r.deviceId ?? r.device_id ?? "").trim() === bindDeviceId
        ) || null;

      if (!controlRow) {
        setDeviceStatus("offline");
        setInterlockKnown(false);
        return;
      }

      const status = readStatusFromRow(controlRow);
      setDeviceStatus(status);

      if (status === "offline") {
        setInterlockKnown(false);
        return;
      }

      // =========================
      // 🔒 Evaluate interlock DI
      // =========================
      if (hasInterlockConfig) {
        const interlockRow =
          list.find(
            (r) =>
              String(r.deviceId ?? r.device_id ?? "").trim() ===
              interlockDeviceId
          ) || null;

        if (interlockRow) {
          const rawDi = readDiFromRow(interlockRow, interlockField);
          const di01 = to01(rawDi);

          if (di01 !== null) {
            const active =
              interlockType === "NC" ? di01 === 0 : di01 === 1;

            setInterlockActive(active);
            setInterlockKnown(true);
          } else {
            setInterlockActive(false);
            setInterlockKnown(false);
          }
        } else {
          setInterlockActive(false);
          setInterlockKnown(false);
        }
      } else {
        setInterlockActive(false);
        setInterlockKnown(false);
      }

      const raw = readDoFromRow(controlRow, bindField);
      const do01 = to01(raw);
      if (do01 === null) return;

      if (pendingWriteRef.current !== null && do01 === pendingWriteRef.current) {
        pendingWriteRef.current = null;
        showBanner("success", "Successful", 4000);
      }

      setUiIsOn(do01 === 0);
    } catch {
      // ignore
    }
  }, [
    play,
    hasBinding,
    secureReadReady,
    tenantEmailSafe,
    tenantAccessSafe,
    bindDeviceId,
    bindField,
    hasInterlockConfig,
    interlockDeviceId,
    interlockField,
    interlockType,
  ]);

  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;
    if (!secureReadReady) return;

    fetchRemote();
  }, [play, hasBinding, secureReadReady, fetchRemote]);

  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;
    if (!secureReadReady) return;

    const tries = [800, 1800, 3200, 5000];

    const timers = tries.map((ms) =>
      setTimeout(() => {
        fetchRemote();
      }, ms)
    );

    return () => timers.forEach(clearTimeout);
  }, [play, hasBinding, secureReadReady, fetchRemote]);

  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;
    if (!secureReadReady) return;

    fetchRemote();
  }, [secureReadReady, play, hasBinding, fetchRemote]);

  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;
    if (!secureReadReady) return;

    const ms = Math.max(500, Number(pollMs) || 12000);

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchRemote();
    }, ms);

    return () => clearInterval(t);
  }, [play, hasBinding, secureReadReady, fetchRemote, pollMs]);

  // ✅ Manual toggle in PLAY:
  // Blocked when offline/startup/cooldown.
  // Interlock blocks ONLY when trying to turn ON.
  const canInteractInPlay =
    play &&
    hasBinding &&
    secureReadReady &&
    !isOffline &&
    !isStartupLocked &&
    !isManualCooldown;

  const handleToggle = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!canInteractInPlay) return;

    const prevUi = uiIsOn;
    const nextUi = !uiIsOn;

    // UI ON => DO 0
    // UI OFF => DO 1
    const nextDo01 = nextUi ? 0 : 1;

    // 🔒 Interlock rule:
    // If DI is active, this toggle cannot turn ON.
    // Turning OFF is still allowed.
    if (hasInterlockConfig && interlockKnown && interlockActive && nextUi) {
      showBanner("error", "Blocked by interlock", 5000);
      return;
    }

    showBanner("none", "");

    setUiIsOn(nextUi);
    setCooldownUntil(Date.now() + Math.max(0, Number(lockMs) || 6000));
    pendingWriteRef.current = nextDo01;

    try {
      let resp = null;

      if (typeof onWrite === "function") {
        resp = await onWrite({
          deviceId: bindDeviceId,
          field: bindField,
          value01: nextDo01,
          widget,
          tenantEmail,
          tenantAccessLevel,
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

          pendingWriteRef.current = null;
          setUiIsOn(prevUi);
          showBanner("error", "Write blocked", 4000);
          return;
        }

        resp = await defaultWriteToBackend({
          dashboardId: dash,
          widgetId: wid,
          value01: nextDo01,
          tenantEmail,
          tenantAccessLevel,
        });
      }

      if (resp?.busy === true || resp?.status === 409) {
        pendingWriteRef.current = null;
        setUiIsOn(prevUi);

        setCooldownUntil(
          Date.now() + Math.max(0, Number(actuationHoldMs) || 10000)
        );

        showBanner(
          "occupied",
          resp?.message || "Control Action in Progress",
          12000
        );

        return;
      }

      const ok = resp?.ok !== false;
      const nodeRedOk = resp?.nodeRedOk === true;

      if (!ok) {
        pendingWriteRef.current = null;
        setUiIsOn(prevUi);
        showBanner("error", "Failed", 4000);
        return;
      }

      if (nodeRedOk) {
        showBanner("success", "Successful", 4000);
      } else {
        showBanner("none", "");
      }
    } catch (err) {
      const msg = String(err?.message || err || "");
      const looksLike409 =
        msg.includes("409") || msg.toLowerCase().includes("write in progress");

      if (looksLike409) {
        pendingWriteRef.current = null;
        setUiIsOn(prevUi);

        setCooldownUntil(
          Date.now() + Math.max(0, Number(actuationHoldMs) || 10000)
        );

        showBanner("occupied", "Control Action in Progress", 12000);
        return;
      }

      console.error("Toggle write failed:", err);
      pendingWriteRef.current = null;
      setUiIsOn(prevUi);
      showBanner("error", "Failed", 4000);
    }
  };

  React.useEffect(() => {
    if (!play) return;
    if (!hasBinding) return;

    if (isOffline) {
      pendingWriteRef.current = null;
      showBanner("none", "");
      setInterlockActive(false);
      setInterlockKnown(false);
    }
  }, [play, hasBinding, isOffline]);

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
    : !secureReadReady && play && hasBinding
    ? "not-allowed"
    : isOffline
    ? "not-allowed"
    : canInteractInPlay
    ? "pointer"
    : play && hasBinding && (isStartupLocked || isManualCooldown)
    ? "not-allowed"
    : "default";

  const allowPointerEvents = (visualOnly ? false : true) || (play && hasBinding);

  const showOverlay =
    play &&
    hasBinding &&
    (!secureReadReady || isOffline || isStartupLocked || isManualCooldown);

  const showOfflineText = play && secureReadReady && isOffline;
  const showOccupiedText = play && !isOffline && banner.kind === "occupied";
  const showSuccessText = play && !isOffline && banner.kind === "success";
  const showErrorText = play && !isOffline && banner.kind === "error";
  const showInterlockText =
    play &&
    !isOffline &&
    hasInterlockConfig &&
    interlockKnown &&
    interlockActive;

  return (
    <>
      <div style={{ display: "inline-flex", flexDirection: "column" }}>
        {title && (
          <div
            style={{
              marginBottom: 6,
              textAlign: "center",
              fontWeight: 900,
              fontSize: 14,
              color: "#0f172a",
              letterSpacing: 0.2,
              userSelect: "none",
              pointerEvents: "none",
              maxWidth: safeW,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={title}
          >
            {title}
          </div>
        )}

        <div
          title={
            !hasBinding
              ? "Bind this toggle to a DO"
              : !secureReadReady && play
              ? "Waiting for secure launch context"
              : isOffline
              ? "Device Offline"
              : showInterlockText
              ? "Interlock Active"
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

        {showOfflineText && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#dc2626",
              fontWeight: 400,
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

        {showInterlockText && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#d97706",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 0.25,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Interlock Active
          </div>
        )}

        {showOccupiedText && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#d97706",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 0.25,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {banner.text || "Control Action in Progress"}
          </div>
        )}

        {showSuccessText && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#16a34a",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 0.3,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {banner.text || "Successful"}
          </div>
        )}

        {showErrorText && (
          <div
            style={{
              marginTop: 6,
              textAlign: "center",
              color: "#dc2626",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 0.3,
              lineHeight: 1,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {banner.text || "Failed"}
          </div>
        )}
      </div>

      <ToggleSwitchPropertiesModal
        open={openProps}
        toggleSwitch={widgetForModal}
        onClose={() => setOpenProps(false)}
        onSave={(nextWidget) => {
          if (typeof onSaveWidget === "function") {
            const normalizedNext = {
              ...nextWidget,
              dashboardId:
                resolvedDashboardIdForWidget ||
                nextWidget?.dashboardId ||
                nextWidget?.properties?.dashboardId ||
                "",
              dashboardName:
                resolvedDashboardNameForWidget ||
                nextWidget?.dashboardName ||
                nextWidget?.properties?.dashboardName ||
                "",
              properties: {
                ...(nextWidget?.properties || {}),
                dashboardId:
                  resolvedDashboardIdForWidget ||
                  nextWidget?.properties?.dashboardId ||
                  "",
                dashboardName:
                  resolvedDashboardNameForWidget ||
                  nextWidget?.properties?.dashboardName ||
                  "",
              },
            };

            console.log("[ToggleSwitchControl] SAVE WIDGET", {
              widgetId: resolveWidgetId(normalizedNext),
              dashboardId: normalizedNext?.dashboardId,
              dashboardName: normalizedNext?.dashboardName,
            });

            onSaveWidget(normalizedNext);
          }
        }}
        isLaunched={play}
        dashboardId={resolvedDashboardIdForWidget}
        dashboardName={resolvedDashboardNameForWidget}
        onSaveProject={onSaveProject}
      />
    </>
  );
}