import { useEffect } from "react";

/**
 * useDashboardLocalStorage
 * - Loads dashboard layout from localStorage on mount
 * - Saves dashboard layout to localStorage on change
 * - Temporary persistence (will be replaced by backend later)
 */
export default function useDashboardLocalStorage(
  droppedTanks,
  setDroppedTanks
) {
  // LOAD FROM LOCAL STORAGE
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

  // SAVE TO LOCAL STORAGE
  useEffect(() => {
    try {
      localStorage.setItem(
        "coreflex_dashboard_objects",
        JSON.stringify(droppedTanks)
      );
    } catch (e) {
      console.error("Error saving dashboard layout:", e);
    }
  }, [droppedTanks]);
}
