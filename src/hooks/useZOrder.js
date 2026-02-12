import React from "react";

export default function useZOrder({ droppedTanks, setDroppedTanks }) {
  // ✅ Source of truth for z (new + legacy)
  const getTankZ = React.useCallback((t) => {
    return Number(t?.z ?? t?.zIndex ?? 0) || 0;
  }, []);

  // ✅ Normalize list: ensure every item has z & zIndex >= 1
  const normalizeZ = React.useCallback((list) => {
    const arr = Array.isArray(list) ? list : [];
    let next = 1;

    return arr.map((t) => {
      const base =
        t?.z !== undefined && t?.z !== null
          ? t.z
          : t?.zIndex !== undefined && t?.zIndex !== null
          ? t.zIndex
          : next++;

      const safe = Math.max(1, Number(base) || 1);
      return { ...t, z: safe, zIndex: safe };
    });
  }, []);

  // ✅ Auto-normalize once whenever we see missing z/zIndex
  React.useEffect(() => {
    if (!Array.isArray(droppedTanks) || droppedTanks.length === 0) return;

    const missing = droppedTanks.some((t) => t?.z == null || t?.zIndex == null);
    if (!missing) return;

    setDroppedTanks((prev) => normalizeZ(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZ]);

  // ✅ Stable bring front/back (reorders by shifting neighbors)
  const bringToFront = React.useCallback(
    (id) => {
      setDroppedTanks((prev) => {
        const items = normalizeZ(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = target.z;
        const maxZ = Math.max(1, ...items.map((t) => t.z));
        if (oldZ === maxZ) return items;

        return items.map((t) => {
          if (t.id === id) return { ...t, z: maxZ, zIndex: maxZ };
          if (t.z > oldZ) return { ...t, z: t.z - 1, zIndex: t.z - 1 };
          return t;
        });
      });
    },
    [setDroppedTanks, normalizeZ]
  );

  const sendToBack = React.useCallback(
    (id) => {
      setDroppedTanks((prev) => {
        const items = normalizeZ(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = target.z;
        const minZ = 1;
        if (oldZ === minZ) return items;

        return items.map((t) => {
          if (t.id === id) return { ...t, z: minZ, zIndex: minZ };
          if (t.z < oldZ) return { ...t, z: t.z + 1, zIndex: t.z + 1 };
          return t;
        });
      });
    },
    [setDroppedTanks, normalizeZ]
  );

  return { getTankZ, normalizeZ, bringToFront, sendToBack };
}
