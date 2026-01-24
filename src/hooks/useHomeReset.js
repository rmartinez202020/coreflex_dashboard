// src/hooks/useHomeReset.js
import { useCallback } from "react";

/**
 * useHomeReset
 * Centralizes the "hard home reset" behavior so App.jsx stays lean.
 */
export default function useHomeReset({
  navigate,
  homeRoute = "/app",

  // navigation state
  setActivePage,
  setActiveSubPage,
  setSubPageColor,

  // modals
  setShowRestoreWarning,
  setShowSiloProps,
  closeDisplaySettings,
  closeGraphicDisplaySettings,

  // menus
  setShowDevices,
  setShowLevelSensors,

  // context + selections
  setContextMenu,
  setSelectedIds,
  setSelectedTank,
  setActiveSiloId,

  // dashboard context
  setActiveDashboard,
} = {}) {
  const goHomeHard = useCallback(() => {
    // go to the main app route
    navigate?.(homeRoute);

    // navigation state
    setActivePage?.("home");
    setActiveSubPage?.(null);
    setSubPageColor?.("");

    // close modals
    setShowRestoreWarning?.(false);
    setShowSiloProps?.(false);
    closeDisplaySettings?.();
    closeGraphicDisplaySettings?.();

    // close menus
    setShowDevices?.(false);
    setShowLevelSensors?.(false);

    // reset context menu + selections
    setContextMenu?.({ visible: false, x: 0, y: 0, targetId: null });
    setSelectedIds?.([]);
    setSelectedTank?.(null);
    setActiveSiloId?.(null);

    // reset dashboard context
    setActiveDashboard?.({
      type: "main",
      dashboardId: null,
      dashboardName: "Main Dashboard",
      customerId: null,
      customerName: "",
    });
  }, [
    navigate,
    homeRoute,
    setActivePage,
    setActiveSubPage,
    setSubPageColor,
    setShowRestoreWarning,
    setShowSiloProps,
    closeDisplaySettings,
    closeGraphicDisplaySettings,
    setShowDevices,
    setShowLevelSensors,
    setContextMenu,
    setSelectedIds,
    setSelectedTank,
    setActiveSiloId,
    setActiveDashboard,
  ]);

  return { goHomeHard };
}
