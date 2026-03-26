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

function normalizeTagField(field) {
  const raw = String(field || "").trim();
  if (!raw) return "";
  const s = raw.toLowerCase().replace(/[\s_-]+/g, "");
  return s;
}

function prettyTagField(field) {
  const f = normalizeTagField(field);
  if (!f) return "—";

  return f
    .toUpperCase()
    .replace(/^AI(\d+)$/, "AI-$1")
    .replace(/^DI(\d+)$/, "DI-$1")
    .replace(/^DO(\d+)$/, "DO-$1")
    .replace(/^AO(\d+)$/, "AO-$1");
}

function getBoundModel(tank, fallback = "") {
  return String(
    tank?.bindModel ||
      tank?.properties?.bindModel ||
      tank?.deviceModel ||
      tank?.properties?.deviceModel ||
      tank?.model ||
      tank?.properties?.model ||
      tank?.tag?.model ||
      tank?.properties?.tag?.model ||
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
      tank?.selectedDeviceId ||
      tank?.properties?.selectedDeviceId ||
      tank?.properties?.device_id ||
      tank?.device_id ||
      tank?.tag?.deviceId ||
      tank?.properties?.tag?.deviceId ||
      ""
  ).trim();
}

function getBoundField(tank, fallback = "") {
  const raw =
    tank?.bindField ||
    tank?.properties?.bindField ||
    tank?.selectedTag ||
    tank?.properties?.selectedTag ||
    tank?.field ||
    tank?.properties?.field ||
    tank?.tag?.field ||
    tank?.properties?.tag?.field ||
    fallback;

  return normalizeTagField(raw);
}

function getDeviceName(tank) {
  return String(
    tank?.deviceName ||
      tank?.properties?.deviceName ||
      tank?.selectedDeviceName ||
      tank?.properties?.selectedDeviceName ||
      tank?.title ||
      tank?.properties?.title ||
      tank?.label ||
      tank?.properties?.label ||
      tank?.name ||
      tank?.properties?.name ||
      ""
  ).trim();
}

function getTelemetryRow(telemetryMap, model, deviceId) {
  if (!deviceId) return null;

  const m = String(model || "").trim();
  const id = String(deviceId || "").trim();
  if (!id) return null;

  if (m && telemetryMap?.[m]?.[id]) return telemetryMap[m][id];
  if (telemetryMap?.[id]) return telemetryMap[id];

  for (const mk of Object.keys(telemetryMap || {})) {
    if (telemetryMap?.[mk]?.[id]) return telemetryMap[mk][id];
  }

  return null;
}

function getTelemetryStatus(row) {
  const raw =
    row?.status ??
    row?.deviceStatus ??
    row?.telemetryStatus ??
    row?.onlineStatus ??
    row?.connectionStatus ??
    row?.state ??
    row?.online ??
    "";

  const s = String(raw || "").trim().toLowerCase();

  if (
    s === "offline" ||
    s === "false" ||
    s === "0" ||
    s === "down" ||
    s === "disconnected" ||
    s === "not_running" ||
    s === "not running"
  ) {
    return "offline";
  }

  if (s === "online" || s === "true" || s === "1" || s === "up") {
    return "online";
  }

  return s;
}

function getTelemetryValue(row, field) {
  if (!row || !field) return null;

  const f = normalizeTagField(field);
  if (!f) return null;

  const direct = [
    f,
    f.toLowerCase(),
    f.toUpperCase(),
    f.replace(/(\D+)(\d+)/, "$1_$2"),
    f.replace(/(\D+)(\d+)/, "$1-$2"),
  ];

  for (const key of direct) {
    if (row[key] !== undefined) return row[key];
  }

  if (/^di\d+$/.test(f)) {
    const n = f.replace("di", "");
    const extra = [
      `in${n}`,
      `IN${n}`,
      `in_${n}`,
      `IN_${n}`,
      `in-${n}`,
      `IN-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^do\d+$/.test(f)) {
    const n = f.replace("do", "");
    const extra = [
      `out${n}`,
      `OUT${n}`,
      `out_${n}`,
      `OUT_${n}`,
      `out-${n}`,
      `OUT-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^ai\d+$/.test(f)) {
    const n = f.replace("ai", "");
    const extra = [
      `a${n}`,
      `A${n}`,
      `analog${n}`,
      `ANALOG${n}`,
      `ai_${n}`,
      `AI_${n}`,
      `ai-${n}`,
      `AI-${n}`,
    ];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  if (/^ao\d+$/.test(f)) {
    const n = f.replace("ao", "");
    const extra = [`ao_${n}`, `AO_${n}`, `ao-${n}`, `AO-${n}`];
    for (const key of extra) {
      if (row[key] !== undefined) return row[key];
    }
  }

  return null;
}

function formatOverlayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}

function normalizeAccessLevel(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/\+/g, "_")
    .replace(/-/g, "_");

  if (
    v === "read_control" ||
    v === "readandcontrol" ||
    v === "read_and_control"
  ) {
    return "read_control";
  }

  return "read_only";
}

function canTenantControl({
  isPublicLaunch,
  isTenantAuthenticated,
  tenantAccessLevel,
}) {
  if (!isPublicLaunch) return true;
  if (!isTenantAuthenticated) return false;
  return normalizeAccessLevel(tenantAccessLevel) === "read_control";
}

function DashboardIdsOverlayBadge({
  visible,
  deviceId,
  deviceStatus,
  field,
  value,
}) {
  if (!visible) return null;
  if (!deviceId && !field) return null;

  const statusText = String(deviceStatus || "OFFLINE");
  const tagText = prettyTagField(field);

  return (
    <div
      style={{
        position: "absolute",
        left: 4,
        top: 4,
        background: "#000",
        color: "#fff",
        borderRadius: 6,
        padding: "7px 9px",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1.28,
        whiteSpace: "pre-line",
        pointerEvents: "none",
        zIndex: 999999,
        boxShadow: "0 6px 16px rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      <div>{deviceId}</div>
      <div>{statusText}</div>
      <div>{tagText}</div>
      <div>{`Value=${formatOverlayValue(value)}`}</div>
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
  isPublicLaunch = false,
  isTenantAuthenticated = false,
  tenantEmail = "",
  tenantAccessLevel = "read_only",
}) {
  const resolvedDashboardName = String(dashboardName || "").trim();

  const tenantCanControl = React.useMemo(
    () =>
      canTenantControl({
        isPublicLaunch,
        isTenantAuthenticated,
        tenantAccessLevel,
      }),
    [isPublicLaunch, isTenantAuthenticated, tenantAccessLevel]
  );

  const shouldShowIdsOverlay = React.useCallback(
    (tank, fallbackField = "") => {
      if (!showDashboardIdsDetails) return false;

      const deviceId = getBoundDeviceId(tank);
      const field = getBoundField(tank, fallbackField);
      const deviceName = getDeviceName(tank);

      return Boolean(deviceId || field || deviceName);
    },
    [showDashboardIdsDetails]
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
          visible={showDashboardIdsDetails}
          deviceId={deviceId}
          deviceStatus={getTelemetryStatus(row) || "offline"}
          field={field}
          value={getTelemetryValue(row, field)}
        />
      );
    },
    [shouldShowIdsOverlay, telemetryMap, showDashboardIdsDetails]
  );

  const wrapWithOverlay = React.useCallback(
    (tank, child, fallbackField = "") => (
      <div style={{ position: "relative", overflow: "visible" }}>
        {renderTelemetryOverlay(tank, fallbackField)}
        {child}
      </div>
    ),
    [renderTelemetryOverlay]
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
            {wrapWithOverlay(tank, <DraggableDisplayBox tank={tank} />)}
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
            {wrapWithOverlay(
              tank,
              <DisplayOutputTextBoxStyle
                tank={tank}
                isPlay={isPlay}
                onUpdate={commonProps.onUpdate}
              />
            )}
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

        const backendStatus = getTelemetryStatus(row);
        const hasBinding = !!deviceId && !!field;
        const deviceIsOffline =
          isPlay && hasBinding && backendStatus === "offline";
        const deviceIsOnline = backendStatus
          ? backendStatus === "online"
          : true;

        return (
          <DraggableDroppedTank
            {...commonProps}
            onDoubleClick={() => {
              if (!isPlay) onOpenGaugeDisplaySettings?.(tank);
            }}
          >
            {wrapWithOverlay(
              tank,
              <div
                style={{
                  position: "relative",
                  width: w,
                  height: h,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GaugeDisplay
                  value={Number.isFinite(numericValue) ? numericValue : 0}
                  width={w}
                  height={h}
                  isPlay={isPlay}
                  telemetryMap={telemetryMap}
                  deviceStatus={backendStatus}
                  deviceIsOffline={deviceIsOffline}
                  deviceIsOnline={deviceIsOnline}
                  settings={{
                    ...tank,
                    ...(tank.properties || {}),
                  }}
                />

                {deviceIsOffline && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: 18,
                      transform: "translateX(-50%)",
                      color: "#dc2626",
                      fontWeight: 700,
                      fontSize: 13,
                      lineHeight: 1,
                      textAlign: "center",
                      pointerEvents: "none",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                      zIndex: 20,
                    }}
                  >
                    Offline
                  </div>
                )}
              </div>,
              "ai1"
            )}
          </DraggableDroppedTank>
        );
      }

      if (tank.shape === "graphicDisplay") {
        const resolvedDash = resolveDashboardId({
          activeDashboardId,
          dashboardId,
          selectedTank,
          droppedTanks,
        });

        return (
          <div
            key={tank.id}
            style={{ position: "relative", overflow: "visible" }}
          >
            {renderTelemetryOverlay(tank)}
            <DraggableGraphicDisplay
              tank={tank}
              telemetryMap={telemetryMap}
              selected={isSelected && !isPlay}
              selectedIds={selectedIds}
              dragDelta={dragDelta}
              dashboardMode={dashboardMode}
              dashboardId={resolvedDash}
              onSelect={handleObjectSelect}
              onUpdate={commonProps.onUpdate}
              onRightClick={(e) => handleRightClick?.(e, tank)}
              onOpenSettings={() => {
                if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
              }}
              onDoubleClick={() => {
                if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
              }}
              tenantEmail={tenantEmail}
              tenantAccessLevel={tenantAccessLevel}
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
            {wrapWithOverlay(
              tank,
              <ToggleSwitchControl
                isOn={isOn}
                width={w}
                height={h}
                isLaunched={isPlay}
                visualOnly={isPlay && !tenantCanControl}
                widget={tank}
                onSaveWidget={commonProps.onUpdate}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
                onSaveProject={onSaveProject}
                tenantEmail={tenantEmail}
                tenantAccessLevel={tenantAccessLevel}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <PushButtonControl
                variant="NO"
                width={w}
                height={h}
                pressed={pressed}
                title={tank?.properties?.title || ""}
                isLaunched={isPlay}
                visualOnly={isPlay && !tenantCanControl}
                widget={tank}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
                tenantEmail={tenantEmail}
                tenantAccessLevel={tenantAccessLevel}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <PushButtonControl
                variant="NC"
                width={w}
                height={h}
                pressed={pressed}
                title={tank?.properties?.title || ""}
                isLaunched={isPlay}
                visualOnly={isPlay && !tenantCanControl}
                widget={tank}
                dashboardId={resolvedDash}
                dashboardName={resolvedDashboardName}
                tenantEmail={tenantEmail}
                tenantAccessLevel={tenantAccessLevel}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <div className="flex flex-col items-center">
                <DraggableStandardTank
                  tank={tank}
                  isPlay={isPlay}
                  telemetryMap={telemetryMap}
                />
              </div>
            )}
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
            {wrapWithOverlay(
              tank,
              <div className="flex flex-col items-center">
                <DraggableHorizontalTank
                  tank={tank}
                  onChange={(nextTank) => commonProps.onUpdate?.(nextTank)}
                  isPlay={isPlay}
                  telemetryMap={telemetryMap}
                />
              </div>
            )}
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
            {wrapWithOverlay(
              tank,
              <div className="flex flex-col items-center">
                <DraggableVerticalTank
                  tank={tank}
                  isPlay={isPlay}
                  telemetryMap={telemetryMap}
                />
              </div>
            )}
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
            {wrapWithOverlay(
              tank,
              <div className="flex flex-col items-center">
                <DraggableSiloTank
                  tank={tank}
                  isPlay={isPlay}
                  telemetryMap={telemetryMap}
                />
              </div>
            )}
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
            {wrapWithOverlay(
              tank,
              <DraggableLedCircle
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <DraggableStatusTextBox
                tank={tank}
                isPlay={isPlay}
                dashboardMode={dashboardMode}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <DraggableBlinkingAlarm
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <DraggableStateImage
                tank={tank}
                isPlay={isPlay}
                telemetryMap={telemetryMap}
                sensorsData={sensorsData}
              />
            )}
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
            {wrapWithOverlay(
              tank,
              <DraggableCounterInput
                variant="canvas"
                label="Counter"
                tank={tank}
                id={tank.id}
                dashboardId={resolvedDash}
                dashboardMode={dashboardMode}
                onReset={async (widgetId) => {
                  if (!isPlay) return;
                  if (!tenantCanControl) {
                    alert("This tenant has read-only access.");
                    return;
                  }

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
            )}
          </DraggableDroppedTank>
        );
      }

      return null;
    });
}