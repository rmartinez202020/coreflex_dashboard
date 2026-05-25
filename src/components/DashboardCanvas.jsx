// src/components/DashboardCanvas.jsx
import React from "react";
import { DndContext } from "@dnd-kit/core";
import { API_URL } from "../config/api";
import { getToken } from "../utils/authToken";
import useDashboardTelemetryPoller from "../hooks/useDashboardTelemetryPoller";
import useMultiSelectClick from "../hooks/useMultiSelectClick";
import DashboardCanvasWidgetLayer from "./DashboardCanvasWidgetLayer";

function getAuthHeaders() {
  const token = String(getToken() || "").trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PAINT_SHAPES = new Set([
  "paintArrow",
  "paintCircle",
  "paintSquare",
  "paintRectangle",
  "paintOval",
  "paintTriangle",
]);

function createId(prefix = "shape") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getPaintShapeDefaults(shape) {
  if (shape === "paintArrow") {
    return { w: 150, h: 60, width: 150, height: 60 };
  }

  if (shape === "paintRectangle") {
    return { w: 140, h: 80, width: 140, height: 80 };
  }

  if (shape === "paintOval") {
    return { w: 130, h: 80, width: 130, height: 80 };
  }

  return { w: 100, h: 100, width: 100, height: 100 };
}

function resolveDashboardId({
  activeDashboardId,
  dashboardId,
  selectedTank,
  droppedTanks,
}) {
  const z = String(activeDashboardId || "").trim();
  if (z) return z;

  const a = String(dashboardId || "").trim();
  if (a) return a;

  const b = String(
    selectedTank?.dashboard_id || selectedTank?.dashboardId || ""
  ).trim();
  if (b) return b;

  const first = Array.isArray(droppedTanks) ? droppedTanks[0] : null;
  const c = String(
    first?.dashboard_id ||
      first?.dashboardId ||
      first?.properties?.dashboard_id ||
      ""
  ).trim();
  if (c) return c;

  return null;
}

async function postJson(path, body) {
  const token = String(getToken() || "").trim();
  if (!token) throw new Error("Missing auth token.");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body || {}),
  });

  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      j?.detail || j?.error || `POST ${path} failed (${res.status})`
    );
  }
  return j;
}

async function softDeleteGraphicBinding({ dashboardId = "main", widgetId }) {
  const dash = String(dashboardId || "main").trim() || "main";
  const wid = String(widgetId || "").trim();
  if (!wid) return;

  await postJson("/graphic-display-bindings/soft-delete", {
    dashboard_id: dash,
    widget_id: wid,
  });
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
  activeHorizontalTankId,
  setActiveHorizontalTankId,
  setShowHorizontalTankProps,
  activeStandardTankId,
  setActiveStandardTankId,
  setShowStandardTankProps,
  activeVerticalTankId,
  setActiveVerticalTankId,
  setShowVerticalTankProps,
  activeWirelessTankId,
  setActiveWirelessTankId,
  setShowWirelessTankProps,
  activeWirelessTank2Id,
  setActiveWirelessTank2Id,
  setShowWirelessTank2Props,
  onSaveProject,
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
  onOpenDisplayOutputSettings,
  onOpenGaugeDisplaySettings,
  onOpenGraphicDisplaySettings,
  onOpenAlarmLog,
  onLaunchAlarmLog,
  onOpenIndicatorSettings,
  onOpenStatusTextSettings,
  onOpenBlinkingAlarmSettings,
  onOpenStateImageSettings,
  onOpenCounterInputSettings,
  activeDashboardId,
  dashboardId,
  dashboardName,
  onOpenPushButtonNOSettings,
  onOpenPushButtonNCSettings,

  isPublicLaunch = false,
  publicDashSlug = "",
  publicDashLaunchId = "",
  tenantEmail = "",
  isTenantAuthenticated = false,
  tenantAccessLevel = "read_only",

  showDashboardIdsDetails = false,
}) {
  const isPlay = dashboardMode === "play" || dashboardMode === "launch";

  const resolvedDashboardIdValue = React.useMemo(() => {
    return resolveDashboardId({
      activeDashboardId,
      dashboardId,
      selectedTank,
      droppedTanks,
    });
  }, [activeDashboardId, dashboardId, selectedTank, droppedTanks]);

  const shouldShowDashboardIdsDetails = React.useMemo(() => {
    const dash = String(resolvedDashboardIdValue || "").trim();
    return Boolean(showDashboardIdsDetails && dash);
  }, [showDashboardIdsDetails, resolvedDashboardIdValue]);

  const handleObjectSelect = useMultiSelectClick({
    isPlay,
    selectedIds,
    setSelectedIds,
    setSelectedTank,
    hideContextMenu,
  });

  const { telemetryMap } = useDashboardTelemetryPoller({
    isPlay,
    API_URL,
    getAuthHeaders,
    getToken,
    droppedTanks,
    activeDashboardId,
    dashboardId,
    selectedTank,
    resolveDashboardId,
    isPublicLaunch,
    publicDashSlug,
    publicDashLaunchId,
    tenantEmail,
    isTenantAuthenticated,
    pollMs: 2200,
    modelMeta: {
      zhc1921: { base: "zhc1921" },
      zhc1661: { base: "zhc1661" },
      tp4000: { base: "tp4000" },
      cfr100: {
        base: "radar-level",
        endpoint: "/radar-level/my-sensors",
      },
    },
  });

  const countersRef = React.useRef({ loading: false });

  const fetchCountersForDashboard = React.useCallback(async () => {
    if (!isPlay) return;

    const dash = resolveDashboardId({
      activeDashboardId,
      dashboardId,
      selectedTank,
      droppedTanks,
    });
    if (!dash) return;

    if (countersRef.current.loading) return;
    countersRef.current.loading = true;

    try {
      const token = String(getToken() || "").trim();
      if (!token) return;

      const res = await fetch(
        `${API_URL}/device-counters/by-dashboard/${encodeURIComponent(dash)}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) return;

      const rows = await res.json();
      const list = Array.isArray(rows) ? rows : [];

      const map = {};
      for (const r of list) {
        const wid = String(r?.widget_id || r?.widgetId || "").trim();
        if (!wid) continue;

        map[wid] = {
          count: Number(r?.count ?? 0) || 0,
          run_seconds: Number(r?.run_seconds ?? 0) || 0,
        };
      }

      setDroppedTanks((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        let changed = false;

        const next = arr.map((t) => {
          if (!t || t.shape !== "counterInput") return t;

          const wid = String(t.id || "").trim();
          if (!wid) return t;

          const incomingObj = map[wid];
          if (!incomingObj) return t;

          const currentCount = Number(t?.properties?.count ?? 0) || 0;
          const currentRun = Number(t?.properties?.run_seconds ?? 0) || 0;

          const incomingCount = Number(incomingObj?.count ?? 0) || 0;
          const incomingRun = Number(incomingObj?.run_seconds ?? 0) || 0;

          if (currentCount === incomingCount && currentRun === incomingRun) {
            return t;
          }

          changed = true;
          return {
            ...t,
            properties: {
              ...(t.properties || {}),
              count: incomingCount,
              run_seconds: incomingRun,
            },
          };
        });

        return changed ? next : prev;
      });
    } catch {
      // ignore
    } finally {
      countersRef.current.loading = false;
    }
  }, [
    isPlay,
    activeDashboardId,
    dashboardId,
    selectedTank,
    droppedTanks,
    setDroppedTanks,
  ]);

  React.useEffect(() => {
    if (!isPlay) return;

    fetchCountersForDashboard();

    const t = setInterval(() => {
      if (document.hidden) return;
      fetchCountersForDashboard();
    }, 2000);

    return () => clearInterval(t);
  }, [isPlay, fetchCountersForDashboard]);

  const prevGraphicIdsRef = React.useRef(new Set());
  const deleteQueueRef = React.useRef(new Set());

  React.useEffect(() => {
    const arr = Array.isArray(droppedTanks) ? droppedTanks : [];

    const currentGraphicIds = new Set(
      arr
        .filter((t) => t?.shape === "graphicDisplay")
        .map((t) => String(t?.id || "").trim())
        .filter(Boolean)
    );

    const prev = prevGraphicIdsRef.current || new Set();

    const removed = [];
    for (const id of prev) {
      if (!currentGraphicIds.has(id)) removed.push(id);
    }

    prevGraphicIdsRef.current = currentGraphicIds;

    if (removed.length === 0) return;

    const dash =
      resolveDashboardId({
        activeDashboardId,
        dashboardId,
        selectedTank,
        droppedTanks: arr,
      }) || "main";

    removed.forEach((wid) => {
      if (!wid) return;
      if (deleteQueueRef.current.has(wid)) return;
      deleteQueueRef.current.add(wid);

      softDeleteGraphicBinding({ dashboardId: dash, widgetId: wid })
        .catch((e) => {
          console.log("[GraphicDisplay] soft-delete failed:", e?.message || e);
        })
        .finally(() => {
          deleteQueueRef.current.delete(wid);
        });
    });
  }, [droppedTanks, activeDashboardId, dashboardId, selectedTank]);

  const getTankZ = React.useCallback((t) => {
    return Number(t?.z ?? t?.zIndex ?? 0) || 0;
  }, []);

  const normalizeZ = React.useCallback((list) => {
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
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(droppedTanks) || droppedTanks.length === 0) return;

    const missing = droppedTanks.some((t) => t?.z == null || t?.zIndex == null);
    if (!missing) return;

    setDroppedTanks((prev) => normalizeZ(prev));
  }, [droppedTanks, setDroppedTanks, normalizeZ]);

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

  React.useEffect(() => {
    void bringToFront;
    void sendToBack;
  }, [bringToFront, sendToBack]);

  const resetCounterOnBackend = React.useCallback(
    async ({ widgetId, dash }) => {
      const token = String(getToken() || "").trim();
      if (!token) {
        throw new Error("Missing auth token. Please logout and login again.");
      }

      const res = await fetch(`${API_URL}/device-counters/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          widget_id: String(widgetId || "").trim(),
          dashboard_id: dash || null,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.detail || `Reset failed (${res.status})`);
      }

      await fetchCountersForDashboard();
      return j;
    },
    [fetchCountersForDashboard]
  );

  const handleCanvasDrop = React.useCallback(
    (e) => {
      if (isPlay) return;

      const shape =
        e.dataTransfer?.getData("shape") ||
        e.dataTransfer?.getData("text/plain") ||
        "";

      if (!PAINT_SHAPES.has(shape)) {
        handleDrop?.(e);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const defaults = getPaintShapeDefaults(shape);

      const x = Math.max(0, e.clientX - rect.left - defaults.w / 2);
      const y = Math.max(0, e.clientY - rect.top - defaults.h / 2);

      const z =
        Math.max(
          0,
          ...(Array.isArray(droppedTanks)
            ? droppedTanks.map((t) => Number(t?.z ?? t?.zIndex ?? 0) || 0)
            : [0])
        ) + 1;

      const newShape = {
        id: createId(shape),
        shape,
        type: shape,
        x,
        y,
        left: x,
        top: y,
        ...defaults,
        z,
        zIndex: z,
        stroke: "#0f172a",
        strokeColor: "#0f172a",
        fill: "transparent",
        fillColor: "transparent",
        strokeWidth: 0.8,
        properties: {
          stroke: "#0f172a",
          strokeColor: "#0f172a",
          fill: "transparent",
          fillColor: "transparent",
          strokeWidth: 0.8,
        },
      };

      setDroppedTanks((prev) => [...(Array.isArray(prev) ? prev : []), newShape]);
      setSelectedIds?.([newShape.id]);
      setSelectedTank?.(newShape);
      hideContextMenu?.();
    },
    [
      isPlay,
      handleDrop,
      droppedTanks,
      setDroppedTanks,
      setSelectedIds,
      setSelectedTank,
      hideContextMenu,
    ]
  );

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
        onDrop={handleCanvasDrop}
        onContextMenu={(e) => {
          if (isPlay) return;
          e.preventDefault();
          e.stopPropagation();
          handleRightClick?.(e, null);
        }}
        onMouseDown={(e) => !isPlay && handleCanvasMouseDown(e)}
        onMouseMove={(e) => !isPlay && handleCanvasMouseMove(e)}
        onMouseUp={(e) => !isPlay && handleCanvasMouseUp(e)}
      >
        <DashboardCanvasWidgetLayer
          droppedTanks={droppedTanks}
          selectedIds={selectedIds}
          dragDelta={dragDelta}
          dashboardMode={dashboardMode}
          isPlay={isPlay}
          telemetryMap={telemetryMap}
          sensorsData={sensorsData}
          setDroppedTanks={setDroppedTanks}
          handleRightClick={handleRightClick}
          handleObjectSelect={handleObjectSelect}
          onOpenDisplaySettings={onOpenDisplaySettings}
          onOpenDisplayOutputSettings={onOpenDisplayOutputSettings}
          onOpenGaugeDisplaySettings={onOpenGaugeDisplaySettings}
          onOpenGraphicDisplaySettings={onOpenGraphicDisplaySettings}
          onOpenAlarmLog={onOpenAlarmLog}
          onLaunchAlarmLog={onLaunchAlarmLog}
          onOpenIndicatorSettings={onOpenIndicatorSettings}
          onOpenStatusTextSettings={onOpenStatusTextSettings}
          onOpenBlinkingAlarmSettings={onOpenBlinkingAlarmSettings}
          onOpenStateImageSettings={onOpenStateImageSettings}
          onOpenCounterInputSettings={onOpenCounterInputSettings}
          onOpenPushButtonNOSettings={onOpenPushButtonNOSettings}
          onOpenPushButtonNCSettings={onOpenPushButtonNCSettings}
          onSaveProject={onSaveProject}
          activeDashboardId={activeDashboardId}
          dashboardId={dashboardId}
          selectedTank={selectedTank}
          dashboardName={dashboardName}
          resolveDashboardId={resolveDashboardId}
          resetCounterOnBackend={resetCounterOnBackend}
          setActiveStandardTankId={setActiveStandardTankId}
          setShowStandardTankProps={setShowStandardTankProps}
          setActiveHorizontalTankId={setActiveHorizontalTankId}
          setShowHorizontalTankProps={setShowHorizontalTankProps}
          setActiveVerticalTankId={setActiveVerticalTankId}
          setShowVerticalTankProps={setShowVerticalTankProps}
          setActiveSiloId={setActiveSiloId}
          setShowSiloProps={setShowSiloProps}
          setActiveWirelessTankId={setActiveWirelessTankId}
          setShowWirelessTankProps={setShowWirelessTankProps}
          setActiveWirelessTank2Id={setActiveWirelessTank2Id}
          setShowWirelessTank2Props={setShowWirelessTank2Props}
          getTankZ={getTankZ}
          showDashboardIdsDetails={shouldShowDashboardIdsDetails}
          dashboardIdsDetailsDashboardId={resolvedDashboardIdValue}
          isPublicLaunch={isPublicLaunch}
          isTenantAuthenticated={isTenantAuthenticated}
          tenantEmail={tenantEmail}
          tenantAccessLevel={tenantAccessLevel}
        />

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