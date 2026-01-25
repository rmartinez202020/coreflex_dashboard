// src/components/AppModals.jsx
import React, { useMemo } from "react";

import RestoreWarningModal from "./RestoreWarningModal";
import DisplaySettingsModal from "./DisplaySettingsModal";
import GraphicDisplaySettingsModal from "./GraphicDisplaySettingsModal";
import SiloPropertiesModal from "./SiloPropertiesModal";

// ✅ NEW: Alarms Log (AI)
import AlarmLogModal from "./AlarmLogModal";

export default function AppModals({
  // --- shared state ---
  droppedTanks,
  setDroppedTanks,

  // --- Restore modal ---
  showRestoreWarning,
  setShowRestoreWarning,
  lastSavedAt,
  handleUploadProject,

  // --- Display settings modal ---
  displaySettingsId,
  closeDisplaySettings,

  // --- Graphic display modal ---
  graphicSettingsId,
  closeGraphicDisplaySettings,

  // --- Silo props modal ---
  showSiloProps,
  setShowSiloProps,
  activeSiloId,

  // --- ✅ Alarms Log (AI) modal ---
  alarmLogOpen,
  closeAlarmLog,
}) {
  // ✅ helpers to avoid silent mismatches (number vs string ids)
  const isSameId = (a, b) => String(a) === String(b);

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

  return (
    <>
      {/* ✅ Display Settings */}
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
                      properties: {
                        ...(t.properties || {}),
                        ...updatedProps,
                      },
                    }
                  : t
              )
            );
          }}
        />
      )}

      {/* ✅ Graphic Display Settings */}
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

      {/* ✅ Silo Properties */}
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

      {/* 🚨 Alarms Log (AI) */}
      <AlarmLogModal open={!!alarmLogOpen} onClose={closeAlarmLog} />

      {/* ✅ Restore Warning */}
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
