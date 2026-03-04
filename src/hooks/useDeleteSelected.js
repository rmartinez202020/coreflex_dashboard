// src/hooks/useDeleteSelected.js
import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import { deleteControlBinding } from "../components/controls/controlBindings";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function deleteCounterRowOnBackend({ widgetId, dashboardId }) {
  const wid = String(widgetId || "").trim();
  if (!wid) return;

  // ✅ send "main" explicitly; backend normalizes "main" -> NULL
  const dash = String(dashboardId || "main").trim();

  const token = String(getToken() || "").trim();
  if (!token) throw new Error("Missing auth token");

  const url =
    `${API_URL}/device-counters/` +
    `?widget_id=${encodeURIComponent(wid)}` +
    `&dashboard_id=${encodeURIComponent(dash)}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(j?.detail || `Delete counter row failed (${res.status})`);
}

// ✅ NEW: soft-delete the graphic display binding row
async function deleteGraphicBindingRowOnBackend({ widgetId, dashboardId }) {
  const wid = String(widgetId || "").trim();
  if (!wid) return;

  const dash = String(dashboardId || "main").trim() || "main";

  const token = String(getToken() || "").trim();
  if (!token) throw new Error("Missing auth token");

  const res = await fetch(`${API_URL}/graphic-display-bindings/soft-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      dashboard_id: dash,
      widget_id: wid,
    }),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(j?.detail || `Delete graphic binding failed (${res.status})`);
  }
}

/**
 * useDeleteSelected
 * - Handles Delete / Backspace to remove selected canvas objects
 * - Guards:
 *   - only on dashboard page
 *   - only in edit mode
 *   - only when something is selected
 *   - does NOT delete while typing in input/textarea/contentEditable
 *
 * NEW:
 * - If the deleted widget is a Counter Input (DI), also delete its backend row
 * - If the deleted widget is a Control (Toggle/Push), also delete its control binding (release DO)
 * - ✅ If the deleted widget is a Graphic Display, also soft-delete its backend binding row
 *
 * IMPORTANT FIX:
 * - Avoid stale droppedTanks by mirroring it into a ref
 */
export default function useDeleteSelected({
  activePage,
  dashboardMode,
  selectedIds,
  droppedTanks,
  setDroppedTanks,
  clearSelection,
  activeDashboardId,
  dashboardId,
}) {
  // ✅ keep latest droppedTanks to avoid stale closure issues
  const droppedRef = useRef([]);
  useEffect(() => {
    droppedRef.current = Array.isArray(droppedTanks) ? droppedTanks : [];
  }, [droppedTanks]);

  const deleteSelected = useCallback(async () => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;
    if (!selectedIds || selectedIds.length === 0) return;

    // ✅ find selected objects from the latest snapshot
    const snapshot = droppedRef.current || [];
    const selectedObjs = snapshot.filter(
      (obj) => obj && selectedIds.includes(obj.id)
    );

    const dashForBackend = String(
      activeDashboardId || dashboardId || "main"
    ).trim();

    // -------------------------
    // ✅ Counters (delete backend row)
    // -------------------------
    const counterIds = selectedObjs
      .filter((obj) => String(obj?.shape || "").trim() === "counterInput")
      .map((obj) => String(obj.id || "").trim())
      .filter(Boolean);

    // -------------------------
    // ✅ Graphic Displays (soft-delete backend binding row)
    // -------------------------
    const graphicDisplayIds = selectedObjs
      .filter((obj) => String(obj?.shape || "").trim() === "graphicDisplay")
      .map((obj) => String(obj.id || "").trim())
      .filter(Boolean);

    // -------------------------
    // ✅ Controls (release DO binding)
    // IMPORTANT FIX:
    // - your old filter used `{}` without return -> always false
    // -------------------------
    const controlWidgetIds = selectedObjs
      .filter((obj) => {
        const s = String(obj?.shape || "").trim();
        return (
          s === "toggleSwitch" ||
          s === "toggleControl" ||
          s === "pushButtonNO" ||
          s === "pushButtonNC"
        );
      })
      .map((obj) => String(obj.id || "").trim())
      .filter(Boolean);

    // ✅ remove from UI immediately
    setDroppedTanks((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (obj) => !selectedIds.includes(obj.id)
      )
    );
    clearSelection();

    // ✅ delete backend rows ONLY for counters (sequential = safer)
    for (const wid of counterIds) {
      try {
        await deleteCounterRowOnBackend({
          widgetId: wid,
          dashboardId: dashForBackend,
        });
      } catch (err) {
        console.error("❌ Failed to delete counter row:", wid, err);
      }
    }

    // ✅ soft-delete backend rows for graphic displays
    for (const wid of graphicDisplayIds) {
      try {
        await deleteGraphicBindingRowOnBackend({
          widgetId: wid,
          dashboardId: dashForBackend,
        });
      } catch (err) {
        console.error("❌ Failed to delete graphic binding:", wid, err);
      }
    }

    // ✅ delete control bindings for deleted control widgets (release DO)
    for (const wid of controlWidgetIds) {
      try {
        await deleteControlBinding({
          dashboardId: dashForBackend,
          widgetId: wid,
        });
      } catch (err) {
        console.error("❌ Failed to delete control binding:", wid, err);
      }
    }
  }, [
    activePage,
    dashboardMode,
    selectedIds,
    setDroppedTanks,
    clearSelection,
    activeDashboardId,
    dashboardId,
  ]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (activePage !== "dashboard") return;
      if (dashboardMode !== "edit") return;

      // ⛔ Don't delete while typing
      const el = document.activeElement;
      const tag = (el?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        void deleteSelected(); // async safe
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, dashboardMode, deleteSelected]);

  return { deleteSelected };
}