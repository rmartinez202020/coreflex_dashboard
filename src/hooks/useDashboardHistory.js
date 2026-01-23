// src/hooks/useDashboardHistory.js
import { useCallback, useEffect, useRef } from "react";
import useUndoRedo from "./useUndoRedo";

/**
 * useDashboardHistory
 * Wraps useUndoRedo + keeps all history-related refs in ONE place.
 *
 * You pass it:
 *  - activePage, dashboardMode
 *  - droppedTanks state (array) + droppedRef (ref) so we avoid stale snapshots
 *  - setDroppedTanks (so undo/redo can apply snapshots)
 *  - clearSelection (so undo/redo clears selected objects)
 *
 * It returns:
 *  - canUndo, canRedo
 *  - handleUndo(), handleRedo()
 *  - hardResetHistory(arr)     // use after Save / Restore / Switch dashboards
 *  - pushSnapshot(arr)         // manual push when you want
 *  - onDragMoveBegin()         // call once at first drag move (push BEFORE snapshot)
 *  - onDragEndCommit()         // call after drag end (push AFTER snapshot)
 *  - beginRestore(), endRestore()
 *
 * NOTE:
 * - App.jsx should NOT manage history refs anymore.
 */
export default function useDashboardHistory({
  limit = 6,
  activePage,
  dashboardMode,
  droppedTanks,
  droppedRef,
  setDroppedTanks,
  clearSelection,
}) {
  const { push, undo, redo, reset, canUndo, canRedo } = useUndoRedo(limit);

  const deepClone = (x) => JSON.parse(JSON.stringify(x || []));

  // prevents re-pushing history when applying undo/redo snapshot
  const skipHistoryPushRef = useRef(false);

  // avoids pushing the initial empty snapshot twice
  const hasUndoInitRef = useRef(false);

  // blocks snapshot effect while dragging objects
  const isObjectDraggingRef = useRef(false);

  // prevents duplicate undo snapshots
  const lastPushedSnapshotRef = useRef("");

  // baseline (starting point) snapshot — you can’t undo before this
  const baselineSnapshotRef = useRef("");

  // blocks snapshot pushes while restoring from DB
  const isRestoringRef = useRef(false);

  // drag flags (kept here so App.jsx is not full of refs)
  const dragStartedRef = useRef(false);
  const dragStartPushedRef = useRef(false);

  // ----------------------------------------
  // ✅ History auto-push effect (when NOT dragging)
  // ----------------------------------------
  useEffect(() => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;

    // do not snapshot while restoring
    if (isRestoringRef.current) return;

    // do not snapshot while dragging
    if (isObjectDraggingRef.current) return;

    const snapshot = JSON.stringify(droppedTanks || []);

    // init once per dashboard load
    if (!hasUndoInitRef.current) {
      // do NOT init on empty dashboard (prevents white undo)
      if (!droppedTanks || droppedTanks.length === 0) return;

      hasUndoInitRef.current = true;

      reset();

      baselineSnapshotRef.current = snapshot;
      lastPushedSnapshotRef.current = snapshot;

      // prevent duplicate push on next render
      skipHistoryPushRef.current = true;

      push(deepClone(droppedTanks));
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      lastPushedSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot === lastPushedSnapshotRef.current) return;

    lastPushedSnapshotRef.current = snapshot;
    push(deepClone(droppedTanks));
  }, [activePage, dashboardMode, droppedTanks, push, reset]);

  // ----------------------------------------
  // ✅ Hard reset history (Save / Restore / Switch)
  // ----------------------------------------
  const hardResetHistory = useCallback(
    (arr) => {
      const safeArr = deepClone(arr || []);
      const snap = JSON.stringify(safeArr);

      baselineSnapshotRef.current = snap;
      lastPushedSnapshotRef.current = snap;

      // fully reset stacks
      reset();

      // seed baseline snapshot
      skipHistoryPushRef.current = true;
      hasUndoInitRef.current = true;
      push(safeArr);

      // also reset drag state
      isObjectDraggingRef.current = false;
      dragStartedRef.current = false;
      dragStartPushedRef.current = false;
    },
    [push, reset]
  );

  // ----------------------------------------
  // ✅ Manual push helper (optional)
  // ----------------------------------------
  const pushSnapshot = useCallback(
    (arr) => {
      const safeArr = deepClone(arr || []);
      const snap = JSON.stringify(safeArr);
      if (snap === lastPushedSnapshotRef.current) return;
      lastPushedSnapshotRef.current = snap;
      push(safeArr);
    },
    [push]
  );

  // ----------------------------------------
  // ✅ Drag helpers (this removes drag-history code from App.jsx)
  // ----------------------------------------
  const onDragMoveBegin = useCallback(() => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;
    if (isRestoringRef.current) return;

    // first time we detect dragging in this action
    if (!dragStartedRef.current) {
      dragStartedRef.current = true;

      // block auto snapshot effect during drag
      isObjectDraggingRef.current = true;

      // push BEFORE-drag snapshot ONCE
      if (!dragStartPushedRef.current) {
        const beforeArr = deepClone(droppedRef?.current || []);
        const beforeSnap = JSON.stringify(beforeArr);

        if (beforeSnap !== lastPushedSnapshotRef.current) {
          lastPushedSnapshotRef.current = beforeSnap;
          push(beforeArr);
        }

        dragStartPushedRef.current = true;
      }
    }
  }, [activePage, dashboardMode, droppedRef, push]);

  const onDragEndCommit = useCallback(() => {
    if (activePage !== "dashboard") return;

    // commit AFTER drag (end of action) once DOM/state settled
    setTimeout(() => {
      const afterArr = deepClone(droppedRef?.current || []);
      const afterSnap = JSON.stringify(afterArr);

      // unblock auto snapshot effect
      isObjectDraggingRef.current = false;

      // reset drag flags
      dragStartedRef.current = false;
      dragStartPushedRef.current = false;

      // push only if changed
      if (afterSnap !== lastPushedSnapshotRef.current) {
        lastPushedSnapshotRef.current = afterSnap;
        push(afterArr);
      }
    }, 0);
  }, [activePage, droppedRef, push]);

  // ----------------------------------------
  // ✅ Restore helpers
  // ----------------------------------------
  const beginRestore = useCallback(() => {
    isRestoringRef.current = true;

    // hard reset undo state BEFORE touching droppedTanks
    hasUndoInitRef.current = false;
    reset();
    lastPushedSnapshotRef.current = "";
    baselineSnapshotRef.current = "";
    skipHistoryPushRef.current = true;

    // also stop drag mode
    isObjectDraggingRef.current = false;
    dragStartedRef.current = false;
    dragStartPushedRef.current = false;
  }, [reset]);

  const endRestore = useCallback(() => {
    isRestoringRef.current = false;

    // let next real edit push snapshots normally
    setTimeout(() => {
      skipHistoryPushRef.current = false;
    }, 0);
  }, []);

  // ----------------------------------------
  // ✅ Undo / Redo handlers
  // ----------------------------------------
  const handleUndo = useCallback(() => {
    if (activePage !== "dashboard") return;

    const current = deepClone(droppedRef?.current || []);

    // stop if at baseline
    if (JSON.stringify(current || []) === baselineSnapshotRef.current) return;

    let res = undo();
    if (!res.ok) return;

    const same =
      JSON.stringify(res.snapshot || []) === JSON.stringify(current || []);

    if (same) {
      res = undo(deepClone(res.snapshot));
      if (!res.ok) return;
    }

    skipHistoryPushRef.current = true;
    setDroppedTanks(deepClone(res.snapshot));
    clearSelection?.();
  }, [activePage, clearSelection, droppedRef, setDroppedTanks, undo]);

  const handleRedo = useCallback(() => {
    if (activePage !== "dashboard") return;

    const current = deepClone(droppedRef?.current || []);

    let res = redo();
    if (!res.ok) return;

    const same =
      JSON.stringify(res.snapshot || []) === JSON.stringify(current || []);

    if (same) {
      res = redo(deepClone(res.snapshot));
      if (!res.ok) return;
    }

    skipHistoryPushRef.current = true;
    setDroppedTanks(deepClone(res.snapshot));
    clearSelection?.();
  }, [activePage, clearSelection, droppedRef, redo, setDroppedTanks]);

  return {
    canUndo,
    canRedo,

    handleUndo,
    handleRedo,

    hardResetHistory,
    pushSnapshot,

    // ✅ NEW: use these in App.jsx drag wrappers
    onDragMoveBegin,
    onDragEndCommit,

    // ✅ NEW: use these in App.jsx restore flow
    beginRestore,
    endRestore,

    // (optional) expose refs if you still need them temporarily
    refs: {
      skipHistoryPushRef,
      hasUndoInitRef,
      isObjectDraggingRef,
      dragStartedRef,
      dragStartPushedRef,
      lastPushedSnapshotRef,
      baselineSnapshotRef,
      isRestoringRef,
    },
  };
}
