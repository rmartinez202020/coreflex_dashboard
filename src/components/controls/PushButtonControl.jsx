import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

function readDiFromRow(row, field) {
  if (!row || !field) return undefined;

  const f = String(field).toLowerCase().trim();
  if (!/^di[1-6]$/.test(f)) return undefined;

  if (row[f] !== undefined) return row[f];

  const up = f.toUpperCase();
  if (row[up] !== undefined) return row[up];

  const n = f.replace("di", "");
  const alt = `in${n}`;
  if (row[alt] !== undefined) return row[alt];

  const altUp = `IN${n}`;
  if (row[altUp] !== undefined) return row[altUp];

  return undefined;
}

function readStatusFromRow(row) {
  return String(
    row?.status ??
      row?.Status ??
      row?.onlineStatus ??
      row?.connectionStatus ??
      ""
  )
    .trim()
    .toLowerCase();
}

function readErrorMessage(payload) {
  const detail = payload?.detail;

  if (typeof detail === "string") return detail;
  if (typeof detail?.error === "string") return detail.error;
  if (typeof detail?.message === "string") return detail.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;

  return "";
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

  if (!dash || !wid) {
    throw new Error("Missing dashboardId/widgetId for write");
  }

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

    const message = readErrorMessage(detail);
    const detailText = JSON.stringify(detail || {}).toLowerCase();

    const isInterlockBlocked =
      String(message || "").toLowerCase().includes("interlock") ||
      detailText.includes("interlock");

    return {
      ok: false,
      busy: !isInterlockBlocked,
      interlockBlocked: isInterlockBlocked,
      status: 409,
      message: isInterlockBlocked
        ? "Interlock Active"
        : message || "Control Action in Progress",
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

async function fetchBackendBinding({
  dashboardId,
  widgetId,
  tenantEmail = "",
  tenantAccessLevel = "",
}) {
  const dash = String(dashboardId || "").trim();
  const wid = String(widgetId || "").trim();
  const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
  const tenantAccessSafe = String(tenantAccessLevel || "").trim();

  if (!dash || !wid) return null;

  const headers = {
    ...getAuthHeaders(),
    ...(tenantEmailSafe ? { "X-Tenant-Email": tenantEmailSafe } : {}),
    ...(tenantAccessSafe ? { "X-Tenant-Access": tenantAccessSafe } : {}),
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  const qs = new URLSearchParams({
    dashboardId: dash,
    widgetId: wid,
    _ts: String(Date.now()),
  });

  const candidates = [
    `${API_URL}/control-bindings/binding?${qs.toString()}`,
    `${API_URL}/control-bindings/resolve?${qs.toString()}`,
    `${API_URL}/control-bindings/${encodeURIComponent(
      dash
    )}/${encodeURIComponent(wid)}?_ts=${Date.now()}`,
    `${API_URL}/control-bindings?${qs.toString()}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!res.ok) continue;

      const data = await res.json().catch(() => null);
      if (!data) continue;

      if (Array.isArray(data)) {
        const found =
          data.find(
            (r) =>
              String(r?.dashboardId ?? r?.dashboard_id ?? "").trim() === dash &&
              String(r?.widgetId ?? r?.widget_id ?? "").trim() === wid
          ) || null;

        if (found) return found;
      } else {
        const item = data?.binding || data?.row || data?.item || data;
        if (item && typeof item === "object") return item;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

function isLaunchRoute() {
  try {
    const p = String(window?.location?.pathname || "").toLowerCase();
    return p.includes("launch");
  } catch {
    return false;
  }
}

function getPublicLaunchParamsFromPath() {
  try {
    const path = String(window?.location?.pathname || "").trim();
    const parts = path.split("/").filter(Boolean);

    const idx = parts.findIndex(
      (p) => String(p || "").toLowerCase() === "launchdashboard"
    );

    if (idx < 0) return { dashboardSlug: "", publicLaunchId: "" };

    const dashboardSlug = String(parts[idx + 1] || "").trim();
    const publicLaunchId = String(parts[idx + 2] || "").trim();

    return { dashboardSlug, publicLaunchId };
  } catch {
    return { dashboardSlug: "", publicLaunchId: "" };
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

function buildRuntimeConfig({ row, widget }) {
  const p = widget?.properties || {};
  const bindingProps = row || {};
  const interlock = p.interlock || {};

  const bindDeviceId = String(
    bindingProps.deviceId ||
      bindingProps.device_id ||
      bindingProps.bindDeviceId ||
      bindingProps.bind_device_id ||
      p.bindDeviceId ||
      p?.tag?.deviceId ||
      ""
  ).trim();

  const bindField = String(
    bindingProps.field ||
      bindingProps.bindField ||
      bindingProps.bind_field ||
      p.bindField ||
      p?.tag?.field ||
      ""
  )
    .trim()
    .toLowerCase();

  const interlockEnabled =
    Boolean(bindingProps.interlock_enabled) ||
    Boolean(bindingProps.interlockEnabled) ||
    Boolean(interlock.enabled) ||
    Boolean(p.interlock_enabled);

  const interlockDeviceId = String(
    bindingProps.interlock_device_id ||
      bindingProps.interlockDeviceId ||
      interlock.deviceId ||
      p.interlock_device_id ||
      ""
  ).trim();

  const interlockField = String(
    bindingProps.interlock_field ||
      bindingProps.interlockField ||
      interlock.field ||
      p.interlock_field ||
      ""
  )
    .trim()
    .toLowerCase();

  const interlockType = String(
    bindingProps.interlock_type ||
      bindingProps.interlockType ||
      interlock.type ||
      p.interlock_type ||
      "NO"
  )
    .trim()
    .toUpperCase();

  const hasBinding = !!bindDeviceId && /^do[1-4]$/.test(bindField);

  const hasInterlockConfig =
    interlockEnabled &&
    !!interlockDeviceId &&
    /^di[1-6]$/.test(interlockField) &&
    (interlockType === "NO" || interlockType === "NC");

  return {
    bindDeviceId,
    bindField,
    hasBinding,
    interlockEnabled,
    interlockDeviceId,
    interlockField,
    interlockType,
    hasInterlockConfig,
  };
}

async function fetchRuntimeStatus({
  config,
  tenantEmail = "",
  tenantAccessLevel = "",
}) {
  const token = String(getToken() || "").trim();
  const tenantEmailSafe = String(tenantEmail || "").trim().toLowerCase();
  const tenantAccessSafe = String(tenantAccessLevel || "").trim();

  let url = "";
  const headers = {
    ...getAuthHeaders(),
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  const isPublicLaunch = !token && !!tenantEmailSafe;

  if (isPublicLaunch) {
    const { dashboardSlug, publicLaunchId } = getPublicLaunchParamsFromPath();

    if (!dashboardSlug || !publicLaunchId || !tenantEmailSafe) {
      return {
        ok: false,
        offline: true,
        interlockActive: false,
        interlockKnown: false,
      };
    }

    const qs = new URLSearchParams({
      dashboard_slug: dashboardSlug,
      public_launch_id: publicLaunchId,
      tenant_email: tenantEmailSafe,
    });

    url = `${API_URL}/tenant-access/devices?${qs.toString()}`;
  } else {
    if (!token) {
      return {
        ok: false,
        offline: true,
        interlockActive: false,
        interlockKnown: false,
      };
    }

    url = `${API_URL}/zhc1921/my-devices`;
  }

  if (tenantEmailSafe) headers["X-Tenant-Email"] = tenantEmailSafe;
  if (tenantAccessSafe) headers["X-Tenant-Access"] = tenantAccessSafe;

  const res = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    return {
      ok: false,
      offline: true,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  const data = await res.json().catch(() => []);
  const list = Array.isArray(data) ? data : [];

  const controlRow =
    list.find(
      (r) =>
        String(r?.deviceId ?? r?.device_id ?? "").trim() ===
        config.bindDeviceId
    ) || null;

  if (!controlRow) {
    return {
      ok: false,
      offline: true,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  const status = readStatusFromRow(controlRow);
  const offline = status === "offline" || !status;

  if (offline) {
    return {
      ok: true,
      offline: true,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  if (!config.hasInterlockConfig) {
    return {
      ok: true,
      offline: false,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  const interlockRow =
    list.find(
      (r) =>
        String(r?.deviceId ?? r?.device_id ?? "").trim() ===
        config.interlockDeviceId
    ) || null;

  if (!interlockRow) {
    return {
      ok: true,
      offline: false,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  const rawDi = readDiFromRow(interlockRow, config.interlockField);
  const di01 = to01(rawDi);

  if (di01 === null) {
    return {
      ok: true,
      offline: false,
      interlockActive: false,
      interlockKnown: false,
    };
  }

  const active = config.interlockType === "NC" ? di01 === 0 : di01 === 1;

  return {
    ok: true,
    offline: false,
    interlockActive: active,
    interlockKnown: true,
  };
}

export default function PushButtonControl({
  variant = "NO",
  width = 110,
  height = 110,
  pressed = false,
  label,
  title = "",
  onPressStart,
  onPressEnd,
  disabled = false,

  isLaunched = false,
  visualOnly = false,
  widget = null,
  dashboardId = null,
  pulseMs = 12000,
  onWrite = null,

  tenantEmail = "",
  tenantAccessLevel = "",
}) {
  const [localPressed, setLocalPressed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [banner, setBanner] = useState({ kind: "none", text: "" });
  const [deviceStatus, setDeviceStatus] = useState("");

  const [interlockActive, setInterlockActive] = useState(false);
  const [interlockKnown, setInterlockKnown] = useState(false);
  const [backendInterlockBlocked, setBackendInterlockBlocked] = useState(false);

  const pointerActiveRef = useRef(false);
  const runningRef = useRef(false);
  const pulseTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  const play = !!isLaunched || isLaunchRoute();

  const resolvedWidgetId = resolveWidgetId(widget);
  const resolvedDashboardId = resolveDashboardId({ dashboardId, widget });

  const p = widget?.properties || {};
  const localConfig = buildRuntimeConfig({ row: null, widget });

  const hasLocalBinding = localConfig.hasBinding;
  const hasRuntimeIdentity = !!resolvedDashboardId && !!resolvedWidgetId;

  const isOffline = play && deviceStatus === "offline";

  const safeW = Math.max(70, Number(width) || 110);
  const safeH = Math.max(70, Number(height) || 110);
  const size = Math.min(safeW, safeH);
  const containerW = Math.max(150, safeW);
  const bezel = Math.max(5, Math.round(size * 0.075));
  const ring = Math.max(4, Math.round(size * 0.06));
  const btn = size - bezel * 2 - ring * 2;

  const isGreen = String(variant).toUpperCase() === "NO";
  const text = (label ?? (isGreen ? "NO" : "NC")).toUpperCase();

  const pulseStartValue01 = isGreen ? 1 : 0;
  const pulseEndValue01 = isGreen ? 0 : 1;

  const isPressed = !!pressed || localPressed;
  const safeTitle = String(title || "").trim();

  const bezelBg =
    "linear-gradient(180deg, #2B2B2B 0%, #0E0E0E 55%, #1B1B1B 100%)";

  const ringBg =
    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.55) 100%)";

  const faceBg = isGreen
    ? "linear-gradient(180deg, #66FF87 0%, #2DE255 55%, #11AA31 100%)"
    : "linear-gradient(180deg, #FF6060 0%, #E60000 55%, #B20000 100%)";

  const pressDepth = Math.max(4, Math.round(size * 0.055));
  const translateY = isPressed ? pressDepth : 0;

  const faceShadow = isPressed
    ? "inset 0 12px 18px rgba(0,0,0,0.60), inset 0 2px 6px rgba(255,255,255,0.10)"
    : "0 10px 18px rgba(0,0,0,0.42), inset 0 2px 8px rgba(255,255,255,0.12), inset 0 -10px 14px rgba(0,0,0,0.35)";

  const highlight = isGreen
    ? "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)"
    : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)";

  const ariaLabel = useMemo(() => {
    const name = isGreen
      ? "Normally Open push button"
      : "Normally Closed push button";
    const titlePart = safeTitle ? ` ${safeTitle}` : "";
    const labelPart = label ? ` ${label}` : "";
    return `${name}${titlePart}${labelPart}`.trim();
  }, [isGreen, label, safeTitle]);

  const bannerStyle = {
    width: containerW,
    marginTop: 6,
    textAlign: "center",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.25,
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  };

  function clearBannerTimer() {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }

  function showBanner(kind, text, ms = null) {
    setBanner({ kind, text: String(text || "") });
    clearBannerTimer();

    if (ms && ms > 0) {
      bannerTimerRef.current = setTimeout(() => {
        setBanner({ kind: "none", text: "" });
      }, ms);
    }
  }

  function hardBlockInterlock() {
    pointerActiveRef.current = false;
    setLocalPressed(false);
    setIsBusy(false);
    runningRef.current = false;

    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
  }

  async function prepareRuntimeForPress() {
    const row = await fetchBackendBinding({
      dashboardId: resolvedDashboardId,
      widgetId: resolvedWidgetId,
      tenantEmail,
      tenantAccessLevel,
    });

    const config = buildRuntimeConfig({ row, widget });

    if (!config.hasBinding) {
      return {
        ok: false,
        reason: "missing_binding",
        config,
        status: null,
      };
    }

    const status = await fetchRuntimeStatus({
      config,
      tenantEmail,
      tenantAccessLevel,
    });

    setDeviceStatus(status.offline ? "offline" : "online");
    setInterlockActive(status.interlockActive);
    setInterlockKnown(status.interlockKnown);

    if (status.offline) {
      return {
        ok: false,
        reason: "offline",
        config,
        status,
      };
    }

    if (status.interlockKnown && status.interlockActive) {
      return {
        ok: false,
        reason: "interlock",
        config,
        status,
      };
    }

    setBackendInterlockBlocked(false);

    return {
      ok: true,
      reason: "",
      config,
      status,
    };
  }

  async function performPulse() {
    if (!play || visualOnly || disabled || isBusy || runningRef.current) return;

    const wid = resolvedWidgetId;
    const dash = resolvedDashboardId;

    if (!dash || !wid) {
      showBanner("error", "Write blocked", 4000);
      return;
    }

    setIsBusy(true);
    showBanner("occupied", "Checking interlock", null);

    try {
      const prepared = await prepareRuntimeForPress();

      if (!prepared.ok) {
        setIsBusy(false);
        runningRef.current = false;
        setLocalPressed(false);

        if (prepared.reason === "interlock") {
          setBackendInterlockBlocked(true);
          hardBlockInterlock();
          showBanner("error", "Interlock Active", 5000);
          return;
        }

        if (prepared.reason === "offline") {
          showBanner("error", "Offline", 5000);
          return;
        }

        showBanner("error", "Write blocked", 4000);
        return;
      }

      runningRef.current = true;
      setLocalPressed(true);
      showBanner("occupied", "Control Action in Progress", null);

      let resp = null;

      if (typeof onWrite === "function") {
        resp = await onWrite({
          deviceId: prepared.config.bindDeviceId,
          field: prepared.config.bindField,
          value01: pulseStartValue01,
          widget,
          tenantEmail,
          tenantAccessLevel,
        });
      } else {
        resp = await defaultWriteToBackend({
          dashboardId: dash,
          widgetId: wid,
          value01: pulseStartValue01,
          tenantEmail,
          tenantAccessLevel,
        });
      }

      if (resp?.interlockBlocked === true) {
        setInterlockActive(true);
        setInterlockKnown(true);
        setBackendInterlockBlocked(true);
        hardBlockInterlock();
        showBanner("error", "Interlock Active", 5000);
        return;
      }

      if (resp?.busy === true || resp?.status === 409) {
        setLocalPressed(false);
        setIsBusy(false);
        runningRef.current = false;
        showBanner("occupied", "Control Action in Progress", 4000);
        return;
      }

      const ok = resp?.ok !== false;
      if (!ok) {
        setLocalPressed(false);
        setIsBusy(false);
        runningRef.current = false;
        showBanner("error", "Failed", 4000);
        return;
      }

      pulseTimerRef.current = setTimeout(async () => {
        try {
          let endResp = null;

          if (typeof onWrite === "function") {
            endResp = await onWrite({
              deviceId: prepared.config.bindDeviceId,
              field: prepared.config.bindField,
              value01: pulseEndValue01,
              widget,
              tenantEmail,
              tenantAccessLevel,
            });
          } else {
            endResp = await defaultWriteToBackend({
              dashboardId: dash,
              widgetId: wid,
              value01: pulseEndValue01,
              tenantEmail,
              tenantAccessLevel,
            });
          }

          if (endResp?.interlockBlocked === true) {
            setInterlockActive(true);
            setInterlockKnown(true);
            setBackendInterlockBlocked(true);
            hardBlockInterlock();
            showBanner("error", "Interlock Active", 5000);
            return;
          }

          const endOk = endResp?.ok !== false;
          if (!endOk && !(endResp?.busy === true || endResp?.status === 409)) {
            showBanner("error", "Failed", 4000);
          } else {
            showBanner("none", "");
          }
        } catch (err) {
          const msg = String(err?.message || err || "").toLowerCase();

          if (msg.includes("interlock")) {
            setInterlockActive(true);
            setInterlockKnown(true);
            setBackendInterlockBlocked(true);
            hardBlockInterlock();
            showBanner("error", "Interlock Active", 5000);
          } else {
            showBanner("error", "Failed", 4000);
          }
        } finally {
          setLocalPressed(false);
          setIsBusy(false);
          runningRef.current = false;
          pulseTimerRef.current = null;
        }
      }, Math.max(500, Number(pulseMs) || 12000));
    } catch (err) {
      const msg = String(err?.message || err || "").toLowerCase();

      if (msg.includes("interlock")) {
        setInterlockActive(true);
        setInterlockKnown(true);
        setBackendInterlockBlocked(true);
        hardBlockInterlock();
        showBanner("error", "Interlock Active", 5000);
      } else {
        setLocalPressed(false);
        setIsBusy(false);
        runningRef.current = false;
        showBanner("error", "Failed", 4000);
      }
    }
  }

  function handlePressStart(e) {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    pointerActiveRef.current = true;

    if (play) {
      if (visualOnly || isBusy || runningRef.current || !hasRuntimeIdentity) {
        return;
      }

      onPressStart?.(e);
      void performPulse();
      return;
    }

    setLocalPressed(true);
    onPressStart?.(e);
  }

  function handlePressEnd(e) {
    if (disabled) return;

    if (play) {
      e.preventDefault();
      e.stopPropagation();
      pointerActiveRef.current = false;
      onPressEnd?.(e);
      return;
    }

    if (!pointerActiveRef.current && !localPressed) return;

    e.preventDefault();
    e.stopPropagation();

    pointerActiveRef.current = false;
    setLocalPressed(false);

    onPressEnd?.(e);
  }

  function handleKeyDown(e) {
    if (disabled) return;
    if (e.key !== " " && e.key !== "Enter") return;
    if (pointerActiveRef.current) return;

    e.preventDefault();

    pointerActiveRef.current = true;

    if (play) {
      if (visualOnly || isBusy || runningRef.current || !hasRuntimeIdentity) {
        return;
      }

      onPressStart?.(e);
      void performPulse();
      return;
    }

    setLocalPressed(true);
    onPressStart?.(e);
  }

  function handleKeyUp(e) {
    if (disabled) return;
    if (e.key !== " " && e.key !== "Enter") return;

    e.preventDefault();
    pointerActiveRef.current = false;

    if (play) {
      onPressEnd?.(e);
      return;
    }

    setLocalPressed(false);
    onPressEnd?.(e);
  }

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      clearBannerTimer();
    };
  }, []);

  const showOfflineText = isOffline;

  const showInterlockActiveText =
    !showOfflineText &&
    (backendInterlockBlocked || (interlockKnown && interlockActive));

  const showBusyText =
    !showOfflineText &&
    !showInterlockActiveText &&
    banner.kind === "occupied" &&
    !!banner.text;

  const showErrorText =
    !showOfflineText &&
    !showInterlockActiveText &&
    banner.kind === "error" &&
    !!banner.text;

  const cursorBlocked =
    disabled ||
    isBusy ||
    !hasRuntimeIdentity ||
    (!hasLocalBinding && !hasRuntimeIdentity);

  return (
    <div
      style={{
        width: containerW,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: safeTitle ? 6 : 0,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {safeTitle && (
        <div
          style={{
            minWidth: containerW,
            width: containerW,
            maxWidth: containerW,
            textAlign: "center",
            fontWeight: 900,
            fontSize: 18,
            color: "#0f172a",
            letterSpacing: 0.3,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {safeTitle}
        </div>
      )}

      <div
        role="button"
        tabIndex={cursorBlocked ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed={isPressed}
        aria-disabled={cursorBlocked}
        onPointerDown={play ? handlePressStart : undefined}
        onPointerUp={play ? handlePressEnd : undefined}
        onPointerCancel={play ? handlePressEnd : undefined}
        onPointerLeave={play ? handlePressEnd : undefined}
        onKeyDown={play ? handleKeyDown : undefined}
        onKeyUp={play ? handleKeyUp : undefined}
        style={{
          width: containerW,
          height: safeH,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: play ? "none" : "auto",
          WebkitTouchCallout: "none",
          cursor: play ? (cursorBlocked ? "not-allowed" : "pointer") : "default",
          opacity: disabled ? 0.7 : showInterlockActiveText ? 0.75 : 1,
        }}
        title={
          play
            ? !hasRuntimeIdentity
              ? "Bind this push button to a DO"
              : isOffline
              ? "Device Offline"
              : showInterlockActiveText
              ? "Interlock Active"
              : isBusy
              ? "Control Action in Progress"
              : safeTitle || text
            : safeTitle || text
        }
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            background: bezelBg,
            boxShadow: "0 10px 18px rgba(0,0,0,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: bezel,
          }}
        >
          <div
            style={{
              width: size - bezel * 2,
              height: size - bezel * 2,
              borderRadius: (size - bezel * 2) / 2,
              background: "#0A0A0A",
              boxShadow:
                "inset 0 8px 16px rgba(0,0,0,0.75), inset 0 -2px 6px rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: ring,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: Math.max(1, ring - 2),
                borderRadius: "999px",
                background: ringBg,
                pointerEvents: "none",
                opacity: 0.9,
              }}
            />

            <div
              style={{
                width: btn,
                height: btn,
                borderRadius: btn / 2,
                background: faceBg,
                transform: `translateY(${translateY}px) scale(${
                  isPressed ? 0.985 : 1
                })`,
                transition: "transform 120ms ease, box-shadow 120ms ease",
                boxShadow: faceShadow,
                border: "1px solid rgba(0,0,0,0.40)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: Math.max(6, Math.round(btn * 0.085)),
                  borderRadius: "999px",
                  background: highlight,
                  pointerEvents: "none",
                  opacity: isPressed ? 0.22 : 0.42,
                  transition: "opacity 120ms ease",
                }}
              />

              <div
                style={{
                  fontWeight: 900,
                  color: "white",
                  fontSize: Math.max(14, Math.round(btn * 0.24)),
                  letterSpacing: Math.max(1, Math.round(btn * 0.02)),
                  textShadow: "0 2px 4px rgba(0,0,0,0.55)",
                  transform: `translateY(${isPressed ? 1 : 0}px)`,
                  transition: "transform 120ms ease",
                }}
              >
                {text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOfflineText && (
        <div
          style={{
            ...bannerStyle,
            color: "#dc2626",
            fontWeight: 400,
          }}
        >
          Offline
        </div>
      )}

      {showInterlockActiveText && (
        <div
          style={{
            ...bannerStyle,
            color: "#dc2626",
            fontWeight: 700,
          }}
        >
          Interlock Active
        </div>
      )}

      {showBusyText && (
        <div style={{ ...bannerStyle, color: "#d97706" }}>{banner.text}</div>
      )}

      {showErrorText && (
        <div
          style={{
            ...bannerStyle,
            color: "#dc2626",
            fontWeight: 600,
          }}
        >
          {banner.text}
        </div>
      )}
    </div>
  );
}