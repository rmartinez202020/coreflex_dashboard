import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect, useCallback, useRef } from "react";

export default function DraggableDroppedTank({
  tank,
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  onSelect,
  onDoubleClick,
  children,
  onUpdate,
  dashboardMode = "edit",
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tank.id,
  });

  const isPlay = dashboardMode === "play";
  const [resizing, setResizing] = useState(false);

  // ✅ measure actual rendered size (for perfect dashboard clamping)
  const elRef = useRef(null);

  // ✅ combine refs: dnd-kit ref + our measuring ref
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

  const outerStyle = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    transform: liveTransform,
    transformOrigin: "top left",
    cursor: selected ? "grab" : "pointer",
    zIndex: tank.zIndex ?? 1,
  };

  const visualWrapperStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: selected ? "1px solid #2563eb" : "1px solid transparent",
  };

  const isToggle =
    tank.shape === "toggleSwitch" || tank.shape === "toggleControl";

  const isPushButton =
    tank.shape === "pushButtonNO" ||
    tank.shape === "pushButtonNC" ||
    tank.shape === "pushButtonControl";

  const isGraphicDisplay = tank.shape === "graphicDisplay";

  // ✅ display output textbox
  const isDisplayOutput = tank.shape === "displayOutput";

  // ✅ NEW: indicators (so double-click can work + prevent DnD from eating dblclick)
  const isIndicator =
    tank.shape === "ledCircle" ||
    tank.shape === "statusTextBox" ||
    tank.shape === "blinkingAlarm" ||
    tank.shape === "stateImage";

  // ✅ IMPORTANT:
  // - In PLAY: allow pointer events for toggle + pushbuttons + displayOutput
  // - In EDIT: allow pointer events for graphic display + indicators so double-click works
  // - Otherwise: keep "none" to avoid fighting DnD
  const contentStyle = {
    display: "inline-block",
    width: "auto",
    height: "auto",
    maxWidth: "none",
    maxHeight: "none",
    pointerEvents: isPlay
      ? isToggle || isPushButton || isDisplayOutput
        ? "auto"
        : "none"
      : isGraphicDisplay || isIndicator
      ? "auto"
      : "none",
  };

  // ✅ PLAY MODE INTERACTION (Toggle + PushButtons only)
  const handleMouseDown = (e) => {
    if (!isPlay) return;
    e.stopPropagation();

    // Toggle = latching
    if (isToggle) {
      onUpdate?.({ ...tank, isOn: !(tank.isOn ?? true) });
      return;
    }

    // Push buttons
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

  // ✅ KEY FIX:
  // If it's a "typing widget" in PLAY mode, do NOT attach dnd-kit listeners,
  // otherwise pointerdown will start drag and the input won't focus reliably.
  //
  // ✅ ALSO: indicators should not attach DnD listeners in EDIT (so dblclick is reliable)
  const dragListeners =
    (isPlay && isDisplayOutput) || (!isPlay && isIndicator) ? undefined : listeners;

  // ===============================
  // ✅ AUTO-MEASURE REAL SIZE (stores measuredW/H on tank)
  // - Saves unscaled size (divide by scale) so clamp stays accurate.
  // ===============================
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let raf = 0;

    const writeSize = () => {
      // getBoundingClientRect includes current scale; normalize it out
      const scale = typeof tank.scale === "number" ? tank.scale : 1;

      const r = el.getBoundingClientRect();
      const unscaledW = Math.max(1, Math.round(r.width / (scale || 1)));
      const unscaledH = Math.max(1, Math.round(r.height / (scale || 1)));

      // Avoid update spam (only update if changed)
      const prevW = tank.measuredW ?? 0;
      const prevH = tank.measuredH ?? 0;

      if (Math.abs(unscaledW - prevW) >= 2 || Math.abs(unscaledH - prevH) >= 2) {
        onUpdate?.({
          ...tank,
          measuredW: unscaledW,
          measuredH: unscaledH,
        });
      }
    };

    // initial
    raf = window.requestAnimationFrame(writeSize);

    // observe changes (images loading, font changes, etc.)
    const ro = new ResizeObserver(() => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(writeSize);
    });

    ro.observe(el);

    // Also measure again shortly after mount (image decode, etc.)
    const t = setTimeout(() => {
      window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(writeSize);
    }, 120);

    return () => {
      clearTimeout(t);
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // NOTE: include only tank.id + tank.scale so we don't loop on measuredW/H updates
  }, [tank.id, tank.scale, onUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={setRefs}
      className="draggable-item"
      style={outerStyle}
      {...attributes}
      {...(dragListeners || {})}
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
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={visualWrapperStyle}>
        <div
          style={contentStyle}
          // ✅ Stop canvas selection box in edit for graphic display + indicators
          onMouseDownCapture={(e) => {
            if (!isPlay && (isGraphicDisplay || isIndicator)) {
              e.stopPropagation();
            }
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {children}
        </div>
      </div>

      {/* Resize handle — EDIT only */}
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
