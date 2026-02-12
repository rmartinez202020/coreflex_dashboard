import React from "react";
import { getRows, readTagFromRow, to01 } from "../components/utils/tagRead";


export default function useCounterInputRisingEdge({
  isPlay,
  sensorsData,
  setDroppedTanks,
  debug = false,
}) {
  React.useEffect(() => {
    if (!isPlay) return;

    setDroppedTanks((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;

      const rows = getRows(sensorsData);
      if (!rows.length) return prev;

      if (debug) {
        console.log("[Counter] PLAY updater fired");
        console.log("[Counter] sensorsData:", sensorsData);
        console.log("[Counter] rows length:", rows.length);
        if (rows.length) {
          console.log(
            "[Counter] first row keys:",
            Object.keys(rows[0] || {}).slice(0, 25)
          );
          console.log("[Counter] first row:", rows[0]);
        }
      }

      let changed = false;

      const next = prev.map((obj) => {
        if (obj.shape !== "counterInput") return obj;

        const deviceId = String(obj?.properties?.tag?.deviceId || "").trim();
        const field = String(obj?.properties?.tag?.field || "").trim();
        if (!deviceId || !field) return obj;

        const row =
          rows.find(
            (r) => String(r.deviceId ?? r.device_id ?? "").trim() === deviceId
          ) || null;
        if (!row) return obj;

        const cur01 = to01(readTagFromRow(row, field));
        if (cur01 === null) return obj;

        const prev01Raw = obj?.properties?._prev01;
        const prev01 =
          prev01Raw === undefined || prev01Raw === null
            ? cur01
            : Number(prev01Raw);

        const oldCount = Number(obj?.properties?.count ?? obj?.value ?? 0) || 0;

        // ✅ rising edge 0 -> 1
        if (prev01 === 0 && cur01 === 1) {
          changed = true;
          const nextCount = oldCount + 1;

          return {
            ...obj,
            value: nextCount,
            count: nextCount,
            properties: {
              ...(obj.properties || {}),
              count: nextCount,
              _prev01: 1,
            },
          };
        }

        // ✅ keep prev state synced
        if (prev01 !== cur01) {
          changed = true;
          return {
            ...obj,
            properties: {
              ...(obj.properties || {}),
              _prev01: cur01,
            },
          };
        }

        return obj;
      });

      return changed ? next : prev;
    });
  }, [isPlay, sensorsData, setDroppedTanks, debug]);
}
