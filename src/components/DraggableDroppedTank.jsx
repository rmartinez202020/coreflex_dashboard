// src/components/DraggableDroppedTank.jsx
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { SCALE_MIN, SCALE_MAX } from "../config/scaleLimits";

const IMAGE_SCALE_MAX = 4.0; // ✅ images can go bigger
const IMAGE_BASE_W_DEFAULT = 120; // ✅ your desired "1:1" base width

export default function DraggableDroppedTank({
  tank,
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  onSelect,
  onDoubleClick,
  onRightClick,
  children,
  onUpdate,
  dashboardMode = "edit",
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
  });

  // ✅ FIX: Launch/Launched should behave like Play
  const isPlay =
    dashboardMode === "play" ||
    dashboardMode === "launch" ||
    dashboardMode === "launched";

  const [resizing, setResizing] = useState(false);

  const elRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      elRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const isImage = tank?.shape === "img";
  const maxForThisWidget = isImage ? IMAGE_SCALE_MAX : SCALE_MAX;

  const isToggle =
    tank?.shape === "toggleSwitch" || tank?.shape === "toggleControl";

  // ---------- Scale event listener ----------
  useEffect(() => {
    const handler = (ev) => {
      try {
        const detail = ev?.detail || {};
        const ids = Array.isArray(detail?.ids) ? detail.ids.filter(Boolean) : [];
        const scaleValueRaw = Number(detail?.scale || NaN);
        if (!Number.isFinite(scaleValueRaw)) return;

        const wid = String(tank?.id || "").trim();
        if (!wid) return;
        if (!ids.includes(wid)) return;

        // clamp the incoming scale request
        const mult = Math.min(
          maxForThisWidget,
          Math.max(SCALE_MIN, scaleValueRaw)
        );

        // ✅ KEY FIX:
        // For toggles, treat coreflex-scale as a MULTIPLIER and bake into w/h immediately.
        // This makes every apply (0.75, then 0.75 again, etc.) work repeatedly.
        if (isToggle) {
          const baseW =
            Number(tank?.w ?? tank?.width ?? tank?.measuredW ?? 180) || 180;

          // keep perfect ratio
          const ratio = 180 / 70;

          const nextW = Math.max(90, Math.round(baseW * mult));
          const nextH = Math.max(40, Math.round(nextW / ratio));

          onUpdate?.({
            ...tank,
            w: nextW,
            h: nextH,
            width: nextW,
            height: nextH,
            measuredW: nextW,
            measuredH: nextH,
            scale: 1, // ✅ baked, new base is now 1:1
          });
          return;
        }

        // default behavior for other widgets: store as scale
        const clamped = mult;
        if (Number(tank?.scale || 1) !== clamped) {
          onUpdate?.({ ...tank, scale: clamped });
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("coreflex-scale", handler);
    return () => window.removeEventListener("coreflex-scale", handler);
  }, [tank, onUpdate, maxForThisWidget, isToggle]);

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);
  };

  // ✅ IMPORTANT:
  // On resize end, "bake" the scale into the widget so it becomes the new 1:1 size.
  // - Images: bake into baseW (existing behavior)
  // - Toggles: bake into w/h + measuredW/H (so future scales use new base)
  const stopResize = useCallback(() => {
    setResizing(false);

    const currentScale = Number(tank?.scale || 1);
    if (!Number.isFinite(currentScale) || currentScale === 1) return;

    // ✅ bake toggle scale into w/h so it becomes the new 1:1 (and update measured base)
    if (isToggle) {
      const baseW = Number(tank?.w ?? tank?.width ?? 180) || 180;

      const ratio = 180 / 70;
      const nextW = Math.max(90, Math.round(baseW * currentScale));
      const nextH = Math.max(40, Math.round(nextW / ratio));

      onUpdate?.({
        ...tank,
        w: nextW,
        h: nextH,
        width: nextW,
        height: nextH,
        measuredW: nextW,
        measuredH: nextH,
        scale: 1,
      });
      return;
    }

    // ✅ Existing: bake image scale into baseW
    if (!isImage) return;

    const baseW = Number(tank?.baseW || IMAGE_BASE_W_DEFAULT);
    const nextBaseW = Math.max(20, Math.round(baseW * currentScale));

    onUpdate?.({
      ...tank,
      baseW: nextBaseW,
      scale: 1,
    });
  }, [isImage, isToggle, tank, onUpdate]);

  const handleResize = useCallback(
    (e) => {
      if (!resizing) return;

      const current = Number(tank.scale || 1);
      const rawNext = current + e.movementX * 0.01;

      const nextScale = Math.min(
        maxForThisWidget,
        Math.max(SCALE_MIN, rawNext)
      );

      onUpdate?.({ ...tank, scale: nextScale });
    },
    [resizing, tank, onUpdate, maxForThisWidget]
  );

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", stopResize);
    }
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [resizing, handleResize, stopResize]);

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const liveTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(${tank.scale || 1})`
    : `translate(${transform?.x || 0}px, ${transform?.y || 0}px) scale(${
        tank.scale || 1
      })`;

  const effectiveZ = tank.z ?? tank.zIndex ?? 1;

  const outerStyle = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    transform: liveTransform,
    transformOrigin: "top left",
    cursor: !isPlay ? (selected ? "grab" : "move") : "default",
    zIndex: effectiveZ,
  };

  const visualWrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: selected && !isPlay ? "1px solid #2563eb" : "1px solid transparent",
  };

  const isPushButton =
    tank.shape === "pushButtonNO" ||
    tank.shape === "pushButtonNC" ||
    tank.shape === "pushButtonControl";

  const isGraphicDisplay = tank.shape === "graphicDisplay";
  const isDisplayOutput = tank.shape === "displayOutput";
  const isCounterInput = tank.shape === "counterInput";

  const contentStyle = {
    display: "inline-block",
    pointerEvents: isPlay
      ? isToggle || isPushButton || isDisplayOutput || isCounterInput
        ? "auto"
        : "none"
      : isGraphicDisplay
      ? "auto"
      : "none",
  };

  const handleMouseDown = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    if (isToggle) {
      onUpdate?.({ ...tank, isOn: !(tank.isOn ?? true) });
      return;
    }

    if (isPushButton) {
      onUpdate?.({ ...tank, pressed: true });
    }
  };

  const handleMouseUp = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    if (isPushButton) {
      onUpdate?.({ ...tank, pressed: false });
    }
  };

  const dragListeners = isPlay && isDisplayOutput ? undefined : listeners;

  // ✅ Auto measure size
  // ✅ FIX: do NOT measure while corner-resizing, otherwise ResizeObserver
  // fights the scale update loop and causes flicker/shaking.
  useEffect(() => {
    if (resizing) return;

    const el = elRef.current;
    if (!el) return;

    let raf = 0;

    const writeSize = () => {
      const scale = typeof tank.scale === "number" ? tank.scale : 1;
      const r = el.getBoundingClientRect();

      const unscaledW = Math.max(1, Math.round(r.width / scale));
      const unscaledH = Math.max(1, Math.round(r.height / scale));

      const prevW = tank.measuredW ?? 0;
      const prevH = tank.measuredH ?? 0;

      if (
        Math.abs(unscaledW - prevW) >= 2 ||
        Math.abs(unscaledH - prevH) >= 2
      ) {
        onUpdate?.({
          ...tank,
          measuredW: unscaledW,
          measuredH: unscaledH,
        });
      }
    };

    raf = requestAnimationFrame(writeSize);

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(writeSize);
    });

    ro.observe(el);

    const t = setTimeout(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(writeSize);
    }, 120);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [tank.id, tank.scale, onUpdate, resizing]);

  return (
    <div
      ref={setRefs}
      className={`draggable-item ${selected && !isPlay ? "selected" : ""}`}
      data-widget-id={String(tank.id)}
      style={outerStyle}
      {...attributes}
      {...(!isPlay ? dragListeners : {})}
      onClick={(e) => {
        if (!isPlay) {
          e.stopPropagation();
          onSelect?.(tank.id, e);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isPlay) onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isPlay) onRightClick?.(e, tank);
      }}
    >
      <div style={visualWrapperStyle}>
        <div
          style={contentStyle}
          onMouseDownCapture={(e) => {
            if (!isPlay && isGraphicDisplay) e.stopPropagation();
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {children}
        </div>
      </div>

      {selected && !isPlay && (
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            background: "#2563eb",
            right: -6,
            bottom: -6,
            borderRadius: 3,
            cursor: "nwse-resize",
            border: "1px solid white",
            zIndex: 99999,
            transform: `scale(${1 / (tank.scale || 1)})`,
            transformOrigin: "bottom right",
          }}
        />
      )}
    </div>
  );
}