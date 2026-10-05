// src/hooks/useDashboardTelemetryPoller.js

import React from "react";

/**
 * useDashboardTelemetryPoller
 * - ONE poller per DashboardCanvas (Play/Launch only)
 * - Polls every pollMs (default 3000ms)
 * - Private mode: fetches telemetry per model per tick
 * - Scale / MOXA uses /weight-scale-systems/latest per selected IP:PORT
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

    // Radar
    cfr100: {
      base: "radar-level",
      endpoint: "/radar-level/my-sensors",
    },

    // Scale / MOXA
    weight_scale: {
      base: "weight-scale-systems",
      endpoint: "/weight-scale-systems/latest",
    },
  },
} = {}) {
  const [telemetryMap, setTelemetryMap] = React.useState(() => {
    const out = {};

    for (const k of Object.keys(modelMeta || {})) {
      out[k] = {};
    }

    return out;
  });

  const loadingRef = React.useRef(false);

  // ======================================
  // TEMPORARY DIAGNOSTIC: modelMeta reference
  // ======================================

  const previousModelMetaRef = React.useRef(modelMeta);

  React.useEffect(() => {
    if (previousModelMetaRef.current !== modelMeta) {
      console.warn(
        "[TelemetryPoller] modelMeta reference changed",
        new Date().toISOString()
      );
    }

    previousModelMetaRef.current = modelMeta;
  }, [modelMeta]);

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

    if (v === "cfr100" || v === "cf-r100" || v === "cf_r100") {
      return "cfr100";
    }

    if (
      v === "weight_scale" ||
      v === "weight-scale" ||
      v === "weightscale" ||
      v === "scale" ||
      v === "moxa" ||
      v === "scale/moxa"
    ) {
      return "weight_scale";
    }

    return v;
  }

  // ======================================
  // SCALE / MOXA DEVICE ID HELPERS
  // ======================================

  /**
   * Scale devices use:
   *
   *   IP:PORT
   *
   * Example:
   *
   *   192.168.1.50:4001
   *
   * IMPORTANT:
   * Never pass Scale / MOXA IDs through normalizeImei().
   */
  function normalizeScaleDeviceId(value) {
    return String(value || "").trim();
  }

  function parseScaleDeviceId(value) {
    const raw = normalizeScaleDeviceId(value);

    if (!raw) {
      return null;
    }

    const separatorIndex = raw.lastIndexOf(":");

    if (separatorIndex <= 0) {
      return null;
    }

    const deviceIp = raw.slice(0, separatorIndex).trim();
    const portRaw = raw.slice(separatorIndex + 1).trim();

    const devicePort = Number(portRaw);

    if (
      !deviceIp ||
      !Number.isFinite(devicePort) ||
      devicePort <= 0
    ) {
      return null;
    }

    return {
      deviceIp,
      devicePort,
      deviceId: `${deviceIp}:${devicePort}`,
    };
  }

  function buildScaleDeviceId(row) {
    const direct = normalizeScaleDeviceId(
      row?.deviceId ?? row?.device_id ?? ""
    );

    if (direct) {
      return direct;
    }

    const ip = String(
      row?.device_ip ??
        row?.deviceIp ??
        ""
    ).trim();

    const port = String(
      row?.device_port ??
        row?.devicePort ??
        ""
    ).trim();

    if (!ip || !port) {
      return "";
    }

    return `${ip}:${port}`;
  }

  function normalizeDeviceIdForModel(modelKey, value) {
    const model = normalizeModelName(modelKey);

    if (model === "weight_scale") {
      return normalizeScaleDeviceId(value);
    }

    return normalizeImei(value);
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

  const extractBinding = React.useCallback((t) => {
    if (!t) return null;

    const tag = t?.properties?.tag || t?.tag || null;

    if (tag) {
      const model = normalizeModelName(tag?.model);

      const deviceId = String(
        tag?.deviceId ||
          tag?.device_id ||
          ""
      ).trim();

      if (model && deviceId) {
        return {
          model,
          deviceId,
        };
      }
    }

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
  }, []);

  // ======================================
  // COLLECT DEVICES NEEDED BY DASHBOARD
  // ======================================

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

      if (!x) {
        continue;
      }

      if (!wanted[x.model]) {
        wanted[x.model] = new Set();
      }

      const normalizedId = normalizeDeviceIdForModel(
        x.model,
        x.deviceId
      );

      if (normalizedId) {
        wanted[x.model].add(normalizedId);
      }
    }

    return wanted;
  }, [droppedTanks, extractBinding, modelMeta]);

  // ======================================
  // CLEAR TELEMETRY
  // ======================================

  const clearTelemetryMap = React.useCallback(() => {
    setTelemetryMap((prev) => {
      let changed = false;

      const next = {};

      for (const k of Object.keys(modelMeta || {})) {
        const wasSize = Object.keys(
          prev?.[k] || {}
        ).length;

        next[k] = {};

        if (wasSize) {
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [modelMeta]);

  // ======================================
  // MAIN FETCH
  // ======================================

  const fetchOnce = React.useCallback(async () => {
    if (!isPlay) {
      return;
    }

    const dash = resolveDashboardId?.({
      activeDashboardId,
      dashboardId,
      selectedTank,
      droppedTanks,
    });

    if (!dash) {
      return;
    }

    if (loadingRef.current) {
      return;
    }

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
        const email = String(
          tenantEmail || ""
        )
          .trim()
          .toLowerCase();

        if (
          !isTenantAuthenticated ||
          !publicDashSlug ||
          !publicDashLaunchId ||
          !email
        ) {
          dbg(
            "public mode skip: missing tenant auth/launch data"
          );

          clearTelemetryMap();
          return;
        }

        const qs = new URLSearchParams({
          dashboard_slug: String(
            publicDashSlug || ""
          ).trim(),

          public_launch_id: String(
            publicDashLaunchId || ""
          ).trim(),

          tenant_email: email,
        });

        const url =
          `${API_URL}/tenant-access/devices?${qs.toString()}`;

        dbg("public fetch", {
          url,
        });

        const res = await fetch(url);

        if (!res.ok) {
          dbgErr("public fetch failed", {
            status: res.status,
          });

          clearTelemetryMap();
          return;
        }

        const data = await res
          .json()
          .catch(() => []);

        const arr = normalizeArray(data);

        const next = {};

        for (const k of Object.keys(modelMeta || {})) {
          next[k] = {};
        }

        for (const row of arr || []) {
          const modelKey = readModelKey(row);

          if (!modelKey) {
            continue;
          }

          if (!next[modelKey]) {
            next[modelKey] = {};
          }

          const setWanted =
            wanted?.[modelKey] ||
            new Set();

          let id = "";

          if (modelKey === "weight_scale") {
            id = buildScaleDeviceId(row);
          } else {
            id = normalizeImei(
              readDeviceId(row)
            );
          }

          if (
            id &&
            setWanted.has(id)
          ) {
            next[modelKey][id] = {
              ...row,
              model: modelKey,
              deviceId: id,
              device_id: id,
            };
          }
        }

        dbg(
          "public telemetryMap built",

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
        return;
      }

      // ======================================
      // PRIVATE MODE
      // ======================================

      const token = String(
        getToken?.() || ""
      ).trim();

      if (!token) {
        dbg(
          "private mode skip: no token"
        );

        return;
      }

      // ======================================
      // FETCH ONE DEVICE MODEL
      // ======================================

      async function fetchModel(
        modelKey,
        base
      ) {
        // ======================================
        // CFR100
        // ======================================

        if (modelKey === "cfr100") {
          const url =
            `${API_URL}/radar-level/my-sensors`;

          dbg(
            "fetchModel CFR100",
            {
              url,
            }
          );

          const res = await fetch(
            url,
            {
              headers: {
                "Content-Type":
                  "application/json",

                ...(getAuthHeaders?.() ||
                  {}),
              },
            }
          );

          if (!res.ok) {
            dbgErr(
              "fetchModel CFR100 failed",
              {
                status:
                  res.status,
              }
            );

            return [];
          }

          const data = await res
            .json()
            .catch(() => []);

          const arr =
            Array.isArray(data)
              ? data
              : [];

          const normalized =
            arr.map((r) => ({
              ...r,

              model:
                "cfr100",

              deviceId:
                normalizeImei(
                  r.raw_imei_bytes ||
                    r.rawImeiBytes ||
                    r.imei ||
                    ""
                ),

              device_id:
                normalizeImei(
                  r.raw_imei_bytes ||
                    r.rawImeiBytes ||
                    r.imei ||
                    ""
                ),

              status:
                r.received_at
                  ? "online"
                  : "offline",
            }));

          dbg(
            "fetchModel CFR100 ok",
            {
              rows:
                normalized.length,
            }
          );

          return normalized;
        }

        // ======================================
        // SCALE / MOXA
        // ======================================

        if (modelKey === "weight_scale") {
          const wantedScaleIds = Array.from(
            wanted?.weight_scale || []
          );

          if (!wantedScaleIds.length) {
            return [];
          }

          /**
           * IMPORTANT:
           *
           * Unlike the old version, we do NOT fetch:
           *
           * /weight-scale-systems/readings?limit=1000
           *
           * Each selected Scale / MOXA Silo already stores:
           *
           *   bindDeviceId = "IP:PORT"
           *
           * We use that exact selection to call:
           *
           * /weight-scale-systems/latest
           *
           * This is the same data source used by the working
           * Silo properties modal.
           */
          const scaleRows = await Promise.all(
            wantedScaleIds.map(async (wantedId) => {
              const scale = parseScaleDeviceId(
                wantedId
              );

              if (!scale) {
                dbgErr(
                  "Scale/MOXA invalid device ID",
                  {
                    wantedId,
                  }
                );

                return null;
              }

              const qs = new URLSearchParams({
                device_ip: scale.deviceIp,
                device_port: String(
                  scale.devicePort
                ),
              });

              const url =
                `${API_URL}/weight-scale-systems/latest?${qs.toString()}`;

              dbg(
                "fetchModel Scale/MOXA latest",
                {
                  deviceId:
                    scale.deviceId,
                  url,
                }
              );

              try {
                const res = await fetch(
                  url,
                  {
                    headers: {
                      "Content-Type":
                        "application/json",

                      ...(getAuthHeaders?.() ||
                        {}),
                    },

                    cache: "no-store",
                  }
                );

                if (!res.ok) {
                  dbgErr(
                    "fetchModel Scale/MOXA latest failed",
                    {
                      deviceId:
                        scale.deviceId,
                      status:
                        res.status,
                    }
                  );

                  return null;
                }

                const data = await res
                  .json()
                  .catch(() => null);

                /**
                 * Backend /latest returns:
                 *
                 * {
                 *   reading: {
                 *     device_ip,
                 *     device_port,
                 *     weight,
                 *     received_at,
                 *     weight_2,
                 *     received_at_2,
                 *     weight_3,
                 *     received_at_3,
                 *     weight_4,
                 *     received_at_4,
                 *     weight_5,
                 *     received_at_5,
                 *     ...
                 *   }
                 * }
                 *
                 * Be tolerant in case the backend later returns
                 * the reading object directly.
                 */
                const reading =
                  data?.reading &&
                  typeof data.reading === "object"
                    ? data.reading
                    : data &&
                      typeof data === "object"
                    ? data
                    : null;

                if (!reading) {
                  dbgErr(
                    "Scale/MOXA latest returned no reading",
                    {
                      deviceId:
                        scale.deviceId,
                    }
                  );

                  return null;
                }

                /**
                 * Force the selected IP:PORT as the map ID.
                 *
                 * This guarantees that the exact ID saved by
                 * SiloPropertiesModal matches the key used by
                 * DraggableSiloTank.
                 */
                return {
                  ...reading,

                  model:
                    "weight_scale",

                  deviceId:
                    scale.deviceId,

                  device_id:
                    scale.deviceId,

                  device_ip:
                    reading?.device_ip ??
                    reading?.deviceIp ??
                    scale.deviceIp,

                  device_port:
                    reading?.device_port ??
                    reading?.devicePort ??
                    scale.devicePort,

                  /**
                   * A successful /latest response means telemetry
                   * was obtained for this selected scale.
                   */
                  status:
                    "online",
                };
              } catch (error) {
                dbgErr(
                  "fetchModel Scale/MOXA latest exception",
                  {
                    deviceId:
                      scale.deviceId,
                    error:
                      String(
                        error?.message ||
                          error
                      ),
                  }
                );

                return null;
              }
            })
          );

          const normalized =
            scaleRows.filter(Boolean);

          dbg(
            "fetchModel Scale/MOXA latest ok",
            {
              requested:
                wantedScaleIds.length,
              rows:
                normalized.length,
            }
          );

          return normalized;
        }

        // ======================================
        // DEFAULT
        // ======================================

        const url =
          `${API_URL}/${base}/my-devices`;

        dbg(
          "fetchModel",
          {
            base,
            url,
          }
        );

        const res = await fetch(
          url,
          {
            headers:
              getAuthHeaders?.() ||
              {},
          }
        );

        if (!res.ok) {
          dbgErr(
            "fetchModel failed",
            {
              base,
              status:
                res.status,
            }
          );

          return [];
        }

        const data = await res
          .json()
          .catch(() => null);

        const arr =
          normalizeArray(data);

        dbg(
          "fetchModel ok",
          {
            base,
            rows:
              arr.length,
          }
        );

        return arr;
      }

      // ======================================
      // FETCH MODELS USED BY THIS DASHBOARD
      // ======================================

      const results =
        await Promise.all(
          Object.keys(
            modelMeta || {}
          ).map(
            async (
              modelKey
            ) => {
              const base =
                modelMeta[
                  modelKey
                ]?.base;

              if (!base) {
                return [
                  modelKey,
                  [],
                ];
              }

              if (
                !wanted?.[
                  modelKey
                ]?.size
              ) {
                return [
                  modelKey,
                  [],
                ];
              }

              const rows =
                await fetchModel(
                  modelKey,
                  base
                );

              return [
                modelKey,
                rows,
              ];
            }
          )
        );

      // ======================================
      // BUILD TELEMETRY MAP
      // ======================================

      const next = {};

      for (const k of Object.keys(
        modelMeta || {}
      )) {
        next[k] = {};
      }

      for (
        const [
          modelKey,
          rows,
        ] of results
      ) {
        const setWanted =
          wanted?.[modelKey] ||
          new Set();

        for (
          const row of rows || []
        ) {
          const id =
            modelKey ===
            "weight_scale"
              ? buildScaleDeviceId(
                  row
                )
              : normalizeImei(
                  readDeviceId(
                    row
                  )
                );

          if (
            id &&
            setWanted.has(id)
          ) {
            next[
              modelKey
            ][id] =
              modelKey ===
              "weight_scale"
                ? {
                    ...row,

                    model:
                      "weight_scale",

                    deviceId:
                      id,

                    device_id:
                      id,
                  }
                : row;
          }
        }
      }

      dbg(
        "private telemetryMap built",

        Object.fromEntries(
          Object.entries(
            next
          ).map(
            ([
              k,
              bucket,
            ]) => [
              k,

              Object.keys(
                bucket
              ).slice(
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
        String(
          e?.message ||
            e
        )
      );
    } finally {
      loadingRef.current =
        false;
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

  // ======================================
  // INTERVAL
  // ======================================

  React.useEffect(() => {
    if (!isPlay) {
      return;
    }

    console.warn(
      "[TelemetryPoller] EFFECT START",
      new Date().toISOString()
    );

    fetchOnce();

    const ms = Math.max(
      500,
      Number(pollMs) ||
        3000
    );

    const t = setInterval(
      () => {
        if (
          document.hidden
        ) {
          return;
        }

        console.warn(
          "[TelemetryPoller] INTERVAL TICK",
          new Date().toISOString()
        );

        fetchOnce();
      },
      ms
    );

    return () => {
      console.warn(
        "[TelemetryPoller] EFFECT CLEANUP",
        new Date().toISOString()
      );

      clearInterval(t);
    };
  }, [
    isPlay,
    fetchOnce,
    pollMs,
  ]);

  return {
    telemetryMap,
    fetchTelemetryOnce:
      fetchOnce,
  };
}