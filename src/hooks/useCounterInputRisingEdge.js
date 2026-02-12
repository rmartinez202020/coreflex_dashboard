// src/hooks/useCounterInputRisingEdge.js
import React from "react";

// ✅ always get an array of DB rows (whatever shape the parent passes)
function getRows(sensorsData) {
  if (Array.isArray(sensorsData)) return sensorsData;

  if (sensorsData && Array.isArray(sensorsData.rows)) return sensorsData.rows;
  if (sensorsData && Array.isArray(sensorsData.data)) return sensorsData.data;
  if (sensorsData && Array.isArray(sensorsData.devices)) return sensorsData.devices;

  return [];
}

// ✅ SAME read behavior as CounterInputSettingsModal
function readTagFromRow(row, field) {
  if (!row || !field) return undefined;

  if (row[field] !== undefined) return row[field];

  const up = String(field).toUpperCase();
  if (row[up] !== undefined) return row[up];

  // legacy DI mapping: di1..di6 -> in1..in6
  if (/^di[1-6]$/i.test(field)) {
    const n = String(field).toLowerCase().replace("di", "");
    const alt = `in${n}`;
    if (row[alt] !== undefined) return row[alt];
    const altUp = alt.toUpperCase();
    if (row[altUp] !== undefined) return row[altUp];
  }

  return undefined;
}

function to01(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v > 0 ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
    const n = Number(s);
    if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
  }
  return v ? 1 : 0;
}

/**
 * ✅ CounterInput rising edge hook
 * - In PLAY mode only
 * - Reads obj.properties.tag { deviceId, field }
 * - Increments obj.properties.count when DI rises (0 -> 1)
 */
export default function useCounterInputRisingEdge({
  isPlay,
  sensorsData,
  setDroppedTanks,
}) {
  React.useEffect(() => {
    if (!isPlay) return;

    setDroppedTanks((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;

      // quick exit if no counters exist
      const hasCounter = prev.some((o) => o?.shape === "counterInput");
      if (!hasCounter) return prev;

      const rows = getRows(sensorsData);
      if (!rows.length) return prev;

      // ✅ fast lookup by deviceId (handles deviceId vs device_id)
      const byDeviceId = new Map(
        rows.map((r) => [String(r.deviceId ?? r.device_id ?? "").trim(), r])
      );

      let changed = false;

      const next = prev.map((obj) => {
        if (obj.shape !== "counterInput") return obj;

        const deviceId = String(obj?.properties?.tag?.deviceId || "").trim();
        const field = String(obj?.properties?.tag?.field || "").trim();
        if (!deviceId || !field) return obj;

        const row = byDeviceId.get(deviceId) || null;
        if (!row) return obj;

        const cur01 = to01(readTagFromRow(row, field));
        if (cur01 === null) return obj;

        // ✅ IMPORTANT: init _prev01 ONLY if it doesn't exist yet
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
  }, [isPlay, sensorsData, setDroppedTanks]);
}
