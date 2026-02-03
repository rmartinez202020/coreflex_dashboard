// src/hooks/useContextMenu.js
import { useState, useCallback } from "react";

/**
 * useContextMenu
 * - Manages canvas context menu state
 * - Stores position + target object id
 * - Input method agnostic (right-click today, touch/keyboard later)
 *
 * ✅ Supports BOTH call signatures:
 *   1) handleRightClick(id, x, y)            (legacy)
 *   2) handleRightClick(event, tankObject)   (new, preferred)
 */
export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,

    // ✅ Optional: store full object reference (useful for menu labels later)
    target: null,
  });

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleRightClick = useCallback((a, b, c) => {
    // ✅ New signature: (event, tank)
    // DashboardCanvas will call: handleRightClick(e, tank)
    if (a && typeof a === "object" && typeof a.preventDefault === "function") {
      const e = a;
      const tank = b || null;

      e.preventDefault();
      e.stopPropagation?.();

      const x =
        typeof e.clientX === "number"
          ? e.clientX
          : typeof e.pageX === "number"
          ? e.pageX
          : 0;

      const y =
        typeof e.clientY === "number"
          ? e.clientY
          : typeof e.pageY === "number"
          ? e.pageY
          : 0;

      setContextMenu({
        visible: true,
        x,
        y,
        targetId: tank?.id ?? null,
        target: tank,
      });
      return;
    }

    // ✅ Legacy signature: (id, x, y)
    const id = a ?? null;
    const x = b ?? 0;
    const y = c ?? 0;

    setContextMenu({
      visible: true,
      x,
      y,
      targetId: id,
      target: null,
    });
  }, []);

  return {
    contextMenu,
    setContextMenu,
    hideContextMenu,
    handleRightClick,
  };
}
