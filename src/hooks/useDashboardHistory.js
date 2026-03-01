// src/hooks/useDashboardHistory.js
import { useCallback, useEffect, useRef } from "react";
import useUndoRedo from "./useUndoRedo";

/**
 * useDashboardHistory
 * Wraps useUndoRedo + keeps all history-related refs in ONE place.
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

  // avoids pushing the initial snapshot twice
  const hasUndoInitRef = useRef(false);

  // blocks snapshot effect while dragging objects / scaling
  const isObjectDraggingRef = useRef(false);

  // prevents duplicate undo snapshots
  const lastPushedSnapshotRef = useRef("");

  // baseline (starting point) snapshot — you can’t undo before this
  const baselineSnapshotRef = useRef("");

  // blocks snapshot pushes while restoring from DB
  const isRestoringRef = useRef(false);

  // drag flags
  const dragStartedRef = useRef(false);
  const dragStartPushedRef = useRef(false);

  // ✅ scale flags
  const scaleInFlightRef = useRef(false);
  const scaleTimerRef = useRef(null);

  // ----------------------------------------
  // ✅ History auto-push effect (when NOT dragging)
  // ----------------------------------------
  useEffect(() => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;

    // do not snapshot while restoring
    if (isRestoringRef.current) return;

    // do not snapshot while dragging/scaling
    if (isObjectDraggingRef.current) return;

    const safeArr = deepClone(droppedTanks || []);
    const snapshot = JSON.stringify(safeArr);

    // ✅ init once per dashboard load (INCLUDING empty dashboard)
    if (!hasUndoInitRef.current) {
      hasUndoInitRef.current = true;

      reset();

      // baseline is whatever the dashboard starts as (even [])
      baselineSnapshotRef.current = snapshot;
      lastPushedSnapshotRef.current = snapshot;

      // prevent duplicate push on next render
      skipHistoryPushRef.current = true;

      // ✅ push baseline snapshot (even if empty) so we can undo back to empty
      push(safeArr);
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      lastPushedSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot === lastPushedSnapshotRef.current) return;

    lastPushedSnapshotRef.current = snapshot;
    push(safeArr);
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

      reset();

      skipHistoryPushRef.current = true;
      hasUndoInitRef.current = true;

      // ✅ baseline push (can be empty)
      push(safeArr);

      // reset drag state
      isObjectDraggingRef.current = false;
      dragStartedRef.current = false;
      dragStartPushedRef.current = false;

      // reset scale state
      scaleInFlightRef.current = false;
      if (scaleTimerRef.current) clearTimeout(scaleTimerRef.current);
      scaleTimerRef.current = null;
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
  // ✅ Drag helpers
  // ----------------------------------------
  const onDragMoveBegin = useCallback(() => {
    if (activePage !== "dashboard") return;
    if (dashboardMode !== "edit") return;
    if (isRestoringRef.current) return;

    if (!dragStartedRef.current) {
      dragStartedRef.current = true;
      isObjectDraggingRef.current = true;

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

    setTimeout(() => {
      const afterArr = deepClone(droppedRef?.current || []);
      const afterSnap = JSON.stringify(afterArr);

      isObjectDraggingRef.current = false;

      dragStartedRef.current = false;
      dragStartPushedRef.current = false;

      if (afterSnap !== lastPushedSnapshotRef.current) {
        lastPushedSnapshotRef.current = afterSnap;
        push(afterArr);
      }
    }, 0);
  }, [activePage, droppedRef, push]);

  // ----------------------------------------
  // ✅ Scale commits should be undoable
  // ----------------------------------------
  useEffect(() => {
    const onScale = () => {
      if (activePage !== "dashboard") return;
      if (dashboardMode !== "edit") return;
      if (isRestoringRef.current) return;

      // prevent duplicate commits from the same action
      if (scaleInFlightRef.current) return;
      scaleInFlightRef.current = true;

      // block auto snapshot while we commit this action
      isObjectDraggingRef.current = true;

      const beforeArr = deepClone(droppedRef?.current || []);
      const beforeSnap = JSON.stringify(beforeArr);

      if (beforeSnap !== lastPushedSnapshotRef.current) {
        lastPushedSnapshotRef.current = beforeSnap;
        push(beforeArr);
      }

      // Poll for updated ref (App updates droppedRef in useEffect)
      const start = Date.now();
      const maxMs = 600; // safety
      const intervalMs = 30;

      const poll = () => {
        const afterArr = deepClone(droppedRef?.current || []);
        const afterSnap = JSON.stringify(afterArr);

        const changed = afterSnap !== beforeSnap;

        if (changed) {
          if (afterSnap !== lastPushedSnapshotRef.current) {
            lastPushedSnapshotRef.current = afterSnap;
            push(afterArr);
          }

          // unblock
          isObjectDraggingRef.current = false;
          scaleInFlightRef.current = false;
          scaleTimerRef.current = null;
          return;
        }

        if (Date.now() - start > maxMs) {
          // give up but unblock (prevents locking history)
          isObjectDraggingRef.current = false;
          scaleInFlightRef.current = false;
          scaleTimerRef.current = null;
          return;
        }

        scaleTimerRef.current = setTimeout(poll, intervalMs);
      };

      scaleTimerRef.current = setTimeout(poll, intervalMs);
    };

    window.addEventListener("coreflex-scale", onScale);
    return () => {
      window.removeEventListener("coreflex-scale", onScale);
      if (scaleTimerRef.current) clearTimeout(scaleTimerRef.current);
      scaleTimerRef.current = null;
    };
  }, [activePage, dashboardMode, droppedRef, push]);

  // ----------------------------------------
  // ✅ Restore helpers
  // ----------------------------------------
  const beginRestore = useCallback(() => {
    isRestoringRef.current = true;

    hasUndoInitRef.current = false;
    reset();
    lastPushedSnapshotRef.current = "";
    baselineSnapshotRef.current = "";
    skipHistoryPushRef.current = true;

    isObjectDraggingRef.current = false;
    dragStartedRef.current = false;
    dragStartPushedRef.current = false;

    scaleInFlightRef.current = false;
    if (scaleTimerRef.current) clearTimeout(scaleTimerRef.current);
    scaleTimerRef.current = null;
  }, [reset]);

  const endRestore = useCallback(() => {
    isRestoringRef.current = false;

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
    if (JSON.stringify(current) === baselineSnapshotRef.current) return;

    let res = undo();
    if (!res?.ok) return;

    // if undo returned same snapshot (rare), try one more step
    if (JSON.stringify(res.snapshot || []) === JSON.stringify(current)) {
      res = undo();
      if (!res?.ok) return;
    }

    skipHistoryPushRef.current = true;
    setDroppedTanks(deepClone(res.snapshot));
    clearSelection?.();
  }, [activePage, clearSelection, droppedRef, setDroppedTanks, undo]);

  const handleRedo = useCallback(() => {
    if (activePage !== "dashboard") return;

    const current = deepClone(droppedRef?.current || []);

    let res = redo();
    if (!res?.ok) return;

    if (JSON.stringify(res.snapshot || []) === JSON.stringify(current)) {
      res = redo();
      if (!res?.ok) return;
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

    onDragMoveBegin,
    onDragEndCommit,

    beginRestore,
    endRestore,

    refs: {
      skipHistoryPushRef,
      hasUndoInitRef,
      isObjectDraggingRef,
      dragStartedRef,
      dragStartPushedRef,
      lastPushedSnapshotRef,
      baselineSnapshotRef,
      isRestoringRef,
      scaleInFlightRef,
    },
  };
}