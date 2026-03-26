// src/hooks/useDashboardTelemetryPoller.js
import React from "react";

/**
 * useDashboardTelemetryPoller
 * - ONE poller per DashboardCanvas (Play/Launch only)
 * - Polls every pollMs (default 3000ms)
 * - Private mode: fetches /{base}/my-devices at most once per model per tick
 * - Public tenant mode: fetches /tenant-access/devices once per tick
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

  // ✅ public tenant launch support
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

  // ✅ normalize API response to array
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

  // ✅ normalize model names from bindings / rows
  function normalizeModelName(raw) {
    const v = String(raw || "")
      .trim()
      .toLowerCase();

    if (!v) return "";

    if (v === "zhc1921" || v === "cf-2000" || v === "cf2000") return "zhc1921";
    if (v === "zhc1661" || v === "cf-1600" || v === "cf1600") return "zhc1661";
    if (v === "tp4000" || v === "tp-4000") return "tp4000";

    return v;
  }

  // ✅ read device id robustly
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

  // ✅ normalize model names from row payload
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

  // ✅ Extract binding from ANY widget shape we support
  const extractBinding = React.useCallback(
    (t) => {
      if (!t) return null;

      // A) common binding: properties.tag
      const tag = t?.properties?.tag || t?.tag || null;
      if (tag) {
        const model = normalizeModelName(tag?.model);
        const deviceId = String(tag?.deviceId || tag?.device_id || "").trim();
        if (model && deviceId && modelMeta?.[model]?.base) {
          return { model, deviceId };
        }
      }

      // B) graphicDisplay binding style
      const bm = normalizeModelName(
        t?.bindModel ?? t?.properties?.bindModel ?? ""
      );
      const bd = String(
        t?.bindDeviceId ??
          t?.properties?.bindDeviceId ??
          t?.bind_device_id ??
          t?.properties?.bind_device_id ??
          ""
      ).trim();

      if (bm && bd && modelMeta?.[bm]?.base) {
        return { model: bm, deviceId: bd };
      }

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
      if (!wanted[x.model]) wanted[x.model] = new Set();
      wanted[x.model].add(x.deviceId);
    }

    return wanted;
  }, [droppedTanks, extractBinding, modelMeta]);

  const clearTelemetryMap = React.useCallback(() => {
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
  }, [modelMeta]);

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

      dbg(
        "wanted devices",
        Object.fromEntries(
          Object.entries(wanted).map(([k, set]) => [k, Array.from(set).slice(0, 20)])
        )
      );

      const anyWanted = Object.values(wanted).some((s) => s && s.size > 0);
      if (!anyWanted) {
        dbg("no wanted bindings -> clearing telemetryMap");
        clearTelemetryMap();
        return;
      }

      // ==========================================
      // ✅ PUBLIC TENANT MODE
      // fetch once from /tenant-access/devices
      // build telemetryMap same way as private mode
      // ==========================================
      if (isPublicLaunch) {
        const email = String(tenantEmail || "")
          .trim()
          .toLowerCase();
        const slug = String(publicDashSlug || "").trim();
        const publicId = String(publicDashLaunchId || "").trim();

        if (!isTenantAuthenticated || !email || !slug || !publicId) {
          dbg("public mode skip", {
            isTenantAuthenticated,
            hasEmail: !!email,
            hasSlug: !!slug,
            hasPublicId: !!publicId,
          });
          clearTelemetryMap();
          return;
        }

        const qs = new URLSearchParams({
          dashboard_slug: slug,
          public_launch_id: publicId,
          tenant_email: email,
        });

        const url = `${API_URL}/tenant-access/devices?${qs.toString()}`;
        dbg("public fetch", { url });

        const res = await fetch(url);
        if (!res.ok) {
          dbgErr("public fetch failed", { status: res.status, url });
          clearTelemetryMap();
          return;
        }

        const data = await res.json().catch(() => []);
        const rows = normalizeArray(data);

        dbg("public fetch ok", {
          rows: rows.length,
          sample: rows.slice(0, 6).map((r) => ({
            model: readModelKey(r),
            id: String(readDeviceId(r) || "").trim(),
          })),
        });

        const next = {};
        for (const k of Object.keys(modelMeta || {})) next[k] = {};

        for (const row of rows || []) {

          // ✅ FORCE OFFLINE DEVICES INTO telemetryMap
for (const modelKey of Object.keys(wanted || {})) {
  for (const id of wanted[modelKey] || []) {
    if (!next?.[modelKey]?.[id]) {
      if (!next[modelKey]) next[modelKey] = {};

      next[modelKey][id] = {
        deviceId: id,
        status: "offline", // 🔥 CRITICAL
      };
    }
  }
}



          const id = String(readDeviceId(row) || "").trim();
          let modelKey = readModelKey(row);

          if (!id) continue;

          // ✅ If public payload does not include model,
          // infer it from the wanted bindings by matching device id
          if (!modelKey) {
            for (const mk of Object.keys(wanted || {})) {
              if (wanted?.[mk]?.has(id)) {
                modelKey = mk;
                break;
              }
            }
          }

          if (!modelKey) continue;
          if (!wanted?.[modelKey]?.has(id)) continue;

          if (!next[modelKey]) next[modelKey] = {};
          next[modelKey][id] = row;
        }

        dbg(
          "public telemetryMap built",
          Object.fromEntries(
            Object.entries(next).map(([k, bucket]) => [k, Object.keys(bucket).slice(0, 20)])
          )
        );

        setTelemetryMap(next);
        return;
      }

      // ==========================================
      // ✅ PRIVATE PLATFORM MODE
      // fetch /{base}/my-devices per model
      // ==========================================
      const token = String(getToken?.() || "").trim();
      if (!token) {
        dbg("private mode skip: no token");
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
          topKeys:
            data && typeof data === "object" ? Object.keys(data).slice(0, 10) : null,
          rows: arr.length,
          sampleIds: arr
            .slice(0, 6)
            .map((r) => String(readDeviceId(r)).trim())
            .filter(Boolean),
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

      dbg(
        "private telemetryMap built",
        Object.fromEntries(
          Object.entries(next).map(([k, bucket]) => [k, Object.keys(bucket).slice(0, 20)])
        )
      );

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
    isPublicLaunch,
    publicDashSlug,
    publicDashLaunchId,
    tenantEmail,
    isTenantAuthenticated,
    clearTelemetryMap,
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