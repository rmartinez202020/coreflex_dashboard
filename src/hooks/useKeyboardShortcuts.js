// src/hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from "react";

export default function useKeyboardShortcuts({
  selectedIds,
  setSelectedIds,
  selectedTank,
  setSelectedTank,
  droppedTanks,
  setDroppedTanks,

  // ✅ NEW (optional): wire undo/redo handlers from useDashboardHistory
  onUndo,
  onRedo,
  canUndo,
  canRedo,

  // ✅ optional: gate shortcuts by page/mode (recommended)
  activePage,
  dashboardMode,
}) {
  // ✅ keep latest selectedIds in a ref so keydown always sees current selection
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // ✅ keep latest droppedTanks + selectedTank in refs (prevents stale closures)
  const droppedRef = useRef(droppedTanks);
  useEffect(() => {
    droppedRef.current = droppedTanks;
  }, [droppedTanks]);

  const selectedTankRef = useRef(selectedTank);
  useEffect(() => {
    selectedTankRef.current = selectedTank;
  }, [selectedTank]);

  // helper: don't steal keys when user is typing
  const isTypingTarget = (el) => {
    if (!el) return false;
    const tag = (el.tagName || "").toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      el.isContentEditable ||
      el.closest?.('[contenteditable="true"]')
    );
  };

  // helper: clamp movement inside the canvas
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // helper: rough size for clamping (best-effort)
  const getObjSize = (obj) => {
    const scale = typeof obj.scale === "number" ? obj.scale : 1;

    // for most objects you use either w/h OR width/height
    const baseW = obj.measuredW ?? obj.w ?? obj.width ?? 80;
    const baseH = obj.measuredH ?? obj.h ?? obj.height ?? 60;

    return { w: (baseW || 0) * scale, h: (baseH || 0) * scale };
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      // ✅ do nothing while typing in inputs (displayOutput, text boxes, etc.)
      if (isTypingTarget(document.activeElement)) return;

      // ✅ Optional gating (prevents shortcuts firing on Home page etc.)
      if (activePage && activePage !== "dashboard") return;
      if (dashboardMode && dashboardMode !== "edit") return;

      const selected = selectedIdsRef.current || [];
      const tanks = droppedRef.current || [];
      const activeId = selectedTankRef.current;

      const keyLower = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey; // ctrl (win) or cmd (mac)

      // =========================
      // ✅ UNDO / REDO (Ctrl/Cmd+Z, Ctrl+Y, Cmd+Shift+Z)
      // =========================
      if (mod && (keyLower === "z" || keyLower === "y")) {
        // Ctrl/Cmd + Z
        if (keyLower === "z" && !e.shiftKey) {
          if (!onUndo || canUndo === false) return;
          e.preventDefault();
          e.stopPropagation();
          onUndo();
          return;
        }

        // Ctrl+Y OR Cmd/Ctrl+Shift+Z
        const isRedo = keyLower === "y" || (keyLower === "z" && e.shiftKey);
        if (isRedo) {
          if (!onRedo || canRedo === false) return;
          e.preventDefault();
          e.stopPropagation();
          onRedo();
          return;
        }
      }

      // =========================
      // DELETE (supports Backspace too)
      // =========================
      if ((e.key === "Delete" || e.key === "Backspace") && selected.length) {
        e.preventDefault();

        setDroppedTanks((prev) => prev.filter((t) => !selected.includes(t.id)));
        setSelectedIds([]);
        setSelectedTank(null);
        return;
      }

      // =========================
      // COPY + PASTE
      // =========================
      if (mod && (keyLower === "c" || keyLower === "v")) {
        e.preventDefault();

        // CTRL/CMD + C
        if (keyLower === "c") {
          if (!tanks.length) return;

          const activeObj =
            tanks.find((t) => t.id === activeId) || tanks[tanks.length - 1];

          const selectedObjects = selected.length
            ? tanks.filter((t) => selected.includes(t.id))
            : [];

          const list = selectedObjects.length ? selectedObjects : [activeObj];
          window._copiedTank = list
            .filter(Boolean)
            .map((o) => JSON.parse(JSON.stringify(o)));
          return;
        }

        // CTRL/CMD + V
        if (keyLower === "v" && window._copiedTank?.length) {
          const ts = Date.now();

          const clones = window._copiedTank.map((base, idx) => ({
            ...JSON.parse(JSON.stringify(base)),
            id: (ts + idx).toString(),
            x: (base.x || 0) + 40 + idx * 10,
            y: (base.y || 0) + 40 + idx * 10,
          }));

          setDroppedTanks((prev) => [...prev, ...clones]);
          setSelectedIds(clones.map((c) => c.id));
          setSelectedTank(clones[0]?.id ?? null);
          return;
        }
      }

      // =========================
      // ARROW KEY MOVEMENT (nudging)
      // =========================
      const key = e.key;
      const isArrow =
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight";

      if (!isArrow) return;
      if (!selected.length) return;

      e.preventDefault();

      const step = e.shiftKey ? 10 : 1;
      let dx = 0,
        dy = 0;

      if (key === "ArrowUp") dy = -step;
      if (key === "ArrowDown") dy = step;
      if (key === "ArrowLeft") dx = -step;
      if (key === "ArrowRight") dx = step;

      // get canvas bounds (your DashboardCanvas has this id)
      const canvas = document.getElementById("coreflex-canvas-root");
      const rect = canvas?.getBoundingClientRect?.();
      const bw = rect?.width ?? null;
      const bh = rect?.height ?? null;

      setDroppedTanks((prev) =>
        prev.map((obj) => {
          if (!selected.includes(obj.id)) return obj;

          let nx = (obj.x || 0) + dx;
          let ny = (obj.y || 0) + dy;

          // clamp only when we know the bounds
          if (bw != null && bh != null) {
            const { w, h } = getObjSize(obj);
            nx = clamp(nx, 0, Math.max(0, bw - w));
            ny = clamp(ny, 0, Math.max(0, bh - h));
          }

          return { ...obj, x: nx, y: ny };
        })
      );
    };

    // ✅ capture true helps override browser default Ctrl+Z behavior
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [
    setDroppedTanks,
    setSelectedIds,
    setSelectedTank,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    activePage,
    dashboardMode,
  ]);
}
