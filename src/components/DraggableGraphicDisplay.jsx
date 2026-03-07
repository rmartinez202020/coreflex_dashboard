// src/components/DraggableGraphicDisplay.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import GraphicDisplay from "./controls/GraphicDisplay";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";

export default function DraggableGraphicDisplay({
  tank,
  onUpdate,
  onSelect,
  onDoubleClick,
  onRightClick, // ✅ NEW
  onOpenSettings, // ✅ NEW: allow widget Settings button to open AppModals modal
  selected,
  selectedIds = [],
  dragDelta = { x: 0, y: 0 },
  dashboardMode = "edit",
  telemetryMap = null, // ✅ NEW: common poller map
}) {
  if (!tank) return null;

  // ✅ FIX: Launch/Launched should behave like Play for telemetry + interactions
  const isPlay =
    dashboardMode === "play" ||
    dashboardMode === "launch" ||
    dashboardMode === "launched";

  const safeOnUpdate = typeof onUpdate === "function" ? onUpdate : () => {};

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: tank.id,
      disabled: isPlay, // ✅ no dragging in play/launch
    });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // ✅ NEW: visibility/heartbeat state
  const visibilityRef = useRef({
    mounted: false,
    lastSent: null,
  });

  const width = tank.w ?? 520;
  const height = tank.h ?? 260;

  const isMultiDragging =
    selectedIds.length > 1 && selectedIds.includes(tank.id);

  const activeTransform = useMemo(() => {
    if (isMultiDragging) return `translate(${dragDelta.x}px, ${dragDelta.y}px)`;
    if (transform) return `translate(${transform.x}px, ${transform.y}px)`;
    return "translate(0px, 0px)";
  }, [isMultiDragging, dragDelta.x, dragDelta.y, transform]);

  // ✅ FIX: prefer new z, fallback to legacy zIndex
  const effectiveZ = tank.z ?? tank.zIndex ?? 1;

  const style = {
    position: "absolute",
    left: tank.x,
    top: tank.y,
    width,
    height,
    transform: activeTransform,
    transformOrigin: "top left",
    border: selected ? "2px solid #2563eb" : "2px solid transparent",
    borderRadius: 10,
    cursor: isPlay ? "default" : isDragging ? "grabbing" : "grab",
    userSelect: "none",
    zIndex: effectiveZ,
  };

  const startResize = (dir, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlay) return;

    setIsResizing(true);
    setResizeDir(dir);

    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: width,
      h: height,
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isResizing || !resizeDir) return;

      let newW = startRef.current.w;
      let newH = startRef.current.h;

      if (resizeDir === "right") {
        newW = Math.max(
          300,
          startRef.current.w + (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "left") {
        newW = Math.max(
          300,
          startRef.current.w - (e.clientX - startRef.current.x)
        );
      }
      if (resizeDir === "bottom") {
        newH = Math.max(
          180,
          startRef.current.h + (e.clientY - startRef.current.y)
        );
      }
      if (resizeDir === "top") {
        newH = Math.max(
          180,
          startRef.current.h - (e.clientY - startRef.current.y)
        );
      }

      safeOnUpdate({ ...tank, w: newW, h: newH });
    };

    const stopMove = () => {
      setIsResizing(false);
      setResizeDir(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopMove);
    };
  }, [isResizing, resizeDir, safeOnUpdate, tank, width, height]);

  // ✅ IMPORTANT: persist GraphicDisplay settings (Single Units / Totalizer / etc.)
  // This wires the Settings modal "Apply" into the parent layout state,
  // so Launch (which loads from DB) gets the updated properties.
  const handleSaveSettings = useCallback(
    (nextTank) => {
      // Keep dashboardId injected in Launch, if present.
      const existingDashId = String(
        tank?.properties?.dashboardId ||
          tank?.properties?.dashboard_id ||
          tank?.dashboardId ||
          ""
      ).trim();

      safeOnUpdate({
        ...tank,
        ...nextTank,

        // ✅ Make sure we merge/keep properties correctly
        properties: {
          ...(tank?.properties || {}),
          ...(nextTank?.properties || {}),

          // ✅ Persist these keys (root cause of Launch mismatch)
          singleUnitsEnabled: nextTank?.singleUnitsEnabled,
          singleUnit: nextTank?.singleUnit ?? nextTank?.singleUnitsUnit ?? "",
          singleUnitsUnit:
            nextTank?.singleUnitsUnit ?? nextTank?.singleUnit ?? "",

          totalizerEnabled: nextTank?.totalizerEnabled,
          totalizerUnit: nextTank?.totalizerUnit,

          // ✅ Preserve dashboardId if it was injected by Launch screen
          ...(existingDashId ? { dashboardId: existingDashId } : {}),
        },
      });
    },
    [safeOnUpdate, tank]
  );

  // ✅ NEW: unified way to open settings (Settings button should call this)
  const handleOpenSettings = useCallback(() => {
    if (isPlay) return;

    // Preferred: open AppModals (provided by DashboardCanvas)
    if (typeof onOpenSettings === "function") {
      onOpenSettings();
      return;
    }

    // Fallback: behave like double-click (older wiring)
    if (typeof onDoubleClick === "function") {
      onDoubleClick(tank);
    }
  }, [isPlay, onOpenSettings, onDoubleClick, tank]);

  // ✅ NEW: resolve dashboard id used by backend visibility route
  const resolvedDashboardId = useMemo(() => {
    return (
      String(
        tank?.dashboard_id ||
          tank?.dashboardId ||
          tank?.properties?.dashboardId ||
          tank?.properties?.dashboard_id ||
          "main"
      ).trim() || "main"
    );
  }, [tank]);

  // ✅ NEW: tell backend whether this graphic is visible to the user
  // force=true bypasses duplicate suppression (used for heartbeat)
  const postGraphicVisibility = useCallback(
    async (isVisible, force = false) => {
      const widgetId = String(tank?.id || "").trim();
      if (!widgetId) return;

      const token = String(getToken() || "").trim();
      if (!token) return;

      if (!force && visibilityRef.current.lastSent === !!isVisible) return;
      visibilityRef.current.lastSent = !!isVisible;

      try {
        await fetch(`${API_URL}/graphic-display-bindings/visibility`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dashboard_id: resolvedDashboardId,
            widget_id: widgetId,
            is_visible: !!isVisible,
          }),
        });
      } catch (err) {
        console.warn("Graphic visibility update failed:", err);
      }
    },
    [resolvedDashboardId, tank?.id]
  );

  // ✅ NEW: mounted in browser = visible
  // user asked for play OR edit mode to count as visible while widget is on screen
  useEffect(() => {
    const widgetId = String(tank?.id || "").trim();
    if (!widgetId) return;

    visibilityRef.current.mounted = true;
    postGraphicVisibility(true);

    return () => {
      visibilityRef.current.mounted = false;

      // best-effort hidden notification on unmount
      // browser close may cancel this, so heartbeat + TTL on Node-RED is still needed
      postGraphicVisibility(false, true);
    };
  }, [postGraphicVisibility, tank?.id]);

  // ✅ NEW: heartbeat every 20s while widget exists in browser
  // if browser/tab closes, heartbeat stops and Node-RED TTL can downgrade to hidden mode
  useEffect(() => {
    const widgetId = String(tank?.id || "").trim();
    if (!widgetId) return;

    const id = window.setInterval(() => {
      postGraphicVisibility(true, true);
    }, 20000);

    return () => window.clearInterval(id);
  }, [postGraphicVisibility, tank?.id]);

  return (
    <div
      ref={setNodeRef}
      className="draggable-item"
      style={style}
      {...attributes}
      onPointerDown={(e) => {
        if (isPlay) return;
        e.stopPropagation();
        onSelect?.(tank.id);
        listeners?.onPointerDown?.(e);
      }}
      onDoubleClick={(e) => {
        if (isPlay) return;
        e.stopPropagation();
        onDoubleClick?.(tank);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPlay) return;
        onSelect?.(tank.id);
        onRightClick?.(e);
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          overflow: "hidden",
          cursor: "inherit",
          // ✅ IMPORTANT: let the chart receive mouse events in play/launch
          pointerEvents: "auto",
        }}
      >
        {/* ✅ NOW uses common poller + persists settings to parent */}
        <GraphicDisplay
          tank={tank}
          telemetryMap={telemetryMap}
          isPlay={isPlay} // ✅ true in play/launch/launched
          onSaveSettings={handleSaveSettings} // ✅ persist units/settings so Launch matches
          dashboardId={resolvedDashboardId} // ✅ pass dashboard id so GraphicDisplay can load historian correctly

          // ✅ NEW: Settings button inside GraphicDisplay should call this
          // so it opens the AppModals GraphicDisplaySettingsModal (which auto-saves project on Apply)
          onOpenSettings={handleOpenSettings}
        />
      </div>

      {selected && !isPlay && (
        <>
          <div
            onMouseDown={(e) => startResize("left", e)}
            style={{
              position: "absolute",
              left: -4,
              top: 0,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />

          <div
            onMouseDown={(e) => startResize("right", e)}
            style={{
              position: "absolute",
              right: -4,
              top: 0,
              width: 8,
              height: "100%",
              cursor: "ew-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />

          <div
            onMouseDown={(e) => startResize("top", e)}
            style={{
              position: "absolute",
              top: -4,
              left: 0,
              height: 8,
              width: "100%",
              cursor: "ns-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />

          <div
            onMouseDown={(e) => startResize("bottom", e)}
            style={{
              position: "absolute",
              bottom: -4,
              left: 0,
              height: 8,
              width: "100%",
              cursor: "ns-resize",
              pointerEvents: "auto",
              zIndex: 99999,
            }}
          />
        </>
      )}
    </div>
  );
}