// src/components/DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import AlarmLogWindow from "./AlarmLogWindow";
import DraggableDroppedTank from "./DraggableDroppedTank";
import DraggableTextBox from "./DraggableTextBox";
import DraggableImage from "./DraggableImage";
import DraggableDisplayBox from "./DraggableDisplayBox";
import DraggableGraphicDisplay from "./DraggableGraphicDisplay";
import DraggableAlarmLog from "./DraggableAlarmLog";
import ToggleSwitchControl from "./controls/ToggleSwitchControl";
import PushButtonControl from "./controls/PushButtonControl";
import AlarmLogResizeEdges from "./alarm/AlarmLogResizeEdges";
import DisplayOutputTextBoxStyle from "./display/DisplayOutputTextBoxStyle";
import { StandardTank, HorizontalTank, VerticalTank, SiloTank } from "./ProTankIcon";
import {
  DraggableLedCircle,
  DraggableStatusTextBox,
  DraggableBlinkingAlarm,
  DraggableStateImage,
  DraggableCounterInput,
} from "./indicators";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ best-effort dashboard id resolver (safe fallbacks)
// ✅ UPDATED: prefer activeDashboardId first, then dashboardId, then selectedTank, then first widget
function resolveDashboardId({ activeDashboardId, dashboardId, selectedTank, droppedTanks }) {
  const z = String(activeDashboardId || "").trim();
  if (z) return z;

  const a = String(dashboardId || "").trim();
  if (a) return a;

  const b = String(selectedTank?.dashboard_id || selectedTank?.dashboardId || "").trim();
  if (b) return b;

  // if all widgets belong to same dashboard, try first one's property
  const first = Array.isArray(droppedTanks) ? droppedTanks[0] : null;
  const c = String(
    first?.dashboard_id || first?.dashboardId || first?.properties?.dashboard_id || ""
  ).trim();
  if (c) return c;

  return null;
}

export default function DashboardCanvas({
  dashboardMode,
  sensors,
  sensorsData,
  droppedTanks,
  setDroppedTanks,
  selectedIds,
  setSelectedIds,
  selectedTank,
  setSelectedTank,
  dragDelta,
  setDragDelta,
  contextMenu,
  setContextMenu,
  activeSiloId,
  setActiveSiloId,
  setShowSiloProps,
  handleSelect,
  handleRightClick,
  handleDrop,
  handleDragMove,
  handleDragEnd,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  getLayerScore,
  selectionBox,
  hideContextMenu,
  guides,
  onOpenDisplaySettings,
  onOpenGraphicDisplaySettings,

  // ✅ NEW
  onOpenAlarmLog,
  onLaunchAlarmLog,

  // ✅ NEW: indicator settings
  onOpenIndicatorSettings,
  onOpenStatusTextSettings,
  onOpenBlinkingAlarmSettings,
  onOpenStateImageSettings,
  onOpenCounterInputSettings,

  // ✅ NEW: active dashboard id (preferred)
  activeDashboardId,

  // ✅ OPTIONAL: pass dashboard id from parent if you have it
  dashboardId,
}) {
  const isPlay = dashboardMode === "play";

  // =====================================================
  // ✅ PLAY MODE: pull live counter values from backend
  // =====================================================
  const countersRef = React.useRef({ loading: false });

  const fetchCountersForDashboard = React.useCallback(async () => {
    if (!isPlay) return;

    const dash = resolveDashboardId({
      activeDashboardId,
      dashboardId,
      selectedTank,
      droppedTanks,
    });
    if (!dash) return;

    if (countersRef.current.loading) return;
    countersRef.current.loading = true;

    try {
      const token = String(getToken() || "").trim();
      if (!token) return;

      // Fast bulk endpoint
      const res = await fetch(
        `${API_URL}/device-counters/by-dashboard/${encodeURIComponent(dash)}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) return;

      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];

      // map by widget_id -> count
      const map = {};
      for (const r of list) {
        const wid = String(r?.widget_id || r?.widgetId || "").trim();
        if (!wid) continue;
        map[wid] = Number(r?.count ?? 0) || 0;
      }

      // apply to dropped tanks
      setDroppedTanks((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        let changed = false;

        const next = arr.map((t) => {
          if (!t || t.shape !== "counterInput") return t;

          const wid = String(t.id || "").trim();
          if (!wid) return t;

          if (map[wid] === undefined) return t;

          const current = Number(t?.properties?.count ?? 0) || 0;
          const incoming = Number(map[wid] ?? 0) || 0;

          if (current === incoming) return t;

          changed = true;
          return {
            ...t,
            properties: {
              ...(t.properties || {}),
              count: incoming,
            },
          };
        });

        return changed ? next : prev;
      });
    } catch {
      // ignore (keep UI stable)
    } finally {
      countersRef.current.loading = false;
    }
  }, [isPlay, activeDashboardId, dashboardId, selectedTank, droppedTanks, setDroppedTanks]);

  React.useEffect(() => {
    if (!isPlay) return;

    // initial fetch
    fetchCountersForDashboard();

    // ✅ poll every 1 second (your request)
    const t = setInterval(() => {
      if (document.hidden) return;
      fetchCountersForDashboard();
    }, 700);

    return () => clearInterval(t);
  }, [isPlay, fetchCountersForDashboard]);

  // =====================================================
  // ✅ Z-ORDER HELPERS (Option A) — STABLE + NO CRASH
  // =====================================================

  const getTankZ = React.useCallback((t) => {
    return Number(t?.z ?? t?.zIndex ?? 0) || 0;
  }, []);

  const normalizeZ = React.useCallback((list) => {
    const arr = Array.isArray(list) ? list : [];
    let next = 1;

    return arr.map((t) => {
      const base =
        t?.z !== undefined && t?.z !== null
          ? t.z
          : t?.zIndex !== undefined && t?.zIndex !== null
          ? t.zIndex
          : next++;

      const safe = Math.max(1, Number(base) || 1);
      return { ...t, z: safe, zIndex: safe };
    });
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(droppedTanks) || droppedTanks.length === 0) return;

    const missing = droppedTanks.some((t) => t?.z == null || t?.zIndex == null);
    if (!missing) return;

    setDroppedTanks((prev) => normalizeZ(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZ]);

  const bringToFront = React.useCallback(
    (id) => {
      setDroppedTanks((prev) => {
        const items = normalizeZ(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = target.z;
        const maxZ = Math.max(1, ...items.map((t) => t.z));
        if (oldZ === maxZ) return items;

        return items.map((t) => {
          if (t.id === id) return { ...t, z: maxZ, zIndex: maxZ };
          if (t.z > oldZ) return { ...t, z: t.z - 1, zIndex: t.z - 1 };
          return t;
        });
      });
    },
    [setDroppedTanks, normalizeZ]
  );

  const sendToBack = React.useCallback(
    (id) => {
      setDroppedTanks((prev) => {
        const items = normalizeZ(prev);
        const target = items.find((t) => t.id === id);
        if (!target) return items;

        const oldZ = target.z;
        const minZ = 1;
        if (oldZ === minZ) return items;

        return items.map((t) => {
          if (t.id === id) return { ...t, z: minZ, zIndex: minZ };
          if (t.z < oldZ) return { ...t, z: t.z + 1, zIndex: t.z + 1 };
          return t;
        });
      });
    },
    [setDroppedTanks, normalizeZ]
  );

  React.useEffect(() => {
    void bringToFront;
    void sendToBack;
  }, [bringToFront, sendToBack]);

  // =====================================================
  // ✅ RESET COUNTER (Play mode)
  // NOTE: your backend might be:
  //   POST /device-counters/reset           (with JSON body)
  // or
  //   POST /device-counters/reset/{widget}  (optional query)
  //
  // I am implementing the BODY version because your backend schema shows ResetCounterBody.
  // Body: { widget_id, dashboard_id? }
  // =====================================================
  const resetCounterOnBackend = React.useCallback(
    async ({ widgetId, dash }) => {
      const token = String(getToken() || "").trim();
      if (!token) throw new Error("Missing auth token. Please logout and login again.");

      const res = await fetch(`${API_URL}/device-counters/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          widget_id: String(widgetId || "").trim(),
          dashboard_id: dash || null,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.detail || `Reset failed (${res.status})`);
      }

      // refresh immediately so UI updates right away
      await fetchCountersForDashboard();
      return j;
    },
    [fetchCountersForDashboard]
  );

  return (
    <DndContext
      sensors={isPlay ? [] : sensors}
      onDragMove={isPlay ? undefined : handleDragMove}
      onDragEnd={isPlay ? undefined : handleDragEnd}
    >
      <div
        id="coreflex-canvas-root"
        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ position: "relative", overflow: "hidden" }}
        onDragOver={(e) => !isPlay && e.preventDefault()}
        onDrop={(e) => !isPlay && handleDrop(e)}
        onContextMenu={(e) => {
          if (isPlay) return; // ✅ no menu in play mode
          e.preventDefault();
          e.stopPropagation();
          handleRightClick?.(e, null);
        }}
        onMouseDown={(e) => !isPlay && handleCanvasMouseDown(e)}
        onMouseMove={(e) => !isPlay && handleCanvasMouseMove(e)}
        onMouseUp={(e) => !isPlay && handleCanvasMouseUp(e)}
      >
        {droppedTanks
          .slice()
          .sort((a, b) => getTankZ(a) - getTankZ(b))
          .map((tank) => {
            const isSelected = selectedIds.includes(tank.id);

            const commonProps = {
              key: tank.id,
              tank,
              selected: isSelected && !isPlay,
              selectedIds,
              dragDelta,
              dashboardMode,
              onSelect: handleSelect,
              onRightClick: (e) => handleRightClick?.(e, tank),
              onUpdate: (updated) =>
                setDroppedTanks((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                ),
            };

            if (tank.shape === "alarmLog" && tank.minimized) {
              return (
                <DraggableAlarmLog
                  key={tank.id}
                  obj={tank}
                  selected={isSelected && !isPlay}
                  onSelect={() => handleSelect(tank.id)}
                  onOpen={() => commonProps.onUpdate?.({ ...tank, minimized: false })}
                  onLaunch={() => onLaunchAlarmLog?.(tank)}
                />
              );
            }

            if (tank.shape === "img") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <DraggableImage src={tank.src} scale={tank.scale} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "displayBox") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenDisplaySettings?.(tank);
                  }}
                >
                  <DraggableDisplayBox tank={tank} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "displayOutput") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenDisplaySettings?.(tank);
                  }}
                >
                  <DisplayOutputTextBoxStyle
                    tank={tank}
                    isPlay={isPlay}
                    onUpdate={commonProps.onUpdate}
                  />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "graphicDisplay") {
              return (
                <DraggableGraphicDisplay
                  key={tank.id}
                  tank={tank}
                  selected={isSelected && !isPlay}
                  selectedIds={selectedIds}
                  dragDelta={dragDelta}
                  onSelect={handleSelect}
                  onUpdate={commonProps.onUpdate}
                  onRightClick={(e) => handleRightClick?.(e, tank)}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
                  }}
                />
              );
            }

            if (tank.shape === "alarmLog") {
              const w = tank.w ?? tank.width ?? 780;
              const h = tank.h ?? tank.height ?? 360;

              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenAlarmLog?.(tank);
                  }}
                >
                  <div
                    style={{ width: w, height: h, position: "relative" }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <AlarmLogWindow
                      onOpenSettings={() => onOpenAlarmLog?.(tank)}
                      onLaunch={() => onLaunchAlarmLog?.(tank)}
                      onMinimize={() => commonProps.onUpdate?.({ ...tank, minimized: true })}
                      onClose={() =>
                        setDroppedTanks((prev) => prev.filter((t) => t.id !== tank.id))
                      }
                    />

                    {!isPlay && (
                      <AlarmLogResizeEdges
                        tank={tank}
                        onUpdate={commonProps.onUpdate}
                        minW={520}
                        minH={240}
                      />
                    )}
                  </div>
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "toggleSwitch" || tank.shape === "toggleControl") {
              const w = tank.w ?? tank.width ?? 180;
              const h = tank.h ?? tank.height ?? 70;
              const isOn = tank.isOn ?? true;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <ToggleSwitchControl isOn={isOn} width={w} height={h} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "pushButtonNO") {
              const w = tank.w ?? tank.width ?? 110;
              const h = tank.h ?? tank.height ?? 110;
              const pressed = !!tank.pressed;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <PushButtonControl variant="NO" width={w} height={h} pressed={pressed} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "pushButtonNC") {
              const w = tank.w ?? tank.width ?? 110;
              const h = tank.h ?? tank.height ?? 110;
              const pressed = !!tank.pressed;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <PushButtonControl variant="NC" width={w} height={h} pressed={pressed} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "standardTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <StandardTank level={0} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "horizontalTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <HorizontalTank level={0} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "verticalTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <VerticalTank level={0} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "siloTank") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) {
                      setActiveSiloId(tank.id);
                      setShowSiloProps(true);
                    }
                  }}
                >
                  <div className="flex flex-col items-center">
                    <SiloTank level={tank.level ?? 0} />
                  </div>
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "textBox") {
              return (
                <DraggableTextBox
                  {...commonProps}
                  disableDrag={isPlay}
                  disableEdit={isPlay}
                  dashboardMode={dashboardMode}
                  onRightClick={(e) => handleRightClick?.(e, tank)}
                />
              );
            }

            if (tank.shape === "ledCircle") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenIndicatorSettings?.(tank);
                  }}
                >
                  <DraggableLedCircle tank={tank} sensorsData={sensorsData} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "statusTextBox") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenStatusTextSettings?.(tank);
                  }}
                >
                  <DraggableStatusTextBox tank={tank} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "blinkingAlarm") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenBlinkingAlarmSettings?.(tank);
                  }}
                >
                  <DraggableBlinkingAlarm tank={tank} sensorsData={sensorsData} />
                </DraggableDroppedTank>
              );
            }

            if (tank.shape === "stateImage") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenStateImageSettings?.(tank);
                  }}
                >
                  <DraggableStateImage tank={tank} />
                </DraggableDroppedTank>
              );
            }

            // ✅ COUNTER INPUT (DI) — backend-driven + play polling + ✅ reset wired
            if (tank.shape === "counterInput") {
              const resolvedDash = resolveDashboardId({
                activeDashboardId,
                dashboardId,
                selectedTank,
                droppedTanks,
              });

              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenCounterInputSettings?.(tank);
                  }}
                >
              <DraggableCounterInput
  variant="canvas"
  label="Counter"
  tank={tank}
  id={tank.id}
  dashboardId={resolvedDash}
  dashboardMode={dashboardMode}   // ✅ ADD THIS
  onReset={async (widgetId) => {
    if (!isPlay) return;
    try {
      await resetCounterOnBackend({ widgetId, dash: resolvedDash });
    } catch (e) {
      console.error("Reset failed:", e);
      alert(e?.message || "Reset failed");
    }
  }}
/>

                </DraggableDroppedTank>
              );
            }

            return null;
          })}

        {!isPlay && selectionBox && (
          <div
            style={{
              position: "absolute",
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
              border: "1px dashed #2563eb",
              background: "rgba(37, 99, 235, 0.15)",
              pointerEvents: "none",
              zIndex: 99999,
            }}
          />
        )}

        {!isPlay &&
          guides &&
          guides.map((g, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: g.type === "vertical" ? g.x : 0,
                top: g.type === "horizontal" ? g.y : 0,
                width: g.type === "vertical" ? "1px" : "100%",
                height: g.type === "horizontal" ? "1px" : "100%",
                background: "red",
                pointerEvents: "none",
                zIndex: 99990,
              }}
            />
          ))}
      </div>
    </DndContext>
  );
}
