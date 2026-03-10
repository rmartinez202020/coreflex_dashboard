// src/components/AppModals.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import IndicatorLightSettingsModal from "./indicators/IndicatorLightSettingsModal";
import StatusTextSettingsModal from "./indicators/StatusTextSettingsModal";
import BlinkingAlarmSettingsModal from "./indicators/BlinkingAlarmSettingsModal";
import StateImageSettingsModal from "./indicators/StateImageSettingsModal";
import RestoreWarningModal from "./RestoreWarningModal";
import DisplaySettingsModal from "./DisplaySettingsModal";
import GraphicDisplaySettingsModal from "./GraphicDisplaySettingsModal";
import SiloPropertiesModal from "./SiloPropertiesModal";
import CounterInputSettingsModal from "./indicators/CounterInputSettingsModal";
import HorizontalTankPropertiesModal from "./HorizontalTankPropertiesModal";
import VerticalTankSettingsModal from "./VerticalTankSettingsModal";
import StandardTankPropertiesModal from "./StandardTankPropertiesModal";
import PushButtonNOPropertiesModal from "./controls/PushButtonNOPropertiesModal";
import PushButtonNCPropertiesModal from "./controls/PushButtonNCPropertiesModal";
import AlarmLogWindow from "./AlarmLogWindow";

export default function AppModals({
  dashboardId = null,
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
  pushButtonNOSettingsId,
  closePushButtonNOSettings,
  pushButtonNCSettingsId,
  closePushButtonNCSettings,
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

  // ✅ always keep latest droppedTanks (avoids stale closure issues)
  const droppedTanksRef = useRef([]);
  useEffect(() => {
    droppedTanksRef.current = Array.isArray(droppedTanks) ? droppedTanks : [];
  }, [droppedTanks]);

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

  const activeHorizontalTank = useMemo(() => {
    if (activeHorizontalTankId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, activeHorizontalTankId) && t.shape === "horizontalTank"
    );
  }, [droppedTanks, activeHorizontalTankId]);

  const activeVerticalTank = useMemo(() => {
    if (activeVerticalTankId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, activeVerticalTankId) && t.shape === "verticalTank"
    );
  }, [droppedTanks, activeVerticalTankId]);

  const activeStandardTank = useMemo(() => {
    if (activeStandardTankId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, activeStandardTankId) && t.shape === "standardTank"
    );
  }, [droppedTanks, activeStandardTankId]);

  const indicatorTarget = useMemo(() => {
    if (indicatorSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, indicatorSettingsId) && t.shape === "ledCircle"
    );
  }, [droppedTanks, indicatorSettingsId]);

  const statusTextTarget = useMemo(() => {
    if (statusTextSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, statusTextSettingsId) && t.shape === "statusTextBox"
    );
  }, [droppedTanks, statusTextSettingsId]);

  const blinkingAlarmTarget = useMemo(() => {
    if (blinkingAlarmSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, blinkingAlarmSettingsId) && t.shape === "blinkingAlarm"
    );
  }, [droppedTanks, blinkingAlarmSettingsId]);

  const stateImageTarget = useMemo(() => {
    if (stateImageSettingsId == null) return null;
    return droppedTanks.find(
      (t) => isSameId(t.id, stateImageSettingsId) && t.shape === "stateImage"
    );
  }, [droppedTanks, stateImageSettingsId]);

  const counterInputTarget = useMemo(() => {
    if (counterInputSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, counterInputSettingsId) && t.shape === "counterInput"
    );
  }, [droppedTanks, counterInputSettingsId]);

  // ✅ NEW: pushButtonNO modal target
  const pushButtonNOTarget = useMemo(() => {
    if (pushButtonNOSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, pushButtonNOSettingsId) && t.shape === "pushButtonNO"
    );
  }, [droppedTanks, pushButtonNOSettingsId]);

  // ✅ NEW: pushButtonNC modal target
  const pushButtonNCTarget = useMemo(() => {
    if (pushButtonNCSettingsId == null) return null;
    return droppedTanks.find(
      (t) =>
        isSameId(t.id, pushButtonNCSettingsId) && t.shape === "pushButtonNC"
    );
  }, [droppedTanks, pushButtonNCSettingsId]);

  const alarmLogWindowProps = windowDrag?.getWindowProps
    ? windowDrag.getWindowProps("alarmLog")
    : null;

  const normalizeUpdated = (updated) => {
    if (!updated || typeof updated !== "object") return { properties: {} };
    if (updated.properties && typeof updated.properties === "object")
      return updated;

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

  const closeVerticalTankModal = () => {
    setShowVerticalTankProps?.(false);
    if (typeof setActiveVerticalTankId === "function") {
      setActiveVerticalTankId(null);
    }
  };

  const closeStandardTankModal = () => {
    setShowStandardTankProps?.(false);
    if (typeof setActiveStandardTankId === "function") {
      setActiveStandardTankId(null);
    }
  };

  return (
    <>
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

      {/* ✅ NEW: Push Button NO settings */}
      {pushButtonNOTarget && (
        <PushButtonNOPropertiesModal
          open={true}
          pushButton={pushButtonNOTarget}
          dashboardId={safeDashboardId}
          onSaveProject={onSaveProject}
          onClose={() => closePushButtonNOSettings?.()}
          onSave={(updated) => {
            patchTankProperties(pushButtonNOTarget.id, updated);
            closePushButtonNOSettings?.();
          }}
        />
      )}

      {pushButtonNCTarget && (
        <PushButtonNCPropertiesModal
          open={true}
          pushButton={pushButtonNCTarget}
          dashboardId={safeDashboardId}
          onSaveProject={onSaveProject}
          onClose={() => closePushButtonNCSettings?.()}
          onSave={(updated) => {
            patchTankProperties(pushButtonNCTarget.id, updated);
            closePushButtonNCSettings?.();
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
          onSave={async (updatedTank) => {
            const base = droppedTanksRef.current || [];

            const next = base.map((t) =>
              isSameId(t.id, updatedTank.id) ? updatedTank : t
            );

            setDroppedTanks(next);

            if (typeof onSaveProject === "function") {
              try {
                console.warn("💾 [AppModals] calling onSaveProject(next)...");
                await onSaveProject(next);
                console.warn("✅ [AppModals] onSaveProject(next) FINISHED");
              } catch (e) {
                alert(e?.message || "Save failed");
                return;
              }
            } else {
              alert("onSaveProject is missing (not a function).");
              return;
            }

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

      {alarmLogOpen && (
        <div
          style={{
            position: "fixed",
            left: alarmLogWindowProps?.position?.x ?? alarmLogPos.x,
            top: alarmLogWindowProps?.position?.y ?? alarmLogPos.y,
            width: alarmLogWindowProps?.size?.width ?? 900,
            height: alarmLogWindowProps?.size?.height ?? 420,
            zIndex: 99999,
          }}
        >
          <AlarmLogWindow
            onClose={closeAlarmLog}
            onLaunch={onLaunchAlarmLog}
            onMinimize={onMinimizeAlarmLog}
            onStartDragWindow={alarmLogWindowProps?.onStartDragWindow}
          />

          {/* ✅ Right edge resize */}
          <div
            onPointerDown={(e) =>
              alarmLogWindowProps?.onStartResizeWindow?.(e, "e")
            }
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 14,
              height: "100%",
              cursor: "ew-resize",
              zIndex: 100000,
              background: "transparent",
            }}
          />

          {/* ✅ Bottom edge resize */}
          <div
            onPointerDown={(e) =>
              alarmLogWindowProps?.onStartResizeWindow?.(e, "s")
            }
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: 14,
              cursor: "ns-resize",
              zIndex: 100000,
              background: "transparent",
            }}
          />

          {/* ✅ Bottom-right corner resize */}
          <div
            onPointerDown={(e) =>
              alarmLogWindowProps?.onStartResizeWindow?.(e, "se")
            }
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 18,
              height: 18,
              cursor: "nwse-resize",
              zIndex: 100001,
              background: "transparent",
            }}
          />
        </div>
      )}

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