import { useEffect } from "react";

/**
 * useDashboardLocalStorage
 *
 * - Loads dashboard layout from localStorage on mount
 * - Saves dashboard layout to localStorage on change
 * - PAUSES automatically while restoring from DB
 *
 * @param {Array} droppedTanks
 * @param {Function} setDroppedTanks
 * @param {boolean} isRestoringFromDB
 */
export default function useDashboardLocalStorage(
  droppedTanks,
  setDroppedTanks,
  isRestoringFromDB = false
) {
  // =========================
  // LOAD FROM LOCAL STORAGE
  // =========================
  useEffect(() => {
    if (isRestoringFromDB) return; // 🛑 DB restore in progress

    try {
      const saved = localStorage.getItem("coreflex_dashboard_objects");
      if (saved) {
        setDroppedTanks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading dashboard layout:", e);
    }
  }, [setDroppedTanks, isRestoringFromDB]);

  // =========================
  // SAVE TO LOCAL STORAGE
  // =========================
  useEffect(() => {
    if (isRestoringFromDB) return; // 🛑 DB restore in progress

    try {
      localStorage.setItem(
        "coreflex_dashboard_objects",
        JSON.stringify(droppedTanks)
      );
    } catch (e) {
      console.error("Error saving dashboard layout:", e);
    }
  }, [droppedTanks, isRestoringFromDB]);
}
