// src/hooks/useDashboardTelemetryPoller.js
import React from "react";

/**
 * useDashboardTelemetryPoller
 * - ONE poller per DashboardCanvas (Play/Launch only)
 * - Polls every pollMs (default 3000ms)
 * - Private mode: fetches telemetry per model per tick
 * - Public tenant mode: fetches /tenant-access/devices once per tick
 * - Builds telemetryMap[model][deviceId] = row
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

  // public tenant launch support
  isPublicLaunch = false,
  publicDashSlug = "",
  publicDashLaunchId = "",
  tenantEmail = "",
  isTenantAuthenticated = false,

  pollMs = 3000,

  modelMeta = {
    zhc1921: { base: "zhc1921" },
    zhc1661: { base: "zhc1661" },
    tp4000: { base: "tp4000" },

    // ✅ NEW
    cfr100: {
      base: "radar-level",
      endpoint: "/radar-level/my-sensors",
    },
  },
} = {}) {
  const [telemetryMap, setTelemetryMap] = React.useState(() => {
    const out = {};
    for (const k of Object.keys(modelMeta || {})) out[k] = {};
    return out;
  });

  const loadingRef = React.useRef(false);

  // ======================================
  // DEBUG
  // ======================================
  const debugEnabled = React.useMemo(() => {
    try {
      if (typeof window === "undefined") return false;

      const qs = window.location?.search || "";

      const params = new URLSearchParams(
        qs.startsWith("?") ? qs.slice(1) : qs
      );

      const v = String(params.get("gddebug") || "")
        .trim()
        .toLowerCase();

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

  // ======================================
  // HELPERS
  // ======================================

  function normalizeArray(data) {
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.devices)
      ? data.devices
      : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.results)
      ? data.results
      : [];
  }

  function normalizeImei(value) {
    return String(value || "")
      .trim()
      .replace(/\D/g, "");
  }

  function normalizeModelName(raw) {
    const v = String(raw || "")
      .trim()
      .toLowerCase();

    if (!v) return "";

    if (v === "zhc1921" || v === "cf-2000" || v === "cf2000") {
      return "zhc1921";
    }

    if (v === "zhc1661" || v === "cf-1600" || v === "cf1600") {
      return "zhc1661";
    }

    if (v === "tp4000" || v === "tp-4000") {
      return "tp4000";
    }

    // ✅ NEW
    if (
      v === "cfr100" ||
      v === "cf-r100" ||
      v === "cf_r100"
    ) {
      return "cfr100";
    }

    return v;
  }

  function readDeviceId(row) {
    return (
      normalizeImei(
        row?.raw_imei_bytes ??
          row?.rawImeiBytes ??
          row?.imei ??
          row?.IMEI ??
          row?.deviceId ??
          row?.device_id ??
          row?.DEVICE_ID ??
          row?.id ??
          ""
      ) || ""
    );
  }

  function readModelKey(row) {
    return normalizeModelName(
      row?.model ??
        row?.bindModel ??
        row?.bind_model ??
        row?.deviceModel ??
        row?.device_model ??
        ""
    );
  }

  // ======================================
  // EXTRACT BINDINGS
  // ======================================

  const extractBinding = React.useCallback(
    (t) => {
      if (!t) return null;

      // A) common binding
      const tag = t?.properties?.tag || t?.tag || null;

      if (tag) {
        const model = normalizeModelName(tag?.model);

        const deviceId = String(
          tag?.deviceId || tag?.device_id || ""
        ).trim();

        if (model && deviceId) {
          return { model, deviceId };
        }
      }

      // B) graphicDisplay style
      const bm = normalizeModelName(
        t?.bindModel ??
          t?.properties?.bindModel ??
          ""
      );

      const bd = String(
        t?.bindDeviceId ??
          t?.properties?.bindDeviceId ??
          t?.bind_device_id ??
          t?.properties?.bind_device_id ??
          t?.bindImei ??
          t?.properties?.bindImei ??
          t?.unitId ??
          t?.properties?.unitId ??
          ""
      ).trim();

      if (bm && bd) {
        return {
          model: bm,
          deviceId: bd,
        };
      }

      return null;
    },
    []
  );

  const collectWanted = React.useCallback(() => {
    const wanted = {};

    for (const k of Object.keys(modelMeta || {})) {
      wanted[k] = new Set();
    }

    const list = Array.isArray(droppedTanks)
      ? droppedTanks
      : [];

    for (const t of list) {
      const x = extractBinding(t);

      if (!x) continue;

      if (!wanted[x.model]) {
        wanted[x.model] = new Set();
      }

      wanted[x.model].add(
        normalizeImei(x.deviceId)
      );
    }

    return wanted;
  }, [droppedTanks, extractBinding, modelMeta]);

  const clearTelemetryMap = React.useCallback(() => {
    setTelemetryMap((prev) => {
      let changed = false;

      const next = {};

      for (const k of Object.keys(modelMeta || {})) {
        const wasSize = Object.keys(prev?.[k] || {})
          .length;

        next[k] = {};

        if (wasSize) changed = true;
      }

      return changed ? next : prev;
    });
  }, [modelMeta]);

  // ======================================
  // MAIN FETCH
  // ======================================

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
      const wanted = collectWanted();

      const anyWanted = Object.values(wanted).some(
        (s) => s && s.size > 0
      );

      if (!anyWanted) {
        clearTelemetryMap();
        return;
      }

      // ======================================
      // PUBLIC MODE
      // ======================================

      if (isPublicLaunch) {
        return;
      }

      // ======================================
      // PRIVATE MODE
      // ======================================

      const token = String(
        getToken?.() || ""
      ).trim();

      if (!token) {
        dbg("private mode skip: no token");
        return;
      }

      async function fetchModel(modelKey, base) {
        // ======================================
        // CFR100
        // ======================================

        if (modelKey === "cfr100") {
          const url = `${API_URL}/radar-level/my-sensors`;

          dbg("fetchModel CFR100", { url });

          const res = await fetch(url, {
            headers: {
              "Content-Type":
                "application/json",
              ...(getAuthHeaders?.() || {}),
            },
          });

          if (!res.ok) {
            dbgErr(
              "fetchModel CFR100 failed",
              {
                status: res.status,
              }
            );

            return [];
          }

          const data = await res
            .json()
            .catch(() => []);

          const arr = Array.isArray(data)
            ? data
            : [];

          const normalized = arr.map((r) => ({
            ...r,

            model: "cfr100",

            deviceId: normalizeImei(
              r.raw_imei_bytes ||
                r.rawImeiBytes ||
                r.imei ||
                ""
            ),

            device_id: normalizeImei(
              r.raw_imei_bytes ||
                r.rawImeiBytes ||
                r.imei ||
                ""
            ),

            status: r.received_at
              ? "online"
              : "offline",
          }));

          dbg("fetchModel CFR100 ok", {
            rows: normalized.length,
          });

          return normalized;
        }

        // ======================================
        // DEFAULT
        // ======================================

        const url = `${API_URL}/${base}/my-devices`;

        dbg("fetchModel", {
          base,
          url,
        });

        const res = await fetch(url, {
          headers:
            getAuthHeaders?.() || {},
        });

        if (!res.ok) {
          dbgErr("fetchModel failed", {
            base,
            status: res.status,
          });

          return [];
        }

        const data = await res
          .json()
          .catch(() => null);

        const arr = normalizeArray(data);

        dbg("fetchModel ok", {
          base,
          rows: arr.length,
        });

        return arr;
      }

      const results = await Promise.all(
        Object.keys(modelMeta || {}).map(
          async (modelKey) => {
            const base =
              modelMeta[modelKey]?.base;

            if (!base) {
              return [modelKey, []];
            }

            if (
              !wanted?.[modelKey]?.size
            ) {
              return [modelKey, []];
            }

            const rows =
              await fetchModel(
                modelKey,
                base
              );

            return [modelKey, rows];
          }
        )
      );

      const next = {};

      for (const k of Object.keys(
        modelMeta || {}
      )) {
        next[k] = {};
      }

      for (const [modelKey, rows] of results) {
        const setWanted =
          wanted?.[modelKey] || new Set();

        for (const row of rows || []) {
          const id = normalizeImei(
            readDeviceId(row)
          );

          if (
            id &&
            setWanted.has(id)
          ) {
            next[modelKey][id] = row;
          }
        }
      }

      dbg(
        "private telemetryMap built",
        Object.fromEntries(
          Object.entries(next).map(
            ([k, bucket]) => [
              k,
              Object.keys(bucket).slice(
                0,
                20
              ),
            ]
          )
        )
      );

      setTelemetryMap(next);
    } catch (e) {
      dbgErr(
        "poller error",
        String(e?.message || e)
      );
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
    isPublicLaunch,
    clearTelemetryMap,
    dbg,
    dbgErr,
  ]);

  // ======================================
  // INTERVAL
  // ======================================

  React.useEffect(() => {
    if (!isPlay) return;

    fetchOnce();

    const ms = Math.max(
      500,
      Number(pollMs) || 3000
    );

    const t = setInterval(() => {
      if (document.hidden) return;

      fetchOnce();
    }, ms);

    return () => clearInterval(t);
  }, [isPlay, fetchOnce, pollMs]);

  return {
    telemetryMap,
    fetchTelemetryOnce: fetchOnce,
  };
}