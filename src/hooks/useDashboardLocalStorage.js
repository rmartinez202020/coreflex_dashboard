import { useEffect } from "react";

/**
 * useDashboardLocalStorage
 * - Loads dashboard layout from localStorage on mount
 * - Saves dashboard layout to localStorage on change
 * - PAUSES saving while restoring from DB
 */
export default function useDashboardLocalStorage(
  droppedTanks,
  setDroppedTanks,
  isRestoringFromDB
) {
  // LOAD FROM LOCAL STORAGE (ONCE)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("coreflex_dashboard_objects");
      if (saved) {
        setDroppedTanks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading dashboard layout:", e);
    }
  }, [setDroppedTanks]);

  // SAVE TO LOCAL STORAGE (ONLY WHEN NOT RESTORING)
  useEffect(() => {
    if (isRestoringFromDB) return; // ⛔ STOP overwrite

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
