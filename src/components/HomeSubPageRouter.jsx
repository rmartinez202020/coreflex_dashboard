// src/components/HomeSubPageRouter.jsx
import React from "react";

import ProfilePage from "./ProfilePage";
import CustomersLocationsPage from "./CustomersLocationsPage";
import DashboardAdminPage from "./DashboardAdminPage";
import HomePage from "./HomePage";

/**
 * HomeSubPageRouter
 * - Renders the correct "home sub page" based on activeSubPage
 * - Keeps App.jsx clean by moving the big ternary block out
 *
 * IMPORTANT: No side effects here. Pure routing/render.
 */
export default function HomeSubPageRouter({
  activeSubPage,
  subPageColor,
  setActiveSubPage,
  setSubPageColor,

  // home page needs it
  currentUserKey,

  // dashboard admin actions (these were inline in App.jsx)
  setActivePage,
  setActiveDashboard,
  setDashboardMode,
  setDroppedTanks,
  setSelectedIds,
  setSelectedTank,
}) {
  // ✅ Back button behavior for DashboardAdminPage
  const handleGoHomeFromAdmin = () => {
    setActiveSubPage(null);
    setSubPageColor("");
  };

  // ✅ Open dashboard from admin list
  const handleOpenDashboard = (row) => {
    // switch to dashboard editor page
    setActivePage("dashboard");

    // set context so header shows customer dashboard title
    setActiveDashboard({
      type: "customer",
      dashboardId: String(row.id),
      dashboardName: row.dashboard_name || "Customer Dashboard",
      customerId: null,
      customerName: row.customer_name || "",
    });

    // go to edit mode
    setDashboardMode("edit");

    // clear canvas so auto-restore can load the correct one
    setDroppedTanks([]);
    setSelectedIds([]);
    setSelectedTank(null);
  };

  // ✅ Launch dashboard from admin list
  const handleLaunchDashboard = (row) => {
    window.open(`/launchDashboard/${row.id}`, "_blank");
  };

  // ROUTE
  if (activeSubPage === "profile") {
    return (
      <ProfilePage
        subPageColor={subPageColor}
        setActiveSubPage={setActiveSubPage}
      />
    );
  }

  if (activeSubPage === "customers") {
    return (
      <CustomersLocationsPage
        subPageColor={subPageColor}
        setActiveSubPage={setActiveSubPage}
      />
    );
  }

  if (activeSubPage === "dashboardAdmin") {
    return (
      <DashboardAdminPage
        onGoHome={handleGoHomeFromAdmin}
        onOpenDashboard={handleOpenDashboard}
        onLaunchDashboard={handleLaunchDashboard}
      />
    );
  }

  // default
  return (
    <HomePage
      setActiveSubPage={setActiveSubPage}
      setSubPageColor={setSubPageColor}
      currentUserKey={currentUserKey}
    />
  );
}

