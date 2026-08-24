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

  // 🔁 AUTO-RESTORE FLAG
  const autoRestoreRanRef = useRef(false);

  // 🔁 RESET AUTO-RESTORE WHEN DASHBOARD CONTEXT CHANGES
  useEffect(() => {
    autoRestoreRanRef.current = false;
  }, [activeDashboard]);

  // ==========================================
  // ✅ Dashboard API endpoint resolver
  // ==========================================
  const getDashboardEndpoint = useCallback((ctx) => {
    if (!ctx || ctx.type === "main") {
      return `${API_URL}/dashboard/main`;
    }

    if (ctx.type === "customer" && ctx.dashboardId) {
      return `${API_URL}/customers-dashboards/${ctx.dashboardId}`;
    }

    return `${API_URL}/dashboard/main`;
  }, []);

  // ==========================================
  // ♻️ Manual Restore endpoint resolver
  // ==========================================
  const getDashboardRestoreEndpoint = useCallback((ctx) => {
    if (!ctx || ctx.type === "main") {
      return `${API_URL}/dashboard/main/restore`;
    }

    if (ctx.type === "customer" && ctx.dashboardId) {
      return `${API_URL}/customers-dashboards/${ctx.dashboardId}/restore`;
    }

    return `${API_URL}/dashboard/main/restore`;
  }, []);

  // ✅ GO BACK TO MAIN DASHBOARD
  const goToMainDashboard = useCallback(() => {
    setActivePage?.("dashboard");

    setActiveDashboard({
      type: "main",
      dashboardId: null,
      dashboardName: "Main Dashboard",
      customerId: null,
      customerName: "",
    });

    setDashboardMode?.("edit");

    setDroppedTanks?.([]);
    setSelectedIds?.([]);
    setSelectedTank?.(null);

    autoRestoreRanRef.current = false;
  }, [
    setActivePage,
    setDashboardMode,
    setDroppedTanks,
    setSelectedIds,
    setSelectedTank,
  ]);

  // 💾 SAVE PROJECT
  const handleSaveProject = useCallback(
    async (overrideObjects = null) => {
      console.log("🧪 [Persistence] handleSaveProject START", {
        activePage,
        dashboardType: activeDashboard?.type,
        dashboardId: activeDashboard?.dashboardId,
        dashboardMode,
        overrideCount: Array.isArray(overrideObjects)
          ? overrideObjects.length
          : null,
        droppedRefCount: Array.isArray(droppedRef?.current)
          ? droppedRef.current.length
          : null,
        droppedStateCount: Array.isArray(droppedTanks)
          ? droppedTanks.length
          : null,
      });

      if (activePage !== "dashboard") {
        console.warn(
          "⚠️ [Persistence] Save ignored: not on dashboard editor page"
        );
        return;
      }

      if (
        activeDashboard.type === "customer" &&
        !activeDashboard.dashboardId
      ) {
        console.error(
          "❌ [Persistence] Cannot save customer dashboard: missing dashboardId"
        );
        return;
      }

      const objectsToSave = Array.isArray(overrideObjects)
        ? overrideObjects
        : Array.isArray(droppedRef?.current)
        ? droppedRef.current
        : droppedTanks || [];

      const dashboardPayload = {
        version: "1.0",
        type:
          activeDashboard.type === "main"
            ? "main_dashboard"
            : "customer_dashboard",
        dashboardId: activeDashboard.dashboardId || null,
        canvas: {
          objects: objectsToSave,
        },
        meta: {
          dashboardMode,
          savedAt: new Date().toISOString(),
          dashboardName: activeDashboard.dashboardName || "",
          customerName: activeDashboard.customerName || "",
        },
      };

      try {
        const token = getToken();

        if (!token) {
          throw new Error("No auth token found");
        }

        console.log(
          "💾 [Persistence] about to call saveMainDashboard",
          {
            objects: objectsToSave.length,
            endpoint: getDashboardEndpoint(activeDashboard),
          }
        );

        await saveMainDashboard(
          dashboardPayload,
          activeDashboard
        );

        console.log(
          "✅ [Persistence] saveMainDashboard finished"
        );

        const now = new Date();
        setLastSavedAt(now);

        hardResetHistory?.(objectsToSave);
      } catch (err) {
        console.error(
          "❌ [Persistence] Save failed (catch):",
          err
        );
      }
    },
    [
      activePage,
      activeDashboard,
      dashboardMode,
      droppedTanks,
      droppedRef,
      hardResetHistory,
      getDashboardEndpoint,
    ]
  );

  // ==========================================
  // ♻️ RESTORE PROJECT — MANUAL BUTTON ONLY
  // ==========================================
  const handleUploadProject = useCallback(async () => {
    let restoredObjects = [];

    try {
      const token = getToken();

      if (!token) {
        throw new Error("No auth token found");
      }

      beginRestore?.();

      const restoreEndpoint =
        getDashboardRestoreEndpoint(activeDashboard);

      console.log(
        "♻️ [Persistence] manual restore request",
        {
          dashboardType: activeDashboard?.type,
          dashboardId: activeDashboard?.dashboardId,
          endpoint: restoreEndpoint,
        }
      );

      const res = await fetch(restoreEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const detail = await res
          .text()
          .catch(() => "");

        throw new Error(
          detail ||
            `Failed to restore dashboard from DB (${res.status})`
        );
      }

      const data = await res.json();

      if (data?.success === false) {
        throw new Error(
          data?.message ||
            "No saved dashboard found to restore"
        );
      }

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
        data?.layout?.meta?.dashboardMode ||
        data?.meta?.dashboardMode;

      if (mode) {
        setDashboardMode(mode);
      }

      const savedAt =
        data?.layout?.meta?.savedAt ||
        data?.meta?.savedAt;

      setLastSavedAt(
        savedAt ? new Date(savedAt) : null
      );

      console.log(
        "✅ [Persistence] manual restore completed"
      );
    } catch (err) {
      console.error(
        "❌ Restore failed:",
        err
      );
    } finally {
      endRestore?.();
    }
  }, [
    activeDashboard,
    getDashboardRestoreEndpoint,
    setDroppedTanks,
    setSelectedIds,
    setSelectedTank,
    hardResetHistory,
    setDashboardMode,
    beginRestore,
    endRestore,
  ]);

  // ⭐ LOAD LAST SAVED TIMESTAMP
  useEffect(() => {
    const loadLastSavedTimestamp = async () => {
      try {
        const token = getToken();

        if (!token) {
          setLastSavedAt(null);
          return;
        }

        const res = await fetch(
          getDashboardEndpoint(activeDashboard),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          setLastSavedAt(null);
          return;
        }

        const data = await res.json();

        const savedAt =
          data?.layout?.meta?.savedAt ||
          data?.meta?.savedAt;

        setLastSavedAt(
          savedAt ? new Date(savedAt) : null
        );
      } catch (err) {
        console.error(
          "Failed to load last saved timestamp:",
          err
        );

        setLastSavedAt(null);
      }
    };

    loadLastSavedTimestamp();
  }, [
    currentUserKey,
    activeDashboard,
    getDashboardEndpoint,
  ]);

  // ==========================================
  // ✅ AUTO-RESTORE FROM DB ON REFRESH
  // IMPORTANT:
  // Uses normal GET endpoint.
  // Does NOT create DASHBOARD_RESTORE log.
  // ==========================================
  useEffect(() => {
    const autoRestore = async () => {
      if (autoRestoreRanRef.current) {
        return;
      }

      if (activePage !== "dashboard") {
        return;
      }

      if ((droppedTanks?.length || 0) > 0) {
        return;
      }

      const token = getToken();

      if (!token) {
        return;
      }

      autoRestoreRanRef.current = true;

      try {
        const res = await fetch(
          getDashboardEndpoint(activeDashboard),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        const objects =
          data?.canvas?.objects ||
          data?.layout?.canvas?.objects ||
          data?.layout?.objects ||
          [];

        setDroppedTanks(objects);

        const mode =
          data?.layout?.meta?.dashboardMode ||
          data?.meta?.dashboardMode;

        if (mode) {
          setDashboardMode(mode);
        }

        const savedAt =
          data?.layout?.meta?.savedAt ||
          data?.meta?.savedAt;

        setLastSavedAt(
          savedAt ? new Date(savedAt) : null
        );
      } catch (err) {
        console.error(
          "❌ Auto restore failed:",
          err
        );
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
    getDashboardRestoreEndpoint,

    goToMainDashboard,

    handleSaveProject,
    handleUploadProject,
  };
}