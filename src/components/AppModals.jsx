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
  // ✅ NEW: required for Counter API (upsert/reset/poll by dashboard)
  dashboardId = null,

  // ✅ NEW: passed from App.jsx so Graphic Display Apply can auto-save project
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

  // ✅ NEW: Horizontal Tank active target (same pattern as silo)
  const activeHorizontalTank = useMemo(() => {
    if (activeHorizontalTankId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, activeHorizontalTankId) && t.shape === "horizontalTank"
    );
  }, [droppedTanks, activeHorizontalTankId]);

  // ✅ NEW: Vertical Tank active target
  const activeVerticalTank = useMemo(() => {
    if (activeVerticalTankId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, activeVerticalTankId) && t.shape === "verticalTank"
    );
  }, [droppedTanks, activeVerticalTankId]);

  // ✅ NEW: Standard Tank active target
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

  // ✅ NEW: Counter Input target
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

  // ✅ close helpers (also clear active ids if setter exists)
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

  // ✅ NEW: single helper for "Apply -> Save Project"
  // - saves 2s after state update so droppedRef + state are consistent
  // - adds loud logs so we know exactly why it didn't save
  const scheduleProjectSave = (objectsSnapshot, reason = "unknown") => {
    console.log("🧭 [AppModals] scheduleProjectSave()", {
      reason,
      hasOnSaveProject: typeof onSaveProject === "function",
      dashboardId: safeDashboardId,
      objects: Array.isArray(objectsSnapshot) ? objectsSnapshot.length : null,
    });

    if (typeof onSaveProject !== "function") {
      console.warn("⚠️ [AppModals] onSaveProject is NOT a function:", onSaveProject);
      return;
    }

    // delay per your request
    window.setTimeout(() => {
      console.log("💾 [AppModals] calling onSaveProject(snapshot) now...", {
        objects: Array.isArray(objectsSnapshot) ? objectsSnapshot.length : null,
      });

      try {
        const p = onSaveProject(objectsSnapshot);
        console.log("✅ [AppModals] onSaveProject() returned:", p);
      } catch (e) {
        console.error("💥 [AppModals] onSaveProject threw:", e);
      }
    }, 2000);
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

      {/* ✅ NEW: Counter Input Settings */}
      {counterInputTarget && (
        <CounterInputSettingsModal
          open={true}
          tank={counterInputTarget}
          sensorsData={sensorsData}
          // ✅ this is the missing piece:
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

      {/* ✅ Graphic Display Settings (Apply should auto-save project) */}
      {graphicTarget && (
        <GraphicDisplaySettingsModal
          open={true}
          tank={graphicTarget}
          onClose={closeGraphicDisplaySettings}
          onSaveProject={null} // ✅ we save from AppModals so we can pass the exact snapshot
          onSave={(updatedTank) => {
            console.log("✅ [AppModals] onSave(updatedTank) fired:", {
              id: updatedTank?.id,
              shape: updatedTank?.shape,
              title: updatedTank?.title,
            });

            setDroppedTanks((prev) => {
              console.log("🧱 [AppModals] setDroppedTanks(prev) length:", prev?.length);

              const next = prev.map((t) =>
                isSameId(t.id, updatedTank.id) ? updatedTank : t
              );

              console.log("🧱 [AppModals] computed next snapshot:", {
                nextLen: next.length,
                updatedId: updatedTank?.id,
              });

              // ✅ THE KEY: save EXACTLY the computed snapshot
              scheduleProjectSave(next, "graphicDisplayApply");

              return next;
            });

            console.log("🚪 [AppModals] closing Graphic modal");
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

      {/* ✅ NEW: Horizontal Tank Properties (same pattern as Silo) */}
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

      {/* ✅ NEW: Vertical Tank Properties */}
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

      {/* ✅ NEW: Standard Tank Properties */}
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