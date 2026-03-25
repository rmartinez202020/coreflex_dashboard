// src/components/pages/PortalTopBar.jsx
import React, { useEffect, useMemo, useState } from "react";
import logoWhite from "../assets/coreflex-logo-white.png";

function formatClock(date) {
  try {
    return new Intl.DateTimeFormat([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

function getAccessLabel(accessLevel) {
  const v = String(accessLevel || "").trim().toLowerCase();
  if (v === "read_control" || v === "read-and-control") {
    return "Read + Control";
  }
  return "Read Only";
}

function getAccessClasses(accessLevel) {
  const v = String(accessLevel || "").trim().toLowerCase();
  if (v === "read_control" || v === "read-and-control") {
    return "bg-green-100 text-green-800 border-green-300";
  }
  return "bg-slate-100 text-slate-700 border-slate-300";
}

export default function PortalTopBar({
  dashboardName = "Dashboard",
  tenantName = "Portal User",
  accessLevel = "read_only",
  onLogout,
  onLogin,
  isAuthenticated = false,

  // ✅ NEW: public alarm-log support
  hasAlarmLog = false,
  onOpenAlarmLog,
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const clockText = useMemo(() => formatClock(now), [now]);
  const accessLabel = useMemo(
    () => getAccessLabel(accessLevel),
    [accessLevel]
  );
  const accessClasses = useMemo(
    () => getAccessClasses(accessLevel),
    [accessLevel]
  );

  return (
    <div className="w-full bg-[#374151] border-b border-slate-600 shadow-sm">
      {/* top accent line */}
      <div className="h-[3px] w-full bg-sky-300" />

      <div className="w-full px-4 md:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoWhite}
              alt="CoreFlex Logo"
              className="h-10 w-auto object-contain select-none pointer-events-none"
              style={{
                filter: "drop-shadow(0 0 12px rgba(255,255,255,0.20))",
              }}
            />

            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-white">CoreFlex</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-300">
                IIoTs Platform
              </span>
            </div>
          </div>

          {/* CENTER */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center">
            <div className="text-sm md:text-base font-semibold text-white truncate text-center w-full">
              Customer Dashboard — {dashboardName}
            </div>

            {/* ✅ NEW: public alarm button */}
            {hasAlarmLog ? (
              <div className="mt-2 hidden md:flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onOpenAlarmLog?.()}
                  className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-100"
                  title="Open Alarm Log in a new tab"
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>Alarms Log (DI-AI)</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className="hidden md:block text-sm font-medium text-slate-200 whitespace-nowrap">
              {clockText}
            </div>

            {isAuthenticated ? (
              <>
                <div className="hidden lg:block text-sm text-slate-200 whitespace-nowrap">
                  {tenantName}
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${accessClasses}`}
                >
                  {accessLabel}
                </span>

                <button
                  type="button"
                  onClick={() => onLogout?.()}
                  className="inline-flex items-center rounded-md border border-slate-500 bg-[#4B5563] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6B7280]"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onLogin?.()}
                className="inline-flex items-center rounded-md border border-slate-500 bg-[#4B5563] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6B7280]"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* ✅ NEW: mobile alarm row */}
        {hasAlarmLog ? (
          <div className="mt-2 flex md:hidden justify-center">
            <button
              type="button"
              onClick={() => onOpenAlarmLog?.()}
              className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100"
              title="Open Alarm Log in a new tab"
            >
              <span aria-hidden="true">⚠️</span>
              <span>Alarms Log (DI-AI)</span>
            </button>
          </div>
        ) : null}

        {/* mobile row */}
        <div className="mt-1.5 flex md:hidden items-center justify-between gap-3 text-xs text-slate-300">
          {isAuthenticated ? (
            <div className="truncate">{tenantName}</div>
          ) : (
            <div className="truncate">Authorized portal access only</div>
          )}
          <div className="shrink-0">{clockText}</div>
        </div>
      </div>

      {/* bottom accent */}
      <div className="h-[2px] w-full bg-sky-200" />
    </div>
  );
}