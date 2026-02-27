// src/hooks/useDashboardTelemetryPoller.js
import React from "react";

/**
 * useDashboardTelemetryPoller
 * - ONE poller per DashboardCanvas (Play/Launch only)
 * - Polls every pollMs (default 3000ms)
 * - Fetches /{base}/my-devices at most once per model per tick
 * - Builds telemetryMap[model][deviceId] = row
 *
 * Supports bindings in:
 *  1) tank.properties.tag = { model, deviceId, field }
 *  2) GraphicDisplay style: tank.bindModel / tank.bindDeviceId (or inside properties)
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

  // ✅ normalize model key to one of modelMeta keys
  const normalizeModelKey = React.useCallback(
    (m) => {
      const raw = String(m || "").trim();
      if (!raw) return "";

      // direct key
      if (modelMeta?.[raw]?.base) return raw;

      // maybe user passed base instead of key
      const found = Object.keys(modelMeta || {}).find(
        (k) => String(modelMeta?.[k]?.base || "").trim() === raw
      );
      return found || raw;
    },
    [modelMeta]
  );

  const extractBinding = React.useCallback(
    (t) => {
      if (!t) return null;

      // ✅ 1) preferred universal format: properties.tag
      const tag = t?.properties?.tag || t?.tag || null;
      if (tag) {
        const model = normalizeModelKey(tag?.model);
        const deviceId = String(tag?.deviceId || "").trim();
        if (model && deviceId && modelMeta?.[model]?.base) return { model, deviceId };
      }

      // ✅ 2) GraphicDisplay format: bindModel/bindDeviceId (sometimes saved on root or properties)
      const gm =
        t?.bindModel ??
        t?.properties?.bindModel ??
        t?.properties?.graphic?.bindModel ??
        "";
      const gd =
        t?.bindDeviceId ??
        t?.properties?.bindDeviceId ??
        t?.properties?.graphic?.bindDeviceId ??
        "";

      const model2 = normalizeModelKey(gm);
      const deviceId2 = String(gd || "").trim();
      if (model2 && deviceId2 && modelMeta?.[model2]?.base) return { model: model2, deviceId: deviceId2 };

      return null;
    },
    [modelMeta, normalizeModelKey]
  );

  const collectWanted = React.useCallback(() => {
    const wanted = {};
    for (const k of Object.keys(modelMeta || {})) wanted[k] = new Set();

    const list = Array.isArray(droppedTanks) ? droppedTanks : [];
    for (const t of list) {
      const x = extractBinding(t);
      if (!x) continue;
      if (!wanted[x.model]) wanted[x.model] = new Set();
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

    fetchOnce(); // immediate
    const ms = Math.max(500, Number(pollMs) || 3000);

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchOnce();
    }, ms);

    return () => clearInterval(t);
  }, [isPlay, fetchOnce, pollMs]);

  return { telemetryMap, fetchTelemetryOnce: fetchOnce };
}