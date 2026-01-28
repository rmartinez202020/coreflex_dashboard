// src/hooks/useKeyboardShortcuts.js
import { useEffect, useRef } from "react";

export default function useKeyboardShortcuts({
  selectedIds,
  setSelectedIds,
  selectedTank,
  setSelectedTank,
  droppedTanks,
  setDroppedTanks,
}) {
  // keep latest selectedIds in a ref so keydown always sees current selection
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // helper: don't steal arrows/copy/paste when user is typing
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

      const selected = selectedIdsRef.current || [];

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
      if (!droppedTanks?.length) {
        // still allow arrow movement even if droppedTanks empty
      } else {
        if (e.ctrlKey && ["c", "v"].includes(e.key)) e.preventDefault();

        const activeObj =
          droppedTanks.find((t) => t.id === selectedTank) ||
          droppedTanks[droppedTanks.length - 1];

        const selectedObjects = selected.length
          ? droppedTanks.filter((t) => selected.includes(t.id))
          : [];

        // CTRL + C
        if (e.ctrlKey && e.key === "c") {
          const list = selectedObjects.length ? selectedObjects : [activeObj];
          window._copiedTank = list.map((o) => JSON.parse(JSON.stringify(o)));
          return;
        }

        // CTRL + V
        if (e.ctrlKey && e.key === "v" && window._copiedTank) {
          const ts = Date.now();

          const clones = window._copiedTank.map((base, idx) => ({
            ...JSON.parse(JSON.stringify(base)),
            id: (ts + idx).toString(),
            x: (base.x || 0) + 40 + idx * 10,
            y: (base.y || 0) + 40 + idx * 10,
          }));

          setDroppedTanks((prev) => [...prev, ...clones]);
          setSelectedIds(clones.map((c) => c.id));
          setSelectedTank(clones[0].id);
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

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    droppedTanks,
    selectedTank,
    setDroppedTanks,
    setSelectedIds,
    setSelectedTank,
  ]);
}
