// src/hooks/useDashboardCanvasClipboard.js
import { useCallback, useRef, useState } from "react";

/**
 * useDashboardCanvasClipboard
 * - Owns clipboardRef
 * - Copy from context menu target + selection logic
 * - Paste at context menu position on canvas
 *
 * Required:
 * - droppedTanks
 * - selectedIds
 * - contextMenu (needs: targetId, x, y)
 * - setDroppedTanks
 *
 * Optional:
 * - getTankZ(t) => number
 * - canvasRootId (default "coreflex-canvas-root")
 */
export default function useDashboardCanvasClipboard({
  droppedTanks,
  selectedIds,
  contextMenu,
  setDroppedTanks,
  getTankZ,
  canvasRootId = "coreflex-canvas-root",
}) {
  // ============================
  // ✅ CLIPBOARD
  // ============================
  const clipboardRef = useRef({
    items: [],
    copiedAt: 0,
  });

  // ✅ MUST be state (ref updates don't re-render)
  const [hasClipboard, setHasClipboard] = useState(false);

  const safeGetTankZ = useCallback(
    (t) => {
      if (typeof getTankZ === "function") return getTankZ(t);
      const v = Number(t?.z ?? t?.zIndex ?? 1);
      return Number.isFinite(v) && v > 0 ? v : 1;
    },
    [getTankZ]
  );

  const getCanvasPointFromClient = useCallback(
    (clientX, clientY) => {
      const el = document.getElementById(canvasRootId);
      if (!el) return { x: 40, y: 40 };

      const r = el.getBoundingClientRect();
      const x = Math.round((clientX ?? 0) - r.left);
      const y = Math.round((clientY ?? 0) - r.top);

      const cx = Math.max(0, Math.min(x, el.clientWidth - 10));
      const cy = Math.max(0, Math.min(y, el.clientHeight - 10));
      return { x: cx, y: cy };
    },
    [canvasRootId]
  );

  const makeId = useCallback(() => {
    try {
      return crypto.randomUUID();
    } catch {
      return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  }, []);

  const copyFromContext = useCallback(() => {
    const targetId = contextMenu?.targetId;
    if (!targetId) return;

    const idsToCopy =
      selectedIds?.length > 1 && selectedIds.includes(targetId)
        ? selectedIds
        : [targetId];

    const items = (droppedTanks || [])
      .filter((t) => idsToCopy.includes(t.id))
      .map((t) => ({ ...t }));

    clipboardRef.current = {
      items,
      copiedAt: Date.now(),
    };

    // ✅ trigger re-render so menu can show "Paste"
    setHasClipboard(items.length > 0);
  }, [contextMenu?.targetId, selectedIds, droppedTanks]);

  const pasteAtContext = useCallback(() => {
    const clip = clipboardRef.current?.items || [];

    // ✅ if clipboard got cleared somehow, keep UI correct
    if (!clip.length) {
      setHasClipboard(false);
      return;
    }

    const pt = getCanvasPointFromClient(
      contextMenu?.x ?? 0,
      contextMenu?.y ?? 0
    );

    const currentMaxZ = Math.max(
      1,
      ...(droppedTanks || []).map((t) => safeGetTankZ(t))
    );
    let z = currentMaxZ + 1;

    const base = clip[0];
    const baseX = base?.x ?? 0;
    const baseY = base?.y ?? 0;

    const OFFSET = 18;

    const pasted = clip.map((src) => {
      const dx = (src.x ?? 0) - baseX;
      const dy = (src.y ?? 0) - baseY;

      const nx = pt.x + dx + OFFSET;
      const ny = pt.y + dy + OFFSET;

      const id = makeId();

      const next = {
        ...src,
        id,
        x: nx,
        y: ny,
        z,
        zIndex: z,
      };

      z += 1;
      return next;
    });

    setDroppedTanks((prev) => [...prev, ...pasted]);
  }, [
    contextMenu?.x,
    contextMenu?.y,
    getCanvasPointFromClient,
    droppedTanks,
    safeGetTankZ,
    setDroppedTanks,
    makeId,
  ]);

  return {
    clipboardRef, // optional (handy for debugging), can remove later
    hasClipboard,
    copyFromContext,
    pasteAtContext,
  };
}
