// src/hooks/useUndoRedo.js
import { useCallback, useRef, useState } from "react";

/**
 * Simple undo/redo history for an array state (like droppedTanks)
 * - Works with setState-style updates
 * - Stores up to `limit` snapshots
 */
export default function useUndoRedo(limit = 6) {
  const historyRef = useRef({
    past: [],
    future: [],
  });

  // just to force UI refresh for canUndo/canRedo
  const [, forceTick] = useState(0);

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const push = useCallback((currentSnapshot) => {
    const h = historyRef.current;
    h.past.push(currentSnapshot);

    // cap history
    if (h.past.length > limit) {
      h.past.shift();
    }

    // new action invalidates redo
    h.future = [];

    forceTick((x) => x + 1);
  }, [limit]);

  const undo = useCallback((currentSnapshot) => {
    const h = historyRef.current;
    if (h.past.length === 0) return { ok: false };

    const previous = h.past.pop();
    h.future.push(currentSnapshot);

    forceTick((x) => x + 1);
    return { ok: true, snapshot: previous };
  }, []);

  const redo = useCallback((currentSnapshot) => {
    const h = historyRef.current;
    if (h.future.length === 0) return { ok: false };

    const next = h.future.pop();
    h.past.push(currentSnapshot);

    // cap past again just in case
    if (h.past.length > limit) {
      h.past.shift();
    }

    forceTick((x) => x + 1);
    return { ok: true, snapshot: next };
  }, [limit]);

  const reset = useCallback(() => {
    historyRef.current = { past: [], future: [] };
    forceTick((x) => x + 1);
  }, []);

  return { push, undo, redo, reset, canUndo, canRedo };
}
