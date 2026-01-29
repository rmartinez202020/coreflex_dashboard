// src/components/AppModals.jsx
import React, { useEffect, useMemo, useState } from "react";

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

  // ✅ Alarm Log actions
  onMinimizeAlarmLog,
  onLaunchAlarmLog,

  // ✅ NEW: pass the window system in (from useWindowDragResize in App.jsx)
  // Example: const windowDrag = useWindowDragResize(defaultsMap)
  windowDrag,
}) {
  const isSameId = (a, b) => String(a) === String(b);

  // ✅ Keep this for now: open-at positioning still useful
  // NOTE: if you're fully on windowDrag positions, you can delete this later.
  const [alarmLogPos, setAlarmLogPos] = useState({ x: 140, y: 90 });

  // ✅ Listen for drop position events (sent by useDropHandler)
  useEffect(() => {
    const onOpenAt = (ev) => {
      const x = ev?.detail?.x;
      const y = ev?.detail?.y;

      if (typeof x !== "number" || typeof y !== "number") return;

      // small offset so the cursor isn't on the title bar buttons
      const next = {
        x: Math.max(x - 40, 10),
        y: Math.max(y - 20, 10),
      };

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

  // ✅ NEW: pull the correct window handlers from the window system
  const alarmLogWindowProps = windowDrag?.getWindowProps?.("alarmLog");

  return (
    <>
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
            closeGraphicDisplaySettings();
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

      {/* 🚨 Alarms Log */}
      <AlarmLogModal
        open={!!alarmLogOpen}
        onClose={closeAlarmLog}
        onLaunch={onLaunchAlarmLog}
        onMinimize={onMinimizeAlarmLog}
        // ✅ NEW: this enables dragging/resizing like the other windows
        windowProps={
          alarmLogWindowProps || {
            // fallback: still opens where you clicked until windowDrag is wired everywhere
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
