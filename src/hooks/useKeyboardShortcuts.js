import { useEffect } from "react";

export default function useKeyboardShortcuts({
  selectedIds,
  setSelectedIds,
  selectedTank,
  setSelectedTank,
  droppedTanks,
  setDroppedTanks,
}) {
  // DELETE selected objects
  useEffect(() => {
    const handleDelete = (e) => {
      if (e.key !== "Delete") return;
      if (!selectedIds.length) return;

      setDroppedTanks((prev) =>
        prev.filter((t) => !selectedIds.includes(t.id))
      );

      setSelectedIds([]);
      setSelectedTank(null);
    };

    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [selectedIds, setSelectedIds, setSelectedTank, setDroppedTanks]);

  // COPY + PASTE
  useEffect(() => {
    const handleCopyPaste = (e) => {
      if (!droppedTanks.length) return;
      if (e.ctrlKey && ["c", "v"].includes(e.key)) e.preventDefault();

      const activeObj =
        droppedTanks.find((t) => t.id === selectedTank) ||
        droppedTanks[droppedTanks.length - 1];

      const selectedObjects = selectedIds.length
        ? droppedTanks.filter((t) => selectedIds.includes(t.id))
        : [];

      // CTRL + C
      if (e.ctrlKey && e.key === "c") {
        const list = selectedObjects.length ? selectedObjects : [activeObj];
        window._copiedTank = list.map((o) =>
          JSON.parse(JSON.stringify(o))
        );
      }

      // CTRL + V
      if (e.ctrlKey && e.key === "v" && window._copiedTank) {
        const ts = Date.now();

        const clones = window._copiedTank.map((base, idx) => ({
          ...JSON.parse(JSON.stringify(base)),
          id: (ts + idx).toString(),
          x: base.x + 40 + idx * 10,
          y: base.y + 40 + idx * 10,
        }));

        setDroppedTanks((prev) => [...prev, ...clones]);
        setSelectedIds(clones.map((c) => c.id));
        setSelectedTank(clones[0].id);
      }
    };

    window.addEventListener("keydown", handleCopyPaste);
    return () =>
      window.removeEventListener("keydown", handleCopyPaste);
  }, [
    selectedIds,
    selectedTank,
    droppedTanks,
    setSelectedIds,
    setSelectedTank,
    setDroppedTanks,
  ]);

  // ARROW KEY MOVEMENT
  useEffect(() => {
    const handleArrows = (e) => {
      if (!selectedIds.length) return;

      const step = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;

      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;

      if (dx === 0 && dy === 0) return;
      e.preventDefault();

      setDroppedTanks((prev) =>
        prev.map((obj) =>
          selectedIds.includes(obj.id)
            ? { ...obj, x: obj.x + dx, y: obj.y + dy }
            : obj
        )
      );
    };

    window.addEventListener("keydown", handleArrows);
    return () => window.removeEventListener("keydown", handleArrows);
  }, [selectedIds, setDroppedTanks]);
}
