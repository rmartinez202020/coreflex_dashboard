// src/components/AppModals.jsx
import React, { useEffect, useMemo, useState } from "react";
import IndicatorLightSettingsModal from "./indicators/IndicatorLightSettingsModal";
import StatusTextSettingsModal from "./indicators/StatusTextSettingsModal";

// ✅ NEW
import BlinkingAlarmSettingsModal from "./indicators/BlinkingAlarmSettingsModal";

// ✅ NEW: State Image settings
import StateImageSettingsModal from "./indicators/StateImageSettingsModal";

import RestoreWarningModal from "./RestoreWarningModal";
import DisplaySettingsModal from "./DisplaySettingsModal";
import GraphicDisplaySettingsModal from "./GraphicDisplaySettingsModal";
import SiloPropertiesModal from "./SiloPropertiesModal";
import AlarmLogModal from "./AlarmLogModal";

export default function AppModals({
  droppedTanks,
  setDroppedTanks,

  showRestoreWarning,
  setShowRestoreWarning,
  lastSavedAt,
  handleUploadProject,

  displaySettingsId,
  closeDisplaySettings,

  graphicSettingsId,
  closeGraphicDisplaySettings,

  showSiloProps,
  setShowSiloProps,
  activeSiloId,

  alarmLogOpen,
  closeAlarmLog,

  onMinimizeAlarmLog,
  onLaunchAlarmLog,

  // ✅ LED Indicator settings
  indicatorSettingsId,
  closeIndicatorSettings,

  // ✅ Status Text settings
  statusTextSettingsId,
  closeStatusTextSettings,

  // ✅ NEW: Blinking Alarm settings
  blinkingAlarmSettingsId,
  closeBlinkingAlarmSettings,

  // ✅ NEW: State Image settings
  stateImageSettingsId,
  closeStateImageSettings,

  // ✅ give indicator modal access to available devices/tags
  sensorsData,

  // ✅ NEW: passed from App.jsx (useWindowDragResize result)
  windowDrag,
}) {
  const isSameId = (a, b) => String(a) === String(b);

  // ✅ Fallback position (only used if windowDrag isn't provided yet)
  const [alarmLogPos, setAlarmLogPos] = useState({ x: 140, y: 90 });

  useEffect(() => {
    const onOpenAt = (ev) => {
      const x = ev?.detail?.x;
      const y = ev?.detail?.y;
      if (typeof x !== "number" || typeof y !== "number") return;

      const next = { x: Math.max(x - 40, 10), y: Math.max(y - 20, 10) };
      setAlarmLogPos(next);
    };

    window.addEventListener("coreflex-alarm-log-open-at", onOpenAt);
    return () =>
      window.removeEventListener("coreflex-alarm-log-open-at", onOpenAt);
  }, []);

  const displayTarget = useMemo(() => {
    if (displaySettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, displaySettingsId) &&
        (t.shape === "displayBox" || t.shape === "displayOutput")
    );
  }, [droppedTanks, displaySettingsId]);

  const graphicTarget = useMemo(() => {
    if (graphicSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, graphicSettingsId) && t.shape === "graphicDisplay"
    );
  }, [droppedTanks, graphicSettingsId]);

  const activeSilo = useMemo(() => {
    if (activeSiloId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, activeSiloId) && t.shape === "siloTank"
    );
  }, [droppedTanks, activeSiloId]);

  // ✅ LED Indicator target
  const indicatorTarget = useMemo(() => {
    if (indicatorSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, indicatorSettingsId) && t.shape === "ledCircle"
    );
  }, [droppedTanks, indicatorSettingsId]);

  // ✅ Status Text target
  const statusTextTarget = useMemo(() => {
    if (statusTextSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, statusTextSettingsId) && t.shape === "statusTextBox"
    );
  }, [droppedTanks, statusTextSettingsId]);

  // ✅ NEW: Blinking Alarm target
  const blinkingAlarmTarget = useMemo(() => {
    if (blinkingAlarmSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, blinkingAlarmSettingsId) && t.shape === "blinkingAlarm"
    );
  }, [droppedTanks, blinkingAlarmSettingsId]);

  // ✅ NEW: State Image target
  const stateImageTarget = useMemo(() => {
    if (stateImageSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, stateImageSettingsId) && t.shape === "stateImage"
    );
  }, [droppedTanks, stateImageSettingsId]);

  const alarmLogWindowProps = windowDrag?.getWindowProps
    ? windowDrag.getWindowProps("alarmLog")
    : null;

  const patchTankProperties = (targetId, updated) => {
    setDroppedTanks((prev) =>
      prev.map((t) => {
        if (!isSameId(t.id, targetId)) return t;

        const nextProps =
          updated?.properties && typeof updated.properties === "object"
            ? { ...(t.properties || {}), ...updated.properties }
            : { ...(t.properties || {}) };

        return { ...t, properties: nextProps };
      })
    );
  };

  return (
    <>
      {/* ✅ LED Indicator Settings */}
      {indicatorTarget && (
        <IndicatorLightSettingsModal
          open={true}
          tank={indicatorTarget}
          sensorsData={sensorsData}
          onClose={() => closeIndicatorSettings?.()}
          onSave={(updated) => {
            patchTankProperties(indicatorTarget.id, updated);
            closeIndicatorSettings?.();
          }}
        />
      )}

      {/* ✅ Status Text Settings */}
      {statusTextTarget && (
        <StatusTextSettingsModal
          open={true}
          tank={statusTextTarget}
          sensorsData={sensorsData}
          onClose={() => closeStatusTextSettings?.()}
          onSave={(updated) => {
            patchTankProperties(statusTextTarget.id, updated);
            closeStatusTextSettings?.();
          }}
        />
      )}

      {/* ✅ NEW: Blinking Alarm Settings */}
      {blinkingAlarmTarget && (
        <BlinkingAlarmSettingsModal
          open={true}
          tank={blinkingAlarmTarget}
          sensorsData={sensorsData}
          onClose={() => closeBlinkingAlarmSettings?.()}
          onSave={(updated) => {
            patchTankProperties(blinkingAlarmTarget.id, updated);
            closeBlinkingAlarmSettings?.();
          }}
        />
      )}

      {/* ✅ NEW: State Image Settings */}
      {stateImageTarget && (
        <StateImageSettingsModal
          open={true}
          tank={stateImageTarget}
          sensorsData={sensorsData}
          onClose={() => closeStateImageSettings?.()}
          onSave={(updated) => {
            patchTankProperties(stateImageTarget.id, updated);
            closeStateImageSettings?.();
          }}
        />
      )}

      {displayTarget && (
        <DisplaySettingsModal
          tank={displayTarget}
          onClose={closeDisplaySettings}
          onSave={(updatedProps) => {
            setDroppedTanks((prev) =>
              prev.map((t) =>
                isSameId(t.id, displayTarget.id)
                  ? {
                      ...t,
                      properties: { ...(t.properties || {}), ...updatedProps },
                    }
                  : t
              )
            );
          }}
        />
      )}

      {graphicTarget && (
        <GraphicDisplaySettingsModal
          open={true}
          tank={graphicTarget}
          onClose={closeGraphicDisplaySettings}
          onSave={(updatedTank) => {
            setDroppedTanks((prev) =>
              prev.map((t) => (isSameId(t.id, updatedTank.id) ? updatedTank : t))
            );
            closeGraphicDisplaySettings?.();
          }}
        />
      )}

      {showSiloProps && activeSilo && (
        <SiloPropertiesModal
          open={showSiloProps}
          silo={activeSilo}
          onClose={() => setShowSiloProps(false)}
          onSave={(updatedSilo) =>
            setDroppedTanks((prev) =>
              prev.map((t) => (isSameId(t.id, updatedSilo.id) ? updatedSilo : t))
            )
          }
        />
      )}

      {/* 🚨 Alarm Log */}
      <AlarmLogModal
        open={!!alarmLogOpen}
        onClose={closeAlarmLog}
        onLaunch={onLaunchAlarmLog}
        onMinimize={onMinimizeAlarmLog}
        windowProps={
          alarmLogWindowProps || {
            position: alarmLogPos,
            size: { width: 900, height: 420 },
          }
        }
      />

      <RestoreWarningModal
        open={showRestoreWarning}
        lastSavedAt={lastSavedAt}
        onCancel={() => setShowRestoreWarning(false)}
        onConfirm={async () => {
          setShowRestoreWarning(false);
          await handleUploadProject();
        }}
      />
    </>
  );
}
