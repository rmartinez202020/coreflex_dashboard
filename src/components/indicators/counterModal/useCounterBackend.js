// src/components/indicators/counterModal/useCounterBackend.js

import React from "react";
import { API_URL } from "../../../config/api";
import { getToken } from "../../../utils/authToken";
import { resolveDashboardIdFromProps, normalizeDiField } from "./counterHelpers";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function useCounterBackend({ tank, dashboardId }) {
  const [serverCounter, setServerCounter] = React.useState(null);
  const [serverErr, setServerErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [loadingCounter, setLoadingCounter] = React.useState(false);

  // =====================================
  // Fetch counter by widget
  // =====================================
  const fetchCounter = React.useCallback(async () => {
    const wid = String(tank?.id || "").trim();
    if (!wid) return;

    const did = resolveDashboardIdFromProps({ dashboardId, tank });
    const qs = did ? `?dashboard_id=${encodeURIComponent(did)}` : "";

    setServerErr("");
    setLoadingCounter(true);

    try {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(
        `${API_URL}/device-counters/by-widget/${encodeURIComponent(wid)}${qs}`,
        { headers: getAuthHeaders() }
      );

      if (res.status === 404) {
        setServerCounter(null);
        return;
      }

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || `Failed to load counter (${res.status})`);
      }

      const data = await res.json();
      setServerCounter(data || null);
    } catch (e) {
      setServerCounter(null);
      setServerErr(e?.message || "Failed to load counter");
    } finally {
      setLoadingCounter(false);
    }
  }, [tank?.id, dashboardId, tank]);

  // =====================================
  // Upsert counter
  // =====================================
  const upsertCounterOnBackend = React.useCallback(
    async ({ widgetId, deviceId, field }) => {
      const dashboard_id = resolveDashboardIdFromProps({ dashboardId, tank });

      const body = {
        widget_id: String(widgetId || "").trim(),
        device_id: String(deviceId || "").trim(),
        field: normalizeDiField(field),
        dashboard_id: dashboard_id || null,
        enabled: true,
      };

      if (!body.widget_id || !body.device_id || !body.field) {
        throw new Error("widget_id, device_id, and field are required");
      }

      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      setSaving(true);
      setServerErr("");

      try {
        const res = await fetch(`${API_URL}/device-counters/upsert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(body),
        });

        const j = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(j?.detail || `Upsert failed (${res.status})`);
        }

        setServerCounter(j || null);
        return j;
      } catch (e) {
        setServerErr(e?.message || "Failed to save counter");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [dashboardId, tank]
  );

  return {
    serverCounter,
    serverErr,
    saving,
    loadingCounter,
    setServerCounter,
    setServerErr,
    fetchCounter,
    upsertCounterOnBackend,
  };
}
