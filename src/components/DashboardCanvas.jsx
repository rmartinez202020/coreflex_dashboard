// src/components/DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";
import AlarmLogWindow from "./AlarmLogWindow";

import DraggableDroppedTank from "./DraggableDroppedTank";
import DraggableTextBox from "./DraggableTextBox";
import DraggableImage from "./DraggableImage";
import DraggableDisplayBox from "./DraggableDisplayBox";

// ✅ NEW
import DraggableGraphicDisplay from "./DraggableGraphicDisplay";

// ✅ NEW: Alarm Log widget (minimized icon)
import DraggableAlarmLog from "./DraggableAlarmLog";

// ✅ Toggle switch visual
import ToggleSwitchControl from "./controls/ToggleSwitchControl";

// ✅ Push button visual
import PushButtonControl from "./controls/PushButtonControl";

import {
  StandardTank,
  HorizontalTank,
  VerticalTank,
  SiloTank,
} from "./ProTankIcon";

import {
  DraggableLedCircle,
  DraggableStatusTextBox,
  DraggableBlinkingAlarm,
  DraggableStateImage,
  DraggableCounterInput,
} from "./indicators";

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

// ===============================
// ✅ ALARM LOG RESIZE HANDLES (ONLY ONE VERSION)
// - INSIDE the box, thicker, always on top
// ✅ NEW: clamps resize so it cannot exceed canvas bounds
// ===============================
function AlarmLogResizeEdges({ tank, onUpdate, minW = 520, minH = 240 }) {
  const dragRef = React.useRef(null);

  const getCanvasWH = () => {
    const el = document.getElementById("coreflex-canvas-root");
    if (!el) return { w: null, h: null };
    return { w: el.clientWidth, h: el.clientHeight };
  };

  const startDrag = (mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const startW = tank.w ?? tank.width ?? 780;
    const startH = tank.h ?? tank.height ?? 360;

    dragRef.current = { mode, startX, startY, startW, startH };

    const onMove = (ev) => {
      const cur = dragRef.current;
      if (!cur) return;

      const dx = ev.clientX - cur.startX;
      const dy = ev.clientY - cur.startY;

      let nextW = cur.startW;
      let nextH = cur.startH;

      if (cur.mode === "right") nextW = Math.max(minW, cur.startW + dx);
      if (cur.mode === "bottom") nextH = Math.max(minH, cur.startH + dy);
      if (cur.mode === "corner") {
        nextW = Math.max(minW, cur.startW + dx);
        nextH = Math.max(minH, cur.startH + dy);
      }

      // ✅ Clamp to canvas bounds (so resize cannot exceed dashboard area)
      const { w: canvasW, h: canvasH } = getCanvasWH();
      const objX = tank.x ?? 0;
      const objY = tank.y ?? 0;

      if (canvasW != null) {
        const maxW = Math.max(minW, canvasW - objX);
        nextW = Math.min(nextW, maxW);
      }

      if (canvasH != null) {
        const maxH = Math.max(minH, canvasH - objY);
        nextH = Math.min(nextH, maxH);
      }

      onUpdate?.({ ...tank, w: nextW, h: nextH });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const EDGE = 14;
  const CORNER = 18;

  return (
    <>
      {/* RIGHT EDGE */}
      <div
        onPointerDown={startDrag("right")}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: EDGE,
          height: "100%",
          cursor: "ew-resize",
          zIndex: 1000000,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />

      {/* BOTTOM EDGE */}
      <div
        onPointerDown={startDrag("bottom")}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: EDGE,
          cursor: "ns-resize",
          zIndex: 1000000,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />

      {/* CORNER */}
      <div
        onPointerDown={startDrag("corner")}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: CORNER,
          height: CORNER,
          cursor: "nwse-resize",
          zIndex: 1000001,
          pointerEvents: "auto",
          background: "transparent",
        }}
      />
    </>
  );
}

// ✅ Green "PushButton NO" style SET button (always visible)
function SetButton({ isPlay, onSet }) {
  const [pressed, setPressed] = React.useState(false);

  const baseBg = "#22c55e";
  const darkBg = "#16a34a";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.stopPropagation();
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
        if (!isPlay) return;
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
        background: isPlay ? (pressed ? darkBg : baseBg) : "#cbd5e1",
        color: isPlay ? "white" : "#334155",
        boxShadow: isPlay
          ? pressed
            ? "inset 0 3px 10px rgba(0,0,0,0.35)"
            : "0 3px 0 rgba(0,0,0,0.35)"
          : "none",
        transform: isPlay
          ? pressed
            ? "translateY(1px)"
            : "translateY(0)"
          : "none",
        transition:
          "transform 80ms ease, box-shadow 80ms ease, background 120ms ease",
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

  React.useEffect(() => {
    if (!editing) setDraft(onlyDigits(rawValue));
  }, [rawValue, editing]);

  const displayed = isPlay
    ? editing
      ? draft
      : padToFormat(rawValue, numberFormat)
    : padToFormat(rawValue, numberFormat);

  const commitFormattedValue = () => {
    const formatted = padToFormat(draft, numberFormat);
    onUpdate?.({ ...tank, value: formatted });
    return formatted;
  };

  const handleSet = () => {
    if (!isPlay) return;

    const formatted = commitFormattedValue();
    const now = new Date().toISOString();

    onUpdate?.({
      ...tank,
      value: formatted,
      lastSetValue: formatted,
      lastSetAt: now,
    });

    window.dispatchEvent(
      new CustomEvent("coreflex-displayOutput-set", {
        detail: { id: tank.id, value: formatted, label, numberFormat, at: now },
      })
    );
  };

  const setBtnH = 26;

  return (
    <div style={{ width: w, userSelect: "none" }}>
      {label ? (
        <div
          style={{
            marginBottom: 6,
            fontSize: 18,
            fontWeight: 900,
            color: "#111",
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
      ) : null}

      <div
        style={{
          width: w,
          height: h,
          background: "white",
          border: "2px solid black",
          borderRadius: 0,
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: setBtnH,
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
                if (e.key === "Enter") e.currentTarget.blur();
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

  // ✅ NEW
  onOpenAlarmLog,
  onLaunchAlarmLog,

  // ✅ NEW: indicator settings
  onOpenIndicatorSettings,
  onOpenStatusTextSettings,
  onOpenBlinkingAlarmSettings,
  onOpenStateImageSettings,
}) {
  const isPlay = dashboardMode === "play";

  // ✅ COUNTER INPUT — increment on DI rising edge (0 -> 1)
React.useEffect(() => {
  if (!isPlay) return;

  const readRowField = (row, field) => {
    if (!row || !field) return undefined;
    if (row[field] !== undefined) return row[field];
    const up = String(field).toUpperCase();
    if (row[up] !== undefined) return row[up];

    // legacy DI mapping: di1..di6 -> in1..in6
    if (/^di[1-6]$/i.test(field)) {
      const n = String(field).toLowerCase().replace("di", "");
      const alt = `in${n}`;
      if (row[alt] !== undefined) return row[alt];
      const altUp = alt.toUpperCase();
      if (row[altUp] !== undefined) return row[altUp];
    }
    return undefined;
  };

  const to01 = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "number") return v > 0 ? 1 : 0;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "1" || s === "true" || s === "on" || s === "yes") return 1;
      if (s === "0" || s === "false" || s === "off" || s === "no") return 0;
      const n = Number(s);
      if (!Number.isNaN(n)) return n > 0 ? 1 : 0;
    }
    return v ? 1 : 0;
  };

  const timer = setInterval(() => {
    if (document.hidden) return;

    setDroppedTanks((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;

      let changed = false;

      const next = prev.map((obj) => {
        if (obj.shape !== "counterInput") return obj;

        const deviceId = String(obj?.properties?.tag?.deviceId || "").trim();
        const field = String(obj?.properties?.tag?.field || "").trim();
        if (!deviceId || !field) return obj;

        const rows = Array.isArray(sensorsData) ? sensorsData : [];
        const row =
          rows.find((r) => String(r.deviceId ?? r.device_id ?? "").trim() === deviceId) || null;

        if (!row) return obj;

        const cur01 = to01(readRowField(row, field));
        if (cur01 === null) return obj;

        const prev01 = Number(obj?.properties?._prev01 ?? 0);

        // rising edge -> increment
        if (prev01 === 0 && cur01 === 1) {
          changed = true;
          const oldCount = Number(obj?.properties?.count ?? 0) || 0;

          return {
            ...obj,
            properties: {
              ...(obj.properties || {}),
              count: oldCount + 1,
              _prev01: 1,
            },
          };
        }

        // falling edge -> arm for next pulse
        if (prev01 === 1 && cur01 === 0) {
          changed = true;
          return {
            ...obj,
            properties: {
              ...(obj.properties || {}),
              _prev01: 0,
            },
          };
        }

        return obj;
      });

      return changed ? next : prev;
    });
  }, 200); // fast enough to catch pulses

  return () => clearInterval(timer);
}, [isPlay, sensorsData, setDroppedTanks]);


  // =====================================================
  // ✅ Z-ORDER HELPERS (Option A) — STABLE + NO CRASH
  // - Defines getTankZ (fixes your crash)
  // - Works with BOTH fields: z (new) + zIndex (legacy)
  // - No negative z; send-to-back will not "disappear"
  // - Keeps items unique + contiguous layering
  // =====================================================

  // ✅ Source of truth for z (new + legacy)
  const getTankZ = React.useCallback((t) => {
    return Number(t?.z ?? t?.zIndex ?? 0) || 0;
  }, []);

  // ✅ Normalize list: ensure every item has z & zIndex >= 1
  const normalizeZ = React.useCallback(
    (list) => {
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
    },
    []
  );

  // ✅ Auto-normalize once whenever we see missing z/zIndex
  React.useEffect(() => {
    if (!Array.isArray(droppedTanks) || droppedTanks.length === 0) return;

    const missing = droppedTanks.some((t) => t?.z == null || t?.zIndex == null);
    if (!missing) return;

    setDroppedTanks((prev) => normalizeZ(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZ]);

  // ✅ Stable bring front/back (reorders by shifting neighbors)
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

  // ✅ Bind to context menu actions if your menu calls these
  // (If your menu uses different callback names, keep these in scope.)
  React.useEffect(() => {
    // no-op; just here to avoid eslint "unused" if you haven’t wired them yet
    void bringToFront;
    void sendToBack;
  }, [bringToFront, sendToBack]);

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
    if (isPlay) return;          // ✅ no menu in play mode
    e.preventDefault();          // ✅ stop browser menu
    e.stopPropagation();         // ✅ don’t bubble
    handleRightClick?.(e, null); // ✅ RIGHT-CLICK ON EMPTY DASHBOARD
  }}

        onMouseDown={(e) => !isPlay && handleCanvasMouseDown(e)}
        onMouseMove={(e) => !isPlay && handleCanvasMouseMove(e)}
        onMouseUp={(e) => !isPlay && handleCanvasMouseUp(e)}
      >
        {droppedTanks
          .slice()
          // ✅ sort using helper (supports old + new)
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

              // ✅ Right-click: pass event + object (useContextMenu supports this)
              onRightClick: (e) => handleRightClick?.(e, tank),

              onUpdate: (updated) =>
                setDroppedTanks((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                ),
            };

            // ✅ MINIMIZED ALARM LOG
            if (tank.shape === "alarmLog" && tank.minimized) {
              return (
                <DraggableAlarmLog
                  key={tank.id}
                  obj={tank}
                  selected={isSelected && !isPlay}
                  onSelect={() => handleSelect(tank.id)}
                  onOpen={() =>
                    commonProps.onUpdate?.({ ...tank, minimized: false })
                  }
                  onLaunch={() => onLaunchAlarmLog?.(tank)}
                />
              );
            }

            // IMAGE
            if (tank.shape === "img") {
              return (
                <DraggableDroppedTank {...commonProps}>
                  <DraggableImage src={tank.src} scale={tank.scale} />
                </DraggableDroppedTank>
              );
            }

            // DISPLAY INPUT
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

            // DISPLAY OUTPUT
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
  onRightClick={(e) => handleRightClick?.(e, tank)}
  onDoubleClick={() => {
    if (!isPlay) onOpenGraphicDisplaySettings?.(tank);
  }}
/>

              );
            }

            // ✅ ALARM LOG (FULL WINDOW + RESIZE)
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
                        setDroppedTanks((prev) =>
                          prev.filter((t) => t.id !== tank.id)
                        )
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
                  dashboardMode={dashboardMode}
                  onRightClick={(e) => handleRightClick?.(e, tank)}
                />
              );
            }

           // LED CIRCLE
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


            // STATUS TEXT
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

            // BLINKING ALARM
            if (tank.shape === "blinkingAlarm") {
              return (
                <DraggableDroppedTank
                  {...commonProps}
                  onDoubleClick={() => {
                    if (!isPlay) onOpenBlinkingAlarmSettings?.(tank);
                  }}
                >
                  <DraggableBlinkingAlarm
                    tank={tank}
                    sensorsData={sensorsData}
                  />
                </DraggableDroppedTank>
              );
            }

            // STATE IMAGE
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

 // ✅ COUNTER INPUT (DI) — title + digits + reset
if (tank.shape === "counterInput") {
  const w = tank.w ?? tank.width ?? 160;
  const h = tank.h ?? tank.height ?? 130;

  const title = String(tank?.properties?.title ?? "Counter");
  const digits = Math.max(1, Math.min(10, Number(tank?.properties?.digits ?? 4)));
  const count = Math.max(0, Number(tank?.properties?.count ?? 0) || 0);

  const display = String(count).padStart(digits, "0");

  return (
    <DraggableDroppedTank
      {...commonProps}
      onDoubleClick={() => {
        // later we’ll open the settings modal here
        // if (!isPlay) onOpenCounterInputSettings?.(tank);
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 12,
          border: isSelected && !isPlay ? "2px solid #2563eb" : "1px solid #cbd5e1",
          background: "#f8fafc",
          boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
          overflow: "hidden",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div
          style={{
            padding: "8px 10px",
            fontWeight: 900,
            fontSize: 14,
            color: "#0f172a",
            textAlign: "center",
            background: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {title}
        </div>

        {/* Digits */}
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <div
            style={{
              width: "82%",
              height: 38,
              borderRadius: 8,
              border: "2px solid #8f8f8f",
              background: "#f2f2f2",
              boxShadow: "inset 0 0 6px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: 2,
              color: "#111",
            }}
          >
            {display}
          </div>
        </div>

        {/* Reset */}
        <button
          type="button"
          disabled={!isPlay}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPlay) return;

            // ✅ reset counter
            commonProps.onUpdate?.({
              ...tank,
              properties: {
                ...(tank.properties || {}),
                count: 0,
                _prev01: 0,
              },
            });
          }}
          style={{
            height: 36,
            borderTop: "1px solid #e5e7eb",
            background: isPlay ? "#ef4444" : "#cbd5e1",
            color: "white",
            fontWeight: 900,
            cursor: isPlay ? "pointer" : "not-allowed",
            opacity: isPlay ? 1 : 0.75,
          }}
          title={isPlay ? "Reset counter" : "Reset works only in Play mode"}
        >
          Reset
        </button>
      </div>
    </DraggableDroppedTank>
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
