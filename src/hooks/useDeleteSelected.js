// src/hooks/useDeleteSelected.js
import { useCallback, useEffect, useRef } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

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
 *
 * IMPORTANT FIX:
 * - Avoid stale droppedTanks by mirroring it into a ref
 *
 * Params:
 * - activePage: string
 * - dashboardMode: "edit" | "play"
 * - selectedIds: array of ids
 * - droppedTanks: array of canvas objects (used to keep ref updated)
 * - setDroppedTanks: setState for droppedTanks
 * - clearSelection: function to clear selectedIds + selectedTank
 * - activeDashboardId: string (preferred)
 * - dashboardId: string (fallback)
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

    const counterIds = selectedObjs
      .filter((obj) => obj?.shape === "counterInput")
      .map((obj) => String(obj.id || "").trim())
      .filter(Boolean);

    // ✅ remove from UI immediately
    setDroppedTanks((prev) =>
      (Array.isArray(prev) ? prev : []).filter((obj) => !selectedIds.includes(obj.id))
    );
    clearSelection();

    // ✅ delete backend rows ONLY for counters
    if (counterIds.length > 0) {
      const dashForBackend = String(activeDashboardId || dashboardId || "main").trim();

      // fire sequentially (safer / easier on backend)
      for (const wid of counterIds) {
        try {
          await deleteCounterRowOnBackend({
            widgetId: wid,
            dashboardId: dashForBackend,
          });
        } catch (err) {
          console.error("❌ Failed to delete counter row:", wid, err);
          // keep silent to avoid annoying UX
        }
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
