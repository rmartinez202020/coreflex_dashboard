// src/hooks/useDeleteSelected.js
import { useCallback, useEffect } from "react";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * useDeleteSelected
 * - Delete / Backspace removes selected objects
 * - ONLY deletes backend row if shape === "counterInput"
 */
export default function useDeleteSelected({
  activePage,
  dashboardMode,
  selectedIds,
  setDroppedTanks,
  clearSelection,
}) {
  const deleteSelected = useCallback(async () => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;
    if (!selectedIds || selectedIds.length === 0) return;

    const token = String(getToken() || "").trim();

    // We need access to previous objects to inspect shape
    setDroppedTanks((prev) => {
      const items = Array.isArray(prev) ? prev : [];

      // 🔎 Find only counterInput widgets that are being deleted
      const countersToDelete = items.filter(
        (obj) =>
          selectedIds.includes(obj.id) &&
          obj.shape === "counterInput"
      );

      // 🔥 Backend delete ONLY for counters
      if (token && countersToDelete.length > 0) {
        countersToDelete.forEach((counter) => {
          const wid = String(counter.id || "").trim();
          if (!wid) return;

          fetch(
            `${API_URL}/device-counters/?widget_id=${encodeURIComponent(wid)}`,
            {
              method: "DELETE",
              headers: { ...getAuthHeaders() },
            }
          ).catch((err) =>
            console.warn("Counter delete failed:", err)
          );
        });
      }

      // ✅ Remove from canvas
      return items.filter((obj) => !selectedIds.includes(obj.id));
    });

    clearSelection();
  }, [
    activePage,
    dashboardMode,
    selectedIds,
    setDroppedTanks,
    clearSelection,
  ]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (activePage !== "dashboard") return;
      if (dashboardMode !== "edit") return;

      const el = document.activeElement;
      const tag = (el?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable)
        return;

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
