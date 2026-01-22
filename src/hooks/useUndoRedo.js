// src/hooks/useUndoRedo.js
import { useCallback, useRef, useState } from "react";

/**
 * Undo/Redo history (timeline + pointer)
 *
 * ✅ Each push() is a single undo step.
 * ✅ Undo always moves back 1 step (no “need 6 moves” behavior).
 * ✅ Redo always moves forward 1 step.
 * ✅ Keeps only the last `limit` snapshots.
 *
 * Notes:
 * - Snapshots are deep-cloned to avoid in-place mutations corrupting history.
 * - This hook is self-contained: undo/redo do NOT need currentSnapshot args.
 */
export default function useUndoRedo(limit = 6) {
  const historyRef = useRef([]);  // array of snapshots
  const indexRef = useRef(-1);    // pointer to current snapshot

  // force UI refresh for canUndo/canRedo
  const [, forceTick] = useState(0);
  const tick = () => forceTick((x) => x + 1);

  const clone = (snapshot) => JSON.parse(JSON.stringify(snapshot || []));

  const reset = useCallback(() => {
    historyRef.current = [];
    indexRef.current = -1;
    tick();
  }, []);

  const push = useCallback(
    (snapshot) => {
      const next = clone(snapshot);

      // if we undid and then pushed, drop redo states (future)
      if (indexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
      }

      // dedupe exact same snapshot
      const current = historyRef.current[indexRef.current];
      if (current && JSON.stringify(current) === JSON.stringify(next)) return;

      historyRef.current.push(next);

      // cap history length
      if (historyRef.current.length > limit) {
        const overflow = historyRef.current.length - limit;
        historyRef.current.splice(0, overflow);
        indexRef.current -= overflow;
      }

      indexRef.current = historyRef.current.length - 1;
      tick();
    },
    [limit]
  );

  const undo = useCallback(() => {
    // need at least 2 states to move back (current + previous)
    if (indexRef.current <= 0) return { ok: false };

    indexRef.current -= 1;
    tick();
    return { ok: true, snapshot: clone(historyRef.current[indexRef.current]) };
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return { ok: false };

    indexRef.current += 1;
    tick();
    return { ok: true, snapshot: clone(historyRef.current[indexRef.current]) };
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo =
    indexRef.current >= 0 && indexRef.current < historyRef.current.length - 1;

  return { push, undo, redo, reset, canUndo, canRedo };
}
