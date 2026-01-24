// src/hooks/useDeleteSelected.js
import { useCallback, useEffect } from "react";

/**
 * useDeleteSelected
 * - Handles Delete / Backspace to remove selected canvas objects
 * - Guards:
 *   - only on dashboard page
 *   - only in edit mode
 *   - only when something is selected
 *   - does NOT delete while typing in input/textarea/contentEditable
 *
 * Params:
 * - activePage: string
 * - dashboardMode: "edit" | "play"
 * - selectedIds: array of ids
 * - setDroppedTanks: setState for droppedTanks
 * - clearSelection: function to clear selectedIds + selectedTank
 */
export default function useDeleteSelected({
  activePage,
  dashboardMode,
  selectedIds,
  setDroppedTanks,
  clearSelection,
}) {
  const deleteSelected = useCallback(() => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;
    if (!selectedIds || selectedIds.length === 0) return;

    setDroppedTanks((prev) => prev.filter((obj) => !selectedIds.includes(obj.id)));

    clearSelection();
  }, [activePage, dashboardMode, selectedIds, setDroppedTanks, clearSelection]);

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
        deleteSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, dashboardMode, deleteSelected]);

  return { deleteSelected };
}
