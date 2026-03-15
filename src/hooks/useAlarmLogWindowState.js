// src/hooks/useAlarmLogWindowState.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "../utils/authToken";

export default function useAlarmLogWindowState({
  apiUrl,
  dashboardId,
  activePage,
  currentUserKey,
  defaultTitle = "Alarms Log (DI-AI)",
  defaultPosition = { x: 140, y: 90 },
  defaultSize = { width: 900, height: 420 },
}) {
  const [alarmLogOpen, setAlarmLogOpen] = useState(false);
  const [alarmLogMinimized, setAlarmLogMinimized] = useState(false);
  const [alarmLogWindowRow, setAlarmLogWindowRow] = useState(null);

  // ✅ avoid duplicate startup fetches for same user+dashboard
  const lastLoadedKeyRef = useRef("");

  const getAuthHeaders = useCallback(() => {
    const token = String(getToken() || "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const normalizedDashboardId =
    String(dashboardId || "main").trim() || "main";

  const openAlarmLog = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/alarm-log-windows/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          dashboard_id: normalizedDashboardId,
          window_key: "alarmLog",
          title: defaultTitle,
          pos_x: Number(defaultPosition?.x ?? 140),
          pos_y: Number(defaultPosition?.y ?? 90),
          width: Number(defaultSize?.width ?? 900),
          height: Number(defaultSize?.height ?? 420),
          is_open: true,
          is_minimized: false,
          is_launched: false,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.detail || data?.error || "Failed to create/open alarm log window"
        );
      }

      setAlarmLogWindowRow(data);
      setAlarmLogMinimized(false);
      setAlarmLogOpen(true);
      return data;
    } catch (err) {
      console.error("Alarm log open failed:", err);
      throw err;
    }
  }, [
    apiUrl,
    getAuthHeaders,
    normalizedDashboardId,
    defaultTitle,
    defaultPosition,
    defaultSize,
  ]);

  const closeAlarmLog = useCallback(() => {
    setAlarmLogOpen(false);
    setAlarmLogMinimized(false);
    setAlarmLogWindowRow(null);
  }, []);

  const minimizeAlarmLog = useCallback(() => {
    setAlarmLogOpen(false);
    setAlarmLogMinimized(true);
  }, []);

  const restoreAlarmLog = useCallback(() => {
    setAlarmLogMinimized(false);
    setAlarmLogOpen(true);
  }, []);

  const clearAlarmLogState = useCallback(() => {
    setAlarmLogOpen(false);
    setAlarmLogMinimized(false);
    setAlarmLogWindowRow(null);
  }, []);

  // ✅ On dashboard entry/load: if backend row exists for this user+dashboard,
  // show Alarm Log in the minimized tray.
  useEffect(() => {
    if (!apiUrl) return;
    if (!currentUserKey) {
      clearAlarmLogState();
      lastLoadedKeyRef.current = "";
      return;
    }
    if (activePage !== "dashboard") return;

    const loadKey = `${currentUserKey}__${normalizedDashboardId}`;
    if (lastLoadedKeyRef.current === loadKey) return;

    let cancelled = false;

    const loadSavedAlarmLogWindow = async () => {
      try {
        const qs = new URLSearchParams({
          dashboard_id: normalizedDashboardId,
          window_key: "alarmLog",
        });

        const res = await fetch(
          `${apiUrl}/alarm-log-windows/by-dashboard?${qs.toString()}`,
          {
            method: "GET",
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!res.ok) {
          throw new Error(
            data?.detail ||
              data?.error ||
              "Failed to fetch alarm log window state"
          );
        }

        if (cancelled) return;

        if (data?.ok && data?.found) {
          setAlarmLogWindowRow(data);
          setAlarmLogOpen(false);
          setAlarmLogMinimized(true);
        } else {
          setAlarmLogWindowRow(null);
          setAlarmLogOpen(false);
          setAlarmLogMinimized(false);
        }

        lastLoadedKeyRef.current = loadKey;
      } catch (err) {
        if (cancelled) return;
        console.error("Alarm log restore fetch failed:", err);
        setAlarmLogWindowRow(null);
        setAlarmLogOpen(false);
        setAlarmLogMinimized(false);
        lastLoadedKeyRef.current = loadKey;
      }
    };

    loadSavedAlarmLogWindow();

    return () => {
      cancelled = true;
    };
  }, [
    apiUrl,
    activePage,
    currentUserKey,
    normalizedDashboardId,
    getAuthHeaders,
    clearAlarmLogState,
  ]);

  return {
    alarmLogOpen,
    alarmLogMinimized,
    alarmLogWindowRow,

    setAlarmLogOpen,
    setAlarmLogMinimized,
    setAlarmLogWindowRow,

    openAlarmLog,
    closeAlarmLog,
    minimizeAlarmLog,
    restoreAlarmLog,
    clearAlarmLogState,
  };
}