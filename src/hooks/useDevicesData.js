// src/hooks/useDevicesData.js
import { useEffect, useState } from "react";

/**
 * useDevicesData
 * Fetches devices from API and formats them for the dashboard UI.
 *
 * @param {string} apiUrl - base API url (ex: API_URL)
 * @param {object} options
 * @param {boolean} options.enabled - allow turning off fetching (default true)
 * @returns {Array} sensorsData
 */
export default function useDevicesData(apiUrl, { enabled = true } = {}) {
  const [sensorsData, setSensorsData] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    if (!apiUrl) return;

    let cancelled = false;

    fetch(`${apiUrl}/devices`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load devices");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        const mapped = (data || []).map((s) => ({
          ...s,
          level_percent: Math.min(100, Math.round((Number(s.level || 0) / 55) * 100)),
          date_received: s.last_update?.split("T")[0] || "",
          time_received: s.last_update
            ? new Date(s.last_update).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
        }));

        setSensorsData(mapped);
      })
      .catch((err) => {
        console.error("Sensor API error:", err);
        if (!cancelled) setSensorsData([]);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, enabled]);

  return sensorsData;
}
