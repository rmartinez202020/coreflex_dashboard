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
   ✅ Display Output (square numeric box)
   - Looks like a clean industrial panel readout
   - Double-click lets you set a numeric value (edit mode only)
========================================================= */
function DisplayOutputBox({ value = "0", width = 140, height = 60 }) {
  const v =
    value === null || value === undefined || value === "" ? "0" : String(value);

  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(180deg, #ffffff 0%, #f2f2f2 100%)",
        borderRadius: 8,
        border: "2px solid #1d4ed8",
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.14), inset 0 0 10px rgba(0,0,0,0.10)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        userSelect: "none",
      }}
    >
      {/* OUT tag */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 8,
          fontSize: 10,
          fontWeight: 900,
          color: "white",
          background: "#1d4ed8",
          padding: "2px 6px",
          borderRadius: 6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          letterSpacing: 0.8,
        }}
      >
        OUT
      </div>

      {/* Value */}
      <div
        style={{
          fontFamily: "monospace",
          fontWeight: 900,
          fontSize: 24,
          color: "#0b1220",
          letterSpacing: 2,
        }}
      >
        {v}
      </div>

      {/* hint */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 8,
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(0,0,0,0.45)",
        }}
      >
        OUTPUT
      </div>
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

            // ✅ DISPLAY OUTPUT (square numeric)
            if (tank.shape === "displayOutput") {
              const w = tank.w ?? tank.width ?? 140;
              const h = tank.h ?? tank.height ?? 60;
              const value = tank.value ?? "0";

              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (isPlay) return;

                    const current = tank.value ?? "0";
                    const next = window.prompt(
                      "Set Display Output value (number):",
                      String(current)
                    );

                    if (next === null) return; // cancelled

                    const cleaned = String(next).trim();

                    // allow blank -> 0
                    const finalValue = cleaned === "" ? "0" : cleaned;

                    commonProps.onUpdate({
                      ...tank,
                      value: finalValue,
                    });
                  }}
                >
                  <DisplayOutputBox value={value} width={w} height={h} />
                </DraggableDroppedTank>
              );
            }

            // ✅ GRAPHIC DISPLAY
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
