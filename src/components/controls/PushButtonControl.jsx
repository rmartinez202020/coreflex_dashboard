import React, { useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { getToken } from "../../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function defaultWriteToBackend({ dashboardId, widgetId, value01 }) {
  const dash = String(dashboardId || "").trim();
  const wid = String(widgetId || "").trim();

  if (!dash || !wid) {
    throw new Error("Missing dashboardId/widgetId for write");
  }

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
      message: "Control Action in Progress",
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
  return String(
    dashboardId ??
      widget?.dashboardId ??
      widget?.dashboard_id ??
      widget?.properties?.dashboardId ??
      widget?.properties?.dashboard_id ??
      ""
  ).trim();
}

export default function PushButtonControl({
  variant = "NO", // "NO" = green, "NC" = red
  width = 110,
  height = 110,
  pressed = false,
  label,
  title = "",
  onPressStart,
  onPressEnd,
  disabled = false,

  // ✅ runtime control props
  isLaunched = false,
  visualOnly = false,
  widget = null,
  dashboardId = null,
  pulseMs = 12000,
  onWrite = null,
}) {
  const [localPressed, setLocalPressed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [banner, setBanner] = useState({ kind: "none", text: "" });
  const pointerActiveRef = useRef(false);
  const runningRef = useRef(false);
  const pulseTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  const play = !!isLaunched || isLaunchRoute();

  const p = widget?.properties || {};
  const bindDeviceId = String(p.bindDeviceId || p?.tag?.deviceId || "").trim();
  const bindField = String(p.bindField || p?.tag?.field || "")
    .trim()
    .toLowerCase();
  const hasBinding = !!bindDeviceId && /^do[1-4]$/.test(bindField);

  const safeW = Math.max(70, Number(width) || 110);
  const safeH = Math.max(70, Number(height) || 110);
  const size = Math.min(safeW, safeH);

  const bezel = Math.max(5, Math.round(size * 0.075));
  const ring = Math.max(4, Math.round(size * 0.06));
  const btn = size - bezel * 2 - ring * 2;

  const isGreen = String(variant).toUpperCase() === "NO";
  const text = (label ?? (isGreen ? "NO" : "NC")).toUpperCase();

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

  const canActuateInPlay =
    play &&
    !visualOnly &&
    !disabled &&
    hasBinding &&
    !isBusy &&
    !runningRef.current;

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

  async function performPulse() {
    if (!canActuateInPlay) return;

    const wid = resolveWidgetId(widget);
    const dash = resolveDashboardId({ dashboardId, widget });

    if (!dash || !wid) {
      showBanner("error", "Write blocked", 4000);
      return;
    }

    runningRef.current = true;
    setIsBusy(true);
    setLocalPressed(true);
    showBanner("occupied", "Control Action in Progress", null);

    try {
      let resp = null;

      if (typeof onWrite === "function") {
        resp = await onWrite({
          deviceId: bindDeviceId,
          field: bindField,
          value01: 1, // ✅ Close = 1
          widget,
        });
      } else {
        resp = await defaultWriteToBackend({
          dashboardId: dash,
          widgetId: wid,
          value01: 1, // ✅ Close = 1
        });
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
              deviceId: bindDeviceId,
              field: bindField,
              value01: 0, // ✅ Open = 0
              widget,
            });
          } else {
            endResp = await defaultWriteToBackend({
              dashboardId: dash,
              widgetId: wid,
              value01: 0, // ✅ Open = 0
            });
          }

          const endOk = endResp?.ok !== false;
          if (!endOk && !(endResp?.busy === true || endResp?.status === 409)) {
            showBanner("error", "Failed", 4000);
          } else {
            showBanner("none", "");
          }
        } catch {
          showBanner("error", "Failed", 4000);
        } finally {
          setLocalPressed(false);
          setIsBusy(false);
          runningRef.current = false;
          pulseTimerRef.current = null;
        }
      }, Math.max(500, Number(pulseMs) || 12000));
    } catch {
      setLocalPressed(false);
      setIsBusy(false);
      runningRef.current = false;
      showBanner("error", "Failed", 4000);
    }
  }

  function handlePressStart(e) {
    if (disabled) return;

    e.preventDefault();
    e.stopPropagation();

    pointerActiveRef.current = true;

    if (play) {
      if (!canActuateInPlay) return;
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
      if (!canActuateInPlay) return;
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

  React.useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      clearBannerTimer();
    };
  }, []);

  const showBusyText = banner.kind === "occupied" && !!banner.text;
  const showErrorText = banner.kind === "error" && !!banner.text;

  return (
    <div
      style={{
        width: safeW,
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
            minWidth: safeW,
            width: "max-content",
            maxWidth: safeW * 3,
            textAlign: "center",
            fontWeight: 900,
            fontSize: Math.max(16, Math.round(size * 0.16)),
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
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-pressed={isPressed}
        onPointerDown={play ? handlePressStart : undefined}
        onPointerUp={play ? handlePressEnd : undefined}
        onPointerCancel={play ? handlePressEnd : undefined}
        onPointerLeave={play ? handlePressEnd : undefined}
        onKeyDown={play ? handleKeyDown : undefined}
        onKeyUp={play ? handleKeyUp : undefined}
        style={{
          width: safeW,
          height: safeH,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: play ? "none" : "auto",
          WebkitTouchCallout: "none",
          cursor: play
            ? disabled || !hasBinding || isBusy
              ? "not-allowed"
              : "pointer"
            : "default",
          opacity: disabled ? 0.7 : 1,
        }}
        title={
          play
            ? !hasBinding
              ? "Bind this push button to a DO"
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

      {showBusyText && (
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
            whiteSpace: "nowrap",
          }}
        >
          {banner.text}
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
            whiteSpace: "nowrap",
          }}
        >
          {banner.text}
        </div>
      )}
    </div>
  );
}