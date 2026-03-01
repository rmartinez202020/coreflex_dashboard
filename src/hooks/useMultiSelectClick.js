// src/hooks/useMultiSelectClick.js
import { useCallback } from "react";

export default function useMultiSelectClick({
  isPlay = false,
  selectedIds = [],
  setSelectedIds = () => {},
  setSelectedTank = () => {},
  hideContextMenu = () => {},
}) {
  return useCallback(
    (id, e) => {
      if (isPlay) return;
      if (!id) return;

      // Support Windows/Linux Ctrl and Mac Cmd
      const additive = !!(e && (e.ctrlKey || e.metaKey));

      hideContextMenu?.();

      setSelectedIds((prev) => {
        const arr = Array.isArray(prev) ? prev : [];

        // Ctrl/Cmd + click toggles selection
        if (additive) {
          const exists = arr.includes(id);
          const next = exists ? arr.filter((x) => x !== id) : [...arr, id];

          // selectedTank should be something sensible:
          // - if we removed the selectedTank, pick another
          // - if we added, make this the selectedTank
          if (!exists) {
            setSelectedTank?.(id);
          } else {
            setSelectedTank?.(next[0] || null);
          }

          return next;
        }

        // Normal click = single selection
        setSelectedTank?.(id);
        return [id];
      });
    },
    [isPlay, hideContextMenu, setSelectedIds, setSelectedTank]
  );
}