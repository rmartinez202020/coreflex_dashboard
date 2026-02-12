// src/hooks/useDevicesData.js
import { useEffect, useRef, useState } from "react";
import { getToken } from "../utils/authToken";

/**
 * useDevicesData
 * Fetches devices from API and formats them for the dashboard UI.
 *
 * ✅ NOW uses /zhc1921/my-devices (authorized) + polls every 1 second.
 *
 * @param {string} apiUrl - base API url (ex: API_URL)
 * @param {object} options
 * @param {boolean} options.enabled - allow turning off fetching (default true)
 * @returns {Array} sensorsData
 */
export default function useDevicesData(apiUrl, { enabled = true } = {}) {
  const [sensorsData, setSensorsData] = useState([]);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!apiUrl) return;

    let cancelled = false;

    const fetchOnce = async () => {
      if (cancelled) return;
      if (document.hidden) return; // ✅ don’t spam while tab is hidden
      if (inFlightRef.current) return;

      inFlightRef.current = true;

      try {
        const token = String(getToken() || "").trim();
        if (!token) throw new Error("Missing auth token. Please logout and login again.");

        const res = await fetch(`${apiUrl}/zhc1921/my-devices`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.detail || `Failed to load my-devices (${res.status})`);
        }

        const data = await res.json();

        if (cancelled) return;

        const mapped = (Array.isArray(data) ? data : []).map((s) => ({
          ...s,

          // normalize deviceId so other code can find it reliably
          deviceId: String(s.deviceId ?? s.device_id ?? "").trim(),

          // keep your old UI helpers (safe even if those fields don't exist)
          level_percent: Math.min(
            100,
            Math.round((Number(s.level || 0) / 55) * 100)
          ),

          // my-devices uses lastSeen; keep compatibility with your old mapping too
          date_received:
            String(s.last_update || s.lastSeen || s.last_seen || "")
              .split("T")[0] || "",

          time_received: (() => {
            const ts = s.last_update || s.lastSeen || s.last_seen;
            if (!ts) return "";
            const d = new Date(ts);
            if (Number.isNaN(d.getTime())) return "";
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          })(),
        }));

        setSensorsData(mapped);
      } catch (err) {
        console.error("Sensor API error:", err);

        // ✅ keep last good data instead of wiping to []
        // If you prefer wipe, change this to: setSensorsData([]);
        if (!cancelled) setSensorsData((prev) => prev);
      } finally {
        inFlightRef.current = false;
      }
    };

    // ✅ fetch immediately, then every 1 second
    fetchOnce();
    const t = setInterval(fetchOnce, 1000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [apiUrl, enabled]);

  return sensorsData;
}
