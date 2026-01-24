// src/hooks/useContextMenu.js
import { useState, useCallback } from "react";

/**
 * useContextMenu
 * - Manages canvas context menu state
 * - Stores position + target object id
 * - Input method agnostic (right-click today, touch/keyboard later)
 */
export default function useContextMenu() {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleRightClick = useCallback((id, x, y) => {
    setContextMenu({
      visible: true,
      x,
      y,
      targetId: id,
    });
  }, []);

  return {
    contextMenu,
    setContextMenu,
    hideContextMenu,
    handleRightClick,
  };
}
