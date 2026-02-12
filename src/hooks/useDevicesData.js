// src/hooks/useDevicesData.js
import { useEffect, useState } from "react";
import { getToken } from "../utils/authToken";

/**
 * useDevicesData
 * Pulls live device telemetry for the logged-in user.
 * Uses /zhc1921/my-devices (auth required) and polls.
 */
export default function useDevicesData(apiUrl, { enabled = true, pollMs = 1000 } = {}) {
  const [sensorsData, setSensorsData] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    if (!apiUrl) return;

    let cancelled = false;

    async function fetchOnce() {
      try {
        const token = String(getToken() || "").trim();
        if (!token) {
          // no token => no telemetry
          if (!cancelled) setSensorsData([]);
          return;
        }

        const res = await fetch(`${apiUrl}/zhc1921/my-devices`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setSensorsData([]);
          return;
        }

        const data = await res.json();
        if (!cancelled) setSensorsData(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSensorsData([]);
      }
    }

    fetchOnce();
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchOnce();
    }, pollMs);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [apiUrl, enabled, pollMs]);

  return sensorsData;
}
