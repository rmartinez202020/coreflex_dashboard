// DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";

import DraggableTank from "./DraggableTank";
import DraggableDroppedTank from "./DraggableDroppedTank";
import DraggableTextBox from "./DraggableTextBox";
import DraggableImage from "./DraggableImage";
import DraggableDisplayBox from "./DraggableDisplayBox";

// ✅ NEW
import DraggableGraphicDisplay from "./DraggableGraphicDisplay";

// ✅ Toggle switch visual
import ToggleSwitchControl from "./controls/ToggleSwitchControl";

// ✅ Push button visual
import PushButtonControl from "./controls/PushButtonControl";

// ✅ Interlock visual
import InterlockControl from "./controls/InterlockControl";

import {
  StandardTank,
  HorizontalTank,
  VerticalTank,
  SiloTank,
} from "./ProTankIcon";

/* =========================================================
   ✅ Display Output visual (professional, different from Input)
   - Blue "OUT" button style (similar quality to NO/NC button)
   - This is only a visual; later we’ll bind it to device outputs.
========================================================= */
function DisplayOutputControl({ width = 110, height = 110, value = "OFF" }) {
  const size = Math.min(width, height);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        position: "relative",
        background:
          "radial-gradient(circle at 30% 30%, #93c5fd 0%, #2563eb 35%, #0b2a6b 100%)",
        boxShadow:
          "0 10px 22px rgba(0,0,0,0.28), inset 0 0 14px rgba(255,255,255,0.18)",
        border: "3px solid rgba(255,255,255,0.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
    >
      {/* Inner ring */}
      <div
        style={{
          position: "absolute",
          inset: Math.max(6, Math.round(size * 0.075)),
          borderRadius: 999,
          border: "2px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.35)",
        }}
      />

      {/* OUT label */}
      <div
        style={{
          zIndex: 2,
          color: "white",
          fontWeight: 900,
          fontSize: Math.max(14, Math.round(size * 0.18)),
          letterSpacing: 1.5,
          textShadow: "0 2px 8px rgba(0,0,0,0.55)",
          fontFamily: "system-ui, Arial",
        }}
      >
        OUT
      </div>

      {/* Small top-left state value (OFF/ON/123) */}
      <div
        style={{
          position: "absolute",
          top: Math.max(8, Math.round(size * 0.09)),
          left: Math.max(10, Math.round(size * 0.11)),
          fontSize: Math.max(10, Math.round(size * 0.10)),
          fontWeight: 900,
          color: "rgba(255,255,255,0.88)",
          textShadow: "0 2px 6px rgba(0,0,0,0.45)",
        }}
      >
        {value}
      </div>

      {/* Indicator dot */}
      <div
        style={{
          position: "absolute",
          bottom: Math.max(10, Math.round(size * 0.11)),
          right: Math.max(12, Math.round(size * 0.13)),
          width: Math.max(6, Math.round(size * 0.07)),
          height: Math.max(6, Math.round(size * 0.07)),
          borderRadius: 999,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 0 10px rgba(255,255,255,0.45)",
        }}
      />
    </div>
  );
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
}) {
  const isPlay = dashboardMode === "play";

  return (
    <DndContext
      sensors={isPlay ? [] : sensors}
      onDragMove={isPlay ? undefined : handleDragMove}
      onDragEnd={isPlay ? undefined : handleDragEnd}
    >
      <div
        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ position: "relative", overflow: "hidden" }}
        onDragOver={(e) => !isPlay && e.preventDefault()}
        onDrop={(e) => !isPlay && handleDrop(e)}
        onMouseDown={(e) => !isPlay && handleCanvasMouseDown(e)}
        onMouseMove={(e) => !isPlay && handleCanvasMouseMove(e)}
        onMouseUp={(e) => !isPlay && handleCanvasMouseUp(e)}
      >
        {droppedTanks
          .slice()
          .sort((a, b) => getLayerScore(a) - getLayerScore(b))
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
              onRightClick: handleRightClick,
              onUpdate: (updated) =>
                setDroppedTanks((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                ),
            };

            // IMAGE
            if (tank.shape === "img") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <DraggableImage src={tank.src} scale={tank.scale} />
                </DraggableDroppedTank>
              );
            }

            // DISPLAY BOX (INPUT)
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

            // ✅ DISPLAY OUTPUT (DEVICE OUTPUT)
            if (
              tank.shape === "displayOutput" ||
              tank.shape === "displayOutputControl"
            ) {
              const w = tank.w ?? tank.width ?? 110;
              const h = tank.h ?? tank.height ?? 110;
              const value = tank.value ?? "OFF";

              return (
                <DraggableDroppedTank {...commonProps}>
                  <DisplayOutputControl width={w} height={h} value={value} />
                </DraggableDroppedTank>
              );
            }

            // ✅ GRAPHIC DISPLAY (uses its own draggable + resize)
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
                  onDoubleClick={() => {
                    if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
                  }}
                />
              );
            }

            // INTERLOCK
            if (tank.shape === "interlock" || tank.shape === "interlockControl") {
              const w = tank.w ?? tank.width ?? 190;
              const h = tank.h ?? tank.height ?? 80;
              const locked = tank.locked ?? true;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <InterlockControl locked={locked} width={w} height={h} />
                </DraggableDroppedTank>
              );
            }

            // TOGGLE
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

            // PUSH BUTTON NO
            if (tank.shape === "pushButtonNO") {
              const w = tank.w ?? tank.width ?? 110;
              const h = tank.h ?? tank.height ?? 110;
              const pressed = !!tank.pressed;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <PushButtonControl
                    variant="NO"
                    width={w}
                    height={h}
                    pressed={pressed}
                  />
                </DraggableDroppedTank>
              );
            }

            // PUSH BUTTON NC
            if (tank.shape === "pushButtonNC") {
              const w = tank.w ?? tank.width ?? 110;
              const h = tank.h ?? tank.height ?? 110;
              const pressed = !!tank.pressed;

              return (
                <DraggableDroppedTank {...commonProps}>
                  <PushButtonControl
                    variant="NC"
                    width={w}
                    height={h}
                    pressed={pressed}
                  />
                </DraggableDroppedTank>
              );
            }

            // STANDARD TANK
            if (tank.shape === "standardTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <StandardTank level={0} />
                </DraggableDroppedTank>
              );
            }

            // HORIZONTAL TANK
            if (tank.shape === "horizontalTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <HorizontalTank level={0} />
                </DraggableDroppedTank>
              );
            }

            // VERTICAL TANK
            if (tank.shape === "verticalTank") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <VerticalTank level={0} />
                </DraggableDroppedTank>
              );
            }

            // SILO
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

            // TEXT BOX
            if (tank.shape === "textBox") {
              return (
                <DraggableTextBox
                  {...commonProps}
                  disableDrag={isPlay}
                  disableEdit={isPlay}
                />
              );
            }

            return null;
          })}

        {/* Selection box */}
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

        {/* Alignment guides */}
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
