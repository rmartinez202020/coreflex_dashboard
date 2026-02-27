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

  // ===============================
  // ✅ DEBUG (NO CONSOLE TYPING)
  // Turn on by URL: ?gddebug=1
  // ===============================
  const debugEnabled = React.useMemo(() => {
    try {
      if (typeof window === "undefined") return false;
      const qs = window.location?.search || "";
      const params = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
      const v = String(params.get("gddebug") || "").trim().toLowerCase();
      return v === "1" || v === "true" || v === "yes";
    } catch {
      return false;
    }
  }, []);

  const dbg = React.useCallback(
    (...args) => {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console
      console.warn("[TelemetryPoller]", ...args);
    },
    [debugEnabled]
  );

  const dbgErr = React.useCallback(
    (...args) => {
      if (!debugEnabled) return;
      // eslint-disable-next-line no-console
      console.error("[TelemetryPoller]", ...args);
    },
    [debugEnabled]
  );

  // ✅ normalize API response to array (matches loader.js idea)
  function normalizeArray(data) {
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.devices)
      ? data.devices
      : Array.isArray(data?.rows)
      ? data.rows
      : [];
  }

  // ✅ read device id robustly (matches loader.js)
  function readDeviceId(row) {
    return (
      row?.deviceId ??
      row?.device_id ??
      row?.id ??
      row?.imei ??
      row?.IMEI ??
      row?.DEVICE_ID ??
      ""
    );
  }

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
      if (!token) {
        dbg("skip: no token");
        return;
      }

      const wanted = collectWanted();
      dbg("wanted devices", Object.fromEntries(
        Object.entries(wanted).map(([k, set]) => [k, Array.from(set).slice(0, 20)])
      ));

      const anyWanted = Object.values(wanted).some((s) => s && s.size > 0);
      if (!anyWanted) {
        dbg("no wanted bindings -> clearing telemetryMap");
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
        const url = `${API_URL}/${base}/my-devices`;
        dbg("fetchModel", { base, url });

        const res = await fetch(url, {
          headers: getAuthHeaders?.() || {},
        });

        if (!res.ok) {
          dbgErr("fetchModel failed", { base, status: res.status });
          return [];
        }

        const data = await res.json().catch(() => null);
        const arr = normalizeArray(data);

        dbg("fetchModel ok", {
          base,
          dataType: data ? typeof data : "null",
          topKeys: data && typeof data === "object" ? Object.keys(data).slice(0, 10) : null,
          rows: arr.length,
          sampleIds: arr.slice(0, 6).map((r) => String(readDeviceId(r)).trim()).filter(Boolean),
        });

        return arr;
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
          const id = String(readDeviceId(row) || "").trim();
          if (id && setWanted.has(id)) next[modelKey][id] = row;
        }
      }

      dbg("telemetryMap built", Object.fromEntries(
        Object.entries(next).map(([k, bucket]) => [k, Object.keys(bucket).slice(0, 20)])
      ));

      setTelemetryMap(next);
    } catch (e) {
      dbgErr("poller error (keeping last telemetryMap)", String(e?.message || e));
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
    dbg,
    dbgErr,
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