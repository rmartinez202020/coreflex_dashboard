import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useCallback, useRef } from "react";

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

  const isPlay = dashboardMode === "play";
  const [resizing, setResizing] = useState(false);

  const elRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      elRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);
  };

  const stopResize = useCallback(() => setResizing(false), []);

  const handleResize = useCallback(
    (e) => {
      if (!resizing) return;
      const newScale = Math.max(0.15, (tank.scale || 1) + e.movementX * 0.01);
      onUpdate?.({ ...tank, scale: newScale });
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

  const liveTransform = isMultiDragging
    ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(${tank.scale || 1})`
    : `translate(${transform?.x || 0}px, ${transform?.y || 0}px) scale(${
        tank.scale || 1
      })`;

  const effectiveZ = tank.z ?? tank.zIndex ?? 1;

  // ✅ FIX: Cursor only active in EDIT mode. In play mode default cursor.
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

  // ✅ NEW: treat counterInput as interactive in play mode so its internal button can show pointer
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

  // allow dragging only when NOT in play mode (except display output special case)
  const dragListeners = isPlay && isDisplayOutput ? undefined : listeners;

  // Auto measure size
  useEffect(() => {
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
  }, [tank.id, tank.scale, onUpdate]);

  return (
    <div
      ref={setRefs}
      className="draggable-item"
      style={outerStyle}
      {...attributes}
      {...(!isPlay ? dragListeners : {})}
      onClick={(e) => {
        if (!isPlay) {
          e.stopPropagation();
          onSelect?.(tank.id);
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
