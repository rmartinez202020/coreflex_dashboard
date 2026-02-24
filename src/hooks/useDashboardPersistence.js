// src/hooks/useDashboardPersistence.js
import { useEffect, useRef, useState, useCallback } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { saveMainDashboard } from "../services/saveMainDashboard";

/**
 * useDashboardPersistence
 * - Owns activeDashboard + lastSavedAt
 * - Save / Restore (manual)
 * - Auto-restore on refresh
 * - Load lastSavedAt from DB
 * - Go to main dashboard helper
 *
 * App provides:
 * - currentUserKey (for reloads)
 * - activePage (only restore when dashboard page)
 * - dashboardMode (saved in payload meta)
 * - droppedTanks + setDroppedTanks
 * - selection setters (to clear selections)
 * - setActivePage (so goToMainDashboard can switch page)
 * - setDashboardMode (restore dashboardMode)
 * - history functions (hardResetHistory / beginRestore / endRestore)
 * - droppedRef (latest canvas ref for save baseline)
 */
export default function useDashboardPersistence({
  currentUserKey,
  activePage,
  setActivePage,
  dashboardMode,
  setDashboardMode,

  droppedTanks,
  setDroppedTanks,
  droppedRef,

  setSelectedIds,
  setSelectedTank,

  hardResetHistory,
  beginRestore,
  endRestore,
}) {
  // ✅ ACTIVE DASHBOARD CONTEXT (Main vs Customer Dashboard)
  const [activeDashboard, setActiveDashboard] = useState({
    type: "main", // "main" | "customer"
    dashboardId: null,
    dashboardName: "Main Dashboard",
    customerId: null,
    customerName: "",
  });

  // ⭐ LAST SAVED TIMESTAMP
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // 🔁 AUTO-RESTORE FLAG (must exist BEFORE goToMainDashboard uses it)
  const autoRestoreRanRef = useRef(false);

  // 🔁 RESET AUTO-RESTORE WHEN DASHBOARD CONTEXT CHANGES
  useEffect(() => {
    autoRestoreRanRef.current = false;
  }, [activeDashboard]);

  // ==========================================
  // ✅ Dashboard API endpoint resolver
  // ==========================================
  const getDashboardEndpoint = useCallback((ctx) => {
    // main dashboard
    if (!ctx || ctx.type === "main") return `${API_URL}/dashboard/main`;

    // customer dashboard (must have an id)
    if (ctx.type === "customer" && ctx.dashboardId) {
      return `${API_URL}/customers-dashboards/${ctx.dashboardId}`;
    }

    // fallback
    return `${API_URL}/dashboard/main`;
  }, []);

  // ✅ GO BACK TO MAIN DASHBOARD (from customer dashboards)
  const goToMainDashboard = useCallback(() => {
    // switch to dashboard page
    setActivePage?.("dashboard");

    // reset dashboard context to MAIN
    setActiveDashboard({
      type: "main",
      dashboardId: null,
      dashboardName: "Main Dashboard",
      customerId: null,
      customerName: "",
    });

    // ensure edit mode
    setDashboardMode?.("edit");

    // clear canvas so main dashboard auto-restores
    setDroppedTanks?.([]);
    setSelectedIds?.([]);
    setSelectedTank?.(null);

    // allow auto-restore to run again
    autoRestoreRanRef.current = false;
  }, [setActivePage, setDashboardMode, setDroppedTanks, setSelectedIds, setSelectedTank]);

  // 💾 SAVE PROJECT (MAIN or CUSTOMER)
  const handleSaveProject = useCallback(async () => {
    // ✅ only allow saving from dashboard editor
    if (activePage !== "dashboard") {
      console.warn("⚠️ Save ignored: not on dashboard editor page");
      return;
    }

    // ✅ customer dashboard must have an id
    if (activeDashboard.type === "customer" && !activeDashboard.dashboardId) {
      console.error("❌ Cannot save customer dashboard: missing dashboardId");
      return;
    }

    const dashboardPayload = {
      version: "1.0",
      type:
        activeDashboard.type === "main"
          ? "main_dashboard"
          : "customer_dashboard",
      dashboardId: activeDashboard.dashboardId || null,
      canvas: { objects: droppedTanks || [] },
      meta: {
        dashboardMode,
        savedAt: new Date().toISOString(),
        dashboardName: activeDashboard.dashboardName || "",
        customerName: activeDashboard.customerName || "",
      },
    };

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");

      await saveMainDashboard(dashboardPayload, activeDashboard);

      const now = new Date();
      setLastSavedAt(now);

      // ✅ make SAVE the new undo baseline
      hardResetHistory?.(droppedRef?.current || droppedTanks || []);

    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  }, [
    activePage,
    activeDashboard,
    dashboardMode,
    droppedTanks,
    droppedRef,
    hardResetHistory,
  ]);

  // ⬆ RESTORE PROJECT (manual button)
  const handleUploadProject = useCallback(async () => {
    let restoredObjects = [];

    try {
      const token = getToken();
      if (!token) throw new Error("No auth token found");

      // ✅ tell history system we are restoring from DB
      beginRestore?.();

      const res = await fetch(getDashboardEndpoint(activeDashboard), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load dashboard from DB");

      const data = await res.json();
      const layout = data?.layout ?? data;

      restoredObjects =
        layout?.canvas?.objects ||
        layout?.layout?.canvas?.objects ||
        layout?.layout?.objects ||
        layout?.objects ||
        [];

      // ✅ apply restored canvas
      setDroppedTanks(restoredObjects);
      setSelectedIds([]);
      setSelectedTank(null);

      // ✅ make RESTORE the new undo baseline
      hardResetHistory?.(restoredObjects);

      const mode =
        data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
      if (mode) setDashboardMode(mode);

      const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
      setLastSavedAt(savedAt ? new Date(savedAt) : null);

    } catch (err) {
      console.error("❌ Upload failed:", err);
    } finally {
      endRestore?.();
    }
  }, [
    activeDashboard,
    getDashboardEndpoint,
    setDroppedTanks,
    setSelectedIds,
    setSelectedTank,
    hardResetHistory,
    setDashboardMode,
    beginRestore,
    endRestore,
  ]);

  // ⭐ LOAD LAST SAVED TIMESTAMP (per user + per dashboard)
  useEffect(() => {
    const loadLastSavedTimestamp = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLastSavedAt(null);
          return;
        }

        const res = await fetch(getDashboardEndpoint(activeDashboard), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setLastSavedAt(null);
          return;
        }

        const data = await res.json();
        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;

        setLastSavedAt(savedAt ? new Date(savedAt) : null);
      } catch (err) {
        console.error("Failed to load last saved timestamp:", err);
        setLastSavedAt(null);
      }
    };

    loadLastSavedTimestamp();
  }, [currentUserKey, activeDashboard, getDashboardEndpoint]);

  // ✅ AUTO-RESTORE FROM DB ON REFRESH
  useEffect(() => {
    const autoRestore = async () => {
      if (autoRestoreRanRef.current) return;

      // only for dashboard page
      if (activePage !== "dashboard") return;

      // don't overwrite if already has objects
      if ((droppedTanks?.length || 0) > 0) return;

      const token = getToken();
      if (!token) return;

      autoRestoreRanRef.current = true;

      try {
        const res = await fetch(getDashboardEndpoint(activeDashboard), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        const objects =
          data?.canvas?.objects ||
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          [];

        setDroppedTanks(objects);

        const mode =
          data?.layout?.meta?.dashboardMode || data?.meta?.dashboardMode;
        if (mode) setDashboardMode(mode);

        const savedAt = data?.layout?.meta?.savedAt || data?.meta?.savedAt;
        setLastSavedAt(savedAt ? new Date(savedAt) : null);

      } catch (err) {
        console.error("❌ Auto restore failed:", err);
      }
    };

    autoRestore();
  }, [
    activePage,
    currentUserKey,
    activeDashboard,
    droppedTanks?.length,
    getDashboardEndpoint,
    setDroppedTanks,
    setDashboardMode,
  ]);

  return {
    activeDashboard,
    setActiveDashboard,
    lastSavedAt,

    getDashboardEndpoint,
    goToMainDashboard,

    handleSaveProject,
    handleUploadProject,
  };
}
