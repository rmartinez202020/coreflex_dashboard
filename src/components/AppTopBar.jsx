// src/components/AppTopBar.jsx
import React from "react";
import DashboardHeader from "./DashboardHeader";

/**
 * AppTopBar
 * - Renders DashboardHeader when activePage === "dashboard"
 * - Otherwise renders the page title (Home / Device Controls / Main Dashboard)
 *
 * ✅ Now supports "minimized windows tray" (Alarm Log minimize/restore)
 *
 * Pure render component (no side effects).
 */
export default function AppTopBar({
  activePage,
  activeDashboard,
  dashboardMode,
  setDashboardMode,
  onLaunch,
  onUndo,
  onRedo,
  canUndo,
  canRedo,

  // ✅ NEW (optional) minimized windows tray props
  minimizedWindows = [], // [{ key, title }]
  onRestoreWindow,
  onCloseWindow,
}) {
  if (activePage === "dashboard") {
    return (
      <DashboardHeader
        title={
          activeDashboard?.type === "main"
            ? "Main Dashboard"
            : `${activeDashboard?.customerName || ""} — ${
                activeDashboard?.dashboardName || "Customer Dashboard"
              }`
        }
        dashboardMode={dashboardMode}
        setDashboardMode={setDashboardMode}
        onLaunch={onLaunch}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        // ✅ pass through minimized tray
        minimizedWindows={minimizedWindows}
        onRestoreWindow={onRestoreWindow}
        onCloseWindow={onCloseWindow}
      />
    );
  }

  const title =
    activePage === "home"
      ? "Home"
      : activePage === "deviceControls"
      ? "Device Controls"
      : "Main Dashboard";

  // ✅ Smaller non-dashboard title to match the tighter top layout
  return (
    <h1 className="text-[20px] font-semibold mb-2 text-gray-800">{title}</h1>
  );
}