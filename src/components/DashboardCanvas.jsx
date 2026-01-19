// DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";

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

// ===============================
// ✅ helpers for Display Output input formatting
// ===============================
function getFormatSpec(numberFormat) {
  const fmt = String(numberFormat || "00000");
  const digits = (fmt.match(/0/g) || []).length;
  return { maxDigits: Math.max(1, digits), fmt };
}

function onlyDigits(str) {
  return String(str || "").replace(/\D/g, "");
}

function padToFormat(rawDigits, numberFormat) {
  const { maxDigits } = getFormatSpec(numberFormat);
  const d = onlyDigits(rawDigits).slice(0, maxDigits);

  // ✅ if nothing typed, show blank (not zeros)
  if (!d) return "";

  return d.padStart(maxDigits, "0");
}

// ✅ Green "PushButton NO" style SET button (always visible)
// - In EDIT: looks the same but does nothing (disabled behavior)
// - In PLAY: clickable + press animation
function SetButton({ isPlay, onSet }) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg = "#22c55e"; // green
  const darkBg = "#16a34a"; // darker green

  return (
    <button
      type="button"
      // ✅ don't let canvas/drag steal click
      onMouseDown={(e) => {
        e.stopPropagation();
        // only animate/act in play
        if (!isPlay) return;
        setPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        setPressed(false);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        if (!isPlay) return;
        setPressed(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPlay) return; // ✅ do nothing in edit
        onSet?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        cursor: isPlay ? "pointer" : "default",
        userSelect: "none",
        fontWeight: 900,
        letterSpacing: 1,

        // ✅ 3D pushbutton look
        background: isPlay ? (pressed ? darkBg : baseBg) : "#cbd5e1", // grey in edit
        color: isPlay ? "white" : "#334155",
        boxShadow: isPlay
          ? pressed
            ? "inset 0 3px 10px rgba(0,0,0,0.35)"
            : "0 3px 0 rgba(0,0,0,0.35)"
          : "none",
        transform: isPlay ? (pressed ? "translateY(1px)" : "translateY(0)") : "none",
        transition: "transform 80ms ease, box-shadow 80ms ease, background 120ms ease",
      }}
      title={isPlay ? "Send/commit this setpoint" : "SET works in Play mode"}
    >
      SET
    </button>
  );
}

// ✅ DISPLAY OUTPUT (textbox style + editable in PLAY + SET always visible)
function DisplayOutputTextBoxStyle({ tank, isPlay, onUpdate }) {
  const w = tank.w ?? tank.width ?? 160;
  const h = tank.h ?? tank.height ?? 60;

  const label = tank?.properties?.label || "";
  const numberFormat = tank?.properties?.numberFormat || "00000";
  const { maxDigits } = getFormatSpec(numberFormat);

  const rawValue =
    tank.value !== undefined && tank.value !== null ? String(tank.value) : "";

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(onlyDigits(rawValue));

  // Sync draft from tank when not editing (restore/load/etc)
  React.useEffect(() => {
    if (!editing) setDraft(onlyDigits(rawValue));
  }, [rawValue, editing]);

  // In PLAY:
  // - while editing -> show draft digits (no padding)
  // - when not editing -> show padded value
  const displayed = isPlay
    ? editing
      ? draft
      : padToFormat(rawValue, numberFormat)
    : padToFormat(rawValue, numberFormat);

  const commitFormattedValue = () => {
    const formatted = padToFormat(draft, numberFormat);

    onUpdate?.({
      ...tank,
      value: formatted,
    });

    return formatted;
  };

  const handleSet = () => {
    if (!isPlay) return; // ✅ only actuate in play

    // 1) commit/pad the current draft
    const formatted = commitFormattedValue();

    // 2) store "sent" metadata
    const now = new Date().toISOString();
    onUpdate?.({
      ...tank,
      value: formatted,
      lastSetValue: formatted,
      lastSetAt: now,
    });

    // 3) fire event for future integration
    window.dispatchEvent(
      new CustomEvent("coreflex-displayOutput-set", {
        detail: {
          id: tank.id,
          value: formatted,
          label,
          numberFormat,
          at: now,
        },
      })
    );
  };

  // ✅ SET always visible (edit + play)
  const setBtnH = 26;

  return (
    <div
      style={{
        width: w,
        height: h,
        background: "white",
        border: "2px solid black",
        borderRadius: 0,
        position: "relative",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {/* ✅ label top-left */}
      {label ? (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 6,
            fontSize: 12,
            fontWeight: 700,
            color: "#111",
            lineHeight: "12px",
            background: "white",
            padding: "0 4px",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {label}
        </div>
      ) : null}

      {/* ✅ value centered */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: setBtnH, // reserve space for SET always
          paddingTop: label ? 10 : 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        {isPlay ? (
          <input
            value={displayed}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onFocus={(e) => {
              e.stopPropagation();
              setEditing(true);

              // caret to end
              requestAnimationFrame(() => {
                try {
                  const len = e.target.value.length;
                  e.target.setSelectionRange(len, len);
                } catch {}
              });
            }}
            onChange={(e) => {
              const next = onlyDigits(e.target.value).slice(0, maxDigits);
              setDraft(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            onBlur={() => {
              setEditing(false);
              commitFormattedValue();
            }}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 22,
              color: "#111",
              letterSpacing: 1.5,
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 22,
              color: "#111",
              letterSpacing: 1.5,
              lineHeight: "22px",
            }}
          >
            {displayed}
          </div>
        )}
      </div>

      {/* ✅ SET button ALWAYS visible */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: setBtnH,
          borderTop: "2px solid black",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <SetButton isPlay={isPlay} onSet={handleSet} />
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

            // DISPLAY INPUT (existing)
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

            // ✅ DISPLAY OUTPUT (textbox style + SET always visible)
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
