// src/components/DraggableDroppedTank.jsx
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { SCALE_MIN, SCALE_MAX } from "../config/scaleLimits";

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

  // ---------- Scale event listener (MULTIPLY mode supported) ----------
  useEffect(() => {
    const handler = (ev) => {
      try {
        const detail = ev?.detail || {};
        const ids = Array.isArray(detail?.ids)
          ? detail.ids.filter(Boolean)
          : [];

        const raw = Number(detail?.scale || NaN);
        if (!Number.isFinite(raw)) return;

        const mode = String(detail?.mode || "set").toLowerCase(); // "mul" | "set"

        const wid = String(tank?.id || "").trim();
        if (!wid) return;
        if (!ids.includes(wid)) return;

        const current = Number(tank?.scale ?? 1) || 1;

        // ✅ if mode=mul, scale is a multiplier factor
        const next =
          mode === "mul"
            ? current * raw
            : raw; // absolute set fallback

        const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, next));

        if (Number(tank?.scale || 1) !== clamped) {
          onUpdate?.({ ...tank, scale: clamped });
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("coreflex-scale", handler);
    return () => window.removeEventListener("coreflex-scale", handler);
  }, [tank, onUpdate]);

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);
  };

  const stopResize = useCallback(() => setResizing(false), []);

  const handleResize = useCallback(
    (e) => {
      if (!resizing) return;

      const cur = Number(tank.scale ?? 1) || 1;
      const next = cur + e.movementX * 0.01;
      const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, next));

      if (clamped === cur) return;
      onUpdate?.({ ...tank, scale: clamped });
    },
    [resizing, tank, onUpdate]
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

  const safeScale = Number(tank.scale ?? 1) || 1;

  const liveTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(${safeScale})`
    : `translate(${transform?.x || 0}px, ${transform?.y || 0}px) scale(${safeScale})`;

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

  const isToggle =
    tank.shape === "toggleSwitch" || tank.shape === "toggleControl";

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
    if (isPushButton) onUpdate?.({ ...tank, pressed: true });
  };

  const handleMouseUp = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    if (isPushButton) onUpdate?.({ ...tank, pressed: false });
  };

  const dragListeners = isPlay && isDisplayOutput ? undefined : listeners;

  // Auto measure size
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let raf = 0;

    const writeSize = () => {
      const scale = Number(tank.scale ?? 1) || 1;
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
  }, [tank.id, tank.scale, onUpdate]);

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
            transform: `scale(${1 / safeScale})`,
            transformOrigin: "bottom right",
          }}
        />
      )}
    </div>
  );
}