import React from "react";
import { API_URL } from "../../config/api";
import {
  getAuthHeaders,
  normalizeHistoryRow,
  summarizeAlarmRows,
  applyLatestDefinitionFields,
  sortAlarmRowsNewestFirst,
} from "./alarmLogHelpers";

export default function useAlarmHistory({
  resolvedAlarmLogKey,
  applyDisabledMap,
}) {
  const [alarms, setAlarms] = React.useState([]);
  const [rawHistoryRows, setRawHistoryRows] = React.useState([]);
  const [expandedHistoryMap, setExpandedHistoryMap] = React.useState({});
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState("");

  const loadAlarmHistory = React.useCallback(
    async (silent = false) => {
      if (!silent) setIsLoadingHistory(true);
      setHistoryError("");

      try {
        const [historyRes, definitionsRes] = await Promise.all([
          fetch(`${API_URL}/alarm-history/read`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              alarm_log_key: resolvedAlarmLogKey,
            }),
          }),
          fetch(`${API_URL}/alarm-definitions/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
          }),
        ]);

        let historyData = null;
        let definitionsData = null;

        try {
          historyData = await historyRes.json();
        } catch {
          historyData = [];
        }

        try {
          definitionsData = await definitionsRes.json();
        } catch {
          definitionsData = [];
        }

        if (!historyRes.ok) {
          throw new Error(
            historyData?.detail ||
              historyData?.error ||
              "Failed to load alarm history"
          );
        }

        if (!definitionsRes.ok) {
          throw new Error(
            definitionsData?.detail ||
              definitionsData?.error ||
              "Failed to load alarm definitions"
          );
        }

        const normalizedRawRows = Array.isArray(historyData)
          ? historyData.map((row, idx) => normalizeHistoryRow(row, idx))
          : [];

        setRawHistoryRows(normalizedRawRows);

        let summarizedRows = summarizeAlarmRows(normalizedRawRows);
        summarizedRows = applyLatestDefinitionFields(
          summarizedRows,
          Array.isArray(definitionsData) ? definitionsData : []
        );
        summarizedRows = applyDisabledMap(summarizedRows);

        setAlarms(summarizedRows);

        setExpandedHistoryMap((prev) => {
          const next = { ...prev };

          for (const key of Object.keys(next)) {
            const rowsForAlarm = sortAlarmRowsNewestFirst(
              normalizedRawRows.filter((r) => r.uniqueAlarmKey === key)
            );

            next[key] = applyDisabledMap(rowsForAlarm);
          }

          return next;
        });
      } catch (err) {
        console.error("❌ Failed to load alarm history:", err);
        setHistoryError(err?.message || "Failed to load alarm history");
        setAlarms([]);
        setRawHistoryRows([]);
      } finally {
        if (!silent) setIsLoadingHistory(false);
      }
    },
    [resolvedAlarmLogKey, applyDisabledMap]
  );

  React.useEffect(() => {
    loadAlarmHistory(false);

    const timer = window.setInterval(() => {
      loadAlarmHistory(true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [loadAlarmHistory]);

  return {
    alarms,
    setAlarms,
    rawHistoryRows,
    setRawHistoryRows,
    expandedHistoryMap,
    setExpandedHistoryMap,
    isLoadingHistory,
    historyError,
    loadAlarmHistory,
  };
}