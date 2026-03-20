// src/components/DashboardCanvasWidgetLayer.jsx
import React from "react";
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
import DraggableVerticalTank from "./DraggableVerticalTank";
import DraggableSiloTank from "./DraggableSiloTank";
import DraggableStandardTank from "./DraggableStandardTank";
import DraggableHorizontalTank from "./DraggableHorizontalTank";
import {
  DraggableLedCircle,
  DraggableStatusTextBox,
  DraggableBlinkingAlarm,
  DraggableStateImage,
  DraggableCounterInput,
} from "./indicators";
import GaugeDisplay from "./gauge/GaugeDisplay";

function getBoundModel(tank, fallback = "") {
  return String(
    tank?.bindModel ||
      tank?.properties?.bindModel ||
      tank?.deviceModel ||
      tank?.properties?.deviceModel ||
      fallback
  )
    .trim()
    .toLowerCase();
}

function getBoundDeviceId(tank) {
  return String(
    tank?.bindDeviceId ||
      tank?.properties?.bindDeviceId ||
      tank?.deviceId ||
      tank?.properties?.deviceId ||
      ""
  ).trim();
}

function getBoundField(tank, fallback = "") {
  return String(
    tank?.bindField ||
      tank?.properties?.bindField ||
      tank?.tag ||
      tank?.properties?.tag ||
      fallback
  ).trim();
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  if (!deviceId) return null;
  return telemetryMap?.[model]?.[deviceId] || telemetryMap?.[deviceId] || null;
}

function getTelemetryValue(row, field) {
  if (!row || !field) return null;

  const f = String(field || "").trim();
  if (!f) return null;

  const direct = [
    f,
    f.toLowerCase(),
    f.toUpperCase(),
    f.replace("-", "_"),
    f.replace("_", "-"),
  ];

  for (const key of direct) {
    if (row[key] !== undefined) return row[key];
  }

  return null;
}

function formatOverlayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}

function DashboardIdsOverlayBadge({
  visible,
  deviceId,
  deviceStatus,
  field,
  value,
}) {
  if (!visible) return null;
  if (!deviceId || !field) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: -44,
        background: "#000",
        color: "#fff",
        borderRadius: 6,
        padding: "6px 8px",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.25,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 999999,
        boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      {deviceId}-{String(deviceStatus || "OFFLINE").toUpperCase()}-{field}-
      {formatOverlayValue(value)}
    </div>
  );
}

export default function DashboardCanvasWidgetLayer({
  droppedTanks,
  selectedIds,
  dragDelta,
  dashboardMode,
  isPlay,
  telemetryMap,
  sensorsData,
  setDroppedTanks,
  handleRightClick,
  handleObjectSelect,
  onOpenDisplaySettings,
  onOpenGaugeDisplaySettings,
  onOpenGraphicDisplaySettings,
  onOpenAlarmLog,
  onLaunchAlarmLog,
  onOpenIndicatorSettings,
  onOpenStatusTextSettings,
  onOpenBlinkingAlarmSettings,
  onOpenStateImageSettings,
  onOpenCounterInputSettings,
  onOpenPushButtonNOSettings,
  onOpenPushButtonNCSettings,
  onSaveProject,
  activeDashboardId,
  dashboardId,
  selectedTank,
  dashboardName,
  resolveDashboardId,
  resetCounterOnBackend,
  setActiveStandardTankId,
  setShowStandardTankProps,
  setActiveHorizontalTankId,
  setShowHorizontalTankProps,
  setActiveVerticalTankId,
  setShowVerticalTankProps,
  setActiveSiloId,
  setShowSiloProps,
  getTankZ,
  showDashboardIdsDetails = false,
  dashboardIdsDetailsDashboardId = "",
}) {
  const resolvedDashboardName = String(dashboardName || "").trim();

  const shouldShowIdsOverlay = React.useCallback(
    (tank, fallbackField = "") => {
      if (!showDashboardIdsDetails) return false;

      const currentDash = String(dashboardIdsDetailsDashboardId || "").trim();
      const tankDash = String(
        tank?.dashboard_id ||
          tank?.dashboardId ||
          tank?.properties?.dashboard_id ||
          tank?.properties?.dashboardId ||
          ""
      ).trim();

      if (currentDash && tankDash && currentDash !== tankDash) return false;

      const deviceId = getBoundDeviceId(tank);
      const field = getBoundField(tank, fallbackField);
      return Boolean(deviceId && field);
    },
    [showDashboardIdsDetails, dashboardIdsDetailsDashboardId]
  );

  const renderTelemetryOverlay = React.useCallback(
    (tank, fallbackField = "") => {
      if (!shouldShowIdsOverlay(tank, fallbackField)) return null;

      const model = getBoundModel(tank, "zhc1921");
      const deviceId = getBoundDeviceId(tank);
      const field = getBoundField(tank, fallbackField);
      const row = getTelemetryRow(telemetryMap, model, deviceId);

      return (
        <DashboardIdsOverlayBadge
          visible
          deviceId={deviceId}
          deviceStatus={row?.status || "offline"}
          field={field}
          value={getTelemetryValue(row, field)}
        />
      );
    },
    [shouldShowIdsOverlay, telemetryMap]
  );

  return (Array.isArray(droppedTanks) ? droppedTanks : [])
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
        onSelect: handleObjectSelect,
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
            onSelect={(e) => handleObjectSelect(tank.id, e)}
            onOpen={() => commonProps.onUpdate?.({ ...tank, minimized: false })}
            onLaunch={() => onLaunchAlarmLog?.(tank)}
          />
        );
      }

      if (tank.shape === "img") {
        return (
          <DraggableDroppedTank {...commonProps}>
            <DraggableImage src={tank.src} baseW={tank.baseW} />
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableDisplayBox tank={tank} />
            </div>
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DisplayOutputTextBoxStyle
                tank={tank}
                isPlay={isPlay}
                onUpdate={commonProps.onUpdate}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "gaugeDisplay") {
        const w = tank.w ?? tank.width ?? 220;
        const h = tank.h ?? tank.height ?? 220;

        const model = getBoundModel(tank, "zhc1921");
        const deviceId = getBoundDeviceId(tank);
        const field = getBoundField(tank, "ai1");

        const row = getTelemetryRow(telemetryMap, model, deviceId);

        const rawValue = getTelemetryValue(row, field);

        const numericValue =
          rawValue === null || rawValue === undefined || rawValue === ""
            ? null
            : typeof rawValue === "number"
            ? rawValue
            : Number(rawValue);

        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) onOpenGaugeDisplaySettings?.(tank);
            }}
          >
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank, "ai1")}
              <GaugeDisplay
                value={Number.isFinite(numericValue) ? numericValue : 0}
                width={w}
                height={h}
                settings={{
                  ...tank,
                  ...(tank.properties || {}),
                }}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "graphicDisplay") {
        return (
          <div key={tank.id} style={{ position: "relative" }}>
            {renderTelemetryOverlay(tank)}
            <DraggableGraphicDisplay
              tank={tank}
              telemetryMap={telemetryMap}
              selected={isSelected && !isPlay}
              selectedIds={selectedIds}
              dragDelta={dragDelta}
              dashboardMode={dashboardMode}
              onSelect={handleObjectSelect}
              onUpdate={commonProps.onUpdate}
              onRightClick={(e) => handleRightClick?.(e, tank)}
              onOpenSettings={() => {
                if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
              }}
              onDoubleClick={() => {
                if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
              }}
            />
          </div>
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
                onMinimize={() =>
                  commonProps.onUpdate?.({ ...tank, minimized: true })
                }
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

        const resolvedDash = resolveDashboardId({
          activeDashboardId,
          dashboardId,
          selectedTank,
          droppedTanks,
        });

        return (
          <DraggableDroppedTank {...commonProps}>
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <ToggleSwitchControl
                isOn={isOn}
                width={w}
                height={h}
                isLaunched={isPlay}
                visualOnly={false}
                widget={tank}
                onSaveWidget={commonProps.onUpdate}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
                onSaveProject={onSaveProject}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "pushButtonNO") {
        const w = tank.w ?? tank.width ?? 110;
        const h = tank.h ?? tank.height ?? 110;
        const pressed = !!tank.pressed;

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
              if (!isPlay) onOpenPushButtonNOSettings?.(tank);
            }}
          >
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <PushButtonControl
                variant="NO"
                width={w}
                height={h}
                pressed={pressed}
                title={tank?.properties?.title || ""}
                isLaunched={isPlay}
                visualOnly={false}
                widget={tank}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "pushButtonNC") {
        const w = tank.w ?? tank.width ?? 110;
        const h = tank.h ?? tank.height ?? 110;
        const pressed = !!tank.pressed;

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
              if (!isPlay) onOpenPushButtonNCSettings?.(tank);
            }}
          >
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <PushButtonControl
                variant="NC"
                width={w}
                height={h}
                pressed={pressed}
                title={tank?.properties?.title || ""}
                isLaunched={isPlay}
                visualOnly={false}
                widget={tank}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "standardTank") {
        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) {
                setActiveStandardTankId?.(tank.id);
                setShowStandardTankProps?.(true);
              }
            }}
          >
            <div className="flex flex-col items-center" style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableStandardTank
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "horizontalTank") {
        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) {
                setActiveHorizontalTankId?.(tank.id);
                setShowHorizontalTankProps?.(true);
              }
            }}
          >
            <div className="flex flex-col items-center" style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableHorizontalTank
                tank={tank}
                onChange={(nextTank) => commonProps.onUpdate?.(nextTank)}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "verticalTank") {
        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) {
                setActiveVerticalTankId?.(tank.id);
                setShowVerticalTankProps?.(true);
              }
            }}
          >
            <div className="flex flex-col items-center" style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableVerticalTank
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "siloTank") {
        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) {
                setActiveSiloId?.(tank.id);
                setShowSiloProps?.(true);
              }
            }}
          >
            <div className="flex flex-col items-center" style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableSiloTank
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableLedCircle
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
            </div>
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableStatusTextBox
                tank={tank}
                isPlay={isPlay}
                dashboardMode={dashboardMode}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            </div>
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableBlinkingAlarm
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            </div>
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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableStateImage
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

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
            <div style={{ position: "relative" }}>
              {renderTelemetryOverlay(tank)}
              <DraggableCounterInput
                variant="canvas"
                label="Counter"
                tank={tank}
                id={tank.id}
                dashboardId={resolvedDash}
                dashboardMode={dashboardMode}
                onReset={async (widgetId) => {
                  if (!isPlay) return;
                  try {
                    await resetCounterOnBackend({
                      widgetId,
                      dash: resolvedDash,
                    });
                  } catch (e) {
                    console.error("Reset failed:", e);
                    alert(e?.message || "Reset failed");
                  }
                }}
              />
            </div>
          </DraggableDroppedTank>
        );
      }

      return null;
    });
}