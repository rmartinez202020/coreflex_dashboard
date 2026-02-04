// src/hooks/useDashboardModalsController.js
import { useMemo, useState, useCallback } from "react";

/**
 * useDashboardModalsController
 * Owns modal IDs + open/close helpers for dashboard widgets.
 *
 * Optional:
 * - droppedTanks: if provided, we expose indicatorTank (handy for debugging/legacy)
 */
export default function useDashboardModalsController({ droppedTanks } = {}) {
  // DISPLAY SETTINGS MODAL
  const [displaySettingsId, setDisplaySettingsId] = useState(null);
  const openDisplaySettings = useCallback(
    (tank) => setDisplaySettingsId(tank?.id ?? null),
    []
  );
  const closeDisplaySettings = useCallback(() => setDisplaySettingsId(null), []);

  // INDICATOR (LED) SETTINGS MODAL
  const [indicatorSettingsId, setIndicatorSettingsId] = useState(null);
  const openIndicatorSettings = useCallback(
    (tank) => setIndicatorSettingsId(tank?.id ?? null),
    []
  );
  const closeIndicatorSettings = useCallback(
    () => setIndicatorSettingsId(null),
    []
  );

  // Optional derived tank (only if droppedTanks passed in)
  const indicatorTank = useMemo(() => {
    if (!Array.isArray(droppedTanks) || !indicatorSettingsId) return null;
    return droppedTanks.find((t) => t.id === indicatorSettingsId) || null;
  }, [droppedTanks, indicatorSettingsId]);

  // STATUS TEXT SETTINGS MODAL
  const [statusTextSettingsId, setStatusTextSettingsId] = useState(null);
  const openStatusTextSettings = useCallback(
    (tank) => setStatusTextSettingsId(tank?.id ?? null),
    []
  );
  const closeStatusTextSettings = useCallback(
    () => setStatusTextSettingsId(null),
    []
  );

  // BLINKING ALARM SETTINGS MODAL
  const [blinkingAlarmSettingsId, setBlinkingAlarmSettingsId] = useState(null);
  const openBlinkingAlarmSettings = useCallback(
    (tank) => setBlinkingAlarmSettingsId(tank?.id ?? null),
    []
  );
  const closeBlinkingAlarmSettings = useCallback(
    () => setBlinkingAlarmSettingsId(null),
    []
  );

  // STATE IMAGE SETTINGS MODAL
  const [stateImageSettingsId, setStateImageSettingsId] = useState(null);
  const openStateImageSettings = useCallback(
    (tank) => setStateImageSettingsId(tank?.id ?? null),
    []
  );
  const closeStateImageSettings = useCallback(
    () => setStateImageSettingsId(null),
    []
  );

  // GRAPHIC DISPLAY SETTINGS MODAL
  const [graphicSettingsId, setGraphicSettingsId] = useState(null);
  const openGraphicDisplaySettings = useCallback(
    (tank) => setGraphicSettingsId(tank?.id ?? null),
    []
  );
  const closeGraphicDisplaySettings = useCallback(
    () => setGraphicSettingsId(null),
    []
  );

  return {
    // ids
    displaySettingsId,
    indicatorSettingsId,
    statusTextSettingsId,
    blinkingAlarmSettingsId,
    stateImageSettingsId,
    graphicSettingsId,

    // opens
    openDisplaySettings,
    openIndicatorSettings,
    openStatusTextSettings,
    openBlinkingAlarmSettings,
    openStateImageSettings,
    openGraphicDisplaySettings,

    // closes
    closeDisplaySettings,
    closeIndicatorSettings,
    closeStatusTextSettings,
    closeBlinkingAlarmSettings,
    closeStateImageSettings,
    closeGraphicDisplaySettings,

    // optional derived
    indicatorTank,
  };
}
