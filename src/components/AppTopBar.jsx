// src/components/AppTopBar.jsx
import React from "react";
import DashboardHeader from "./DashboardHeader";

/**
 * AppTopBar
 * - Renders DashboardHeader when activePage === "dashboard"
 * - Otherwise renders the page title (Home / Device Controls / Main Dashboard)
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
      />
    );
  }

  const title =
    activePage === "home"
      ? "Home"
      : activePage === "deviceControls"
      ? "Device Controls"
      : "Main Dashboard";

  return <h1 className="text-2xl font-bold mb-4 text-gray-800">{title}</h1>;
}
