// src/hooks/useDevicesData.js
import { useEffect, useMemo, useRef, useState } from "react";
import { getToken } from "../utils/authToken";

// ✅ Models to poll (add tp4000 later if needed)
const MODELS = [
  { key: "zhc1921", base: "zhc1921" },
  { key: "zhc1661", base: "zhc1661" },
];

function normalizeArray(data) {
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.devices)
    ? data.devices
    : Array.isArray(data?.rows)
    ? data.rows
    : [];
}

function readDeviceId(row) {
  return String(
    row?.deviceId ??
      row?.device_id ??
      row?.id ??
      row?.imei ??
      row?.IMEI ??
      row?.DEVICE_ID ??
      ""
  ).trim();
}

async function fetchModelRows(apiUrl, base, token, signal) {
  const url = `${apiUrl}/${base}/my-devices?_ts=${Date.now()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return normalizeArray(data);
}

/**
 * ✅ COMMON POLLER
 * Returns:
 *  - rows: flat array (legacy-friendly)
 *  - byModel: rows per model
 *  - telemetryMap: telemetryMap[modelKey][deviceId] = row
 */
export default function useDevicesData(
  apiUrl,
  { enabled = true, pollMs = 3000 } = {}
) {
  const [byModel, setByModel] = useState(() => {
    const init = {};
    for (const m of MODELS) init[m.key] = [];
    return init;
  });

  const tokenRef = useRef("");
  useEffect(() => {
    tokenRef.current = String(getToken() || "").trim();
  });

  useEffect(() => {
    if (!enabled) return;
    if (!apiUrl) return;

    let cancelled = false;
    const ctrl = new AbortController();

    async function fetchOnce() {
      try {
        const token = String(tokenRef.current || "").trim();
        if (!token) {
          if (!cancelled) {
            const empty = {};
            for (const m of MODELS) empty[m.key] = [];
            setByModel(empty);
          }
          return;
        }

        const results = await Promise.all(
          MODELS.map((m) => fetchModelRows(apiUrl, m.base, token, ctrl.signal))
        );

        if (cancelled) return;

        const next = {};
        MODELS.forEach((m, idx) => {
          next[m.key] = Array.isArray(results[idx]) ? results[idx] : [];
        });

        setByModel(next);
      } catch (e) {
        if (cancelled) return;
        if (String(e?.name || "").toLowerCase().includes("abort")) return;

        const empty = {};
        for (const m of MODELS) empty[m.key] = [];
        setByModel(empty);
      }
    }

    fetchOnce();

    const t = window.setInterval(() => {
      if (document.hidden) return;
      fetchOnce();
    }, Math.max(250, Number(pollMs) || 3000));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [apiUrl, enabled, pollMs]);

  const rows = useMemo(() => {
    const out = [];
    for (const m of MODELS) {
      const arr = Array.isArray(byModel[m.key]) ? byModel[m.key] : [];
      out.push(...arr);
    }
    return out;
  }, [byModel]);

  const telemetryMap = useMemo(() => {
    const map = {};
    for (const m of MODELS) {
      const arr = Array.isArray(byModel[m.key]) ? byModel[m.key] : [];
      const inner = {};
      for (const row of arr) {
        const id = readDeviceId(row);
        if (!id) continue;
        inner[id] = row;
      }
      map[m.key] = inner;
    }
    return map;
  }, [byModel]);

  return { rows, byModel, telemetryMap };
}