// DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";

import DraggableTank from "./DraggableTank";
import DraggableDroppedTank from "./DraggableDroppedTank";
import DraggableTextBox from "./DraggableTextBox";
import DraggableImage from "./DraggableImage";
import DraggableDisplayBox from "./DraggableDisplayBox";

// ✅ NEW: Toggle switch visual
import ToggleSwitchControl from "./controls/ToggleSwitchControl";

import {
  StandardTank,
  HorizontalTank,
  VerticalTank,
  SiloTank,
} from "./ProTankIcon";

export default function DashboardCanvas({
  dashboardMode,          // ⭐ NEW — PLAY/EDIT
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
  onOpenDisplaySettings
}) {

  const isPlay = dashboardMode === "play";   // ⭐ BLOCKS INTERACTION

  return (
    <DndContext 
      sensors={isPlay ? [] : sensors}      // ❌ no dragging sensors in play mode
      onDragMove={isPlay ? undefined : handleDragMove}
      onDragEnd={isPlay ? undefined : handleDragEnd}
    >
      <div
        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg bg-white"
        style={{ position: "relative", overflow: "hidden" }}

        // ❌ No dropping new items in play mode
        onDragOver={(e) => !isPlay && e.preventDefault()}
        onDrop={(e) => !isPlay && handleDrop(e)}

        // ❌ No selection box in play mode
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
              selected: isSelected && !isPlay,  // ❌ no selection highlight
              selectedIds,
              dragDelta,
              disableDrag: isPlay,              // ⭐ NEW — disable movement
              disableSelect: isPlay,            // ⭐ NEW — disable selection
              disableSettings: isPlay,          // ⭐ NEW — block double click
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

            // DISPLAY BOX
            if (tank.shape === "displayBox") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenDisplaySettings(tank);
                  }}
                >
                  <DraggableDisplayBox tank={tank} />
                </DraggableDroppedTank>
              );
            }

            // ✅ TOGGLE SWITCH CONTROL (visual only)
            // Supports both names to avoid breaking your drop handler:
            // - "toggleSwitch" (recommended new shape)
            // - "toggleControl" (if your handler uses ctrl.type directly)
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

            // SILO TANK
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

            // TEXT BOXES
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

        {/* ❌ NO SELECTION BOX IN PLAY */}
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

        {/* ❌ NO ALIGNMENT LINES IN PLAY */}
        {!isPlay && guides &&
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
