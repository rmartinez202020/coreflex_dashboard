// src/components/AppModals.jsx
import React, { useEffect, useMemo, useState } from "react";
import IndicatorLightSettingsModal from "./indicators/IndicatorLightSettingsModal";
import StatusTextSettingsModal from "./indicators/StatusTextSettingsModal";
import BlinkingAlarmSettingsModal from "./indicators/BlinkingAlarmSettingsModal";
import StateImageSettingsModal from "./indicators/StateImageSettingsModal";
import RestoreWarningModal from "./RestoreWarningModal";
import DisplaySettingsModal from "./DisplaySettingsModal";
import GraphicDisplaySettingsModal from "./GraphicDisplaySettingsModal";
import SiloPropertiesModal from "./SiloPropertiesModal";
import AlarmLogModal from "./AlarmLogModal";
import CounterInputSettingsModal from "./indicators/CounterInputSettingsModal";
import HorizontalTankPropertiesModal from "./HorizontalTankPropertiesModal";
import VerticalTankSettingsModal from "./VerticalTankSettingsModal";
import StandardTankPropertiesModal from "./StandardTankPropertiesModal";

export default function AppModals({
  // ✅ required for Counter API (upsert/reset/poll by dashboard)
  dashboardId = null,

  // ✅ passed from App.jsx (THIS is handleSaveProject)
  onSaveProject,

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
  showHorizontalTankProps,
  setShowHorizontalTankProps,
  activeHorizontalTankId,
  showVerticalTankProps,
  setShowVerticalTankProps,
  activeVerticalTankId,
  setActiveVerticalTankId,
  showStandardTankProps,
  setShowStandardTankProps,
  activeStandardTankId,
  setActiveStandardTankId,
  alarmLogOpen,
  closeAlarmLog,
  onMinimizeAlarmLog,
  onLaunchAlarmLog,
  indicatorSettingsId,
  closeIndicatorSettings,
  statusTextSettingsId,
  closeStatusTextSettings,
  blinkingAlarmSettingsId,
  closeBlinkingAlarmSettings,
  stateImageSettingsId,
  closeStateImageSettings,
  counterInputSettingsId,
  closeCounterInputSettings,
  sensorsData,
  windowDrag,
  debug = false,
}) {
  const isSameId = (a, b) => String(a) === String(b);

  // ✅ normalize dashboardId (string or null)
  const safeDashboardId = useMemo(() => {
    const s = String(dashboardId || "").trim();
    return s ? s : null;
  }, [dashboardId]);

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

  // ✅ Horizontal Tank active target
  const activeHorizontalTank = useMemo(() => {
    if (activeHorizontalTankId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, activeHorizontalTankId) && t.shape === "horizontalTank"
    );
  }, [droppedTanks, activeHorizontalTankId]);

  // ✅ Vertical Tank active target
  const activeVerticalTank = useMemo(() => {
    if (activeVerticalTankId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, activeVerticalTankId) && t.shape === "verticalTank"
    );
  }, [droppedTanks, activeVerticalTankId]);

  // ✅ Standard Tank active target
  const activeStandardTank = useMemo(() => {
    if (activeStandardTankId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, activeStandardTankId) && t.shape === "standardTank"
    );
  }, [droppedTanks, activeStandardTankId]);

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

  // ✅ Blinking Alarm target
  const blinkingAlarmTarget = useMemo(() => {
    if (blinkingAlarmSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, blinkingAlarmSettingsId) && t.shape === "blinkingAlarm"
    );
  }, [droppedTanks, blinkingAlarmSettingsId]);

  // ✅ State Image target
  const stateImageTarget = useMemo(() => {
    if (stateImageSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, stateImageSettingsId) && t.shape === "stateImage"
    );
  }, [droppedTanks, stateImageSettingsId]);

  // ✅ Counter Input target
  const counterInputTarget = useMemo(() => {
    if (counterInputSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, counterInputSettingsId) && t.shape === "counterInput"
    );
  }, [droppedTanks, counterInputSettingsId]);

  const alarmLogWindowProps = windowDrag?.getWindowProps
    ? windowDrag.getWindowProps("alarmLog")
    : null;

  // ✅ Accept either:
  // 1) onSave({ properties: {...} })  (preferred)
  // 2) onSave({ ...flatProps })       (fallback - we wrap into properties)
  const normalizeUpdated = (updated) => {
    if (!updated || typeof updated !== "object") return { properties: {} };
    if (updated.properties && typeof updated.properties === "object")
      return updated;

    // Fallback: treat the whole object as properties
    const { id, shape, x, y, w, h, width, height, ...rest } = updated;
    return { properties: rest };
  };

  const patchTankProperties = (targetId, updated) => {
    const normalized = normalizeUpdated(updated);

    if (debug) {
      console.log("🧩 MODAL SAVE (raw):", updated);
      console.log("🧩 MODAL SAVE (normalized):", normalized);
      console.log("🧩 DASHBOARD ID:", safeDashboardId);
    }

    setDroppedTanks((prev) =>
      prev.map((t) => {
        if (!isSameId(t.id, targetId)) return t;

        const nextProps =
          normalized?.properties && typeof normalized.properties === "object"
            ? { ...(t.properties || {}), ...normalized.properties }
            : { ...(t.properties || {}) };

        return { ...t, properties: nextProps };
      })
    );
  };

  // ✅ close helpers
  const closeVerticalTankModal = () => {
    setShowVerticalTankProps?.(false);
    if (typeof setActiveVerticalTankId === "function")
      setActiveVerticalTankId(null);
  };

  const closeStandardTankModal = () => {
    setShowStandardTankProps?.(false);
    if (typeof setActiveStandardTankId === "function")
      setActiveStandardTankId(null);
  };

  // ✅ SAVE HELPER: call the SAME function used by left "Save Project"
  // - schedule after React state queue so persistence sees the same snapshot
  const saveSnapshotNow = (snapshot, reason = "unknown") => {
    console.log("💾 [AppModals] saveSnapshotNow()", {
      reason,
      dashboardId: safeDashboardId,
      hasOnSaveProject: typeof onSaveProject === "function",
      snapshotCount: Array.isArray(snapshot) ? snapshot.length : null,
    });

    if (typeof onSaveProject !== "function") {
      console.warn(
        "⚠️ [AppModals] onSaveProject is NOT a function:",
        onSaveProject
      );
      return;
    }

    const run = () => {
      try {
        const p = onSaveProject(snapshot);
        console.log("✅ [AppModals] onSaveProject(snapshot) called. return=", p);
      } catch (e) {
        console.error("💥 [AppModals] onSaveProject(snapshot) threw:", e);
      }
    };

    // queueMicrotask is great, but fallback for older browsers
    if (typeof queueMicrotask === "function") queueMicrotask(run);
    else window.setTimeout(run, 0);
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

      {/* ✅ Blinking Alarm Settings */}
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

      {/* ✅ State Image Settings */}
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

      {/* ✅ Counter Input Settings */}
      {counterInputTarget && (
        <CounterInputSettingsModal
          open={true}
          tank={counterInputTarget}
          sensorsData={sensorsData}
          dashboardId={safeDashboardId}
          onClose={() => closeCounterInputSettings?.()}
          onSave={(updated) => {
            patchTankProperties(counterInputTarget.id, updated);
            closeCounterInputSettings?.();
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

      {/* ✅ Graphic Display Settings (Apply MUST auto-save project) */}
      {graphicTarget && (
        <GraphicDisplaySettingsModal
          open={true}
          tank={graphicTarget}
          onClose={closeGraphicDisplaySettings}
          onSave={(updatedTank) => {
            console.log("✅ [AppModals] Graphic onSave(updatedTank) fired:", {
              id: updatedTank?.id,
              shape: updatedTank?.shape,
              title: updatedTank?.title,
            });

            setDroppedTanks((prev) => {
              const next = prev.map((t) =>
                isSameId(t.id, updatedTank.id) ? updatedTank : t
              );

              console.log("🧱 [AppModals] Graphic snapshot computed:", {
                prevLen: prev?.length,
                nextLen: next?.length,
                updatedId: updatedTank?.id,
              });

              // ✅ do the real save with the exact snapshot we just computed
              saveSnapshotNow(next, "graphicDisplayApply");

              return next;
            });

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

      {/* ✅ Horizontal Tank Properties */}
      {showHorizontalTankProps && activeHorizontalTank && (
        <HorizontalTankPropertiesModal
          open={showHorizontalTankProps}
          tank={activeHorizontalTank}
          onClose={() => setShowHorizontalTankProps(false)}
          onSave={(updatedTank) => {
            setDroppedTanks((prev) =>
              prev.map((t) => (isSameId(t.id, updatedTank.id) ? updatedTank : t))
            );
            setShowHorizontalTankProps(false);
          }}
        />
      )}

      {/* ✅ Vertical Tank Properties */}
      {showVerticalTankProps && activeVerticalTank && (
        <VerticalTankSettingsModal
          open={showVerticalTankProps}
          tank={activeVerticalTank}
          onClose={closeVerticalTankModal}
          onSave={(updatedTank) => {
            setDroppedTanks((prev) =>
              prev.map((t) => (isSameId(t.id, updatedTank.id) ? updatedTank : t))
            );
            closeVerticalTankModal();
          }}
        />
      )}

      {/* ✅ Standard Tank Properties */}
      {showStandardTankProps && activeStandardTank && (
        <StandardTankPropertiesModal
          open={showStandardTankProps}
          tank={activeStandardTank}
          onClose={closeStandardTankModal}
          onSave={(updatedTank) => {
            setDroppedTanks((prev) =>
              prev.map((t) => (isSameId(t.id, updatedTank.id) ? updatedTank : t))
            );
            closeStandardTankModal();
          }}
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