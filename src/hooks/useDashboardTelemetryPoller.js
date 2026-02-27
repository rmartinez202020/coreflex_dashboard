// src/hooks/useDashboardTelemetryPoller.js
import React from "react";

/**
 * useDashboardTelemetryPoller
 * - ONE poller per DashboardCanvas (Play/Launch only)
 * - Polls every pollMs (default 3000ms)
 * - Fetches /{base}/my-devices at most once per model per tick
 * - Builds telemetryMap[model][deviceId] = row
 *
 * Supports bindings stored as:
 *  A) tank.properties.tag = { model, deviceId, field }
 *  B) GraphicDisplay style: tank.bindModel / tank.bindDeviceId (or inside tank.properties)
 */
export default function useDashboardTelemetryPoller({
  isPlay,
  API_URL,
  getAuthHeaders,
  getToken,
  droppedTanks,
  activeDashboardId,
  dashboardId,
  selectedTank,
  resolveDashboardId,
  pollMs = 3000,
  modelMeta = {
    zhc1921: { base: "zhc1921" },
    zhc1661: { base: "zhc1661" },
    tp4000: { base: "tp4000" },
  },
} = {}) {
  const [telemetryMap, setTelemetryMap] = React.useState(() => {
    const out = {};
    for (const k of Object.keys(modelMeta || {})) out[k] = {};
    return out;
  });

  const loadingRef = React.useRef(false);

  // ✅ Extract binding from ANY widget shape we support
  const extractBinding = React.useCallback(
    (t) => {
      if (!t) return null;

      // A) common binding: properties.tag
      const tag = t?.properties?.tag || t?.tag || null;
      if (tag) {
        const model = String(tag?.model || "").trim();
        const deviceId = String(tag?.deviceId || "").trim();
        if (model && deviceId && modelMeta?.[model]?.base) return { model, deviceId };
      }

      // B) graphicDisplay binding style
      const bm = String(t?.bindModel ?? t?.properties?.bindModel ?? "").trim();
      const bd = String(t?.bindDeviceId ?? t?.properties?.bindDeviceId ?? "").trim();
      if (bm && bd && modelMeta?.[bm]?.base) return { model: bm, deviceId: bd };

      return null;
    },
    [modelMeta]
  );

  const collectWanted = React.useCallback(() => {
    const wanted = {};
    for (const k of Object.keys(modelMeta || {})) wanted[k] = new Set();

    const list = Array.isArray(droppedTanks) ? droppedTanks : [];
    for (const t of list) {
      const x = extractBinding(t);
      if (!x) continue;
      wanted[x.model].add(x.deviceId);
    }

    return wanted;
  }, [droppedTanks, extractBinding, modelMeta]);

  const fetchOnce = React.useCallback(async () => {
    if (!isPlay) return;

    const dash = resolveDashboardId?.({
      activeDashboardId,
      dashboardId,
      selectedTank,
      droppedTanks,
    });
    if (!dash) return;

    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const token = String(getToken?.() || "").trim();
      if (!token) return;

      const wanted = collectWanted();

      const anyWanted = Object.values(wanted).some((s) => s && s.size > 0);
      if (!anyWanted) {
        setTelemetryMap((prev) => {
          let changed = false;
          const next = {};
          for (const k of Object.keys(modelMeta || {})) {
            const wasSize = Object.keys(prev?.[k] || {}).length;
            next[k] = {};
            if (wasSize) changed = true;
          }
          return changed ? next : prev;
        });
        return;
      }

      async function fetchModel(base) {
        const res = await fetch(`${API_URL}/${base}/my-devices`, {
          headers: getAuthHeaders?.() || {},
        });
        if (!res.ok) return [];
        const data = await res.json().catch(() => []);
        return Array.isArray(data) ? data : [];
      }

      const results = await Promise.all(
        Object.keys(modelMeta || {}).map(async (modelKey) => {
          const base = modelMeta[modelKey]?.base;
          if (!base) return [modelKey, []];

          if (!wanted?.[modelKey]?.size) return [modelKey, []];

          const rows = await fetchModel(base);
          return [modelKey, rows];
        })
      );

      const next = {};
      for (const k of Object.keys(modelMeta || {})) next[k] = {};

      for (const [modelKey, rows] of results) {
        const setWanted = wanted?.[modelKey] || new Set();
        for (const row of rows || []) {
          const id = String(row?.deviceId ?? row?.device_id ?? "").trim();
          if (id && setWanted.has(id)) next[modelKey][id] = row;
        }
      }

      setTelemetryMap(next);
    } catch {
      // keep last good telemetryMap
    } finally {
      loadingRef.current = false;
    }
  }, [
    isPlay,
    API_URL,
    getAuthHeaders,
    getToken,
    droppedTanks,
    activeDashboardId,
    dashboardId,
    selectedTank,
    resolveDashboardId,
    collectWanted,
    modelMeta,
  ]);

  React.useEffect(() => {
    if (!isPlay) return;

    fetchOnce();
    const ms = Math.max(500, Number(pollMs) || 3000);

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchOnce();
    }, ms);

    return () => clearInterval(t);
  }, [isPlay, fetchOnce, pollMs]);

  return { telemetryMap, fetchTelemetryOnce: fetchOnce };
}