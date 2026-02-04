// src/hooks/useDashboardZOrder.js
import { useCallback, useEffect } from "react";

/**
 * useDashboardZOrder
 * - Centralizes z-order logic for canvas objects
 * - Exposes: getTankZ, getLayerScore, normalizeZList, bringToFront, sendToBack
 * - Also auto-fixes old projects missing z/zIndex
 */
export default function useDashboardZOrder({ droppedTanks, setDroppedTanks }) {
  // ✅ Option A: z-order uses tank.z (fallback to tank.zIndex)
  const getTankZ = useCallback((t) => {
    const v = Number(t?.z ?? t?.zIndex ?? 1);
    return Number.isFinite(v) && v > 0 ? v : 1;
  }, []);

  const getLayerScore = useCallback((obj) => getTankZ(obj), [getTankZ]);

  // ✅ Normalize list so every object has a safe positive z and zIndex
  const normalizeZList = useCallback((list) => {
    let next = 1;

    return (list || []).map((t) => {
      const raw =
        t.z !== undefined && t.z !== null
          ? t.z
          : t.zIndex !== undefined && t.zIndex !== null
          ? t.zIndex
          : next++;

      const safe = Math.max(1, Number(raw) || 1);

      return {
        ...t,
        z: safe,
        zIndex: safe, // ✅ keep legacy field in sync
      };
    });
  }, []);

  // ✅ Bring to Front / Send to Back WITHOUT negatives and WITHOUT disappearing
  const bringToFront = useCallback(
    (id) => {
      if (!id) return;

      setDroppedTanks((prev) => {
        const items = normalizeZList(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = getTankZ(target);
        const maxZ = Math.max(1, ...items.map((t) => getTankZ(t)));

        // already top
        if (oldZ === maxZ) return items;

        return items.map((t) => {
          const z = getTankZ(t);

          if (t.id === id) return { ...t, z: maxZ, zIndex: maxZ };

          // shift down anything above oldZ
          if (z > oldZ) return { ...t, z: z - 1, zIndex: z - 1 };

          return { ...t, z, zIndex: z };
        });
      });
    },
    [setDroppedTanks, normalizeZList, getTankZ]
  );

  const sendToBack = useCallback(
    (id) => {
      if (!id) return;

      setDroppedTanks((prev) => {
        const items = normalizeZList(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = getTankZ(target);
        const minZ = 1;

        // already back
        if (oldZ === minZ) return items;

        return items.map((t) => {
          const z = getTankZ(t);

          if (t.id === id) return { ...t, z: minZ, zIndex: minZ };

          // shift up anything below oldZ
          if (z < oldZ) return { ...t, z: z + 1, zIndex: z + 1 };

          return { ...t, z, zIndex: z };
        });
      });
    },
    [setDroppedTanks, normalizeZList, getTankZ]
  );

  // ✅ Auto-normalize old projects once (adds z/zIndex if missing)
  useEffect(() => {
    if (!droppedTanks?.length) return;

    const needsFix = droppedTanks.some((t) => t.z == null || t.zIndex == null);
    if (!needsFix) return;

    setDroppedTanks((prev) => normalizeZList(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZList]);

  return {
    getTankZ,
    getLayerScore,
    normalizeZList,
    bringToFront,
    sendToBack,
  };
}
